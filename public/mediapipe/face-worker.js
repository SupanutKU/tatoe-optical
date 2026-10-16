/* Classic worker: MediaPipe's WASM loader needs importScripts. The matching
 * SDK module and model are both hosted by this app; no camera frames leave it. */
let detector = null;
let busy = false;
self.onmessage = async ({ data }) => {
  if (data.type === 'init') {
    try {
      const base = new URL('./', self.location.href);
      const { FaceLandmarker, FilesetResolver } = await import(new URL('vision_bundle.mjs', base).href);
      const vision = await FilesetResolver.forVisionTasks(new URL('wasm', base).href);
      const options = { runningMode: 'VIDEO', numFaces: 1, outputFacialTransformationMatrixes: true,
        outputFaceBlendshapes: false, minFaceDetectionConfidence: .5, minFacePresenceConfidence: .5, minTrackingConfidence: .5 };
      try {
        detector = await FaceLandmarker.createFromOptions(vision, { ...options, canvas: new OffscreenCanvas(1, 1),
          baseOptions: { modelAssetPath: new URL('face_landmarker.task', base).href, delegate: 'GPU' } });
      } catch {
        detector = await FaceLandmarker.createFromOptions(vision, { ...options, canvas: new OffscreenCanvas(1, 1),
          baseOptions: { modelAssetPath: new URL('face_landmarker.task', base).href, delegate: 'CPU' } });
      }
      self.postMessage({ type: 'ready' });
    } catch (error) { self.postMessage({ type: 'error', message: String(error) }); }
    return;
  }
  if (data.type === 'frame') {
    if (!detector || busy) { data.bitmap.close(); self.postMessage({ type: 'skipped' }); return; }
    busy = true;
    try {
      const result = detector.detectForVideo(data.bitmap, data.timestamp);
      self.postMessage({ type: 'result', landmarks: result.faceLandmarks,
        matrix: result.facialTransformationMatrixes?.[0]?.data ? Array.from(result.facialTransformationMatrixes[0].data) : undefined,
        width: data.width, height: data.height });
    } catch (error) { self.postMessage({ type: 'error', message: String(error) }); }
    finally { data.bitmap.close(); busy = false; }
  }
};
