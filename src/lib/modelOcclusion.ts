import * as THREE from 'three';

/** Separate front and rear draw order while retaining real depth occlusion.
 * Split merged meshes geometrically, so this also works without part names. */
export function prepareModelOcclusion(root: THREE.Object3D) {
  root.updateMatrixWorld(true);
  const meshes: THREE.Mesh[] = [];
  root.traverse(object => { if (object instanceof THREE.Mesh) meshes.push(object); });
  for (const mesh of meshes) {
    const geometry = mesh.geometry;
    const positions = geometry.getAttribute('position');
    if (!positions) continue;
    const front: number[] = [], rear: number[] = [];
    const frontMaterials: number[] = [], rearMaterials: number[] = [];
    const index = geometry.getIndex();
    const count = index?.count ?? positions.count;
    const point = new THREE.Vector3();
    const frontPart = /lens|rim|bridge|brow/i.test(mesh.name) && !/pad|arm/i.test(mesh.name);
    const rearPart = /temple|ear.?tip|pad|hinge/i.test(mesh.name);
    for (let offset = 0; offset + 2 < count; offset += 3) {
      const triangle = [0, 1, 2].map(i => index ? index.getX(offset + i) : offset + i);
      const isFront = frontPart || (!rearPart && triangle.every(i =>
        point.fromBufferAttribute(positions, i).applyMatrix4(mesh.matrixWorld).z >= -.08));
      (isFront ? front : rear).push(...triangle);
      const group = geometry.groups.find(g => offset >= g.start && offset < g.start + g.count);
      (isFront ? frontMaterials : rearMaterials).push(group?.materialIndex ?? 0);
    }
    const wrapper = new THREE.Group();
    wrapper.copy(mesh, false);
    mesh.parent?.add(wrapper);
    for (const child of [...mesh.children]) wrapper.add(child);
    // Preserve authored material groups, including multi-material merged GLBs.
    const makePart = (indices: number[], materials: number[], frontLayer: boolean) => {
      if (!indices.length) return;
      const part = mesh.clone(false);
      part.position.set(0, 0, 0); part.quaternion.identity(); part.scale.set(1, 1, 1);
      part.matrix.identity(); part.matrixAutoUpdate = true;
      part.geometry = geometry.clone();
      part.geometry.setIndex(indices);
      part.geometry.clearGroups();
      part.geometry.setDrawRange(0, Infinity);
      for (let offset=0; offset<materials.length;) {
        let end=offset+1;
        while (end<materials.length && materials[end]===materials[offset]) end++;
        part.geometry.addGroup(offset*3, (end-offset)*3, materials[offset]);
        offset=end;
      }
      const cloneMaterial = (source: THREE.Material) => {
        const material = source.clone();
        material.depthTest = true;
        material.depthWrite = !material.transparent;
        return material;
      };
      part.material = Array.isArray(mesh.material) ? mesh.material.map(cloneMaterial) : cloneMaterial(mesh.material);
      part.renderOrder = frontLayer ? 10 : 0;
      wrapper.add(part);
    };
    makePart(rear, rearMaterials, false); makePart(front, frontMaterials, true);
    mesh.removeFromParent();
    geometry.dispose();
    for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) material.dispose();
  }
}
