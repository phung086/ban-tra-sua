import * as T from "three";
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Merge distinct rigid details by material, in local coordinates. Articulated
// bones and blinking eyes stay separate. Cached actor geometry is reused per look.
export function mergeRigid(root:T.Group, dynamic:T.Object3D[], register:(key:string,factory:()=>T.BufferGeometry)=>T.BufferGeometry, prefix:string, sectorSize?:number, nearFocus?:{x:number;z:number;radius:number;sectorSize:number}) {
  root.updateMatrixWorld(true);
  const inverse=root.matrixWorld.clone().invert(), skip=new Set(dynamic), buckets=new Map<string,T.Mesh[]>();
  root.traverse(object=>{
    if(!(object instanceof T.Mesh) || object instanceof T.InstancedMesh || object instanceof T.SkinnedMesh || Array.isArray(object.material) || object.material.transparent) return;
    for(let ancestor:T.Object3D|null=object;ancestor;ancestor=ancestor.parent) if(skip.has(ancestor)) return;
    const p=object.getWorldPosition(new T.Vector3());
    // Keep small spatial bounds near the shop, while using larger batches
    // for distant streets. The near/far prefix prevents cross-zone merges.
    const near=nearFocus && Math.hypot(p.x-nearFocus.x,p.z-nearFocus.z)<=nearFocus.radius ? nearFocus : undefined;
    const size=near?.sectorSize??sectorSize;
    const zone=size?`${near?'near:':''}${Math.floor(p.x/size)},${Math.floor(p.z/size)}`:'local';
    const key=`${prefix}:${zone}:${object.material.uuid}`;
    const meshes=buckets.get(key)??[]; meshes.push(object); buckets.set(key,meshes);
  });
  const merged:T.Mesh[]=[];
  buckets.forEach((meshes,key)=>{
    if(meshes.length<2) return;
    const geometry=register(key,()=>{
      const copies=meshes.map(mesh=>{
        const copy=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();
        return copy.applyMatrix4(new T.Matrix4().multiplyMatrices(inverse,mesh.matrixWorld));
      });
      const result=mergeGeometries(copies)!; copies.forEach(g=>g.dispose());
      result.computeBoundingSphere(); result.computeBoundingBox(); return result;
    });
    const mesh=new T.Mesh(geometry,meshes[0].material);
    mesh.castShadow=meshes.some(m=>m.castShadow); mesh.receiveShadow=true;
    meshes.forEach(m=>m.removeFromParent()); root.add(mesh); merged.push(mesh);
  });
  return merged;
}

// Only immutable opaque props; actors, cups and live inventory stay independent.
export function batchStatic(root: T.Group, dynamic: T.Object3D[]) {
  root.updateMatrixWorld(true);
  // Instance matrices are relative to the batch parent, not world space.
  // This also keeps streamed/rotated zone roots from applying transforms twice.
  const inverseRoot = root.matrixWorld.clone().invert();
  const skip = new Set(dynamic),
    buckets = new Map<string, T.Mesh[]>();
  root.traverse((object) => {
    if (
      !(object instanceof T.Mesh) ||
      object instanceof T.InstancedMesh || object instanceof T.SkinnedMesh ||
      Array.isArray(object.material) ||
      object.material.transparent
    )
      return;
    for (
      let ancestor: T.Object3D | null = object;
      ancestor;
      ancestor = ancestor.parent
    )
      if (skip.has(ancestor)) return;
    const zone =
      object.getWorldPosition(new T.Vector3()).z < -8 ? "street" : "shop";
    const key = `${zone}:${object.geometry.uuid}:${object.material.uuid}`;
    const items = buckets.get(key) ?? [];
    items.push(object);
    buckets.set(key, items);
  });
  const batches: T.InstancedMesh[] = [];
  buckets.forEach((items) => {
    if (items.length < 2) return;
    const batch = new T.InstancedMesh(
      items[0].geometry,
      items[0].material,
      items.length,
    );
    batch.castShadow = items.some((item) => item.castShadow);
    batch.receiveShadow = true;
    items.forEach((item, index) => {
      batch.setMatrixAt(index, new T.Matrix4().multiplyMatrices(inverseRoot, item.matrixWorld));
      item.removeFromParent();
    });
    batch.computeBoundingBox();
    batch.computeBoundingSphere();
    root.add(batch);
    batches.push(batch);
  });
  return batches;
}
