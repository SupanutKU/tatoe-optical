import React, { useRef } from 'react';
import { FrozenPhotoView } from './FrozenPhotoView';
import type { FrozenPhoto } from '../../hooks/useVirtualTryOn';

interface UploadViewProps {
  photo: FrozenPhoto | null;
  isProcessing: boolean;
  glassesSrc: string | null;
  onFileSelected: (file: File) => void;
  onRetake: () => void;
}

export const UploadView: React.FC<UploadViewProps> = ({
  photo,
  isProcessing,
  glassesSrc,
  onFileSelected,
  onRetake,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  if (photo) {
    return (
      <FrozenPhotoView photo={photo} glassesSrc={glassesSrc} retakeLabel="เลือกรูปใหม่" onRetake={onRetake} />
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center gap-4 bg-surface-container-high px-6 text-center">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelected(file);
          e.target.value = '';
        }}
      />

      {isProcessing ? (
        <>
          <span className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-on-surface-variant">กำลังตรวจจับใบหน้าในรูปภาพ...</p>
        </>
      ) : (
        <>
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[30px]">add_a_photo</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-on-surface">อัปโหลดรูปใบหน้าของคุณ</p>
            <p className="text-xs text-on-surface-variant mt-1">รองรับไฟล์ JPG, PNG หรือ WEBP</p>
          </div>
          <button
            onClick={() => inputRef.current?.click()}
            className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">image</span>
            เลือกรูปภาพ
          </button>
        </>
      )}
    </div>
  );
};
