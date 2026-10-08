/** Local, deterministic front-view cleanup. No API key or image generation. */
export type LensPoint = { x: number; y: number };
export interface LensRegion { polygon: LensPoint[]; tint: [number, number, number]; opacity: number }

function hull(points: LensPoint[]): LensPoint[] {
  const p = points.sort((a, b) => a.x - b.x || a.y - b.y);
  const cross = (a: LensPoint, b: LensPoint, c: LensPoint) => (b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
  const half = (list: LensPoint[]) => { const out: LensPoint[] = []; for (const q of list) { while (out.length > 1 && cross(out[out.length-2], out[out.length-1], q) <= 0) out.pop(); out.push(q); } return out; };
  return [...half(p).slice(0, -1), ...half([...p].reverse()).slice(0, -1)];
}

/** Locate enclosed lens interiors from contrast, including opaque tinted lenses.
 * Interior arm pixels are barriers, but their surrounding interior is joined by
 * the convex hull. Only accept two large, balanced, enclosed regions; never
 * guess elliptical holes for an unrecognised / angled product photograph. */
export function detectLensRegions(data: Uint8ClampedArray, w: number, h: number): LensRegion[] {
  for (const gain of [0.40, 0.65, 0.80]) {
    const result = detectAtContrast(data, w, h, gain);
    if (result.length === 2) return result;
  }
  return [];
}

function detectAtContrast(data: Uint8ClampedArray, w: number, h: number, gain: number): LensRegion[] {
  const total = w*h, lum = new Float32Array(total), samples: number[] = [];
  for (let i=0;i<total;i++) {
    const o=i*4; lum[i]=0.299*data[o]+0.587*data[o+1]+0.114*data[o+2];
    if (data[o+3]>80) samples.push(lum[i]);
  }
  if (samples.length < 40) return [];
  samples.sort((a,b)=>a-b);
  const dark = samples[Math.floor(samples.length*0.10)];
  const mid = samples[Math.floor(samples.length*0.65)];
  // Already transparent lens holes use the same boundary pass. Tinted lenses
  // require contrast between rim and lens; otherwise leave the asset intact.
  const threshold = dark + Math.max(9, Math.min(85, (mid-dark)*gain));
  const raw = new Uint8Array(total), dilated = new Uint8Array(total), closed = new Uint8Array(total);
  for (let i=0;i<total;i++) raw[i]=Number(data[i*4+3]>80 && lum[i]<threshold);
  for(let y=1;y<h-1;y++) for(let x=1;x<w-1;x++) {
    let v=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++) v |= raw[(y+dy)*w+x+dx];
    dilated[y*w+x]=v;
  }
  for(let y=2;y<h-2;y++) for(let x=2;x<w-2;x++) {
    let v=1;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++) v &= dilated[(y+dy)*w+x+dx];
    closed[y*w+x]=v;
  }
  const barrier = (i: number) => !!(raw[i] || closed[i]);
  const seen = new Uint8Array(total), queue = new Int32Array(total);
  const components: { points: LensPoint[]; n: number; x: number; y: number; edge: boolean; colors: [number,number,number,number][] }[] = [];
  for (let start=0;start<total;start++) {
    if (seen[start] || barrier(start)) continue;
    let head=0,tail=0,sx=0,sy=0,edge=false;
    const points: LensPoint[]=[], colors: [number,number,number,number][]=[]; queue[tail++]=start;seen[start]=1;
    while (head<tail) {
      const i=queue[head++],x=i%w,y=Math.floor(i/w);sx+=x;sy+=y;
      if (x===0||y===0||x===w-1||y===h-1) edge=true;
      let boundary=false;
      for (const [nx,ny] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]) {
        if(nx<0||ny<0||nx>=w||ny>=h) continue;
        const j=ny*w+nx;
        if(barrier(j)) {boundary=true;continue;}
        if(!seen[j]) {seen[j]=1;queue[tail++]=j;}
      }
      if(boundary) points.push({x,y});
      else if (i % 4 === 0 && data[i*4+3]>80 && lum[i]>threshold+5) {
        const o=i*4; colors.push([data[o],data[o+1],data[o+2],lum[i]]);
      }
    }
    if (!edge && tail>total*0.008) components.push({points,n:tail,x:sx/tail,y:sy/tail,edge,colors});
  }
  const groups = [components.filter(c=>c.x<w*0.48), components.filter(c=>c.x>w*0.52)];
  const regions: LensRegion[]=[];
  for (const group of groups) {
    group.sort((a,b)=>b.n-a.n);
    const main=group[0]; if(!main||main.n<total*0.025) return [];
    const parts=group.filter(c=>Math.abs(c.y-main.y)<h*0.25 && c.n>main.n*0.06);
    const polygon=hull(parts.flatMap(c=>c.points));
    if(polygon.length<4) return [];
    const xs=polygon.map(p=>p.x),ys=polygon.map(p=>p.y);
    const bw=Math.max(...xs)-Math.min(...xs),bh=Math.max(...ys)-Math.min(...ys);
    if(bw<w*0.16||bw>w*0.48||bh<h*0.22||bh>h*0.94) return [];
    const colors = parts.flatMap(c=>c.colors);
    colors.sort((a,b)=>a[3]-b[3]);
    const sample=colors[Math.floor(colors.length*0.6)];
    const tint: [number,number,number]=sample ? [sample[0],sample[1],sample[2]] : [255,255,255];
    const brightness=sample?.[3]??255;
    // Replace opaque product-photo lens with an optical tint, revealing the face.
    const opacity=brightness>185 ? 0 : Math.min(0.55,Math.max(0.12,(255-brightness)/255*0.60));
    regions.push({polygon,tint,opacity});
  }
  const centres=regions.map(r=>({x:r.polygon.reduce((s,p)=>s+p.x,0)/r.polygon.length,y:r.polygon.reduce((s,p)=>s+p.y,0)/r.polygon.length}));
  if(centres[1].x-centres[0].x<w*0.25 || Math.abs(centres[0].y-centres[1].y)>h*0.22) return [];
  return regions;
}

/** Keep original rim pixels; replace only the detected lens interior. */
export function cleanLensInteriors(canvas: HTMLCanvasElement): boolean {
  const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)return false;
  const w=Math.min(480,canvas.width),h=Math.max(1,Math.round(canvas.height*w/canvas.width));
  const probe=document.createElement('canvas');probe.width=w;probe.height=h;
  const pc=probe.getContext('2d',{willReadFrequently:true});if(!pc)return false;
  pc.drawImage(canvas,0,0,w,h);
  const regions=detectLensRegions(pc.getImageData(0,0,w,h).data,w,h);
  if(regions.length!==2)return false;
  ctx.save();ctx.scale(canvas.width/w,canvas.height/h);
  for(const r of regions) {
    ctx.beginPath();r.polygon.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();
    ctx.globalCompositeOperation='destination-out';ctx.fillStyle='#000';ctx.fill();
    ctx.globalCompositeOperation='source-over';ctx.fillStyle=`rgba(${r.tint.join(',')},${r.opacity})`;ctx.fill();
  }
  ctx.restore();return true;
}
