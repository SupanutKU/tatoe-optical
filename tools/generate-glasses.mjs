// Original procedural eyewear assets. Units: metres; X across, Y up, +Z front.
// Run from the project root: node tools/generate-glasses.mjs
import * as T from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';
import { mkdir, writeFile } from 'node:fs/promises';

globalThis.FileReader ??= class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(result => { this.result=result; this.onloadend?.(); }); }
  readAsDataURL(blob) { blob.arrayBuffer().then(result => { this.result=`data:${blob.type};base64,${Buffer.from(result).toString('base64')}`; this.onloadend?.(); }); }
};
const material=(name,color,metalness=0,roughness=.3,opacity=1)=>new T.MeshStandardMaterial({name,color,metalness,roughness,transparent:opacity<1,opacity,depthWrite:opacity===1,side:T.DoubleSide});
const black=material('black_acetate',0x15171c,0,.28);
const silver=material('brushed_titanium',0xb1b7bd,.85,.26);
const gold=material('warm_gold',0xb68a42,.85,.24);
const clear=material('clear_optical_glass',0xc4e2e7,0,.12,.13);
const sun=material('smoke_green_glass',0x405b50,0,.15,.36);
const pad=material('silicone',0xf1eee8,0,.65,.72);
const tip=material('ear_sleeve',0x282526,0,.5);
function mesh(group,name,geometry,mat) { const m=new T.Mesh(geometry,mat); m.name=name; group.add(m); return m; }
function tube(group,name,points,radius,mat) { return mesh(group,name,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),Math.max(24,points.length*10),radius,8,false),mat); }
function contour(style,side) {
  if(style==='aviator') {
    const outline=new T.Shape();
    outline.moveTo(-.023,.015);
    outline.bezierCurveTo(-.018,.024,.014,.027,.025,.018);
    outline.bezierCurveTo(.034,.01,.029,-.014,.016,-.026);
    outline.bezierCurveTo(.007,-.034,-.005,-.028,-.015,-.015);
    outline.bezierCurveTo(-.022,-.006,-.028,.007,-.023,.015);
    const points=outline.getPoints(20).slice(0,-1).map(p=>new T.Vector2(p.x*side,p.y));
    return side<0?points.reverse():points;
  }
  const pts=[];
  for(let i=0;i<80;i++) {
    const a=i/80*Math.PI*2, c=Math.cos(a), s=Math.sin(a);
    let x,y;
    if(style==='square') { x=.026*Math.sign(c)*Math.pow(Math.abs(c),.36); y=.018*Math.sign(s)*Math.pow(Math.abs(s),.36); }
    else if(style==='round') { x=.024*c; y=.024*s; }
    else { x=.027*c; y=.024*s; }
    pts.push(new T.Vector2(x,y));
  }
  return pts;
}
function shape(points) { return new T.Shape(points); }
function create(style) {
  const group=new T.Group(); group.name=`Tatoe_${style}`;
  const mat=style==='square'?black:style==='round'?silver:gold;
  const rimWidth=style==='square'?.0032:.00125;
  const depth=style==='square'?.0048:.002;
  const cx=style==='round'?.033:.034;
  for(const side of [-1,1]) {
    const label=side<0?'left':'right', points=contour(style,side);
    const outer=points.map(p=>new T.Vector2(p.x*(1+rimWidth/.026),p.y*(1+rimWidth/.022)));
    const ring=shape(outer); ring.holes.push(new T.Path([...points].reverse()));
    const r=mesh(group,`${label}_rim`,new T.ExtrudeGeometry(ring,{depth,bevelEnabled:true,bevelThickness:.00045,bevelSize:.0004,bevelSegments:2,steps:1}),mat); r.position.set(side*cx,0,-depth/2);
    const l=mesh(group,`${label}_lens`,new T.ExtrudeGeometry(shape(points),{depth:.0012,bevelEnabled:false}),style==='aviator'?sun:clear); l.position.set(side*cx,0,-.0006);
    const hingeX=side*(cx+(style==='round'?.025:.029));
    const hinge=mesh(group,`${label}_hinge`,new T.BoxGeometry(.005,.004,.006),mat); hinge.position.set(hingeX,.004,-.003);
    tube(group,`${label}_temple`,[[hingeX,.004,-.005],[side*.068,.004,-.025],[side*.070,.002,-.085],[side*.068,-.002,-.112]],style==='square'?.0021:.00125,mat);
    tube(group,`${label}_ear_tip`,[[side*.068,-.002,-.106],[side*.067,-.006,-.125],[side*.064,-.018,-.136]],.0025,tip);
    tube(group,`${label}_pad_arm`,[[side*.012,-.001,-.003],[side*.009,-.009,-.007]],.00065,mat);
    const nose=mesh(group,`${label}_nose_pad`,new T.SphereGeometry(1,12,8),pad); nose.scale.set(.0025,.005,.0015); nose.position.set(side*.009,-.01,-.008); nose.rotation.z=side*.22;
  }
  const gap=style==='round'?.009:.008;
  tube(group,'bridge',[[-gap,.004,0],[-.004,.007,.001],[.004,.007,.001],[gap,.004,0]],style==='square'?.0023:.00125,mat);
  if(style==='aviator') tube(group,'brow_bar',[[-.019,.022,0],[0,.023,.001],[.019,.022,0]],.001,gold);
  group.userData={author:'Tatoe Optical',units:'metres',license:'CC0-1.0',style,axes:'X across, Y up, +Z front'};
  return group;
}
await mkdir('public/models',{recursive:true});
await mkdir('model-source',{recursive:true});
for(const style of ['square','round','aviator']) {
  const group=create(style); group.updateMatrixWorld(true);
  const data=await new GLTFExporter().parseAsync(group,{binary:true,onlyVisible:true});
  await writeFile(`public/models/tatoe_${style}.glb`,Buffer.from(data));
  // OBJ contains editable geometry; GLB retains the PBR colours and transparency.
  await writeFile(`model-source/tatoe_${style}.obj`,new OBJExporter().parse(group));
  console.log(`${style}: ${data.byteLength} bytes`);
}
