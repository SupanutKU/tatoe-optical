import * as THREE from 'three';

export function disposeModel(root: THREE.Object3D) {
  const textures = new Set<THREE.Texture>();
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry.dispose();
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
      material.dispose();
    }
  });
  textures.forEach(texture => texture.dispose());
}

/** Frame authored geometry without changing the model used by face tracking. */
export function createModelPreview(model: THREE.Object3D, width: number, height: number) {
  const bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  const extent = Math.max(size.x, size.y, size.z);
  if (bounds.isEmpty() || !Number.isFinite(extent) || extent <= 0) throw new Error('โมเดลไม่มีรูปทรงที่แสดงได้');
  const root = new THREE.Group();
  root.add(model);
  root.position.copy(bounds.getCenter(new THREE.Vector3())).negate();
  const scene = new THREE.Scene();
  scene.add(root);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x78869a, 2.5));
  const light = new THREE.DirectionalLight(0xffffff, 3);
  light.position.set(extent, extent * 2, extent * 3);
  scene.add(light);
  const aspect = width / height;
  const halfHeight = Math.max(size.y, size.x / aspect, extent * .3) * .65;
  const camera = new THREE.OrthographicCamera(-halfHeight * aspect, halfHeight * aspect, halfHeight, -halfHeight, extent * .001, extent * 20);
  camera.position.set(0, 0, extent * 3);
  camera.lookAt(0, 0, 0);
  return { scene, camera };
}

export function renderModelThumbnail(model: THREE.Object3D): string {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
  try {
    renderer.setSize(640, 420);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0xffffff, 0);
    const { scene, camera } = createModelPreview(model.clone(true), 640, 420);
    renderer.render(scene, camera);
    return renderer.domElement.toDataURL('image/png');
  } finally {
    renderer.dispose();
    renderer.forceContextLoss();
  }
}
