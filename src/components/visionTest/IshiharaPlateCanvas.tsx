import React, { useEffect, useRef, useState } from 'react';

interface IshiharaPlateCanvasProps {
  plateId: number;
  numberDisplay: string;
  size?: number;
  className?: string;
}

interface Dot {
  x: number;
  y: number;
  r: number;
  color: string;
}

// Realistic Ishihara color sets by plate
const PALETTES: Record<
  number,
  {
    foreground: string[];
    background: string[];
    alternateForeground?: string[];
  }
> = {
  // Plate 1: Demonstration 12 (Every normal & colorblind person can see)
  1: {
    foreground: ['#D95627', '#E26938', '#C4461B', '#ED7A4A', '#BA3F15'],
    background: ['#6B9A80', '#7EAB91', '#5B8C71', '#8DBDA3', '#537F66']
  },
  // Plate 2: 8 (Normal sees 8, Red-Green sees 3)
  2: {
    foreground: ['#D65038', '#E3664F', '#C33F27', '#EB745F'],
    background: ['#719869', '#82A97A', '#608758', '#8FB687', '#577C50'],
    alternateForeground: ['#889360', '#7B8855']
  },
  // Plate 3: 6 (Normal sees 6, Red-Green sees nothing)
  3: {
    foreground: ['#D64835', '#E45E4C', '#C43623', '#ED6F5D'],
    background: ['#70976A', '#81A87B', '#60865A', '#8DB387', '#547A4E']
  },
  // Plate 4: 29 (Normal sees 29, Red-Green sees 70)
  4: {
    foreground: ['#D85038', '#E4644D', '#C53D25', '#EB725C'],
    background: ['#6E9668', '#7FA779', '#5E8558', '#8FB789', '#53794D']
  },
  // Plate 5: 5 (Normal sees 5, Red-Green sees 2)
  5: {
    foreground: ['#DA5037', '#E5634B', '#C73F26', '#EB715A'],
    background: ['#70966A', '#80A67A', '#60855A', '#8EB488', '#54784E']
  },
  // Plate 6: 74 (Normal sees 74, Red-Green sees 21)
  6: {
    foreground: ['#D84C36', '#E4604A', '#C63B23', '#EA6F59'],
    background: ['#6F9569', '#7FA579', '#5E8358', '#8DB387', '#53774D']
  },
  // Plate 7: 16 (Normal sees 16, Red-Green blind sees nothing or indistinctly)
  7: {
    foreground: ['#D64630', '#E35943', '#C4341E', '#EC6A55'],
    background: ['#73986D', '#84A97E', '#63885D', '#91B68B', '#567A50']
  },
  // Plate 8: 73 (Normal sees 73, Red-Green sees nothing)
  8: {
    foreground: ['#DA4D37', '#E5614A', '#C73C23', '#EB705A'],
    background: ['#6E9568', '#7FA679', '#5D8457', '#8EB588', '#52774C']
  }
};

