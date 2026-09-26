import React, { useState, useRef, useEffect } from 'react';
import jsQR from 'jsqr';
import { UserProfile, ScreenId, ClaimTicket, ClaimStepId, ClaimAttachedFile } from '../types';
import { ClaimComparisonViewer } from './ClaimComparisonViewer';
import {
  OPTICAL_BRANCHES,
  CLAIM_STEPS_TEMPLATE,
  loadStoredClaims,
  saveStoredClaims,
  generateNextClaimId
} from '../data/mockClaims';

interface ClaimScreenProps {
  user: UserProfile;
  initialClaimId?: string;
  initialTab?: 'submit' | 'track';
  onNavigate: (screen: ScreenId) => void;
  onOpenChat?: () => void;
  onShowToast: (message: string) => void;
}

// Reusable progress bar component for claim tracking
interface ClaimProgressBarProps {
  currentStepId: ClaimStepId;
  animated?: boolean;
}

const ClaimProgressBar: React.FC<ClaimProgressBarProps> = ({ currentStepId, animated = true }) => {
  const stepConfig: Record<ClaimStepId, { step: number; label: string; percent: number; color: string }> = {
    submitted: { step: 1, label: 'ยื่นคำร้องสำเร็จ', percent: 20, color: 'from-primary to-primary-container' },
    received: { step: 2, label: 'ศูนย์บริการรับเรื่อง', percent: 40, color: 'from-primary to-secondary' },
    inspecting: { step: 3, label: 'กำลังตรวจสอบ/ซ่อมแซม', percent: 60, color: 'from-sky-500 to-primary' },
    dispatched: { step: 4, label: 'จัดส่งไปยังสาขาแล้ว', percent: 80, color: 'from-secondary to-emerald-500' },
    delivered: { step: 5, label: 'ลูกค้ารับสินค้าเรียบร้อย', percent: 100, color: 'from-emerald-500 to-emerald-600' }
  };

  const current = stepConfig[currentStepId] || stepConfig.submitted;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-on-surface flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${current.step === 5 ? 'bg-emerald-500' : 'bg-primary'}`} />
          <span>สถานะ: {current.label}</span>
        </span>
        <span className="font-mono font-bold text-primary tabular-nums text-[11px]">
          ขั้นที่ {current.step}/5 ({current.percent}%)
        </span>
      </div>

      {/* Track & Filled Bar */}
      <div
        className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden p-0.5 border border-outline-variant/20 relative"
        role="progressbar"
        aria-valuenow={current.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`ความคืบหน้าการเคลม ${current.percent}%`}
      >
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r ${current.color} ${
            animated && current.percent < 100 ? 'relative overflow-hidden' : ''
          }`}
          style={{ width: `${current.percent}%` }}
        >
          {animated && current.percent < 100 && (
            <div className="absolute inset-0 bg-white/25 animate-pulse" />
          )}
        </div>
      </div>

      {/* 5 Milestone Step Marks */}
      <div className="flex justify-between items-center px-0.5 text-[9px] text-on-surface-variant font-medium">
        <span className={current.step >= 1 ? 'font-bold text-primary' : ''}>1. ยื่นเรื่อง</span>
        <span className={current.step >= 2 ? 'font-bold text-primary' : ''}>2. รับเรื่อง</span>
        <span className={current.step >= 3 ? 'font-bold text-primary' : ''}>3. ตรวจซ่อม</span>
        <span className={current.step >= 4 ? 'font-bold text-primary' : ''}>4. ส่งถึงสาขา</span>
        <span className={current.step >= 5 ? 'font-bold text-emerald-600' : ''}>5. รับสินค้า</span>
      </div>
    </div>
  );
};

// FAQ Item definition & Common Claim Questions
export interface ClaimFaqItem {
  id: string;
  category: string;
  icon: string;
  question: string;
  answer: string;
}

export const CLAIM_FAQS: ClaimFaqItem[] = [
  {
    id: 'faq-warranty',
    category: 'เงื่อนไขการรับประกัน (Warranty Terms)',
    icon: 'verified_user',
    question: 'เงื่อนไขการรับประกันสินค้า (Warranty Terms) ครอบคลุมอะไรบ้าง?',
    answer:
      'สินค้าแว่นตาทุกชิ้นจาก TATOE Optical ได้รับประกันศูนย์ไทยแท้ 1 ปีเต็มนับจากวันที่สั่งซื้อ ครอบคลุมความบกพร่องจากการผลิต เช่น ข้อต่อบานพับหลวม, เกลียวน็อตสกรู, แป้นจมูกซิลิโคนเสื่อมสภาพ, สารเคลือบมัลติโค้ตติ้งเลนส์ลอกร่อนตามธรรมชาติ และบริการดัดปรับแต่งทรงฟรีตลอดอายุการใช้งาน (ไม่ครอบคลุมกรณีอุบัติเหตุแตกหักจากการกดทับ รอยขีดข่วนลึกจากการใช้งาน หรือการดัดแปลงนอกศูนย์บริการ)'
  },
  {
    id: 'faq-time',
    category: 'ระยะเวลาดำเนินการ (Processing Time)',
    icon: 'schedule',
    question: 'ระยะเวลาในการดำเนินการตรวจสอบและส่งเคลมสินค้าใช้เวลากี่วัน?',
    answer:
      'ระยะเวลามาตรฐานขึ้นอยู่กับลักษณะอาการชำรุด:\n• ปรับดัดทรงกรอบแว่น / เปลี่ยนแป้นจมูก / ขันสกรู: 1–2 วันทำการ (รับได้ทันทีที่สาขาหากมีอะไหล่พร้อม)\n• ตรวจเช็คโครงสร้างเลนส์และดัดทรงไทเทเนียมระดับแล็บ: 3–5 วันทำการ\n• ส่งเคลมเปลี่ยนเลนส์สายตาใหม่จากแล็บโรงงาน: 5–7 วันทำการ\nทั้งนี้ ระบบจะอัปเดตแจ้งเตือนสถานะความคืบหน้า 5 ขั้นตอนแบบเรียลไทม์ในหน้านี้'
  },
  {
    id: 'faq-docs',
    category: 'เอกสารและหลักฐาน (Documents & Evidence)',
    icon: 'description',
    question: 'ต้องเตรียมเอกสารหรือหลักฐานอะไรบ้างเมื่อส่งเคลมสินค้า?',
    answer:
      'จำเป็นต้องเตรียมหลักฐาน 2 อย่าง:\n1. ใบเสร็จรับเงิน หรือ ภาพถ่ายใบเสร็จ / หมายเลขคำสั่งซื้อ (#BEY-xxxx) ในระบบแอปพลิเคชัน\n2. ภาพถ่ายแว่นตาบริเวณที่ชำรุดให้เห็นจุดเสียหายชัดเจน (รองรับไฟล์ JPG, PNG หรือ PDF สูงสุด 10MB)\nเมื่อส่งข้อมูลในระบบแล้ว สามารถนำตัวแว่นจริงไปส่งมอบที่สาขาที่เลือกไว้ได้ทันที'
  },
  {
    id: 'faq-cost',
    category: 'ค่าใช้จ่าย (Costs & Fees)',
    icon: 'payments',
    question: 'การส่งเคลมมีค่าใช้จ่ายเพิ่มเติมหรือไม่?',
    answer:
      'ไม่มีค่าใช้จ่ายใดๆ สำหรับสินค้าที่อยู่ในระยะเวลารับประกัน 1 ปี และตรงตามเงื่อนไข (ฟรีทั้งค่าอะไหล่มาตรฐานและค่าบริการช่าง) ในกรณีที่สินค้าอยู่นอกประกัน หรือความเสียหายเกิดจากอุบัติเหตุนอกเงื่อนไข เจ้าหน้าที่จะติดต่อชี้แจงและแจ้งราคาประเมินให้ท่านอนุมัติก่อนเริ่มดำเนินการทุกครั้ง'
  },
  {
    id: 'faq-branch',
    category: 'จุดบริการและรับสินค้า (Branches & Pickup)',
    icon: 'storefront',
    question: 'สามารถส่งเคลมและรับสินค้าคืนที่สาขาใดได้บ้าง?',
    answer:
      'ท่านสามารถเลือกรับบริการได้ทั้ง 6 สาขาของเรา ได้แก่ สยามพารากอน, เซ็นทรัลเวิลด์, เอ็มควอเทียร์, เซ็นทรัลลาดพร้าว, เมกาบางนา และศูนย์ใหญ่พระราม 9 หรือหากต้องการให้จัดส่งพัสดุกลับถึงที่พัก สามารถแจ้งเจ้าหน้าที่ผ่านช่องทางแชทได้เช่นกัน'
  }
];

