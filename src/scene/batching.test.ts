import * as T from "three";
import { describe, expect, it } from "vitest";
import { batchStatic } from "./batching";

describe("static prop batching", () => {
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
