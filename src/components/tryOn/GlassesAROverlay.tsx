import React, { useEffect, useRef } from 'react';
import type { Product } from '../../types';
import type { FaceMetrics } from '../../lib/faceGeometry';

interface Props {
  metrics: FaceMetrics | null;
  product?: Product;
  mirrored?: boolean;
  videoSize: { width: number; height: number };
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

function mapCoverPoint(
  x: number,
  y: number,
  videoW: number,
  videoH: number,
  screenW: number,
  screenH: number,
  mirrored: boolean
) {
  const scale = Math.max(screenW / videoW, screenH / videoH);
  const renderedW = videoW * scale;
  const renderedH = videoH * scale;
  const cropX = (screenW - renderedW) / 2;
  const cropY = (screenH - renderedH) / 2;
  let sx = x * scale + cropX;
  const sy = y * scale + cropY;
  if (mirrored) sx = screenW - sx;
  return { x: sx, y: sy, scale };
}

function colorForProduct(product?: Product) {
  const text = `${product?.colorName || ''} ${product?.name || ''}`.toLowerCase();
  if (/gold|ทอง|champagne/.test(text)) return '#b68a3b';
  if (/silver|เงิน|chrome/.test(text)) return '#b9c0c7';
  if (/brown|น้ำตาล|tortoise|havanna/.test(text)) return '#5a3b2b';
  if (/blue|น้ำเงิน|ฟ้า/.test(text)) return '#253b61';
  if (/red|แดง|burgundy/.test(text)) return '#6e2f34';
  return '#17191d';
}

function drawProceduralGlasses(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  eyeDistance: number,
  rotation: number,
  product?: Product
) {
  const shape = product?.shape || 'round';
  const color = colorForProduct(product);
  const lensW = eyeDistance * 0.82;
  const lensH = shape === 'round' ? eyeDistance * 0.78 : eyeDistance * 0.56;
  const gap = eyeDistance * 0.13;
  const totalW = lensW * 2 + gap;

  ctx.save();
  ctx.translate(cx, cy + eyeDistance * 0.055);
  ctx.rotate(rotation);
  ctx.lineWidth = Math.max(2, eyeDistance * 0.035);
  ctx.strokeStyle = color;
  ctx.fillStyle = 'rgba(210,230,245,0.10)';

  const drawLens = (centerX: number) => {
    ctx.beginPath();
    if (shape === 'round') {
      ctx.ellipse(centerX, 0, lensW / 2, lensH / 2, 0, 0, Math.PI * 2);
    } else if (shape === 'cat-eye') {
      ctx.moveTo(centerX - lensW / 2, lensH * 0.1);
      ctx.quadraticCurveTo(centerX - lensW * 0.05, -lensH * 0.58, centerX + lensW / 2, -lensH * 0.32);
      ctx.quadraticCurveTo(centerX + lensW * 0.46, lensH * 0.46, centerX, lensH / 2);
      ctx.quadraticCurveTo(centerX - lensW * 0.45, lensH * 0.42, centerX - lensW / 2, lensH * 0.1);
    } else if (shape === 'drop') {
      ctx.moveTo(centerX, -lensH / 2);
      ctx.bezierCurveTo(centerX + lensW / 2, -lensH * 0.42, centerX + lensW / 2, lensH * 0.25, centerX, lensH / 2);
      ctx.bezierCurveTo(centerX - lensW / 2, lensH * 0.25, centerX - lensW / 2, -lensH * 0.42, centerX, -lensH / 2);
    } else {
      const r = Math.min(lensW, lensH) * 0.12;
      ctx.roundRect(centerX - lensW / 2, -lensH / 2, lensW, lensH, r);
    }
    ctx.fill();
    ctx.stroke();
  };

  const left = -(gap / 2 + lensW / 2);
  const right = gap / 2 + lensW / 2;
  drawLens(left);
  drawLens(right);

  // bridge
  ctx.beginPath();
  ctx.moveTo(left + lensW * 0.43, -lensH * 0.05);
  ctx.quadraticCurveTo(0, -lensH * 0.24, right - lensW * 0.43, -lensH * 0.05);
  ctx.stroke();

  // temples
  ctx.lineWidth = Math.max(2, eyeDistance * 0.026);
  ctx.beginPath();
  ctx.moveTo(-totalW / 2 + lensW * 0.08, -lensH * 0.02);
  ctx.lineTo(-totalW / 2 - eyeDistance * 0.34, -lensH * 0.02);
  ctx.moveTo(totalW / 2 - lensW * 0.08, -lensH * 0.02);
  ctx.lineTo(totalW / 2 + eyeDistance * 0.34, -lensH * 0.02);
  ctx.stroke();

  ctx.restore();
}

export const GlassesAROverlay: React.FC<Props> = ({ metrics, product, mirrored = true, videoSize }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const smoothRef = useRef<{ x: number; y: number; scale: number; roll: number } | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const render = () => {
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);

      if (!metrics || !product || !videoSize.width || !videoSize.height) return;

      const anchor = mapCoverPoint(
        metrics.eyeCenter.x,
        metrics.eyeCenter.y,
        videoSize.width,
        videoSize.height,
        rect.width,
        rect.height,
        mirrored
      );

      const target = {
        x: anchor.x,
        y: anchor.y,
        scale: anchor.scale,
        roll: (metrics.rollDeg * Math.PI) / 180,
      };
      const alpha = 0.24;
      if (!smoothRef.current) smoothRef.current = { ...target };
      else {
        smoothRef.current.x += (target.x - smoothRef.current.x) * alpha;
        smoothRef.current.y += (target.y - smoothRef.current.y) * alpha;
        smoothRef.current.scale += (target.scale - smoothRef.current.scale) * alpha;
        smoothRef.current.roll += (target.roll - smoothRef.current.roll) * alpha;
      }

      const eyeDistance = clamp(metrics.eyeDistancePx * smoothRef.current.scale, 40, rect.width * 0.42);
      drawProceduralGlasses(ctx, smoothRef.current.x, smoothRef.current.y, eyeDistance, smoothRef.current.roll, product);
    };

    const loop = () => {
      render();
      rafRef.current = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      smoothRef.current = null;
    };
  }, [metrics, product, mirrored, videoSize.width, videoSize.height]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-[12]" aria-hidden="true" />;
};
