import { useCallback, useRef, useState } from 'react';
import { getImageFaceLandmarker, isBrowserSupported } from '../lib/faceLandmarkerLoader';
import { computeFaceMetrics, type FaceMetrics } from '../lib/faceGeometry';

export type TryOnMode = 'camera' | 'upload';

export type PhotoStatus = 'detecting' | 'no-face' | 'multiple-faces' | 'ready' | 'error';

export interface FrozenPhoto {
  src: string;
  naturalWidth: number;
  naturalHeight: number;
  status: PhotoStatus;
  metrics: FaceMetrics | null;
  errorMessage?: string;
}

export interface UseVirtualTryOnResult {
  mode: TryOnMode;
  setMode: (mode: TryOnMode) => void;
  frozenPhoto: FrozenPhoto | null;
  isProcessingUpload: boolean;
  captureFromVideo: (video: HTMLVideoElement, liveMetrics: FaceMetrics | null, mirrored: boolean) => void;
  handleUploadFile: (file: File) => Promise<void>;
  retake: () => void;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image-load-failed'));
    img.src = src;
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('file-read-failed'));
    reader.readAsDataURL(file);
  });
}

async function analyzeFrozenPhoto(src: string): Promise<FrozenPhoto> {
  const image = await loadImageElement(src);
  const base = {src,naturalWidth:image.naturalWidth,naturalHeight:image.naturalHeight,metrics:null};
  const detector = await getImageFaceLandmarker();
  const result = detector.detect(image);
  const faces = result.faceLandmarks ?? [];
  if (!faces.length) return {...base,status:'no-face',errorMessage:'ไม่พบใบหน้า กรุณาใช้ภาพที่เห็นใบหน้าชัดเจน'};
  if (faces.length>1) return {...base,status:'multiple-faces',errorMessage:'พบมากกว่า 1 ใบหน้า กรุณาใช้ภาพที่มีใบหน้าเดียว'};
  const metrics = computeFaceMetrics(faces[0],image.naturalWidth,image.naturalHeight,result.facialTransformationMatrixes?.[0]?.data);
  return {...base,metrics,status:metrics?'ready':'error',errorMessage:metrics?undefined:'ไม่สามารถวิเคราะห์ใบหน้าได้ กรุณาลองใหม่'};
}

export function useVirtualTryOn(): UseVirtualTryOnResult {
  const [mode,setModeState] = useState<TryOnMode>('camera');
  const [frozenPhoto,setFrozenPhoto] = useState<FrozenPhoto|null>(null);
  const [isProcessingUpload,setIsProcessingUpload] = useState(false);
  const requestId = useRef(0);
  const setMode = useCallback((next:TryOnMode)=>{
    requestId.current++; setModeState(next); setFrozenPhoto(null); setIsProcessingUpload(false);
  },[]);
  const retake = useCallback(()=>{
    requestId.current++; setFrozenPhoto(null); setIsProcessingUpload(false);
  },[]);

  const captureFromVideo = useCallback(async(video:HTMLVideoElement,_liveMetrics:FaceMetrics|null,mirrored:boolean)=>{
    if (!video || !video.videoWidth || !video.videoHeight) return;
    const id = ++requestId.current;
    const canvas = document.createElement('canvas');
    canvas.width=video.videoWidth;canvas.height=video.videoHeight;
    const ctx=canvas.getContext('2d');if(!ctx)return;
    if(mirrored){ctx.translate(canvas.width,0);ctx.scale(-1,1)}
    ctx.drawImage(video,0,0,canvas.width,canvas.height);
    const src=canvas.toDataURL('image/jpeg',.94);
    setIsProcessingUpload(false);
    setFrozenPhoto({src,naturalWidth:canvas.width,naturalHeight:canvas.height,status:'detecting',metrics:null});
    try {
      // Re-detect this exact mirrored snapshot. Live pose may belong to a
      // preceding video frame, especially when the wearer moves while clicking.
      const photo=await analyzeFrozenPhoto(src);
      if(id===requestId.current)setFrozenPhoto(photo);
    }catch{
      if(id===requestId.current)setFrozenPhoto({src,naturalWidth:canvas.width,naturalHeight:canvas.height,status:'error',metrics:null,errorMessage:'วิเคราะห์ภาพที่ถ่ายไม่สำเร็จ กรุณาถ่ายใหม่'});
    }
  },[]);

  const handleUploadFile = useCallback(async(file:File)=>{
    const id=++requestId.current;
    setIsProcessingUpload(false);
    const error=(message:string)=>setFrozenPhoto({src:'',naturalWidth:0,naturalHeight:0,status:'error',metrics:null,errorMessage:message});
    if(!ACCEPTED_TYPES.includes(file.type)){error('รองรับเฉพาะไฟล์ JPG, JPEG, PNG หรือ WEBP เท่านั้น');return}
    if(!isBrowserSupported()){error('เบราว์เซอร์นี้ไม่รองรับการตรวจจับใบหน้า');return}
    setIsProcessingUpload(true);
    try {
      const src=await readFileAsDataUrl(file);
      const image=await loadImageElement(src);
      if(id!==requestId.current)return;
      setFrozenPhoto({src,naturalWidth:image.naturalWidth,naturalHeight:image.naturalHeight,status:'detecting',metrics:null});
      const photo=await analyzeFrozenPhoto(src);
      if(id===requestId.current)setFrozenPhoto(photo);
    }catch{
      if(id===requestId.current)error('เกิดข้อผิดพลาดในการประมวลผลรูปภาพ กรุณาลองใหม่');
    }finally{
      if(id===requestId.current)setIsProcessingUpload(false);
    }
  },[]);
  return {mode,setMode,frozenPhoto,isProcessingUpload,captureFromVideo,handleUploadFile,retake};
}
