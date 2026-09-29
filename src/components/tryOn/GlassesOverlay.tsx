import React, { forwardRef } from 'react';

interface GlassesOverlayProps {
  className?: string;
  mirrored?: boolean;
}

/**
 * The visible render surface for a preview (camera or static photo). The
 * owner of the ref draws the full frame onto this canvas each update — not
 * just the glasses — so that glasses pixels can be composited (multiply
 * blend) against the actual face pixels underneath rather than against
 * nothing. A canvas can't blend against a separate <video>/<img> sitting
 * behind it in the DOM, only against pixels already drawn on itself.
 * `object-cover` keeps its internal (native-resolution) bitmap scaled
 * identically to how the source video/image is framed.
 */
export const GlassesOverlay = forwardRef<HTMLCanvasElement, GlassesOverlayProps>(
  ({ className = '', mirrored = false }, ref) => {
    return (
      <canvas
        ref={ref}
        className={`absolute inset-0 w-full h-full object-cover pointer-events-none ${
          mirrored ? '-scale-x-100' : ''
        } ${className}`}
      />
    );
  }
);

GlassesOverlay.displayName = 'GlassesOverlay';
