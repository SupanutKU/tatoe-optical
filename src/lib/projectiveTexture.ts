import type { Point2D } from './faceGeometry';

const pixels = new WeakMap<object, ImageData>();
let surface: HTMLCanvasElement | undefined;
let buffer: ImageData | undefined;

/** One inverse-mapped bitmap, rather than 128 independently antialiased
 * triangles. Each destination pixel is written once, so transparent lenses
 * have no triangle grid or doubled opacity along internal mesh edges. */
export function drawSeamlessTexture(ctx: CanvasRenderingContext2D, image: CanvasImageSource, q: [Point2D,Point2D,Point2D,Point2D]): boolean {
  try {
    let src=pixels.get(image as object);
    if(!src) {
      const sw=(image as HTMLImageElement).naturalWidth||(image as HTMLCanvasElement).width;
      const sh=(image as HTMLImageElement).naturalHeight||(image as HTMLCanvasElement).height;
      const c=document.createElement('canvas');c.width=sw;c.height=sh;
      const cx=c.getContext('2d',{willReadFrequently:true});if(!cx||!sw||!sh)return false;
      cx.drawImage(image,0,0);src=cx.getImageData(0,0,sw,sh);pixels.set(image as object,src);
    }
    const x0=Math.floor(Math.min(...q.map(p=>p.x))),y0=Math.floor(Math.min(...q.map(p=>p.y)));
    const width=Math.ceil(Math.max(...q.map(p=>p.x)))-x0+1,height=Math.ceil(Math.max(...q.map(p=>p.y)))-y0+1;
    if(!Number.isFinite(width+height)||width<=0||height<=0)return false;
    const scale=Math.min(1,900/width,600/height),w=Math.max(1,Math.ceil(width*scale)),h=Math.max(1,Math.ceil(height*scale));
    const [p0,p1,p2,p3]=q;
    const dx1=p1.x-p2.x,dx2=p3.x-p2.x,dy1=p1.y-p2.y,dy2=p3.y-p2.y;
    const dx3=p0.x-p1.x+p2.x-p3.x,dy3=p0.y-p1.y+p2.y-p3.y;
    const det=dx1*dy2-dx2*dy1;
    if(Math.abs(det)<1e-8)return false;
    const g=(dx3*dy2-dx2*dy3)/det,k=(dx1*dy3-dx3*dy1)/det;
    const a=p1.x-p0.x+g*p1.x,b=p3.x-p0.x+k*p3.x,c=p0.x;
    const d=p1.y-p0.y+g*p1.y,e=p3.y-p0.y+k*p3.y,f=p0.y;
    // Inverse 3x3 homography (common determinant cancels in u,v).
    const A=e-f*k,B=c*k-b,C=b*f-c*e,D=f*g-d,E=a-c*g,F=c*d-a*f,G=d*k-e*g,H=b*g-a*k,I=a*e-b*d;
    surface??=document.createElement('canvas');
    if(surface.width!==w||surface.height!==h||!buffer) {surface.width=w;surface.height=h;buffer=new ImageData(w,h);}
    const out=buffer.data,sd=src.data,sw=src.width,sh=src.height;out.fill(0);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++) {
      const px=x0+(x+0.5)/scale,py=y0+(y+0.5)/scale,z=G*px+H*py+I;
      if(Math.abs(z)<1e-8)continue;
      const u=(A*px+B*py+C)/z,v=(D*px+E*py+F)/z;
      if(u<0||u>1||v<0||v>1)continue;
      const sx=Math.max(0,Math.min(sw-1,u*sw-0.5)),sy=Math.max(0,Math.min(sh-1,v*sh-0.5));
      const ix=Math.floor(sx),iy=Math.floor(sy),tx=sx-ix,ty=sy-iy;
      const j00=(iy*sw+ix)*4,j10=(iy*sw+Math.min(sw-1,ix+1))*4,j01=(Math.min(sh-1,iy+1)*sw+ix)*4,j11=(Math.min(sh-1,iy+1)*sw+Math.min(sw-1,ix+1))*4;
      const weights=[(1-tx)*(1-ty),tx*(1-ty),(1-tx)*ty,tx*ty],idx=[j00,j10,j01,j11];
      let alpha=0,r=0,green=0,blue=0;
      for(let n=0;n<4;n++){const weight=weights[n]*sd[idx[n]+3];alpha+=weight;r+=weight*sd[idx[n]];green+=weight*sd[idx[n]+1];blue+=weight*sd[idx[n]+2];}
      const o=(y*w+x)*4;
      if(alpha>0){out[o]=r/alpha;out[o+1]=green/alpha;out[o+2]=blue/alpha;out[o+3]=alpha;}
    }
    const ox=surface.getContext('2d');if(!ox)return false;ox.putImageData(buffer,0,0);
    ctx.drawImage(surface,x0,y0,w/scale,h/scale);return true;
  } catch { return false; } // Remote CORS assets retain the existing renderer.
}