export const ClaimScreen: React.FC<ClaimScreenProps> = ({
  user,
  initialClaimId = '',
  initialTab = 'submit',
  onNavigate,
  onOpenChat,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'submit' | 'track'>(initialTab);
  const [claimsList, setClaimsList] = useState<ClaimTicket[]>(() => loadStoredClaims());
  const [openFaqIds, setOpenFaqIds] = useState<string[]>(['faq-warranty', 'faq-time']);

  const toggleFaq = (id: string) => {
    setOpenFaqIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Form State
  const [customerName, setCustomerName] = useState(user.name || '');
  const [phoneNumber, setPhoneNumber] = useState(user.phone || '');
  const [selectedBranch, setSelectedBranch] = useState(OPTICAL_BRANCHES[0].name);
  const [issueDescription, setIssueDescription] = useState('');
  const [productModel, setProductModel] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<ClaimAttachedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newlyCreatedClaim, setNewlyCreatedClaim] = useState<ClaimTicket | null>(null);

  // Tracking State
  const [searchClaimId, setSearchClaimId] = useState(initialClaimId || 'CLM-202609001');
  const [searchedClaim, setSearchedClaim] = useState<ClaimTicket | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Save to local storage on changes
  useEffect(() => {
    saveStoredClaims(claimsList);
  }, [claimsList]);

  // Active claims & Latest claim calculations for tracking summary
  const activeClaims = claimsList.filter((c) => c.currentStepId !== 'delivered');
  const activeClaimsCount = activeClaims.length;
  const latestClaim = claimsList[0] || null;

  // Filter state for recent claims list (All, Pending, In Progress, Completed)
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');

  const pendingCount = claimsList.filter((c) => c.currentStepId === 'submitted').length;
  const inProgressCount = claimsList.filter((c) =>
    ['received', 'inspecting', 'dispatched'].includes(c.currentStepId)
  ).length;
  const completedCount = claimsList.filter((c) => c.currentStepId === 'delivered').length;

  const filteredClaimsList = claimsList.filter((claim) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'completed') return claim.currentStepId === 'delivered';
    if (statusFilter === 'pending') return claim.currentStepId === 'submitted';
    if (statusFilter === 'in_progress') {
      return ['received', 'inspecting', 'dispatched'].includes(claim.currentStepId);
    }
    return true;
  });

  // Notify Me subscriptions map: { [claimId]: { enabled: boolean; sms: boolean; email: boolean } }
  const [notifyPreferences, setNotifyPreferences] = useState<
    Record<string, { enabled: boolean; sms: boolean; email: boolean }>
  >(() => {
    try {
      const saved = localStorage.getItem('tatoe_claim_notify_prefs');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      'CLM-202609001': { enabled: true, sms: true, email: true },
      'CLM-202609002': { enabled: true, sms: true, email: false }
    };
  });

  const saveNotifyPreferences = (
    prefs: Record<string, { enabled: boolean; sms: boolean; email: boolean }>
  ) => {
    setNotifyPreferences(prefs);
    try {
      localStorage.setItem('tatoe_claim_notify_prefs', JSON.stringify(prefs));
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleNotify = (claimId: string) => {
    const current = notifyPreferences[claimId] || { enabled: false, sms: true, email: true };
    const nextState = !current.enabled;
    const updated = {
      ...notifyPreferences,
      [claimId]: {
        ...current,
        enabled: nextState
      }
    };
    saveNotifyPreferences(updated);
    if (nextState) {
      onShowToast(`เปิดแจ้งเตือนสถานะสำหรับ ${claimId} แล้ว (SMS & Email) 🔔`);
    } else {
      onShowToast(`ปิดการแจ้งเตือนสำหรับ ${claimId} แล้ว 🔕`);
    }
  };

  const handleToggleChannel = (claimId: string, channel: 'sms' | 'email') => {
    const current = notifyPreferences[claimId] || { enabled: true, sms: true, email: true };
    const updated = {
      ...notifyPreferences,
      [claimId]: {
        ...current,
        [channel]: !current[channel]
      }
    };
    saveNotifyPreferences(updated);
    const channelName = channel === 'sms' ? 'SMS' : 'Email';
    const isNowOn = !current[channel];
    onShowToast(`${isNowOn ? 'เปิด' : 'ปิด'}การแจ้งเตือนผ่าน ${channelName} สำหรับ ${claimId}`);
  };

  // QR Code Scanner State & Refs for scanning physical claim receipts
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const receiptUploadRef = useRef<HTMLInputElement>(null);

  const playSuccessBeep = () => {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        const audioCtx = new AudioContextClass();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.18);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.18);
      }
    } catch {
      // Audio silently ignored if context restricted
    }
  };

  const stopCamera = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const handleScannedCode = (scannedText: string) => {
    stopCamera();
    setIsScannerOpen(false);
    playSuccessBeep();

    // Match CLM-xxxx or extract ID
    const match = scannedText.match(/CLM-\d{9}/i) || scannedText.match(/CLM-[A-Za-z0-9_-]+/i);
    const claimId = match ? match[0].toUpperCase() : scannedText.trim().toUpperCase();

    setSearchClaimId(claimId);
    handleSearchClaim(claimId);
    onShowToast(`สแกน QR Code จากใบเสร็จสำเร็จ: รหัส ${claimId} 📷`);
  };

  const scanQrFrame = () => {
    if (videoRef.current && videoRef.current.readyState >= 2) {
      const video = videoRef.current;
      let canvas = canvasRef.current;
      if (!canvas) {
        canvas = document.createElement('canvas');
      }
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx && canvas.width > 0 && canvas.height > 0) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert'
        });
        if (code && code.data) {
          handleScannedCode(code.data);
          return;
        }
      }
    }
    animationFrameId.current = requestAnimationFrame(scanQrFrame);
  };

  const startCamera = async () => {
    setScannerError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setScannerError('เบราว์เซอร์ไม่รองรับการเปิดกล้องโดยตรง กรุณาใช้ปุ่มอัปโหลดรูปภาพใบเสร็จ');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } }
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsCameraActive(true);
        animationFrameId.current = requestAnimationFrame(scanQrFrame);
      }
    } catch (err) {
      console.warn('Camera stream error:', err);
      setScannerError('ไม่สามารถเข้าถึงกล้องได้ (กรุณาอนุญาตสิทธิ์กล้อง หรือใช้ปุ่มอัปโหลดภาพใบเสร็จ)');
      setIsCameraActive(false);
    }
  };

  // Manage camera streaming based on modal open state
  useEffect(() => {
    if (isScannerOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isScannerOpen]);

  // Handle uploading physical receipt photo from device storage
  const handleScanReceiptFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            handleScannedCode(code.data);
          } else {
            onShowToast('ไม่พบ QR Code ในรูปภาพใบเสร็จ กรุณาตรวจสอบว่าภาพคมชัดและลองอีกครั้ง');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // If initialClaimId is passed, automatically search for it
  useEffect(() => {
    if (initialClaimId) {
      setSearchClaimId(initialClaimId);
      const match = claimsList.find(
        (c) => c.claimId.trim().toUpperCase() === initialClaimId.trim().toUpperCase()
      );
      if (match) {
        setSearchedClaim(match);
        setHasSearched(true);
      }
    } else {
      // Default to first mock claim
      const defaultMatch = claimsList.find((c) => c.claimId === 'CLM-202609001');
      if (defaultMatch) {
        setSearchedClaim(defaultMatch);
        setHasSearched(true);
      }
    }
  }, [initialClaimId]);

  // Claim Process Feedback & Star-Rating State per claim
  interface ClaimFeedbackRecord {
    rating: number; // 1 to 5
    comment: string;
    aspects: string[];
    submittedAt: string;
  }

  const [claimFeedbacks, setClaimFeedbacks] = useState<Record<string, ClaimFeedbackRecord>>(() => {
    try {
      const saved = localStorage.getItem('tatoe_claim_feedbacks');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      'CLM-202609003': {
        rating: 5,
        comment: 'บริการดัดโครงสร้างแว่นตาดีมาก รวดเร็ว ช่างอธิบายละเอียดและดูแลอย่างเป็นกันเอง ประทับใจมากครับ',
        aspects: ['⚡ ความรวดเร็วในการเคลม', '👓 ความประณีตในการซ่อม', '🏪 บริการของเจ้าหน้าที่สาขา'],
        submittedAt: '15 ก.ย. 2026'
      }
    };
  });

  // Current draft inputs for feedback
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackHoverRating, setFeedbackHoverRating] = useState<number>(0);
  const [feedbackComment, setFeedbackComment] = useState<string>('');
  const [selectedAspects, setSelectedAspects] = useState<string[]>([]);
  const [isEditingFeedback, setIsEditingFeedback] = useState<boolean>(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState<boolean>(false);

  // Sync draft feedback when searchedClaim changes
  useEffect(() => {
    if (searchedClaim) {
      const existing = claimFeedbacks[searchedClaim.claimId];
      if (existing) {
        setFeedbackRating(existing.rating);
        setFeedbackComment(existing.comment);
        setSelectedAspects(existing.aspects || []);
        setIsEditingFeedback(false);
      } else {
        setFeedbackRating(5);
        setFeedbackComment('');
        setSelectedAspects([]);
        setIsEditingFeedback(false);
      }
    }
  }, [searchedClaim?.claimId]);

  const handleSubmitFeedback = (claimId: string) => {
    if (feedbackRating < 1) {
      onShowToast('กรุณาให้คะแนนดาวอย่างน้อย 1 ดาว');
      return;
    }

    setIsSubmittingFeedback(true);
    setTimeout(() => {
      const newFeedback: ClaimFeedbackRecord = {
        rating: feedbackRating,
        comment: feedbackComment.trim(),
        aspects: [...selectedAspects],
        submittedAt: new Date().toLocaleDateString('th-TH', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })
      };

      const updated = {
        ...claimFeedbacks,
        [claimId]: newFeedback
      };

      setClaimFeedbacks(updated);
      try {
        localStorage.setItem('tatoe_claim_feedbacks', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }

      setIsSubmittingFeedback(false);
      setIsEditingFeedback(false);
      onShowToast('ขอบพระคุณสำหรับข้อเสนอแนะ! เราจะนำไปพัฒนาบริการรับประกันสินค้าให้ดียิ่งขึ้น ⭐');
    }, 350);
  };

  const toggleAspect = (aspect: string) => {
    setSelectedAspects((prev) =>
      prev.includes(aspect) ? prev.filter((a) => a !== aspect) : [...prev, aspect]
    );
  };

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!customerName.trim() || customerName.trim().length < 2) {
      newErrors.customerName = 'กรุณาระบุชื่อ - นามสกุลให้ถูกต้อง';
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 9 || cleanPhone.length > 10) {
      newErrors.phoneNumber = 'กรุณาระบุเบอร์โทรศัพท์ 9-10 หลักที่สามารถติดต่อได้';
    }

    if (!selectedBranch.trim()) {
      newErrors.branch = 'กรุณาเลือกสาขาที่สะดวกเข้ารับบริการ';
    }

    if (!issueDescription.trim() || issueDescription.trim().length < 8) {
      newErrors.issueDescription = 'กรุณาอธิบายอาการชำรุดหรือสาเหตุที่ต้องการเคลมอย่างน้อย 8 ตัวอักษร';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle file uploads (JPG, PNG, PDF)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: ClaimAttachedFile[] = [];

    Array.from(files).forEach((file) => {
      // Validate file size (< 10MB)
      if (file.size > 10 * 1024 * 1024) {
        onShowToast(`ไฟล์ "${file.name}" มีขนาดเกิน 10MB`);
        return;
      }

      const isImage = file.type.startsWith('image/');
      const fileObj: ClaimAttachedFile = {
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        type: file.type,
        url: isImage ? URL.createObjectURL(file) : undefined
      };

      newFiles.push(fileObj);
    });

    setAttachedFiles((prev) => [...prev, ...newFiles]);
    onShowToast(`แนบไฟล์สำเร็จ ${newFiles.length} รายการ`);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (fileId: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  // Submit claim handler
  const handleSubmitClaim = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      onShowToast('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      return;
    }

    setIsSubmitting(true);

    // Simulate API request
    setTimeout(() => {
      const newClaimId = generateNextClaimId(claimsList);
      const nowString = new Date().toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) + ' น.';

      const createdClaim: ClaimTicket = {
        claimId: newClaimId,
        customerName: customerName.trim(),
        phoneNumber: phoneNumber.trim(),
        branch: selectedBranch,
        productName: productModel.trim() || 'แว่นตาตัดประกอบ TATOE Optical',
        issueDescription: issueDescription.trim(),
        attachedFiles: [...attachedFiles],
        submittedAt: nowString,
        currentStepId: 'submitted',
        estimatedCompletion: 'ประมาณ 5-7 วันทำการ',
        steps: [
          {
            ...CLAIM_STEPS_TEMPLATE[0],
            state: 'completed',
            timestamp: `${nowString} (เสร็จสิ้น)`,
            location: 'ระบบออนไลน์ TATOE Portal'
          },
          {
            ...CLAIM_STEPS_TEMPLATE[1],
            state: 'in_progress',
            timestamp: 'กำลังรอการจัดส่ง/นำแว่นตาเข้าสาขา',
            location: selectedBranch
          },
          {
            ...CLAIM_STEPS_TEMPLATE[2],
            state: 'pending',
            timestamp: 'รอตรวจสอบอะไหล่และสภาพแว่น'
          },
          {
            ...CLAIM_STEPS_TEMPLATE[3],
            state: 'pending',
            timestamp: 'รอการจัดส่งกลับ'
          },
          {
            ...CLAIM_STEPS_TEMPLATE[4],
            state: 'pending',
            timestamp: 'รอการส่งมอบ'
          }
        ]
      };

      // Add to state and persistence
      const updatedClaims = [createdClaim, ...claimsList];
      setClaimsList(updatedClaims);
      setNewlyCreatedClaim(createdClaim);
      setIsSubmitting(false);

      // Reset form
      setIssueDescription('');
      setProductModel('');
      setAttachedFiles([]);
      setErrors({});

      onShowToast(`ยื่นคำร้องเคลมสำเร็จ! รหัสใบเคลม: ${newClaimId}`);
    }, 900);
  };

  // Search claim handler
  const handleSearchClaim = (idToSearch?: string) => {
    const targetId = (idToSearch || searchClaimId).trim().toUpperCase();
    if (!targetId) {
      onShowToast('กรุณากรอกรหัสใบเคลมที่ต้องการตรวจสอบ');
      return;
    }

    setSearchClaimId(targetId);
    setHasSearched(true);

    const match = claimsList.find(
      (c) => c.claimId.trim().toUpperCase() === targetId
    );

    if (match) {
      setSearchedClaim(match);
      onShowToast(`พบข้อมูลใบเคลม ${targetId}`);
    } else {
      setSearchedClaim(null);
      onShowToast(`ไม่พบข้อมูลสำหรับรหัส "${targetId}"`);
    }
  };

  // Copy claim ID helper
  const handleCopyClaimId = (id: string) => {
    navigator.clipboard?.writeText(id);
    onShowToast(`คัดลอกรหัส ${id} เรียบร้อยแล้ว`);
  };

  // Simulation handler to test progression between 5 steps
  const handleSimulateStepChange = (targetStepNumber: number) => {
    if (!searchedClaim) return;
    const targetIndex = targetStepNumber - 1;
    const nowTime = `วันนี้ • ${new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.`;

    const updatedSteps = searchedClaim.steps.map((step, idx) => {
      if (idx < targetIndex) {
        return {
          ...step,
          state: 'completed' as const,
          timestamp: step.timestamp || nowTime
        };
      } else if (idx === targetIndex) {
        const isDelivered = idx === searchedClaim.steps.length - 1;
        return {
          ...step,
          state: isDelivered ? ('completed' as const) : ('in_progress' as const),
          timestamp: `${nowTime} (${isDelivered ? 'เสร็จสมบูรณ์' : 'กำลังดำเนินการ'})`
        };
      } else {
        return {
          ...step,
          state: 'pending' as const
        };
      }
    });

    const stepIds: ClaimStepId[] = ['submitted', 'received', 'inspecting', 'dispatched', 'delivered'];
    const newCurrentStepId = stepIds[targetIndex];

    const updatedClaim: ClaimTicket = {
      ...searchedClaim,
      currentStepId: newCurrentStepId,
      steps: updatedSteps
    };

    setSearchedClaim(updatedClaim);
    setClaimsList((prev) =>
      prev.map((c) => (c.claimId === updatedClaim.claimId ? updatedClaim : c))
    );
    onShowToast(`จำลองอัปเดต: ขั้นที่ ${targetStepNumber} (${searchedClaim.steps[targetIndex].title})`);

    // Simulate SMS/Email notifications if Notify Me is enabled
    const notifPref = notifyPreferences[updatedClaim.claimId];
    if (notifPref?.enabled && (notifPref.sms || notifPref.email)) {
      const activeChannels: string[] = [];
      if (notifPref.sms) activeChannels.push(`SMS (${updatedClaim.phoneNumber})`);
      if (notifPref.email) activeChannels.push(`Email (${user.email || 'customer@tatoe.com'})`);

      setTimeout(() => {
        onShowToast(
          `🔔 [Notify Me จำลอง] ส่งการแจ้งเตือนผ่าน ${activeChannels.join(' & ')}: ใบเคลม ${updatedClaim.claimId} อยู่ใน "${searchedClaim.steps[targetIndex].title}" เรียบร้อยแล้ว`
        );
      }, 1400);
    }
  };

  return (
    <div className="flex flex-col w-full pb-6 gap-space-md">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pt-1 pb-2 border-b border-outline-variant/15">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('profile')}
            className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface transition-colors active:scale-95"
            aria-label="ย้อนกลับไปหน้าโปรไฟล์"
            title="ย้อนกลับ"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div className="flex flex-col">
            <h1 className="font-bold text-headline-sm text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[24px]">verified_user</span>
              <span>ระบบใบเคลมสินค้า</span>
            </h1>
            <span className="text-[11px] text-on-surface-variant">
              TATOE Optical Warranty & Repair Tracking
            </span>
          </div>
        </div>

        {onOpenChat && (
          <button
            type="button"
            onClick={onOpenChat}
            className="h-8 px-2.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold flex items-center gap-1 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">support_agent</span>
            <span className="hidden sm:inline">ติดต่อเจ้าหน้าที่</span>
          </button>
        )}
      </div>

      {/* 2 Main Tabs Navigation */}
      <div className="grid grid-cols-2 p-1 bg-surface-container rounded-2xl shadow-inner border border-outline-variant/20">
        <button
          type="button"
          onClick={() => setActiveTab('submit')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-98 ${
            activeTab === 'submit'
              ? 'bg-surface-container-lowest text-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">edit_document</span>
          <span>1. กรอกใบเคลม (Submit Claim)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('track')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-98 ${
            activeTab === 'track'
              ? 'bg-surface-container-lowest text-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">track_changes</span>
          <span>2. ตรวจสอบสถานะ (Track Status)</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: ระบบกรอกใบเคลม (Submit Claim Form)                  */}
      {/* ======================================================== */}
      {activeTab === 'submit' && (
        <div className="flex flex-col gap-space-md animate-in fade-in duration-200">
          {/* Warranty Banner */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-primary/10 via-primary-fixed/20 to-secondary-fixed/20 border border-primary/20 flex items-start gap-3 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-[20px]">shield</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-bold text-on-surface">ประกันศูนย์ไทยแท้ 1 ปีเต็ม</h3>
              <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">
                ครอบคลุมการดัดปรับทรง, สกรูข้อต่อหลวม, แป้นจมูก และการเคลมปัญหาเลนส์ตามมาตรฐาน 
                กรอกข้อมูลด้านล่างเพื่อรับรหัสติดตามสถานะแบบเรียลไทม์
              </p>
            </div>
          </div>

          {/* Form Card */}
          <form
            onSubmit={handleSubmitClaim}
            className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/15 flex flex-col gap-4"
          >
            {/* 1. ชื่อ - นามสกุล */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-on-surface flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <span>ชื่อ - นามสกุล</span>
                  <span className="text-error">*</span>
                </span>
                <span className="text-[10px] text-on-surface-variant font-normal">ตามบัตรประชาชน</span>
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-[18px] text-outline pointer-events-none">
                  person
                </span>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    if (errors.customerName) setErrors((prev) => ({ ...prev, customerName: '' }));
                  }}
                  placeholder="เช่น นายธนกฤต วงศ์สวัสดิ์"
                  className={`w-full py-2.5 pl-9 pr-3 rounded-xl bg-surface-container border text-xs font-medium text-on-surface placeholder:text-outline focus:outline-none focus:ring-1 transition-all ${
                    errors.customerName
                      ? 'border-error focus:ring-error'
                      : 'border-outline-variant/25 focus:border-primary focus:ring-primary'
                  }`}
                />
              </div>
              {errors.customerName && (
                <span className="text-[10px] font-bold text-error flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-[13px]">error</span>
                  {errors.customerName}
                </span>
              )}
            </div>

            {/* 2. เบอร์โทรศัพท์ */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-on-surface flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <span>เบอร์โทรศัพท์</span>
                  <span className="text-error">*</span>
                </span>
                <span className="text-[10px] text-on-surface-variant font-normal">รับ SMS อัปเดตสถานะ</span>
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-[18px] text-outline pointer-events-none">
                  call
                </span>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    if (errors.phoneNumber) setErrors((prev) => ({ ...prev, phoneNumber: '' }));
                  }}
                  placeholder="เช่น 089-123-4567"
                  className={`w-full py-2.5 pl-9 pr-3 rounded-xl bg-surface-container border text-xs font-medium text-on-surface placeholder:text-outline focus:outline-none focus:ring-1 transition-all ${
                    errors.phoneNumber
                      ? 'border-error focus:ring-error'
                      : 'border-outline-variant/25 focus:border-primary focus:ring-primary'
                  }`}
                />
              </div>
              {errors.phoneNumber && (
                <span className="text-[10px] font-bold text-error flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-[13px]">error</span>
                  {errors.phoneNumber}
                </span>
              )}
            </div>

            {/* 3. รุ่นแว่นตาที่ต้องการเคลม (Optional/Prefilled) */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-on-surface flex items-center justify-between">
                <span>รุ่นสินค้า / หมายเลขคำสั่งซื้อ (ถ้ามี)</span>
                <span className="text-[10px] text-on-surface-variant font-normal">ระบุเพื่อความรวดเร็ว</span>
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-[18px] text-outline pointer-events-none">
                  eyeglasses
                </span>
                <input
                  type="text"
                  value={productModel}
                  onChange={(e) => setProductModel(e.target.value)}
                  placeholder="เช่น Big Eye Urban Black หรือ #BEY-2025058"
                  className="w-full py-2.5 pl-9 pr-3 rounded-xl bg-surface-container border border-outline-variant/25 text-xs font-medium text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
            </div>

            {/* 4. ร้านแว่นสาขาใกล้บ้าน (Dropdown / Select List) */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-on-surface flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <span>ร้านแว่นสาขาใกล้บ้านที่สะดวก</span>
                  <span className="text-error">*</span>
                </span>
                <span className="text-[10px] text-on-surface-variant font-normal">สำหรับส่งและรับแว่น</span>
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-[18px] text-primary pointer-events-none">
                  storefront
                </span>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full py-2.5 pl-9 pr-8 rounded-xl bg-surface-container border border-outline-variant/25 text-xs font-semibold text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                >
                  {OPTICAL_BRANCHES.map((b) => (
                    <option key={b.id} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 text-[18px] text-outline pointer-events-none">
                  expand_more
                </span>
              </div>
              <div className="p-2 rounded-lg bg-surface-container-high/60 text-[11px] text-on-surface-variant flex items-center gap-1.5 mt-0.5">
                <span className="material-symbols-outlined text-[14px] text-primary shrink-0">info</span>
                <span>
                  {OPTICAL_BRANCHES.find((b) => b.name === selectedBranch)?.location} •{' '}
                  {OPTICAL_BRANCHES.find((b) => b.name === selectedBranch)?.operatingHours}
                </span>
              </div>
            </div>

            {/* 5. รายละเอียด/ข้อมูลการเคลม (Textarea) */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-on-surface flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <span>รายละเอียด / สาเหตุและปัญหาที่ส่งเคลม</span>
                  <span className="text-error">*</span>
                </span>
                <span className="text-[10px] text-on-surface-variant font-normal">
                  {issueDescription.length}/500 อักษร
                </span>
              </label>
              <textarea
                rows={3}
                maxLength={500}
                value={issueDescription}
                onChange={(e) => {
                  setIssueDescription(e.target.value);
                  if (errors.issueDescription) setErrors((prev) => ({ ...prev, issueDescription: '' }));
                }}
                placeholder="ระบุอาการชำรุด เช่น ขาแว่นหลวมข้างซ้าย, แป้นจมูกหัก, เลนส์มีรอยขูดขีด หรือกรอบแว่นบิดเบี้ยวผิดรูป..."
                className={`w-full p-3 rounded-xl bg-surface-container border text-xs font-medium text-on-surface placeholder:text-outline focus:outline-none focus:ring-1 transition-all resize-none ${
                  errors.issueDescription
                    ? 'border-error focus:ring-error'
                    : 'border-outline-variant/25 focus:border-primary focus:ring-primary'
                }`}
              />
              {errors.issueDescription && (
                <span className="text-[10px] font-bold text-error flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-[13px]">error</span>
                  {errors.issueDescription}
                </span>
              )}
            </div>

            {/* 6. แนบหลักฐานใบเสร็จ/รูปภาพสินค้า (File Upload) */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-on-surface flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-primary">attach_file</span>
                  <span>แนบหลักฐานใบเสร็จ / รูปภาพสินค้าที่ชำรุด</span>
                </label>
                <span className="text-[10px] text-on-surface-variant">รองรับ JPG, PNG, PDF (สูงสุด 10MB)</span>
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-outline-variant/40 hover:border-primary/60 rounded-2xl p-4 bg-surface-container/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center text-center cursor-pointer group active:scale-99"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 group-hover:bg-primary/20 text-primary flex items-center justify-center mb-1.5 transition-colors">
                  <span className="material-symbols-outlined text-[22px]">cloud_upload</span>
                </div>
                <span className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">
                  คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่
                </span>
                <span className="text-[10px] text-on-surface-variant mt-0.5">
                  ภาพถ่ายความเสียหายของแว่นตา หรือรูปภาพ/PDF ใบเสร็จรับเงิน
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* Attached Files List */}
              {attachedFiles.length > 0 && (
                <div className="flex flex-col gap-1.5 pt-1">
                  <span className="text-[11px] font-bold text-on-surface-variant">
                    ไฟล์ที่แนบแล้ว ({attachedFiles.length} รายการ):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {attachedFiles.map((file) => {
                      const isPdf = file.type.includes('pdf');
                      return (
                        <div
                          key={file.id}
                          className="p-2 rounded-xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-between gap-2 shadow-2xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {file.url ? (
                              <img
                                src={file.url}
                                alt={file.name}
                                className="w-9 h-9 rounded-lg object-cover shrink-0 border border-outline-variant/20"
                              />
                            ) : (
                              <div
                                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                                  isPdf ? 'bg-rose-100 text-rose-700' : 'bg-primary/10 text-primary'
                                }`}
                              >
                                <span className="material-symbols-outlined text-[20px]">
                                  {isPdf ? 'picture_as_pdf' : 'image'}
                                </span>
                              </div>
                            )}

                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-on-surface truncate">
                                {file.name}
                              </span>
                              <span className="text-[10px] text-on-surface-variant">
                                {file.size}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveFile(file.id)}
                            className="w-7 h-7 rounded-lg text-outline hover:text-error hover:bg-rose-50 flex items-center justify-center transition-colors shrink-0"
                            title="ลบไฟล์นี้"
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-md hover:bg-primary-container active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">
                      progress_activity
                    </span>
                    <span>กำลังส่งข้อมูลใบเคลม...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">send</span>
                    <span>ยืนยันการส่งเคลมสินค้า</span>
                  </>
                )}
              </button>
              <p className="text-[10px] text-center text-on-surface-variant mt-2">
                เมื่อกดส่งเคลม ระบบจะสร้างรหัสใบเคลม (Claim ID) ให้อัตโนมัติทันที
              </p>
            </div>
          </form>

          {/* Success Modal Popup when submitted */}
          {newlyCreatedClaim && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="w-full max-w-[390px] bg-surface-container-lowest rounded-3xl p-5 shadow-2xl border border-outline-variant/20 flex flex-col gap-4 animate-in zoom-in-95 duration-200 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                  <span className="material-symbols-outlined text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <h3 className="font-extrabold text-lg text-on-surface">ยื่นคำร้องเคลมสำเร็จ!</h3>
                  <p className="text-xs text-on-surface-variant">
                    ระบบได้สร้างรหัสใบเคลมสำหรับติดตามสถานะของคุณเรียบร้อยแล้ว
                  </p>
                </div>

                {/* Claim ID Display Card */}
                <div className="p-3.5 rounded-2xl bg-surface-container border border-primary/20 flex flex-col items-center gap-1.5 relative overflow-hidden">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    รหัสใบเคลมสินค้า (Claim ID)
                  </span>
                  <span className="font-mono font-black text-xl text-primary tracking-wider">
                    {newlyCreatedClaim.claimId}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => handleCopyClaimId(newlyCreatedClaim.claimId)}
                      className="px-3 py-1 rounded-full bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs flex items-center gap-1 active:scale-95 transition-all"
                    >
                      <span className="material-symbols-outlined text-[15px]">content_copy</span>
                      <span>คัดลอกรหัส</span>
                    </button>
                  </div>
                </div>

                {/* Summary Info */}
                <div className="bg-surface-container-low rounded-xl p-3 text-left text-xs flex flex-col gap-1.5 border border-outline-variant/15">
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">ผู้ยื่นเรื่อง:</span>
                    <span className="font-semibold text-on-surface">{newlyCreatedClaim.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">สาขาที่รับเรื่อง:</span>
                    <span className="font-semibold text-on-surface truncate max-w-[180px]">
                      {newlyCreatedClaim.branch}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">เวลาที่ยื่นเรื่อง:</span>
                    <span className="font-semibold text-on-surface">{newlyCreatedClaim.submittedAt}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchClaimId(newlyCreatedClaim.claimId);
                      setSearchedClaim(newlyCreatedClaim);
                      setHasSearched(true);
                      setNewlyCreatedClaim(null);
                      setActiveTab('track');
                    }}
                    className="w-full h-11 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-md hover:bg-primary-container active:scale-98 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[17px]">track_changes</span>
                    <span>ไปที่หน้าตรวจสอบสถานะทันที</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewlyCreatedClaim(null)}
                    className="w-full h-10 rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high font-semibold text-xs active:scale-98 transition-all"
                  >
                    ปิดหน้าต่างนี้
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: ตรวจสอบสถานะเคลม (Track Claim Status)                */}
      {/* ======================================================== */}
      {activeTab === 'track' && (
        <div className="flex flex-col gap-space-md animate-in fade-in duration-200">
          {/* Summary Card: Active Claims Count & Latest Claim Status Quick-View */}
          <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/15 flex flex-col gap-3.5">
            {/* Header: Title and Active Claims Count */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">assignment_turned_in</span>
                </div>
                <div className="flex flex-col">
                  <h3 className="text-xs font-extrabold text-on-surface">ภาพรวมใบเคลมของฉัน</h3>
                  <span className="text-[11px] text-on-surface-variant">
                    {claimsList.length} รายการทั้งหมดในระบบ
                  </span>
                </div>
              </div>

              {/* Active Claims Count Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-fixed/40 text-on-primary-fixed border border-primary/20 shrink-0 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-bold">Active Claims:</span>
                  <span className="font-mono font-black text-sm text-primary tabular-nums">
                    {activeClaimsCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick-view of Latest Claim Status using Progress Bar Component */}
            {latestClaim ? (
              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/15 flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider shrink-0">
                      คำร้องล่าสุด:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchClaimId(latestClaim.claimId);
                        handleSearchClaim(latestClaim.claimId);
                      }}
                      className="font-mono font-black text-xs text-primary hover:underline truncate"
                      title="คลิกเพื่อตรวจสอบคำร้องนี้"
                    >
                      {latestClaim.claimId}
                    </button>
                  </div>

                  <span className="text-[10px] text-on-surface-variant truncate max-w-[140px]">
                    {latestClaim.branch.split(' (')[0]}
                  </span>
                </div>

                {latestClaim.productName && (
                  <p className="text-[11px] font-medium text-on-surface truncate">
                    {latestClaim.productName}
                  </p>
                )}

                {/* Progress Bar Component */}
                <ClaimProgressBar currentStepId={latestClaim.currentStepId} />

                <div className="flex items-center justify-between pt-1 border-t border-outline-variant/10 text-[11px]">
                  <span className="text-[10px] text-on-surface-variant">
                    ยื่นเรื่อง: {latestClaim.submittedAt.split(' • ')[0]}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchClaimId(latestClaim.claimId);
                      handleSearchClaim(latestClaim.claimId);
                    }}
                    className={`font-bold text-xs flex items-center gap-0.5 transition-colors ${
                      searchedClaim?.claimId === latestClaim.claimId
                        ? 'text-primary'
                        : 'text-secondary hover:text-primary'
                    }`}
                  >
                    <span>
                      {searchedClaim?.claimId === latestClaim.claimId
                        ? 'กำลังแสดงขั้นตอนด้านล่าง'
                        : 'ดูขั้นตอนแบบละเอียด'}
                    </span>
                    <span className="material-symbols-outlined text-[15px]">arrow_downward</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-surface-container-low text-center text-xs text-on-surface-variant">
                ยังไม่มีข้อมูลคำร้องเคลมในระบบ กรุณากรอกแบบฟอร์มเพื่อส่งคำร้อง
              </div>
            )}
          </div>

          {/* Search Input Box */}
          <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/15 flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label htmlFor="claim-search-input" className="text-xs font-bold text-on-surface flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-primary">search</span>
                  <span>กรอกรหัสใบเคลม (Claim ID)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="px-2.5 py-1 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 font-bold text-[11px] flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs group"
                  title="สแกน QR Code จากใบเสร็จจริง"
                >
                  <span className="material-symbols-outlined text-[16px] group-hover:scale-110 transition-transform">
                    qr_code_scanner
                  </span>
                  <span>สแกน QR ใบเสร็จ</span>
                </button>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <div className="relative flex-1 flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-[18px] text-outline pointer-events-none">
                    tag
                  </span>
                  <input
                    id="claim-search-input"
                    type="text"
                    value={searchClaimId}
                    onChange={(e) => setSearchClaimId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchClaim()}
                    placeholder="เช่น CLM-202609001"
                    className="w-full py-2.5 pl-9 pr-10 rounded-xl bg-surface-container border border-outline-variant/25 font-mono text-xs font-bold text-on-surface placeholder:text-outline uppercase focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setIsScannerOpen(true)}
                    className="absolute right-2 p-1 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                    title="สแกน QR Code จากใบเสร็จ"
                  >
                    <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handleSearchClaim()}
                  className="h-10 px-4 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-sm hover:bg-primary-container active:scale-95 transition-all flex items-center gap-1 shrink-0"
                >
                  <span className="material-symbols-outlined text-[16px]">search</span>
                  <span>ค้นหา</span>
                </button>
              </div>
            </div>

            {/* Quick Mock Sample Pills */}
            <div className="flex flex-col gap-1.5 pt-1 border-t border-outline-variant/15">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                คลิกทดสอบรหัสตัวอย่างในระบบ:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {claimsList.slice(0, 4).map((c) => (
                  <button
                    key={c.claimId}
                    type="button"
                    onClick={() => {
                      setSearchClaimId(c.claimId);
                      handleSearchClaim(c.claimId);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold transition-all active:scale-95 border ${
                      searchedClaim?.claimId === c.claimId
                        ? 'bg-primary text-on-primary border-primary shadow-2xs'
                        : 'bg-surface-container text-on-surface border-outline-variant/20 hover:bg-surface-container-high'
                    }`}
                  >
                    {c.claimId}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Search Result View */}
          {hasSearched && searchedClaim ? (
            <div className="flex flex-col gap-space-md animate-in fade-in duration-200">
              {/* Claim Overview Card */}
              <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/15 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-outline-variant/15">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                      หมายเลขคำร้อง
                    </span>
                    <span className="font-mono font-black text-base text-primary">
                      {searchedClaim.claimId}
                    </span>
                  </div>

                  {/* Status Pill Badge */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {searchedClaim.repairComparisons && searchedClaim.repairComparisons.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold border border-primary/25 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">auto_fix_high</span>
                        <span>ภาพก่อน-หลัง ({searchedClaim.repairComparisons.length})</span>
                      </span>
                    )}

                    {searchedClaim.currentStepId === 'delivered' ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1 border border-emerald-300">
                        <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                          check_circle
                        </span>
                        เสร็จสมบูรณ์
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold flex items-center gap-1 border border-amber-300">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                        กำลังดำเนินการ
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleCopyClaimId(searchedClaim.claimId)}
                      className="w-7 h-7 rounded-lg bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-outline transition-colors"
                      title="คัดลอกรหัส"
                    >
                      <span className="material-symbols-outlined text-[15px]">content_copy</span>
                    </button>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-on-surface-variant">ชื่อผู้ส่งเคลม:</span>
                    <span className="font-bold text-on-surface">{searchedClaim.customerName}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-on-surface-variant">เบอร์โทรศัพท์:</span>
                    <span className="font-bold text-on-surface font-mono">{searchedClaim.phoneNumber}</span>
                  </div>
                  <div className="flex flex-col col-span-2">
                    <span className="text-[10px] text-on-surface-variant">สาขาที่รับเรื่อง:</span>
                    <span className="font-bold text-on-surface">{searchedClaim.branch}</span>
                  </div>
                  {searchedClaim.productName && (
                    <div className="flex flex-col col-span-2">
                      <span className="text-[10px] text-on-surface-variant">สินค้า:</span>
                      <span className="font-bold text-primary">{searchedClaim.productName}</span>
                    </div>
                  )}
                  <div className="flex flex-col col-span-2 bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/15">
                    <span className="text-[10px] text-on-surface-variant font-bold">อาการที่แจ้งเคลม:</span>
                    <p className="text-xs text-on-surface mt-0.5 leading-relaxed">
                      "{searchedClaim.issueDescription}"
                    </p>
                  </div>
                </div>

                {/* Attached Files preview if available */}
                {searchedClaim.attachedFiles && searchedClaim.attachedFiles.length > 0 && (
                  <div className="flex flex-col gap-1.5 pt-1">
                    <span className="text-[10px] font-bold text-on-surface-variant">
                      หลักฐานที่แนบไว้ ({searchedClaim.attachedFiles.length} ไฟล์):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {searchedClaim.attachedFiles.map((f) => (
                        <div
                          key={f.id}
                          className="px-2 py-1 rounded-lg bg-surface-container text-[11px] font-medium text-on-surface flex items-center gap-1 border border-outline-variant/20"
                        >
                          <span className="material-symbols-outlined text-[13px] text-primary">
                            {f.type.includes('pdf') ? 'picture_as_pdf' : 'image'}
                          </span>
                          <span className="truncate max-w-[150px]">{f.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 'Notify Me' Toggle for SMS/Email Updates */}
                {(() => {
                  const pref = notifyPreferences[searchedClaim.claimId] || {
                    enabled: false,
                    sms: true,
                    email: true
                  };
                  const isEnabled = pref.enabled;

                  return (
                    <div className="pt-2.5 border-t border-outline-variant/15 flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 transition-all">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                              isEnabled
                                ? 'bg-primary text-on-primary shadow-2xs'
                                : 'bg-surface-container-high text-on-surface-variant'
                            }`}
                          >
                            <span
                              className={`material-symbols-outlined text-[19px] ${
                                isEnabled ? 'animate-bounce' : ''
                              }`}
                            >
                              {isEnabled ? 'notifications_active' : 'notifications_none'}
                            </span>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-on-surface">
                                แจ้งเตือนสถานะอัตโนมัติ (Notify Me)
                              </span>
                              {isEnabled && (
                                <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold border border-emerald-300">
                                  เปิดอยู่
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-on-surface-variant truncate">
                              {isEnabled
                                ? 'รับ SMS และ Email อัปเดตทันทีเมื่อสถานะเปลี่ยน'
                                : 'เปิดเพื่อรับ SMS / Email อัปเดตความคืบหน้า'}
                            </span>
                          </div>
                        </div>

                        {/* Interactive Switch Toggle */}
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isEnabled}
                          onClick={() => handleToggleNotify(searchedClaim.claimId)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                            isEnabled ? 'bg-primary' : 'bg-surface-container-highest'
                          }`}
                          aria-label="เปิดปิดการแจ้งเตือนความคืบหน้าใบเคลม"
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              isEnabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Expandable Channel Options when Enabled */}
                      {isEnabled && (
                        <div className="pl-1 pr-1 py-1 flex flex-col gap-1.5 text-[11px] animate-in fade-in slide-in-from-top-1 duration-150">
                          <span className="text-[10px] font-bold text-on-surface-variant flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px] text-primary">tune</span>
                            <span>เลือกช่องทางรับการแจ้งเตือน:</span>
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {/* SMS Channel */}
                            <label
                              onClick={(e) => {
                                e.preventDefault();
                                handleToggleChannel(searchedClaim.claimId, 'sms');
                              }}
                              className={`p-2 rounded-lg border flex items-center justify-between gap-2 cursor-pointer transition-colors active:scale-99 ${
                                pref.sms
                                  ? 'bg-primary/5 border-primary/30 text-on-surface shadow-2xs'
                                  : 'bg-surface-container-low border-outline-variant/20 text-on-surface-variant opacity-75'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="material-symbols-outlined text-[16px] text-primary shrink-0">
                                  sms
                                </span>
                                <div className="flex flex-col truncate">
                                  <span className="font-bold text-[10px]">ข้อความ SMS</span>
                                  <span className="font-mono text-[9px] text-on-surface-variant truncate">
                                    {searchedClaim.phoneNumber}
                                  </span>
                                </div>
                              </div>
                              <input
                                type="checkbox"
                                checked={pref.sms}
                                readOnly
                                className="w-4 h-4 text-primary rounded border-outline-variant/30 focus:ring-primary cursor-pointer shrink-0"
                              />
                            </label>

                            {/* Email Channel */}
                            <label
                              onClick={(e) => {
                                e.preventDefault();
                                handleToggleChannel(searchedClaim.claimId, 'email');
                              }}
                              className={`p-2 rounded-lg border flex items-center justify-between gap-2 cursor-pointer transition-colors active:scale-99 ${
                                pref.email
                                  ? 'bg-primary/5 border-primary/30 text-on-surface shadow-2xs'
                                  : 'bg-surface-container-low border-outline-variant/20 text-on-surface-variant opacity-75'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="material-symbols-outlined text-[16px] text-secondary shrink-0">
                                  mail
                                </span>
                                <div className="flex flex-col truncate">
                                  <span className="font-bold text-[10px]">อีเมล (Email)</span>
                                  <span className="text-[9px] text-on-surface-variant truncate">
                                    {user.email || 'customer@tatoe.com'}
                                  </span>
                                </div>
                              </div>
                              <input
                                type="checkbox"
                                checked={pref.email}
                                readOnly
                                className="w-4 h-4 text-primary rounded border-outline-variant/30 focus:ring-primary cursor-pointer shrink-0"
                              />
                            </label>
                          </div>
                          <p className="text-[9px] text-on-surface-variant mt-0.5">
                            * ระบบจะจำลองส่งข้อความ SMS และ Email ทันทีเมื่อสถานะของใบเคลมนี้ขยับหรือเปลี่ยนแปลง
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* เปรียบเทียบรูปภาพสินค้าก่อน-หลังเคลม (Before & After Photo Comparison) */}
              <ClaimComparisonViewer
                comparisons={searchedClaim.repairComparisons}
                claimId={searchedClaim.claimId}
                productName={searchedClaim.productName}
                currentStepId={searchedClaim.currentStepId}
              />

              {/* Step Status Indicators Legend */}
              <div className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-2">
                <span className="text-[11px] font-bold text-on-surface flex items-center gap-1">
                  <span className="material-symbols-outlined text-primary text-[16px]">info</span>
                  <span>คำอธิบายสัญลักษณ์แสดงสถานะขั้นตอน (Step Status Indicators):</span>
                </span>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  {/* 1. Completed */}
                  <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 p-2 rounded-xl border border-emerald-200">
                    <span className="material-symbols-outlined text-emerald-600 text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      check_circle
                    </span>
                    <div className="flex flex-col">
                      <span className="font-bold leading-tight">เสร็จสิ้นแล้ว</span>
                      <span className="text-[9px] opacity-80">(Completed)</span>
                    </div>
                  </div>

                  {/* 2. In Progress */}
                  <div className="flex items-center gap-1.5 bg-sky-50 text-sky-800 p-2 rounded-xl border border-sky-200">
                    <span className="material-symbols-outlined text-sky-600 text-[18px] animate-spin">
                      progress_activity
                    </span>
                    <div className="flex flex-col">
                      <span className="font-bold leading-tight">กำลังดำเนินการ</span>
                      <span className="text-[9px] opacity-80">(In Progress)</span>
                    </div>
                  </div>

                  {/* 3. Pending / Upcoming */}
                  <div className="flex items-center gap-1.5 bg-slate-100 text-slate-700 p-2 rounded-xl border border-slate-300">
                    <span className="material-symbols-outlined text-slate-400 text-[18px]">
                      check_box_outline_blank
                    </span>
                    <div className="flex flex-col">
                      <span className="font-bold leading-tight">ยังไม่เริ่ม</span>
                      <span className="text-[9px] opacity-80">(Pending)</span>
                    </div>
                  </div>
                </div>

                {/* Interactive Demo: Quick Step Simulator Buttons */}
                <div className="flex flex-col gap-1.5 pt-2 border-t border-outline-variant/15">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-primary">play_circle</span>
                      <span>ทดสอบจำลองเปลี่ยนขั้นตอน (Demo Step Switcher):</span>
                    </span>
                    <span className="text-[10px] text-primary font-bold">คลิกเลือกดูการเปลี่ยนสัญลักษณ์</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1">
                    {[1, 2, 3, 4, 5].map((num) => {
                      const stepObj = searchedClaim.steps[num - 1];
                      const isCurrent = stepObj.state === 'in_progress' || (num === 5 && stepObj.state === 'completed');
                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() => handleSimulateStepChange(num)}
                          className={`py-1 px-1 rounded-lg text-[10px] font-bold transition-all active:scale-95 flex flex-col items-center justify-center border ${
                            isCurrent
                              ? 'bg-primary text-on-primary border-primary shadow-xs'
                              : 'bg-surface-container text-on-surface hover:bg-surface-container-high border-outline-variant/20'
                          }`}
                          title={`เปลี่ยนสถานะเป็นขั้นตอนที่ ${num}`}
                        >
                          <span>ขั้นที่ {num}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Progress Stepper / Timeline (ตั้งแต่ต้นจนจบ) */}
              <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/15 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[18px]">alt_route</span>
                    <span>ความคืบหน้าการดำเนินงาน 5 ขั้นตอน (Progress Stepper)</span>
                  </h3>
                  <span className="text-[10px] text-on-surface-variant font-medium">
                    อัปเดตล่าสุด: วันนี้
                  </span>
                </div>

                {/* Timeline Items */}
                <div className="flex flex-col relative pl-2">
                  {searchedClaim.steps.map((step, idx) => {
                    const isLast = idx === searchedClaim.steps.length - 1;

                    return (
                      <div key={step.id} className="relative flex items-start gap-3.5 pb-6 last:pb-1">
                        {/* Connecting Line between steps */}
                        {!isLast && (
                          <div
                            className={`absolute left-[13px] top-[26px] bottom-0 w-0.5 transition-colors ${
                              step.state === 'completed'
                                ? 'bg-emerald-500'
                                : step.state === 'in_progress'
                                ? 'bg-gradient-to-b from-sky-500 to-slate-200'
                                : 'bg-slate-200 border-dashed border-l border-slate-300'
                            }`}
                          />
                        )}

                        {/* Step Status Indicator Icon */}
                        <div className="relative z-10 shrink-0 mt-0.5">
                          {/* Case 1: Completed -> Green Checkmark Icon */}
                          {step.state === 'completed' && (
                            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center ring-2 ring-emerald-500/30 shadow-xs">
                              <span
                                className="material-symbols-outlined text-[20px] font-bold"
                                style={{ fontVariationSettings: "'FILL' 1" }}
                                title="ขั้นตอนเสร็จสิ้นแล้ว (Completed)"
                              >
                                check_circle
                              </span>
                            </div>
                          )}

                          {/* Case 2: In Progress -> Blue/Orange Circle Spinner */}
                          {step.state === 'in_progress' && (
                            <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center ring-4 ring-sky-400/30 shadow-xs animate-pulse">
                              <span
                                className="material-symbols-outlined text-[18px] animate-spin font-bold"
                                title="กำลังดำเนินการอยู่ (In Progress)"
                              >
                                progress_activity
                              </span>
                            </div>
                          )}

                          {/* Case 3: Pending/Upcoming -> Gray Outline Square */}
                          {step.state === 'pending' && (
                            <div className="w-7 h-7 rounded-md bg-slate-50 text-slate-400 flex items-center justify-center border-2 border-slate-300">
                              <span
                                className="material-symbols-outlined text-[18px]"
                                title="ยังไม่เริ่มดำเนินการ (Pending/Upcoming)"
                              >
                                check_box_outline_blank
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Step Details */}
                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="flex items-center justify-between gap-1 flex-wrap">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-mono">
                                ขั้นที่ {step.stepNumber}
                              </span>
                              <span
                                className={`text-xs font-bold leading-snug ${
                                  step.state === 'completed'
                                    ? 'text-emerald-950 font-extrabold'
                                    : step.state === 'in_progress'
                                    ? 'text-sky-950 font-black'
                                    : 'text-slate-500'
                                }`}
                              >
                                {step.title}
                              </span>
                            </div>

                            {/* State Tag */}
                            {step.state === 'completed' && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                                สำเร็จ
                              </span>
                            )}
                            {step.state === 'in_progress' && (
                              <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-300 shrink-0 animate-pulse">
                                กำลังดำเนินการ
                              </span>
                            )}
                            {step.state === 'pending' && (
                              <span className="text-[10px] font-medium text-slate-400 shrink-0">
                                รอดำเนินการ
                              </span>
                            )}
                          </div>

                          <span className="text-[10px] text-on-surface-variant font-medium block mt-0.5">
                            {step.englishTitle}
                          </span>

                          <p
                            className={`text-xs mt-1 leading-relaxed ${
                              step.state === 'pending' ? 'text-slate-400' : 'text-on-surface'
                            }`}
                          >
                            {step.description}
                          </p>

                          {/* Timestamp & Location Metadata */}
                          {(step.timestamp || step.location) && (
                            <div className="flex items-center gap-3 mt-1.5 text-[11px] text-on-surface-variant flex-wrap bg-surface-container-low p-2 rounded-lg border border-outline-variant/15">
                              {step.timestamp && (
                                <span className="flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[13px] text-primary">
                                    schedule
                                  </span>
                                  <span>{step.timestamp}</span>
                                </span>
                              )}
                              {step.location && (
                                <span className="flex items-center gap-1 font-medium text-on-surface">
                                  <span className="material-symbols-outlined text-[13px] text-secondary">
                                    location_on
                                  </span>
                                  <span>{step.location}</span>
                                </span>
                              )}
                            </div>
                          )}

                          {/* Estimated Completion Date label under the final delivery status */}
                          {isLast && (
                            <div className="mt-2.5 p-2.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-primary/5 to-surface-container border border-emerald-500/30 flex items-center justify-between gap-2 shadow-2xs">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-700 flex items-center justify-center shrink-0">
                                  <span
                                    className="material-symbols-outlined text-[17px]"
                                    style={{ fontVariationSettings: "'FILL' 1" }}
                                  >
                                    event_available
                                  </span>
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
                                    วันกำหนดแล้วเสร็จโดยประมาณ (Estimated Completion Date)
                                  </span>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs font-black text-on-surface font-mono">
                                      {searchedClaim.estimatedCompletion || 'ประมาณ 5-7 วันทำการ'}
                                    </span>
                                    {step.state === 'completed' ? (
                                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded-full border border-emerald-300">
                                        ส่งมอบสำเร็จแล้ว
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-medium text-on-surface-variant">
                                        (คาดการณ์ตามคิวตรวจซ่อม)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-1 rounded-lg shrink-0 flex items-center gap-1 border border-primary/20">
                                <span className="material-symbols-outlined text-[13px]">storefront</span>
                                <span>พร้อมรับที่สาขา</span>
                              </span>
                            </div>
                          )}

                          {/* Quick Feedback Callout for Delivered Claims */}
                          {isLast && step.state === 'completed' && (
                            <div className="mt-2 flex items-center justify-between text-[10px] text-amber-800 bg-amber-50/80 px-2.5 py-1.5 rounded-xl border border-amber-200">
                              <span className="flex items-center gap-1 font-bold">
                                <span
                                  className="material-symbols-outlined text-[14px] text-amber-600"
                                  style={{ fontVariationSettings: "'FILL' 1" }}
                                >
                                  star
                                </span>
                                <span>สินค้ารับมอบเรียบร้อยแล้ว เชิญประเมินความพึงพอใจด้านล่าง</span>
                              </span>
                              <span className="material-symbols-outlined text-[14px] text-amber-700 animate-bounce">
                                arrow_downward
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ======================================================== */}
              {/* Claim Process Rating & Feedback (เมื่อสถานะเป็น Delivered) */}
              {/* ======================================================== */}
              {searchedClaim.currentStepId === 'delivered' && (
                <section
                  aria-label="แบบประเมินความพึงพอใจขั้นตอนการเคลมสินค้า"
                  className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-amber-300/60 bg-gradient-to-br from-amber-500/5 via-surface-container-lowest to-emerald-500/5 flex flex-col gap-3.5 animate-in fade-in slide-in-from-bottom-2 duration-200"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-outline-variant/15">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-2xs">
                        <span
                          className="material-symbols-outlined text-[20px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-xs font-black text-on-surface">
                            ประเมินความพึงพอใจการเคลมสินค้า
                          </h3>
                          <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded-full border border-amber-300">
                            Claim Service Feedback
                          </span>
                        </div>
                        <span className="text-[10px] text-on-surface-variant">
                          ช่วย TATOE Optical พัฒนาการบริการรับประกันและซ่อมบำรุงให้ดียิ่งขึ้น
                        </span>
                      </div>
                    </div>

                    {claimFeedbacks[searchedClaim.claimId] && !isEditingFeedback && (
                      <button
                        type="button"
                        onClick={() => setIsEditingFeedback(true)}
                        className="text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5 shrink-0"
                      >
                        <span className="material-symbols-outlined text-[14px]">edit</span>
                        <span>แก้ไขแบบประเมิน</span>
                      </button>
                    )}
                  </div>

                  {/* Feedback Form / Display View */}
                  {claimFeedbacks[searchedClaim.claimId] && !isEditingFeedback ? (
                    /* Already Submitted View */
                    <div className="p-3.5 rounded-xl bg-surface-container-low border border-emerald-500/30 flex flex-col gap-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`material-symbols-outlined text-[20px] ${
                                star <= claimFeedbacks[searchedClaim.claimId].rating
                                  ? 'text-amber-400'
                                  : 'text-outline/30'
                              }`}
                              style={{
                                fontVariationSettings:
                                  star <= claimFeedbacks[searchedClaim.claimId].rating
                                    ? "'FILL' 1"
                                    : "'FILL' 0"
                              }}
                            >
                              star
                            </span>
                          ))}
                          <span className="text-xs font-black text-on-surface ml-1 font-mono">
                            {claimFeedbacks[searchedClaim.claimId].rating}/5
                          </span>
                        </div>

                        <span className="text-[10px] text-on-surface-variant">
                          ประเมินเมื่อ: {claimFeedbacks[searchedClaim.claimId].submittedAt}
                        </span>
                      </div>

                      {/* Display Aspects Tags */}
                      {claimFeedbacks[searchedClaim.claimId].aspects &&
                        claimFeedbacks[searchedClaim.claimId].aspects.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {claimFeedbacks[searchedClaim.claimId].aspects.map((aspect) => (
                              <span
                                key={aspect}
                                className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200"
                              >
                                {aspect}
                              </span>
                            ))}
                          </div>
                        )}

                      {/* Display Comment */}
                      {claimFeedbacks[searchedClaim.claimId].comment ? (
                        <p className="text-xs text-on-surface leading-relaxed bg-surface-container-lowest p-2.5 rounded-lg border border-outline-variant/15 italic">
                          "{claimFeedbacks[searchedClaim.claimId].comment}"
                        </p>
                      ) : (
                        <p className="text-[11px] text-on-surface-variant italic">
                          (ไม่ได้ระบุข้อเสนอแนะเพิ่มเติม)
                        </p>
                      )}

                      <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-medium">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        <span>ขอบพระคุณสำหรับข้อเสนอแนะ ร้านค้าได้รับข้อมูลเรียบร้อยแล้ว</span>
                      </div>
                    </div>
                  ) : (
                    /* Interactive Rating & Input Form */
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSubmitFeedback(searchedClaim.claimId);
                      }}
                      className="flex flex-col gap-3"
                    >
                      {/* Star Rating Controls */}
                      <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 gap-1.5">
                        <span className="text-[11px] font-bold text-on-surface">
                          ให้คะแนนความพึงพอใจโดยรวม:
                        </span>
                        <div className="flex items-center gap-1.5" role="radiogroup" aria-label="คะแนนดาว">
                          {[1, 2, 3, 4, 5].map((star) => {
                            const isFilled =
                              star <= (feedbackHoverRating || feedbackRating);

                            return (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setFeedbackRating(star)}
                                onMouseEnter={() => setFeedbackHoverRating(star)}
                                onMouseLeave={() => setFeedbackHoverRating(0)}
                                className="p-1 rounded-lg hover:scale-110 active:scale-95 transition-transform cursor-pointer focus:outline-none"
                                aria-label={`ให้ ${star} ดาว`}
                              >
                                <span
                                  className={`material-symbols-outlined text-[30px] transition-colors ${
                                    isFilled ? 'text-amber-400' : 'text-outline/30'
                                  }`}
                                  style={{
                                    fontVariationSettings: isFilled ? "'FILL' 1" : "'FILL' 0"
                                  }}
                                >
                                  star
                                </span>
                              </button>
                            );
                          })}
                        </div>
                        <span className="text-xs font-bold text-amber-700 min-h-[18px]">
                          {feedbackHoverRating || feedbackRating ? (
                            <span>
                              {
                                {
                                  1: '⭐ ต้องปรับปรุง (Needs Improvement - 1/5)',
                                  2: '⭐⭐ พอใช้ (Fair - 2/5)',
                                  3: '⭐⭐⭐ ปานกลาง (Good - 3/5)',
                                  4: '⭐⭐⭐⭐ ดีมาก (Very Good - 4/5)',
                                  5: '⭐⭐⭐⭐⭐ ยอดเยี่ยม ประทับใจมาก (Excellent - 5/5)'
                                }[feedbackHoverRating || feedbackRating]
                              }
                            </span>
                          ) : null}
                        </span>
                      </div>

                      {/* Aspect Badges (Quick Select) */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-on-surface-variant flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px] text-primary">thumb_up</span>
                          <span>จุดที่ท่านประทับใจเป็นพิเศษ (เลือกได้มากกว่า 1 ข้อ):</span>
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            '⚡ ความรวดเร็วในการเคลม',
                            '👓 ความประณีตในการซ่อม',
                            '💬 การอัปเดตสถานะชัดเจน',
                            '🏪 บริการของเจ้าหน้าที่สาขา',
                            '🛡️ เงื่อนไขประกันศูนย์ 1 ปี'
                          ].map((aspect) => {
                            const isSelected = selectedAspects.includes(aspect);
                            return (
                              <button
                                key={aspect}
                                type="button"
                                onClick={() => toggleAspect(aspect)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all active:scale-95 border ${
                                  isSelected
                                    ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs'
                                    : 'bg-surface-container text-on-surface hover:bg-surface-container-high border-outline-variant/20'
                                }`}
                              >
                                {aspect}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Feedback Textarea Field */}
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <label
                            htmlFor="claim-feedback-input"
                            className="text-[11px] font-bold text-on-surface flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[14px] text-primary">rate_review</span>
                            <span>ข้อเสนอแนะเพิ่มเติมเกี่ยวกับการบริการ:</span>
                          </label>
                          <span className="text-[9px] text-on-surface-variant font-mono">
                            {feedbackComment.length}/300
                          </span>
                        </div>
                        <textarea
                          id="claim-feedback-input"
                          rows={3}
                          maxLength={300}
                          value={feedbackComment}
                          onChange={(e) => setFeedbackComment(e.target.value)}
                          placeholder="เขียนข้อเสนอแนะหรือความคิดเห็นเพื่อช่วยให้ทางร้านพัฒนาบริการเคลมสินค้า (เช่น ความรวดเร็ว การให้คำแนะนำของช่าง หรือการรับสินค้าที่สาขา)..."
                          className="w-full p-2.5 rounded-xl bg-surface-container border border-outline-variant/25 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-end gap-2 pt-1">
                        {isEditingFeedback && (
                          <button
                            type="button"
                            onClick={() => setIsEditingFeedback(false)}
                            className="px-3 py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-xs font-bold text-on-surface transition-colors"
                          >
                            ยกเลิก
                          </button>
                        )}
                        <button
                          type="submit"
                          disabled={isSubmittingFeedback}
                          className="px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-2xs hover:bg-primary-container active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {isSubmittingFeedback ? (
                            <>
                              <span className="material-symbols-outlined text-[15px] animate-spin">
                                progress_activity
                              </span>
                              <span>กำลังส่งแบบประเมิน...</span>
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-[15px]">send</span>
                              <span>ส่งแบบประเมินบริการเคลม</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </section>
              )}

              {/* Action Buttons at Bottom */}
              <div className="flex items-center gap-2">
                {onOpenChat && (
                  <button
                    type="button"
                    onClick={onOpenChat}
                    className="flex-1 h-11 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-98 border border-outline-variant/25"
                  >
                    <span className="material-symbols-outlined text-[18px] text-primary">chat</span>
                    <span>แชทสอบถามช่างเทคนิค</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('submit');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex-1 h-11 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-98 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">add_circle</span>
                  <span>ยื่นใบเคลมฉบับใหม่</span>
                </button>
              </div>
            </div>
          ) : hasSearched ? (
            /* Not Found State */
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/15 flex flex-col items-center text-center gap-3 animate-in fade-in duration-200">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-error flex items-center justify-center">
                <span className="material-symbols-outlined text-[28px]">search_off</span>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="font-bold text-sm text-on-surface">
                  ไม่พบข้อมูลรหัสใบเคลม "{searchClaimId}"
                </h3>
                <p className="text-xs text-on-surface-variant max-w-xs">
                  กรุณาตรวจสอบความถูกต้องของรหัสใบเคลม (เช่น CLM-202609001) หรือติดต่อศูนย์บริการลูกค้า
                </p>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSearchClaimId('CLM-202609001');
                    handleSearchClaim('CLM-202609001');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs active:scale-95 transition-all"
                >
                  ลองดูตัวอย่าง CLM-202609001
                </button>
              </div>
            </div>
          ) : null}

          {/* ======================================================== */}
          {/* Scrollable List of Recent & Historical Claims             */}
          {/* ======================================================== */}
          <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/15 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-outline-variant/15">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[19px]">history</span>
                </div>
                <div className="flex flex-col">
                  <h3 className="text-xs font-extrabold text-on-surface">
                    ประวัติรายการเคลมทั้งหมด (Recent Claims)
                  </h3>
                  <p className="text-[10px] text-on-surface-variant">
                    แสดง {filteredClaimsList.length} จาก {claimsList.length} รายการ • แตะเพื่อดูไทม์ไลน์
                  </p>
                </div>
              </div>

              {/* Status Filter Dropdown */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <label
                  htmlFor="claim-status-filter"
                  className="text-[11px] font-semibold text-on-surface-variant flex items-center gap-1 shrink-0"
                >
                  <span className="material-symbols-outlined text-[15px] text-primary">filter_list</span>
                  <span>กรองสถานะ:</span>
                </label>
                <div className="relative flex items-center">
                  <select
                    id="claim-status-filter"
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value as 'all' | 'pending' | 'in_progress' | 'completed')
                    }
                    className="py-1.5 pl-2.5 pr-7 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/25 text-xs font-bold text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer transition-colors shadow-2xs"
                  >
                    <option value="all">ทั้งหมด / All ({claimsList.length})</option>
                    <option value="pending">รอดำเนินการ / Pending ({pendingCount})</option>
                    <option value="in_progress">กำลังดำเนินการ / In Progress ({inProgressCount})</option>
                    <option value="completed">เสร็จสิ้นแล้ว / Completed ({completedCount})</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-1.5 text-[16px] text-outline pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>
            </div>

            {/* Scrollable Container with max height */}
            <div className="max-h-[350px] overflow-y-auto flex flex-col gap-2.5 pr-1 divide-y divide-outline-variant/10">
              {filteredClaimsList.length > 0 ? (
                filteredClaimsList.map((claim) => {
                  const isSelected = searchedClaim?.claimId === claim.claimId;
                  const isDelivered = claim.currentStepId === 'delivered';

                  // Status label config
                  const statusMeta: Record<ClaimStepId, { label: string; step: string; badgeClass: string; icon: string }> = {
                    submitted: {
                      label: 'ยื่นคำร้องสำเร็จ',
                      step: 'ขั้นที่ 1/5',
                      badgeClass: 'bg-primary/10 text-primary border-primary/20',
                      icon: 'progress_activity'
                    },
                    received: {
                      label: 'ศูนย์บริการรับเรื่อง',
                      step: 'ขั้นที่ 2/5',
                      badgeClass: 'bg-sky-50 text-sky-800 border-sky-300',
                      icon: 'progress_activity'
                    },
                    inspecting: {
                      label: 'กำลังตรวจซ่อม',
                      step: 'ขั้นที่ 3/5',
                      badgeClass: 'bg-amber-50 text-amber-900 border-amber-300',
                      icon: 'progress_activity'
                    },
                    dispatched: {
                      label: 'จัดส่งถึงสาขาแล้ว',
                      step: 'ขั้นที่ 4/5',
                      badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-300',
                      icon: 'progress_activity'
                    },
                    delivered: {
                      label: 'ลูกค้ารับสินค้าเรียบร้อย',
                      step: 'ขั้นที่ 5/5',
                      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
                      icon: 'check_circle'
                    }
                  };

                  const currentMeta = statusMeta[claim.currentStepId] || statusMeta.submitted;

                  return (
                    <div
                      key={claim.claimId}
                      onClick={() => {
                        setSearchClaimId(claim.claimId);
                        setSearchedClaim(claim);
                        setHasSearched(true);
                        onShowToast(`กำลังแสดงสถานะของ ${claim.claimId}`);
                        // Smooth scroll to top of tracking section
                        const searchEl = document.getElementById('claim-search-input');
                        if (searchEl) {
                          searchEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      }}
                      className={`pt-2.5 first:pt-0 p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 active:scale-99 ${
                        isSelected
                          ? 'bg-primary/5 border-primary/40 ring-1 ring-primary/30 shadow-2xs'
                          : 'bg-surface-container-low/70 hover:bg-surface-container-low border-outline-variant/15 hover:border-outline-variant/30'
                      }`}
                    >
                      {/* Top row: Claim ID + Status Badge */}
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-xs text-primary">
                            {claim.claimId}
                          </span>
                          {isSelected && (
                            <span className="px-1.5 py-0.2 rounded bg-primary text-on-primary text-[9px] font-bold">
                              กำลังเลือก
                            </span>
                          )}
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 shrink-0 ${currentMeta.badgeClass}`}
                        >
                          <span
                            className={`material-symbols-outlined text-[12px] ${
                              !isDelivered ? 'animate-spin' : ''
                            }`}
                            style={isDelivered ? { fontVariationSettings: "'FILL' 1" } : undefined}
                          >
                            {currentMeta.icon}
                          </span>
                          <span>{currentMeta.label}</span>
                          <span className="opacity-75 font-normal text-[9px]">({currentMeta.step})</span>
                        </span>
                      </div>

                      {/* Middle row: Product Name & Issue snippet */}
                      <div className="flex flex-col gap-0.5">
                        {claim.productName && (
                          <span className="text-xs font-bold text-on-surface truncate">
                            {claim.productName}
                          </span>
                        )}
                        <p className="text-[11px] text-on-surface-variant line-clamp-1">
                          "{claim.issueDescription}"
                        </p>
                      </div>

                      {/* Bottom row: Branch & Date + Action affordance */}
                      <div className="flex items-center justify-between pt-1 text-[10px] text-on-surface-variant border-t border-outline-variant/10">
                        <div className="flex items-center gap-1 truncate max-w-[190px]">
                          <span className="material-symbols-outlined text-[13px] text-primary shrink-0">
                            storefront
                          </span>
                          <span className="truncate">{claim.branch.split(' (')[0]}</span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px] text-secondary">
                              calendar_today
                            </span>
                            <span className="font-medium">{claim.submittedAt.split(' • ')[0]}</span>
                          </div>
                          <span className="material-symbols-outlined text-[15px] text-primary">
                            chevron_right
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                /* Empty state when filter produces no results */
                <div className="py-6 px-4 rounded-xl bg-surface-container-low text-center flex flex-col items-center justify-center gap-2 text-on-surface-variant">
                  <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-outline">
                    <span className="material-symbols-outlined text-[22px]">filter_alt_off</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-on-surface">ไม่พบรายการเคลมในสถานะนี้</span>
                    <span className="text-[10px] text-on-surface-variant">
                      ลองเปลี่ยนตัวกรองเป็น "ทั้งหมด" หรือสถานะอื่น
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('all')}
                    className="mt-1 px-3 py-1 rounded-lg bg-primary text-on-primary text-[11px] font-bold active:scale-95 transition-all"
                  >
                    แสดงทั้งหมด
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* FAQ Section: Common Questions About Claim & Warranty     */}
      {/* ======================================================== */}
      <section
        aria-label="คำถามที่พบบ่อยเกี่ยวกับการเคลมสินค้า"
        className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/15 flex flex-col gap-3.5 mt-1"
      >
        <div className="flex items-center justify-between pb-2 border-b border-outline-variant/15">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">help_outline</span>
            </div>
            <div className="flex flex-col">
              <h2 className="text-xs font-extrabold text-on-surface">
                คำถามที่พบบ่อยเกี่ยวกับการเคลม (Claim FAQs)
              </h2>
              <p className="text-[10px] text-on-surface-variant">
                เงื่อนไขการรับประกัน 1 ปี • ระยะเวลาดำเนินการ • หลักฐานที่ต้องใช้
              </p>
            </div>
          </div>

          <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-lg border border-outline-variant/20">
            {CLAIM_FAQS.length} ข้อควรรู้
          </span>
        </div>

        {/* Accordion List */}
        <div className="flex flex-col divide-y divide-outline-variant/15">
          {CLAIM_FAQS.map((faq) => {
            const isOpen = openFaqIds.includes(faq.id);

            return (
              <div key={faq.id} className="py-2.5 first:pt-0 last:pb-0 flex flex-col">
                <button
                  type="button"
                  onClick={() => toggleFaq(faq.id)}
                  aria-expanded={isOpen}
                  className="flex items-start justify-between gap-2.5 text-left w-full group py-1 active:opacity-80 transition-opacity"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="material-symbols-outlined text-[18px] text-primary shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                      {faq.icon}
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-semibold text-secondary">
                        {faq.category}
                      </span>
                      <span className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors leading-snug">
                        {faq.question}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`material-symbols-outlined text-[20px] text-outline group-hover:text-primary transition-transform duration-200 shrink-0 mt-0.5 ${
                      isOpen ? 'rotate-180 text-primary' : ''
                    }`}
                  >
                    expand_more
                  </span>
                </button>

                {isOpen && (
                  <div className="pl-7 pr-1 pt-1.5 pb-1 animate-in fade-in slide-in-from-top-1 duration-150">
                    <p className="text-[11px] leading-relaxed text-on-surface-variant bg-surface-container-low p-3 rounded-xl border border-outline-variant/15 whitespace-pre-line">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Contact Support Footer within FAQ */}
        <div className="p-3 rounded-xl bg-gradient-to-r from-primary/5 via-surface-container-low to-secondary/5 border border-primary/20 flex items-center justify-between gap-2 text-xs mt-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-primary shrink-0">
              support_agent
            </span>
            <div className="flex flex-col">
              <span className="font-bold text-[11px] text-on-surface">มีคำถามเพิ่มเติม?</span>
              <span className="text-[10px] text-on-surface-variant">
                เจ้าหน้าที่เทคนิคพร้อมดูแลทุกวัน 09:00 - 18:00 น.
              </span>
            </div>
          </div>

          {onOpenChat && (
            <button
              type="button"
              onClick={onOpenChat}
              className="h-8 px-3 rounded-lg bg-primary text-on-primary font-bold text-[11px] shadow-2xs hover:bg-primary-container active:scale-95 transition-all flex items-center gap-1 shrink-0"
            >
              <span className="material-symbols-outlined text-[14px]">chat</span>
              <span>แชทสอบถาม</span>
            </button>
          )}
        </div>
      </section>

      {/* ======================================================== */}
      {/* QR Code Receipt Scanner Modal                             */}
      {/* ======================================================== */}
      {isScannerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="qr-scanner-title"
        >
          <div className="bg-surface-container-lowest text-on-surface rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-outline-variant/20 flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-outline-variant/15 bg-surface-container-low">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
                </div>
                <div className="flex flex-col">
                  <h3 id="qr-scanner-title" className="text-xs font-extrabold text-on-surface">
                    สแกน QR Code จากใบเสร็จรับเงิน
                  </h3>
                  <span className="text-[10px] text-on-surface-variant">
                    เล็งกรอบกล้องให้ตรงกับ QR Code บนใบเสร็จเพื่อดึง Claim ID อัตโนมัติ
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setIsScannerOpen(false);
                }}
                className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors"
                aria-label="ปิดหน้าต่างสแกน"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Viewfinder Area */}
            <div className="p-4 flex flex-col items-center gap-3 overflow-y-auto">
              <div className="relative w-full aspect-square max-w-[270px] rounded-2xl overflow-hidden bg-black flex items-center justify-center shadow-inner border border-outline-variant/30">
                {/* Live Video Element */}
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Viewfinder Target Framing with 4 Corners & Laser Beam */}
                <div className="absolute inset-5 pointer-events-none flex flex-col justify-between">
                  <div className="flex justify-between">
                    <span className="w-6 h-6 border-t-3 border-l-3 border-emerald-400 rounded-tl-lg" />
                    <span className="w-6 h-6 border-t-3 border-r-3 border-emerald-400 rounded-tr-lg" />
                  </div>
                  {/* Animated laser line */}
                  <div className="w-full h-0.5 bg-gradient-to-r from-emerald-400/20 via-emerald-400 to-emerald-400/20 shadow-[0_0_8px_#34d399] animate-pulse" />
                  <div className="flex justify-between">
                    <span className="w-6 h-6 border-b-3 border-l-3 border-emerald-400 rounded-bl-lg" />
                    <span className="w-6 h-6 border-b-3 border-r-3 border-emerald-400 rounded-br-lg" />
                  </div>
                </div>

                {/* Camera Inactive / Error Overlay */}
                {(!isCameraActive || scannerError) && (
                  <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-4 text-center gap-2">
                    <span className="material-symbols-outlined text-[32px] text-amber-400">
                      videocam_off
                    </span>
                    <p className="text-xs text-white/90 font-medium leading-relaxed">
                      {scannerError || 'กำลังเชื่อมต่อกล้องสำหรับสแกนใบเสร็จ...'}
                    </p>
                    <button
                      type="button"
                      onClick={() => startCamera()}
                      className="px-3 py-1.5 rounded-xl bg-primary text-on-primary text-[11px] font-bold mt-1 shadow-2xs hover:bg-primary-container active:scale-95"
                    >
                      ลองเชื่อมต่อกล้องใหม่
                    </button>
                  </div>
                )}
              </div>

              {/* Upload Receipt Photo Button */}
              <div className="w-full flex flex-col gap-1.5">
                <input
                  ref={receiptUploadRef}
                  type="file"
                  accept="image/*"
                  onChange={handleScanReceiptFile}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => receiptUploadRef.current?.click()}
                  className="w-full py-2.5 px-3 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-98 shadow-2xs"
                >
                  <span className="material-symbols-outlined text-[18px] text-primary">
                    photo_library
                  </span>
                  <span>อัปโหลดภาพถ่ายใบเสร็จจากเครื่อง (Upload Photo)</span>
                </button>
              </div>

              {/* Quick Simulated Receipt Samples */}
              <div className="w-full p-3 rounded-xl bg-surface-container-low border border-outline-variant/15 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-primary">receipt_long</span>
                    <span>จำลองสแกนใบเสร็จ (Demo Receipts):</span>
                  </span>
                  <span className="text-[9px] text-primary font-bold">คลิกทดสอบทันที</span>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {claimsList.slice(0, 4).map((c) => (
                    <button
                      key={c.claimId}
                      type="button"
                      onClick={() => handleScannedCode(c.claimId)}
                      className="p-2 rounded-lg bg-surface-container-lowest hover:bg-surface-container border border-outline-variant/20 hover:border-primary/40 text-left transition-all active:scale-95 flex flex-col gap-0.5 group shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-[11px] text-primary group-hover:underline">
                          {c.claimId}
                        </span>
                        <span className="material-symbols-outlined text-[14px] text-outline group-hover:text-primary">
                          qr_code_2
                        </span>
                      </div>
                      <span className="text-[9px] text-on-surface-variant truncate">
                        {c.branch.split(' (')[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-outline-variant/15 bg-surface-container-low flex justify-end">
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setIsScannerOpen(false);
                }}
                className="px-4 py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-xs font-bold text-on-surface transition-colors"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
