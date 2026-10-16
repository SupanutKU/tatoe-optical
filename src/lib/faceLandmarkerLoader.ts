import {
  FaceLandmarker,
  FilesetResolver,
  type FaceLandmarkerResult,
} from '@mediapipe/tasks-vision';

// Matching runtime and model are served by the app, including on mobile.
const WASM_BASE_URL = '/mediapipe/wasm';
const MODEL_ASSET_URL = '/mediapipe/face_landmarker.task';

export type RunningMode = 'VIDEO' | 'IMAGE';

let videoLandmarkerPromise: Promise<FaceLandmarker> | null = null;
let imageLandmarkerPromise: Promise<FaceLandmarker> | null = null;

async function createLandmarker(runningMode: RunningMode): Promise<FaceLandmarker> {
  const vision = await FilesetResolver.forVisionTasks(WASM_BASE_URL);
  const options = {
    baseOptions: {
      modelAssetPath: MODEL_ASSET_URL,
      delegate: 'GPU' as const,
    },
    runningMode,
    numFaces: runningMode === 'VIDEO' ? 1 : 2,
    minFaceDetectionConfidence: .5,
    minFacePresenceConfidence: .5,
    minTrackingConfidence: .5,
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: true,
  };
  try { return await FaceLandmarker.createFromOptions(vision, options); }
  catch { return FaceLandmarker.createFromOptions(vision, { ...options, baseOptions: { ...options.baseOptions, delegate: 'CPU' } }); }
}

/** Lazily creates (once) and returns the VIDEO-mode landmarker used for the live camera feed. */
export function getVideoFaceLandmarker(): Promise<FaceLandmarker> {
  if (!videoLandmarkerPromise) {
    videoLandmarkerPromise = createLandmarker('VIDEO').catch((err) => {
      videoLandmarkerPromise = null;
      throw err;
    });
  }
  return videoLandmarkerPromise;
}

/** Lazily creates (once) and returns the IMAGE-mode landmarker used for uploaded photos. */
export function getImageFaceLandmarker(): Promise<FaceLandmarker> {
  if (!imageLandmarkerPromise) {
    imageLandmarkerPromise = createLandmarker('IMAGE').catch((err) => {
      imageLandmarkerPromise = null;
      throw err;
    });
  }
  return imageLandmarkerPromise;
}

export function isBrowserSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window.WebAssembly && document.createElement('canvas').getContext('webgl2'));
}

export type { FaceLandmarkerResult };