export const IshiharaPlateCanvas: React.FC<IshiharaPlateCanvasProps> = ({
  plateId,
  numberDisplay,
  size = 280,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use higher DPR for crisp rendering on retina/mobile screens
    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 2, 2.5) : 2;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const center = size / 2;
    const radius = size * 0.46;

    // 1. Render offscreen mask with numberDisplay
    const offscreen = document.createElement('canvas');
    offscreen.width = size;
    offscreen.height = size;
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) return;

    offCtx.fillStyle = '#000000';
    offCtx.fillRect(0, 0, size, size);

    // Draw circular mask clip
    offCtx.save();
    offCtx.beginPath();
    offCtx.arc(center, center, radius, 0, Math.PI * 2);
    offCtx.clip();

    // Draw the number on offscreen canvas in pure white
    offCtx.fillStyle = '#FFFFFF';
    offCtx.textAlign = 'center';
    offCtx.textBaseline = 'middle';
    
    // Choose font size based on text length
    const fontSize = numberDisplay.length > 1 ? size * 0.52 : size * 0.62;
    offCtx.font = `900 ${fontSize}px "Plus Jakarta Sans", "Arial Black", Impact, sans-serif`;
    offCtx.fillText(numberDisplay, center, center + size * 0.02);
    offCtx.restore();

    // Read mask pixel data
    const maskData = offCtx.getImageData(0, 0, size, size).data;

    // Helper to check if (x,y) hits foreground number
    const isMaskHit = (x: number, y: number): boolean => {
      const px = Math.floor(x);
      const py = Math.floor(y);
      if (px < 0 || px >= size || py < 0 || py >= size) return false;
      const idx = (py * size + px) * 4;
      return maskData[idx] > 120; // Red channel > 120 means white text
    };

    // 2. Generate dot positions deterministically based on plateId & size
    const palette = PALETTES[plateId] || PALETTES[1];
    const dots: Dot[] = [];

    // Simple pseudo-random seeded generator
    let seed = plateId * 98765 + 12345;
    const rnd = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    // Packing circles inside plate
    const minR = size * 0.016;
    const maxR = size * 0.038;
    const step = size * 0.046;

    for (let y = center - radius; y <= center + radius; y += step * 0.85) {
      for (let x = center - radius; x <= center + radius; x += step * 0.85) {
        // Add random jitter to grid
        const jx = x + (rnd() - 0.5) * step * 0.75;
        const jy = y + (rnd() - 0.5) * step * 0.75;
        const dist = Math.hypot(jx - center, jy - center);

        if (dist + maxR <= radius) {
          const r = minR + rnd() * (maxR - minR);
          const isFg = isMaskHit(jx, jy);

          let colorPool: string[];
          if (isFg) {
            colorPool = palette.foreground;
          } else {
            colorPool = palette.background;
          }

          const baseColor = colorPool[Math.floor(rnd() * colorPool.length)];
          dots.push({
            x: jx,
            y: jy,
            r,
            color: baseColor
          });
        }
      }
    }

    // Secondary fill in gaps
    for (let i = 0; i < 220; i++) {
      const angle = rnd() * Math.PI * 2;
      const dist = Math.sqrt(rnd()) * (radius - maxR * 1.1);
      const gx = center + Math.cos(angle) * dist;
      const gy = center + Math.sin(angle) * dist;

      // Check distance to existing dots
      let tooClose = false;
      for (const d of dots) {
        if (Math.hypot(gx - d.x, gy - d.y) < d.r + minR * 0.7) {
          tooClose = true;
          break;
        }
      }

      if (!tooClose) {
        const isFg = isMaskHit(gx, gy);
        const colorPool = isFg ? palette.foreground : palette.background;
        dots.push({
          x: gx,
          y: gy,
          r: minR * (0.8 + rnd() * 0.8),
          color: colorPool[Math.floor(rnd() * colorPool.length)]
        });
      }
    }

    // 3. Clear canvas & draw backdrop circle
    ctx.clearRect(0, 0, size, size);

    // Subtle disc background shadow and rim
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#1e293b';
    ctx.fill();

    // Draw all dots
    for (const d of dots) {
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = d.color;
      ctx.fill();
    }

    // Subtle inner vignette ring to mimic genuine paper plates
    const grad = ctx.createRadialGradient(
      center,
      center,
      radius * 0.75,
      center,
      center,
      radius
    );
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.restore();
    setIsRendered(true);
  }, [plateId, numberDisplay, size]);

  return (
    <div
      className={`relative rounded-full overflow-hidden shadow-xl ring-4 ring-white/10 select-none flex items-center justify-center bg-slate-900 ${className}`}
      style={{ width: size, height: size }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="block"
        aria-label={`แผ่นตรวจสายตาตาบอดสีอิชิฮาระ แผ่นที่ ${plateId}`}
      />
      {!isRendered && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-white/50 animate-pulse">
          กำลังสร้างแผ่นทดสอบ...
        </div>
      )}
    </div>
  );
};
