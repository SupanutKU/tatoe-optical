import {
  FaceLandmarker,
  FilesetResolver,
  type FaceLandmarkerResult,
} from '@mediapipe/tasks-vision';

// Google's public MediaPipe CDN + model store. Downloaded once by the
// browser and cached — no assets need to be bundled with the app.
const WASM_BASE_URL =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/wasm';
const MODEL_ASSET_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

export type RunningMode = 'VIDEO' | 'IMAGE';

let videoLandmarkerPromise: Promise<FaceLandmarker> | null = null;
let imageLandmarkerPromise: Promise<FaceLandmarker> | null = null;

async function createLandmarker(runningMode: RunningMode): Promise<FaceLandmarker> {
  const vision = await FilesetResolver.forVisionTasks(WASM_BASE_URL);
  return FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: MODEL_ASSET_URL,
      delegate: 'GPU',
    },
    runningMode,
    numFaces: 2, // allow detecting a 2nd face just so we can warn the user
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: true,
  });
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
