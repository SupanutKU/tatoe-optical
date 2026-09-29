import React, { useRef, useState } from 'react';
import { prepareEyewearAsset, prepareEyewearFile } from '../../lib/eyewearAsset';

interface Props {
  value: string | null;
  onChange: (value: string | null) => void;
}

export const EyewearAssetPicker: React.FC<Props> = ({ value, onChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const processFile = async (file: File) => {
    setBusy(true); setMessage('กำลังตัดพื้นหลังและจัดกรอบแว่น...');
    try {
      const asset = await prepareEyewearFile(file);
      onChange(asset.dataUrl);
      setMessage('พร้อมใช้: ตัดพื้นหลังและ crop เฉพาะกรอบแล้ว');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'เตรียมรูปแว่นไม่สำเร็จ');
    } finally { setBusy(false); }
  };

  const processUrl = async () => {
    if (!url.trim()) return;
    setBusy(true); setMessage('กำลังโหลดและตัดพื้นหลังรูปจาก URL...');
    try {
      const asset = await prepareEyewearAsset(url.trim());
      onChange(asset.dataUrl);
      setMessage('พร้อมใช้: ประมวลผลรูปจาก URL แล้ว');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'โหลด URL ไม่สำเร็จ');
    } finally { setBusy(false); }
  };

  return (
    <div className="mt-3 rounded-2xl bg-black/35 border border-white/10 p-3 text-white">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-xs font-bold">ทดลองรูปแว่น 2D</div>
          <div className="text-[10px] text-white/60 mt-0.5">ไฟล์หรือ URL • ระบบจะตัดพื้นหลังอัตโนมัติ</div>
        </div>
        {value && <button type="button" onClick={() => onChange(null)} className="text-[10px] px-2 py-1 rounded-full bg-white/10">ใช้รูปสินค้าเดิม</button>}
      </div>
      <div className="flex gap-2 mt-2">
        <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className="flex-1 h-9 rounded-xl bg-white text-[#071b4b] text-[11px] font-bold disabled:opacity-50">เลือกไฟล์</button>
        <input ref={inputRef} className="hidden" type="file" accept="image/png,image/jpeg,image/webp" onChange={e => { const f = e.target.files?.[0]; if (f) void processFile(f); e.currentTarget.value = ''; }} />
      </div>
      <div className="flex gap-2 mt-2">
        <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://.../glasses.jpg" className="min-w-0 flex-1 h-9 rounded-xl bg-white/10 border border-white/10 px-3 text-[11px] outline-none" />
        <button type="button" onClick={() => void processUrl()} disabled={busy || !url.trim()} className="h-9 px-3 rounded-xl bg-white/15 text-[11px] font-bold disabled:opacity-40">ใช้ URL</button>
      </div>
      {busy && <div className="mt-2 text-[10px] text-white/75">{message}</div>}
      {!busy && message && <div className="mt-2 text-[10px] text-white/75">{message}</div>}
    </div>
  );
};
