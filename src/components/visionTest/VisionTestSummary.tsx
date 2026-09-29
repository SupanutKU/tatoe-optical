import React, { useState } from 'react';
import { VisionExamReport } from '../../types/visionTest';
import { Prescription } from '../../types';

interface VisionTestSummaryProps {
  report: VisionExamReport;
  onSaveToProfile: (updatedRx: Prescription) => void;
  onRetest: () => void;
  onBookAppointment: () => void;
  onShopEyewear: () => void;
}

export const VisionTestSummary: React.FC<VisionTestSummaryProps> = ({
  report,
  onSaveToProfile,
  onRetest,
  onBookAppointment,
  onShopEyewear
}) => {
  const [isSaved, setIsSaved] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleSave = () => {
    const rx: Prescription = {
      od: {
        sphere: report.od.acuity.estimatedSph || '-1.50',
        cylinder: report.od.astigmatism.hasAstigmatism
          ? report.od.astigmatism.cylinderPower || '-0.75'
          : '0.00',
        axis: report.od.astigmatism.hasAstigmatism && report.od.astigmatism.calculatedAxisDeg
          ? `${report.od.astigmatism.calculatedAxisDeg}°`
          : undefined,
        visualAcuity: report.od.acuity.level
      },
      os: {
        sphere: report.os.acuity.estimatedSph || '-1.50',
        cylinder: report.os.astigmatism.hasAstigmatism
          ? report.os.astigmatism.cylinderPower || '-0.75'
          : '0.00',
        axis: report.os.astigmatism.hasAstigmatism && report.os.astigmatism.calculatedAxisDeg
          ? `${report.os.astigmatism.calculatedAxisDeg}°`
          : undefined,
        visualAcuity: report.os.acuity.level
      },
      lastChecked: `วันนี้ (ตรวจออนไลน์ ${new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })})`,
      colorVisionStatus: report.colorVision.diagnosis,
      colorVisionScore: `${report.colorVision.correctCount}/${report.colorVision.totalPlates}`,
      testedOnline: true
    };

    onSaveToProfile(rx);
    setIsSaved(true);
  };

  const handleShare = () => {
    const text = `ผลตรวจวัดสายตาออนไลน์ TATOE Optical\nOD (ตาขวา): SPH ${report.od.acuity.estimatedSph}, CYL ${report.od.astigmatism.hasAstigmatism ? report.od.astigmatism.cylinderPower : '0.00'}${report.od.astigmatism.hasAstigmatism ? ` Axis ${report.od.astigmatism.calculatedAxisDeg}°` : ''}\nOS (ตาซ้าย): SPH ${report.os.acuity.estimatedSph}, CYL ${report.os.astigmatism.hasAstigmatism ? report.os.astigmatism.cylinderPower : '0.00'}${report.os.astigmatism.hasAstigmatism ? ` Axis ${report.os.astigmatism.calculatedAxisDeg}°` : ''}\nตาบอดสี: ${report.colorVision.diagnosisTitle} (${report.colorVision.correctCount}/${report.colorVision.totalPlates})`;

    if (navigator.share) {
      navigator.share({
        title: 'ผลตรวจสายตา TATOE Optical',
        text
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const hasAnyAstigmatism =
    report.od.astigmatism.hasAstigmatism || report.os.astigmatism.hasAstigmatism;

  return (
    <div className="flex flex-col w-full gap-4 text-xs">
      {/* Top Completion Header */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-primary to-secondary text-white shadow-md flex flex-col gap-2 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-15 pointer-events-none">
          <span className="material-symbols-outlined text-[96px]">check_circle</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-white/90">
          <span className="material-symbols-outlined text-[16px]">verified</span>
          <span>ใบรายงานผลการตรวจสายตาดิจิทัล (Digital Vision Report)</span>
        </div>
        <h2 className="text-xl font-bold text-white">
          การตรวจวัดสายตาเสร็จสมบูรณ์
        </h2>
        <p className="text-[11px] text-white/80 leading-relaxed max-w-xs">
          บันทึกผลเมื่อ {report.testedAt} • ระบบตรวจวัดความคมชัด สายตาเอียง และคัดกรองตาบอดสี
        </p>
      </div>

      {/* Prescription Prescription Card (OD & OS) */}
      <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between pb-2 border-b border-outline-variant/15">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">
              eyeglasses
            </span>
            <span className="font-bold text-sm text-on-surface">
              ค่าสายตาที่ประเมินได้ (Prescription Summary)
            </span>
          </div>
          {hasAnyAstigmatism && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 font-bold text-[10px] border border-amber-500/30">
              พบค่าสายตาเอียง
            </span>
          )}
        </div>

        {/* 2-Column Table for OD and OS */}
        <div className="grid grid-cols-2 gap-3">
          {/* OD (Right Eye) */}
          <div className="p-3 rounded-xl bg-surface-container-low border border-primary/20 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-primary flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                OD (ตาขวา)
              </span>
              <span className="text-[10px] text-outline">{report.od.acuity.level}</span>
            </div>

            <div className="space-y-1 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-sans">SPH (สั้น/ยาว):</span>
                <span className="font-bold text-primary">{report.od.acuity.estimatedSph}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-sans">CYL (เอียง):</span>
                <span className="font-bold text-on-surface">
                  {report.od.astigmatism.hasAstigmatism
                    ? report.od.astigmatism.cylinderPower || '-0.75'
                    : '0.00'}
                </span>
              </div>
              {report.od.astigmatism.hasAstigmatism && (
                <div className="flex justify-between">
                  <span className="text-on-surface-variant font-sans">AXIS (องศา):</span>
                  <span className="font-bold text-secondary">
                    {report.od.astigmatism.calculatedAxisDeg || 90}°
                  </span>
                </div>
              )}
            </div>

            <span className="text-[9px] text-on-surface-variant mt-auto pt-1 border-t border-outline-variant/15">
              {report.od.astigmatism.note}
            </span>
          </div>

          {/* OS (Left Eye) */}
          <div className="p-3 rounded-xl bg-surface-container-low border border-secondary/20 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-secondary flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-secondary"></span>
                OS (ตาซ้าย)
              </span>
              <span className="text-[10px] text-outline">{report.os.acuity.level}</span>
            </div>

            <div className="space-y-1 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-sans">SPH (สั้น/ยาว):</span>
                <span className="font-bold text-secondary">{report.os.acuity.estimatedSph}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-sans">CYL (เอียง):</span>
                <span className="font-bold text-on-surface">
                  {report.os.astigmatism.hasAstigmatism
                    ? report.os.astigmatism.cylinderPower || '-0.75'
                    : '0.00'}
                </span>
              </div>
              {report.os.astigmatism.hasAstigmatism && (
                <div className="flex justify-between">
                  <span className="text-on-surface-variant font-sans">AXIS (องศา):</span>
                  <span className="font-bold text-secondary">
                    {report.os.astigmatism.calculatedAxisDeg || 90}°
                  </span>
                </div>
              )}
            </div>

            <span className="text-[9px] text-on-surface-variant mt-auto pt-1 border-t border-outline-variant/15">
              {report.os.astigmatism.note}
            </span>
          </div>
        </div>

        {/* Save to Profile Button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaved}
          className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer shadow-xs ${
            isSaved
              ? 'bg-teal-600 text-white cursor-default'
              : 'bg-primary hover:bg-primary-container text-on-primary'
          }`}
        >
          <span className="material-symbols-outlined text-[17px]">
            {isSaved ? 'check_circle' : 'bookmark_add'}
          </span>
          <span>{isSaved ? 'บันทึกลงโปรไฟล์ค่าสายตาเรียบร้อยแล้ว ⭐' : 'บันทึกค่าสายตานี้ลงโปรไฟล์ของฉัน'}</span>
        </button>
      </div>

      {/* Color Blindness Test Result Card */}
      <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 shadow-sm flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[20px]">
              palette
            </span>
            <span className="font-bold text-sm text-on-surface">
              ผลการตรวจตาบอดสี (Color Vision Assessment)
            </span>
          </div>
          <span className="font-mono font-bold text-xs text-primary px-2 py-0.5 rounded-full bg-surface-container-low">
            {report.colorVision.correctCount} / {report.colorVision.totalPlates} แผ่น
          </span>
        </div>

        <div className="p-3 rounded-xl bg-surface-container-low/70 border border-outline-variant/15 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                report.colorVision.diagnosis === 'normal'
                  ? 'bg-emerald-500'
                  : 'bg-amber-500'
              }`}
            ></span>
            <h4 className="font-bold text-xs text-on-surface">
              {report.colorVision.diagnosisTitle}
            </h4>
          </div>
          <p className="text-[11px] text-on-surface-variant leading-relaxed">
            {report.colorVision.diagnosisDetails}
          </p>
        </div>

        {/* Advice Bullet List */}
        <div className="flex flex-col gap-1 pt-1">
          <span className="text-[10px] font-bold text-slate-500">คำแนะนำสำหรับคุณ:</span>
          {report.colorVision.recommendations.map((rec, idx) => (
            <div key={idx} className="flex items-start gap-1.5 text-[10px] text-on-surface-variant">
              <span className="text-secondary font-bold">•</span>
              <span>{rec}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Lens Recommendations tailored to results */}
      <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 shadow-sm flex flex-col gap-2.5">
        <span className="font-bold text-xs text-on-surface flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-[17px]">
            auto_awesome
          </span>
          เลนส์ที่แนะนำสำหรับผลสายตาของคุณ
        </span>

        <div className="grid grid-cols-1 gap-2">
          {hasAnyAstigmatism ? (
            <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/15 flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[16px]">tune</span>
              </div>
              <div>
                <strong className="block text-[11px] text-on-surface">
                  เลนส์โครงสร้างแอสเฟอริก (Aspheric Freeform Lens)
                </strong>
                <span className="text-[10px] text-on-surface-variant leading-tight block mt-0.5">
                  ลดการบิดเบือนภาพบริเวณขอบเลนส์ ให้มุมมองที่กว้าง คมชัดเป็นธรรมชาติ เหมาะสำหรับผู้มีค่าสายตาเอียงโดยเฉพาะ
                </span>
              </div>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/15 flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[16px]">shield</span>
              </div>
              <div>
                <strong className="block text-[11px] text-on-surface">
                  เลนส์มัลติโค้ต ตัดแสงสะท้อนและกรองแสงสีฟ้า (Blue Cut UV400)
                </strong>
                <span className="text-[10px] text-on-surface-variant leading-tight block mt-0.5">
                  ปกป้องสายตาจากการใช้งานหน้าจอมือถือและคอมพิวเตอร์ ลดอาการตาล้าและปวดตา
                </span>
              </div>
            </div>
          )}

          <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/15 flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[16px]">contrast</span>
            </div>
            <div>
              <strong className="block text-[11px] text-on-surface">
                สารเคลือบเลนส์เพิ่มคอนทราสต์ (High-Contrast AR Coating)
              </strong>
              <span className="text-[10px] text-on-surface-variant leading-tight block mt-0.5">
                เพิ่มความสดใสของเฉดสี ช่วยให้การมองเห็นในเวลากลางคืนคมชัด ปลอดภัยยิ่งขึ้น
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Next Actions */}
      <div className="flex flex-col gap-2 pt-1">
        <button
          type="button"
          onClick={onShopEyewear}
          className="w-full h-11 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[17px]">shopping_bag</span>
          <span>เลือกดูกรอบแว่นตาที่เข้ากับผลตรวจนี้</span>
        </button>

        <button
          type="button"
          onClick={onBookAppointment}
          className="w-full h-11 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-on-surface font-bold text-xs flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-primary text-[17px]">storefront</span>
          <span>นัดตรวจสายตาละเอียด 100% ฟรีที่สาขา</span>
        </button>

        <div className="grid grid-cols-2 gap-2 mt-1">
          <button
            type="button"
            onClick={handleShare}
            className="py-2.5 px-3 rounded-xl bg-surface-container-lowest hover:bg-surface-container border border-outline-variant/30 text-on-surface font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-98 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-primary">
              {copySuccess ? 'check' : 'share'}
            </span>
            <span>{copySuccess ? 'คัดลอกแล้ว!' : 'แชร์ผลตรวจ'}</span>
          </button>

          <button
            type="button"
            onClick={onRetest}
            className="py-2.5 px-3 rounded-xl bg-surface-container-lowest hover:bg-surface-container border border-outline-variant/30 text-on-surface-variant font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-98 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
            <span>ตรวจใหม่อีกครั้ง</span>
          </button>
        </div>
      </div>

      {/* Clinical Disclaimer */}
      <p className="text-[10px] text-outline text-center leading-relaxed px-2 pb-2">
        * หมายเหตุ: การตรวจวัดสายตาออนไลน์เป็นการคัดกรองเบื้องต้นเพื่อประเมินค่าสายตาและภาวะตาบอดสี สำหรับการตัดเลนส์ที่มีความซับซ้อนสูง แนะนำเข้ารับการตรวจวัดอย่างละเอียดด้วยเครื่อง Phoropter โดยนักทัศนมาตรที่สาขา TATOE Optical
      </p>
    </div>
  );
};
