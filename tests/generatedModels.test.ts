import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { prepareModelFit } from '../src/lib/modelAutoFit';
import { createModelPreview } from '../src/lib/modelPreview';
for (const style of ['square','round','aviator']) {
  const bytes=fs.readFileSync(`public/models/tatoe_${style}.glb`);
  const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  for (const name of ['left_lens','right_lens','left_rim','right_rim','bridge','left_temple','right_temple','left_nose_pad','right_nose_pad']) {
    const part=gltf.scene.getObjectByName(name);
    assert.ok(part instanceof THREE.Mesh,`${style}: missing ${name}`);
    assert.ok(part.geometry.getAttribute('position').count>0);
  }
  const bounds=new THREE.Box3().setFromObject(gltf.scene);
  const dimensions=bounds.getSize(new THREE.Vector3());
  assert.ok(dimensions.x>.12 && dimensions.x<.16);
  assert.ok(dimensions.z>.13 && bounds.min.z<-.13);
  const lens=gltf.scene.getObjectByName('left_lens') as THREE.Mesh;
  assert.ok((lens.material as THREE.MeshStandardMaterial).transparent);
  const fit=prepareModelFit(gltf.scene);
  assert.equal(fit.source,'lenses');
  assert.ok(fit.lensSpan>.4 && fit.lensSpan<.6);
  assert.ok(fit.lensCenters && Math.abs(fit.lensCenters[0].y-fit.lensCenters[1].y)<.001);
  const preview=createModelPreview(fit.root,640,420);
  assert.ok(preview.camera.right>preview.camera.left);
}
console.log('Passed: all three original GLBs have optical centres, complete 3D parts, transparent lenses, wearable dimensions and preview framing.');
