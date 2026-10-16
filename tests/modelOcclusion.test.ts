import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {prepareModelFit} from '../src/lib/modelAutoFit';
import {prepareModelOcclusion} from '../src/lib/modelOcclusion';
const bytes=fs.readFileSync('public/models/aviator_lavender.glb');
const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const fit=prepareModelFit(gltf.scene);
prepareModelOcclusion(fit.root);
let lenses=0,temples=0;
fit.root.traverse(o=>{
 if(!(o instanceof THREE.Mesh))return;
 const mats=Array.isArray(o.material)?o.material:[o.material];
 if(o.name.includes('lens')) {lenses++;assert.ok(mats.every(m=>m.depthTest&&!m.depthWrite));assert.equal(o.renderOrder,10)}
 if(o.name.includes('temple')) {temples++;assert.ok(mats.every(m=>m.depthTest));}
});
assert.equal(lenses,2);assert.equal(temples,2);
// An unnamed merged mesh must split its front and rear with materials intact.
const geo=new THREE.BufferGeometry();
geo.setAttribute('position',new THREE.Float32BufferAttribute([-1,0,0,1,0,0,0,1,0, -1,0,-1,1,0,-1,0,1,-1],3));
geo.addGroup(0,3,0);geo.addGroup(3,3,1);
const root=new THREE.Group();root.add(new THREE.Mesh(geo,[new THREE.MeshBasicMaterial({color:'red'}),new THREE.MeshBasicMaterial({color:'blue'})]));
prepareModelOcclusion(root);
const parts:THREE.Mesh[]=[];root.traverse(o=>{if(o instanceof THREE.Mesh)parts.push(o)});
assert.equal(parts.length,2);
for(const mesh of parts){assert.equal(mesh.geometry.index?.count,3);assert.equal(mesh.geometry.groups[0].materialIndex,mesh.renderOrder===10?0:1)}
console.log('Passed: front and rear preserve physical depth; temples retain occlusion; merged model material groups preserved.');
