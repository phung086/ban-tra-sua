import * as T from "three";
import { describe, expect, it } from "vitest";
import { batchStatic, mergeRigid } from "./batching";

describe("static prop batching", () => {
  it("merges more rigid props at sector 32 while preserving bounds and moving subtrees", () => {
    function measure(sector: number) {
      const root=new T.Group(), moving=new T.Group();
      const material=new T.MeshStandardMaterial();
      const geometry=new T.BoxGeometry(2,1,2);
      root.add(moving);
      const live=new T.Mesh(geometry,material);
      live.position.set(5,0,-12);
      moving.add(live);
      const positions=[2,10,18,26];
      const pieces=positions.map(x=>{
        const mesh=new T.Mesh(geometry,material);
        mesh.position.set(x,0,-12); root.add(mesh);return mesh;
      });
      root.updateMatrixWorld(true);
      const expected=new T.Box3();
      pieces.forEach(mesh=>expected.union(new T.Box3().setFromObject(mesh,true)));
      const allocated:T.BufferGeometry[]=[];
      const batches=mergeRigid(root,[moving],(_,factory)=>{
        const result=factory();allocated.push(result);return result;
      },'test',sector);
      const actual=new T.Box3();
      batches.forEach(mesh=>actual.union(new T.Box3().setFromObject(mesh,true)));
      expect(moving.children).toContain(live);
      for(const axis of ['x','y','z'] as const) {
        expect(actual.min[axis]).toBeCloseTo(expected.min[axis],5);
        expect(actual.max[axis]).toBeCloseTo(expected.max[axis],5);
      }
      expect(positions.every(x=>x>=actual.min.x-1&&x<=actual.max.x+1)).toBe(true);
      allocated.forEach(g=>g.dispose());geometry.dispose();material.dispose();
      return batches.length;
    }
    expect(measure(16)).toBe(2);
    expect(measure(32)).toBe(1);
  });
  it('merges different geometry in local space without freezing eyes or doubling parent scale',()=>{
    const root=new T.Group(); root.position.set(5,2,-8); root.scale.set(0.8,1.2,0.9); root.rotation.y=0.4;
    const material=new T.MeshStandardMaterial(), eye=new T.Mesh(new T.SphereGeometry(0.1),material);
    root.add(eye);
    const originals=[new T.Mesh(new T.BoxGeometry(1,2,1),material),new T.Mesh(new T.SphereGeometry(0.5),material)];
    originals[0].position.set(-1,0,0); originals[1].position.set(1,0,0); root.add(...originals);
    root.updateMatrixWorld(true);
    const expected=new T.Box3(); originals.forEach(m=>expected.union(new T.Box3().setFromObject(m,true)));
    const allocated:T.BufferGeometry[]=[];
    const merged=mergeRigid(root,[eye],(_,factory)=>{const g=factory();allocated.push(g);return g;},'test');
    expect(merged).toHaveLength(1);
    expect(eye.parent).toBe(root);
    const actual=new T.Box3().setFromObject(merged[0],true);
    for(const axis of ['x','y','z'] as const) {
      expect(actual.min[axis]).toBeCloseTo(expected.min[axis],5);
      expect(actual.max[axis]).toBeCloseTo(expected.max[axis],5);
    }
    expect(actual.max.x-actual.min.x).toBeGreaterThan(2);
    expect(merged[0].geometry.getAttribute('position').count).toBeGreaterThan(100);
    allocated.forEach(g=>g.dispose()); originals.forEach(m=>m.geometry.dispose());eye.geometry.dispose();material.dispose();
  });
  it("preserves world transforms while batching repeated geometry", () => {
    const root = new T.Group(),
      group = new T.Group();
    group.position.set(2, 0, -4);
    group.rotation.y = 0.8;
    root.add(group);
    const geometry = new T.BoxGeometry(),
      material = new T.MeshStandardMaterial();
    const originals = [0, 1, 2].map((x) => {
      const mesh = new T.Mesh(geometry, material);
      mesh.position.x = x;
      group.add(mesh);
      return mesh;
    });
    root.updateMatrixWorld(true);
    const expected = originals.map((mesh) => mesh.matrixWorld.clone());
    const batches = batchStatic(root, []);
    expect(batches).toHaveLength(1);
    expect(batches[0].count).toBe(3);
    const matrix = new T.Matrix4();
    expected.forEach((value, index) => {
      batches[0].getMatrixAt(index, matrix);
      matrix.elements.forEach((n, i) =>
        expect(n).toBeCloseTo(value.elements[i], 5),
      );
    });
    batches[0].dispose();
    geometry.dispose();
    material.dispose();
  });
  it("keeps articulated subtrees, inventory and glass outside static batches", () => {
    const root = new T.Group(),
      moving = new T.Group();
    root.add(moving);
    const geometry = new T.BoxGeometry(),
      material = new T.MeshStandardMaterial(),
      glass = new T.MeshStandardMaterial({ transparent: true, opacity: 0.2 });
    for (let i = 0; i < 3; i++) moving.add(new T.Mesh(geometry, material));
    const stock = new T.Mesh(geometry, material),
      window = new T.Mesh(geometry, glass);
    root.add(stock, window);
    expect(batchStatic(root, [moving, stock])).toEqual([]);
    expect(moving.children).toHaveLength(3);
    expect(stock.parent).toBe(root);
    expect(window.parent).toBe(root);
    geometry.dispose();
    material.dispose();
    glass.dispose();
  });
});
