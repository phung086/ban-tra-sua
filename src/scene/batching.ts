import * as T from "three";

// Only immutable opaque props; actors, cups and live inventory stay independent.
export function batchStatic(root: T.Group, dynamic: T.Object3D[]) {
  root.updateMatrixWorld(true);
  const skip = new Set(dynamic),
    buckets = new Map<string, T.Mesh[]>();
  root.traverse((object) => {
    if (
      !(object instanceof T.Mesh) ||
      object instanceof T.InstancedMesh ||
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
      batch.setMatrixAt(index, item.matrixWorld);
      item.removeFromParent();
    });
    batch.computeBoundingBox();
    batch.computeBoundingSphere();
    root.add(batch);
    batches.push(batch);
  });
  return batches;
}
