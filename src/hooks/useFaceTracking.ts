import { useEffect, useRef, useState, type RefObject, type MutableRefObject } from 'react';
import { getVideoFaceLandmarker, isBrowserSupported } from '../lib/faceLandmarkerLoader';
import { computeFaceMetrics, type FaceMetrics } from '../lib/faceGeometry';

export type TrackingStatus = 'idle' | 'unsupported' | 'loading-model' | 'no-face' | 'multiple-faces' | 'tracking' | 'error';
export interface UseFaceTrackingOptions { videoRef: RefObject<HTMLVideoElement | null>; enabled: boolean }
export interface UseFaceTrackingResult {
  status: TrackingStatus; errorMessage: string | null; metrics: FaceMetrics | null;
  metricsRef: MutableRefObject<FaceMetrics | null>;
}
const UI_INTERVAL = 80, FRAME_INTERVAL = 50;

export function useFaceTracking({ videoRef, enabled }: UseFaceTrackingOptions): UseFaceTrackingResult {
  const [status,setStatus] = useState<TrackingStatus>('idle');
  const [errorMessage,setErrorMessage] = useState<string|null>(null);
  const [metrics,setMetrics] = useState<FaceMetrics|null>(null);
  const metricsRef = useRef<FaceMetrics|null>(null);
  useEffect(()=>{
    metricsRef.current=null; setMetrics(null); setErrorMessage(null);
    if(!enabled){setStatus('idle');return}
    if(!isBrowserSupported()){setStatus('unsupported');setErrorMessage('อุปกรณ์นี้ไม่รองรับการลองแว่น 3D');return}
    let cancelled=false,raf=0,busy=false,lastVideoTime=-1,lastSubmit=0,lastUi=0;
    let lastStatus:TrackingStatus='loading-model';
    let worker:Worker|null=null, timer:ReturnType<typeof setTimeout>|undefined;
    let fallbackStarted=false, errors=0;
    setStatus('loading-model');
    const clearTimer=()=>{if(timer!==undefined)clearTimeout(timer);timer=undefined};
    const commit=(faces:any[],matrix:ArrayLike<number>|undefined,width:number,height:number)=>{
      if(cancelled)return;
      const next=faces.length===1?computeFaceMetrics(faces[0],width,height,matrix):null;
      const nextStatus:TrackingStatus=faces.length>1?'multiple-faces':next?'tracking':'no-face';
      metricsRef.current=next;
      const now=performance.now();
      if(nextStatus!==lastStatus||now-lastUi>=UI_INTERVAL){lastStatus=nextStatus;lastUi=now;setStatus(nextStatus);setMetrics(next)}
    };
    const schedule=(loop:FrameRequestCallback)=>{if(!cancelled)raf=requestAnimationFrame(loop)};
    const getFrame=(timestamp:number)=>{
      const video=videoRef.current;
      if(!video||video.readyState<2||!video.videoWidth||video.currentTime===lastVideoTime||timestamp-lastSubmit<FRAME_INTERVAL||document.hidden)return null;
      lastVideoTime=video.currentTime;lastSubmit=timestamp;return video;
    };
    const fallback=async()=>{
      if(cancelled||fallbackStarted)return;
      fallbackStarted=true;clearTimer();worker?.terminate();worker=null;cancelAnimationFrame(raf);busy=false;
      try {
        const detector=await getVideoFaceLandmarker();if(cancelled)return;
        const loop=(timestamp:number)=>{
          if(cancelled)return;schedule(loop);
          if(timestamp-lastSubmit<100)return;
          const video=getFrame(timestamp);if(!video)return;
          try{const result=detector.detectForVideo(video,timestamp);commit(result.faceLandmarks,result.facialTransformationMatrixes?.[0]?.data,video.videoWidth,video.videoHeight);errors=0}
          catch{if(++errors>=3){cancelAnimationFrame(raf);setStatus('error');setErrorMessage('ตรวจจับใบหน้าไม่สำเร็จ กรุณาเริ่มระบบใหม่')}}
        };
        schedule(loop);
      }catch{if(!cancelled){setStatus('error');setErrorMessage('โหลดระบบลองแว่นไม่สำเร็จ กรุณาเริ่มระบบใหม่')}}
    };
    if(typeof Worker!=='undefined'&&typeof OffscreenCanvas!=='undefined'&&typeof createImageBitmap==='function') {
      try {
        worker=new Worker(new URL('/mediapipe/face-worker.js',window.location.origin));
        timer=setTimeout(()=>{void fallback()},15000);
        worker.onerror=()=>{void fallback()};
        worker.onmessage=({data})=>{
          if(cancelled||fallbackStarted)return;
          if(data.type==='ready'){
            clearTimer();errors=0;
            const loop=(timestamp:number)=>{
              if(cancelled||fallbackStarted)return;schedule(loop);
              if(busy)return;
              const video=getFrame(timestamp);if(!video)return;
              busy=true;
              const width=video.videoWidth,height=video.videoHeight;
              const ratio=Math.min(1,720/Math.max(width,height));
              createImageBitmap(video,{resizeWidth:Math.round(width*ratio),resizeHeight:Math.round(height*ratio),resizeQuality:'low'}).then(bitmap=>{
                if(cancelled||fallbackStarted||!worker){bitmap.close();busy=false;return}
                try{worker.postMessage({type:'frame',bitmap,timestamp,width,height},[bitmap]);timer=setTimeout(()=>{void fallback()},3000)}
                catch{bitmap.close();busy=false;void fallback()}
              }).catch(()=>{busy=false;void fallback()});
            };
            schedule(loop);
          } else if(data.type==='result'){
            clearTimer();busy=false;errors=0;commit(data.landmarks,data.matrix,data.width,data.height);
          } else if(data.type==='skipped'){clearTimer();busy=false}
          else if(data.type==='error'){clearTimer();busy=false;void fallback()}
        };
        worker.postMessage({type:'init'});
      }catch{void fallback()}
    }else{void fallback()}
    return ()=>{cancelled=true;clearTimer();cancelAnimationFrame(raf);worker?.terminate();metricsRef.current=null};
  },[enabled,videoRef]);
  return {status,errorMessage,metrics,metricsRef};
}
