import { ClaimTicket, ClaimStepInfo } from '../types';

export interface OpticalBranch {
  id: string;
  name: string;
  location: string;
  phone: string;
  operatingHours: string;
}

export const OPTICAL_BRANCHES: OpticalBranch[] = [
  {
    id: 'siam-paragon',
    name: 'สาขาสยามพารากอน (Siam Paragon)',
    location: 'ชั้น 2 โซน Department Store ใกล้บันไดเลื่อน',
    phone: '02-129-4567',
    operatingHours: 'เปิดทุกวัน 10:00 - 21:00 น.'
  },
  {
    id: 'central-world',
    name: 'สาขาเซ็นทรัลเวิลด์ (CentralWorld)',
    location: 'ชั้น 3 โซน Atrium ติดทางเชื่อม BTS',
    phone: '02-255-8901',
    operatingHours: 'เปิดทุกวัน 10:00 - 21:30 น.'
  },
  {
    id: 'emquartier',
    name: 'สาขาเอ็มควอเทียร์ (EmQuartier)',
    location: 'ชั้น 3 อาคาร The Helix Quartier',
    phone: '02-003-6289',
    operatingHours: 'เปิดทุกวัน 10:30 - 21:00 น.'
  },
  {
    id: 'central-ladprao',
    name: 'สาขาเซ็นทรัลลาดพร้าว (Central Ladprao)',
    location: 'ชั้น 2 ใกล้ศูนย์บริการลูกค้า',
    phone: '02-541-1234',
    operatingHours: 'เปิดทุกวัน 10:00 - 21:00 น.'
  },
  {
    id: 'mega-bangna',
    name: 'สาขาเมกาบางนา (Mega Bangna)',
    location: 'ชั้น 1 โซน Mega Plaza ทางออกฝั่ง Big C',
    phone: '02-105-1888',
    operatingHours: 'เปิดทุกวัน 10:00 - 21:30 น.'
  },
  {
    id: 'headquarters',
    name: 'ศูนย์บริการใหญ่สำนักงานใหญ่ (TATOE Headquarter)',
    location: 'อาคาร TATOE Tower ชั้น 1 ถ.พระราม 9 ห้วยขวาง กทม.',
    phone: '02-999-8800',
    operatingHours: 'จันทร์ - เสาร์ 09:00 - 18:00 น.'
  }
];

export const CLAIM_STEPS_TEMPLATE: Omit<ClaimStepInfo, 'state' | 'timestamp' | 'location'>[] = [
  {
    id: 'submitted',
    stepNumber: 1,
    title: 'ยื่นคำร้องเคลมสำเร็จ',
    englishTitle: 'Claim Submitted',
    description: 'ระบบได้รับข้อมูลการเคลมและเอกสารหลักฐานของท่านเรียบร้อยแล้ว พร้อมส่งต่อให้ศูนย์บริการ'
  },
  {
    id: 'received',
    stepNumber: 2,
    title: 'ร้านค้า/ศูนย์บริการรับเรื่อง',
    englishTitle: 'Claim Received',
    description: 'เจ้าหน้าที่ศูนย์บริการรับเรื่องและลงทะเบียนรับสินค้าเข้าสู่ระบบตรวจสอบอะไหล่'
  },
  {
    id: 'inspecting',
    stepNumber: 3,
    title: 'อยู่ระหว่างการตรวจสอบ/ซ่อมแซม',
    englishTitle: 'Under Inspection/Repair',
    description: 'ช่างเทคนิคผู้เชี่ยวชาญกำลังดำเนินการตรวจเช็ค ดัดปรับทรง เปลี่ยนอะไหล่ หรือเคลมเลนส์ใหม่'
  },
  {
    id: 'dispatched',
    stepNumber: 4,
    title: 'ดำเนินการเสร็จสิ้น/จัดส่งไปยังสาขา',
    englishTitle: 'Completed/Dispatched',
    description: 'การซ่อมแซมผ่านการตรวจ QC 100% เรียบร้อย พัสดุถูกจัดส่งกลับถึงสาขาปลายทาง พร้อมให้ลูกค้ารับสินค้า'
  },
  {
    id: 'delivered',
    stepNumber: 5,
    title: 'ลูกค้ารับสินค้าเรียบร้อย',
    englishTitle: 'Delivered',
    description: 'ลูกค้าได้ทำการตรวจสอบสภาพสินค้าและเซ็นรับแว่นตากลับไปใช้งานอย่างสมบูรณ์แบบ'
  }
];

export const INITIAL_MOCK_CLAIMS: ClaimTicket[] = [
  {
    claimId: 'CLM-202609001',
    customerName: 'คุณภัทรพล สุทธิสิทธิ์',
    phoneNumber: '089-123-4567',
    branch: 'สาขาสยามพารากอน (Siam Paragon)',
    productName: 'Big Eye Urban Black (Titanium Edition)',
    orderId: '#BEY-2025058',
    issueDescription: 'ขาแว่นข้างซ้ายหลวม มีอาการง้างผิดองศา และแป้นจมูกซิลิโคนเดิมเปลี่ยนสี ต้องการให้ช่างปรับตั้งศูนย์ใหม่และเปลี่ยนแป้นจมูกใหม่',
    submittedAt: '21 ก.ย. 2026 • 10:30 น.',
    currentStepId: 'inspecting',
    estimatedCompletion: '26 ก.ย. 2026',
    attachedFiles: [
      {
        id: 'file-1',
        name: 'damage-left-hinge.jpg',
        size: '1.8 MB',
        type: 'image/jpeg',
        url: 'https://images.unsplash.com/photo-1591076482161-42ce6da69f68?w=300&auto=format&fit=crop&q=80'
      },
      {
        id: 'file-2',
        name: 'receipt-2025058.pdf',
        size: '420 KB',
        type: 'application/pdf'
      }
    ],
    repairComparisons: [
      {
        id: 'cmp-101',
        partName: 'ข้อต่อขาแว่นไทเทเนียมข้างซ้าย (Left Titanium Hinge)',
        beforeUrl: 'https://images.unsplash.com/photo-1591076482161-42ce6da69f68?w=800&auto=format&fit=crop&q=80',
        afterUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format&fit=crop&q=80',
        beforeDescription: 'ขาแว่นง้างออกผิดรูป 115° น็อตยึดเกลียวหวาน และบานพับหลวมคลอน ไม่พับแนบชิดกับกรอบหน้า',
        afterDescription: 'ดัดปรับตั้งศูนย์บานพับคืนมุมมาตรฐาน 92° เปลี่ยนน็อต Micro-Torx ชุบทองคำขาว ขันแน่น 0.15 Nm ขยับพับได้นุ่มนวล',
        technicianNote: 'ช่างเอกชัย (Optical Master #T08): ใช้อุปกรณ์ดัดไนลอนไร้รอย พร้อมหยอดน้ำยากันคลาย Loctite Blue มาตรฐานเยอรมัน ผ่านการทดสอบพับ 1,000 ครั้ง',
        completedAt: '23 ก.ย. 2026 • 15:30 น.',
        inspectorName: 'หัวหน้าช่าง ธีรเดช (QC Lead)'
      },
      {
        id: 'cmp-102',
        partName: 'แป้นจมูกแอร์ซิลิโคนซับแรงกด (Air Silicone Nosepads)',
        beforeUrl: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=800&auto=format&fit=crop&q=80',
        afterUrl: 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800&auto=format&fit=crop&q=80',
        beforeDescription: 'แป้นจมูกเดิมแข็งกระด้าง มีคราบออกไซด์เกาะและเปลี่ยนสีเป็นสีเขียวคล้ำจากการสัมผัสเหงื่อ',
        afterDescription: 'เปลี่ยนชุดแป้นจมูกแท้ TATOE Pure-Air Cushion ชนิด Medical-Grade ใสบริสุทธิ์ พร้อมล้างทำความสะอาดก้านแกนด้วยระบบ Ultrasonic',
        technicianNote: 'ผ่านเกณฑ์ตรวจสอบความนุ่มและองศาแนบสันจมูก ลดรอยกดแดงข้างจมูกได้มากกว่า 40%',
        completedAt: '23 ก.ย. 2026 • 16:00 น.',
        inspectorName: 'หัวหน้าช่าง ธีรเดช (QC Lead)'
      }
    ],
    steps: [
      {
        ...CLAIM_STEPS_TEMPLATE[0],
        state: 'completed',
        timestamp: '21 ก.ย. 2026 • 10:30 น.',
        location: 'ระบบออนไลน์ TATOE Portal'
      },
      {
        ...CLAIM_STEPS_TEMPLATE[1],
        state: 'completed',
        timestamp: '22 ก.ย. 2026 • 09:15 น.',
        location: 'ศูนย์บริการสาขาสยามพารากอน'
      },
      {
        ...CLAIM_STEPS_TEMPLATE[2],
        state: 'in_progress',
        timestamp: '23 ก.ย. 2026 • 14:00 น. (กำลังดำเนินการ)',
        location: 'TATOE Optical Lab สำนักงานใหญ่ พระราม 9'
      },
      {
        ...CLAIM_STEPS_TEMPLATE[3],
        state: 'pending',
        timestamp: 'คาดการณ์ 25 ก.ย. 2026'
      },
      {
        ...CLAIM_STEPS_TEMPLATE[4],
        state: 'pending',
        timestamp: 'รอการส่งมอบ'
      }
    ]
  },
  {
    claimId: 'CLM-202609002',
    customerName: 'คุณมินตรา ชัยเจริญ',
    phoneNumber: '081-987-6543',
    branch: 'สาขาเซ็นทรัลลาดพร้าว (Central Ladprao)',
    productName: 'Big Eye Classic 01 (Vintage Gold)',
    orderId: '#BEY-2025049',
    issueDescription: 'เลนส์มัลติโค้ทข้างขวามีรอยขีดข่วนจากอุบัติเหตุ และต้องการส่งเคลมเปลี่ยนเลนส์ใหม่ตามเงื่อนไขประกัน 1 ปี',
    submittedAt: '18 ก.ย. 2026 • 14:20 น.',
    currentStepId: 'dispatched',
    estimatedCompletion: '24 ก.ย. 2026',
    attachedFiles: [
      {
        id: 'file-3',
        name: 'lens-scratch-detail.png',
        size: '2.4 MB',
        type: 'image/png',
        url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=300&auto=format&fit=crop&q=80'
      }
    ],
    repairComparisons: [
      {
        id: 'cmp-201',
        partName: 'เลนส์มัลติโค้ทตัดแสงสะท้อนข้างขวา (Right Multicoat Lens)',
        beforeUrl: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&auto=format&fit=crop&q=80',
        afterUrl: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=800&auto=format&fit=crop&q=80',
        beforeDescription: 'ผิวหน้าเลนส์มีรอยขูดลึกระดับชั้นโค้ทติ้งแตกลายบริเวณตรงกลางช่องการมอง ส่งผลให้ภาพมัวและแสงฟุ้งกระจาย',
        afterDescription: 'ติดตั้งเปลี่ยนเลนส์ Aspheric 1.67 Blue-Block UV400 แท้ เคลือบผิว Super Hydrophobic ใส คมชัด ปราศจากรอยขีดข่วน 100%',
        technicianNote: 'ช่างวิรัช: ตัดเจียรขอบเลนส์ด้วยเครื่อง CNC เลเซอร์ความแม่นยำสูง ค่าระยะรูม่านตา (PD) 63.0 มม. ตรงตามใบสั่งแพทย์',
        completedAt: '21 ก.ย. 2026 • 16:30 น.',
        inspectorName: 'นักทัศนมาตร อรอุมา (Optometrist)'
      }
    ],
    steps: [
      {
        ...CLAIM_STEPS_TEMPLATE[0],
        state: 'completed',
        timestamp: '18 ก.ย. 2026 • 14:20 น.',
        location: 'ระบบออนไลน์ TATOE Portal'
      },
      {
        ...CLAIM_STEPS_TEMPLATE[1],
        state: 'completed',
        timestamp: '19 ก.ย. 2026 • 10:00 น.',
        location: 'สาขาเซ็นทรัลลาดพร้าว'
      },
      {
        ...CLAIM_STEPS_TEMPLATE[2],
        state: 'completed',
        timestamp: '21 ก.ย. 2026 • 16:30 น.',
        location: 'TATOE Optical Lab สำนักงานใหญ่'
      },
      {
        ...CLAIM_STEPS_TEMPLATE[3],
        state: 'in_progress',
        timestamp: '24 ก.ย. 2026 • 10:45 น. (สินค้าถึงสาขาแล้ว)',
        location: 'สาขาเซ็นทรัลลาดพร้าว ชั้น 2 พร้อมให้ลูกค้ารับสินค้า'
      },
      {
        ...CLAIM_STEPS_TEMPLATE[4],
        state: 'pending',
        timestamp: 'รอลูกค้าเข้ารับสินค้าที่สาขา'
      }
    ]
  },
  {
    claimId: 'CLM-202609003',
    customerName: 'คุณธนกฤต วงศ์สวัสดิ์',
    phoneNumber: '085-456-7890',
    branch: 'สาขาเซ็นทรัลเวิลด์ (CentralWorld)',
    productName: 'Big Eye Bold Square (Black Matte)',
    orderId: '#BEY-2025032',
    issueDescription: 'กรอบแว่นบิดงอจากการนั่งทับ นำส่งให้ช่างผู้เชี่ยวชาญช่วยดัดโครงสร้างให้กลับมาสมดุล',
    submittedAt: '10 ก.ย. 2026 • 11:00 น.',
    currentStepId: 'delivered',
    estimatedCompletion: '15 ก.ย. 2026',
    attachedFiles: [
      {
        id: 'file-4',
        name: 'bent-frame.jpg',
        size: '1.2 MB',
        type: 'image/jpeg'
      }
    ],
    repairComparisons: [
      {
        id: 'cmp-301',
        partName: 'สมดุลระนาบหน้าแว่นตาและมุมเทกรอบ (Face-form Angle Calibration)',
        beforeUrl: 'https://images.unsplash.com/photo-1509695504232-52e1b52dd939?w=800&auto=format&fit=crop&q=80',
        afterUrl: 'https://images.unsplash.com/photo-1577803645773-f96470509666?w=800&auto=format&fit=crop&q=80',
        beforeDescription: 'กรอบแว่นบิดเบี้ยวเอียงขวา 8 องศา วางบนโต๊ะแล้วขาแว่นลอยข้างหนึ่ง สะพานกลางแอ่นเสียศูนย์',
        afterDescription: 'ดัดคืนรูปทรงสมดุล 4 จุดสัมผัส (4-Point Touch Test) ขนานระนาบ 180° มุมเทหน้าแว่น Pantoscopic Tilt 8.5° สวมใส่กระชับไม่เอียง',
        technicianNote: 'ช่างชำนาญการ นพดล: ผ่านตู้อบความร้อนอุณหภูมิควบคุม 65°C เพื่อผ่อนคลายโมเลกุลอะซิเตท พร้อมขัดเงาลบรอยขูดขีดรอบกรอบด้วยครีมไดมอนด์พาสต์',
        completedAt: '12 ก.ย. 2026 • 15:20 น.',
        inspectorName: 'หัวหน้าช่าง ธีรเดช (QC Lead)'
      }
    ],
    steps: [
      {
        ...CLAIM_STEPS_TEMPLATE[0],
        state: 'completed',
        timestamp: '10 ก.ย. 2026 • 11:00 น.',
        location: 'ระบบออนไลน์ TATOE Portal'
      },
      {
        ...CLAIM_STEPS_TEMPLATE[1],
        state: 'completed',
        timestamp: '11 ก.ย. 2026 • 09:30 น.',
        location: 'สาขาเซ็นทรัลเวิลด์'
      },
      {
        ...CLAIM_STEPS_TEMPLATE[2],
        state: 'completed',
        timestamp: '12 ก.ย. 2026 • 15:20 น.',
        location: 'TATOE Optical Lab สำนักงานใหญ่'
      },
      {
        ...CLAIM_STEPS_TEMPLATE[3],
        state: 'completed',
        timestamp: '14 ก.ย. 2026 • 11:15 น.',
        location: 'สาขาเซ็นทรัลเวิลด์ ชั้น 3'
      },
      {
        ...CLAIM_STEPS_TEMPLATE[4],
        state: 'completed',
        timestamp: '15 ก.ย. 2026 • 16:40 น.',
        location: 'ลูกค้ารับสินค้าและเซ็นชื่อเรียบร้อย'
      }
    ]
  },
  {
    claimId: 'CLM-202609004',
    customerName: 'คุณวรัญญา ปรีชาพงษ์',
    phoneNumber: '082-345-6789',
    branch: 'สาขาเอ็มควอเทียร์ (EmQuartier)',
    productName: 'Big Eye Nordic Air (Rimless Titanium)',
    orderId: '#BEY-2025064',
    issueDescription: 'น็อตยึดแป้นจมูกข้างขวาหลุดหาย และต้องการให้ตรวจเช็คความแน่นของเลนส์ทั้งสองข้าง',
    submittedAt: 'เมื่อสักครู่ • วันนี้',
    currentStepId: 'received',
    estimatedCompletion: '28 ก.ย. 2026',
    attachedFiles: [
      {
        id: 'file-5',
        name: 'nosepad-screw-missing.jpg',
        size: '950 KB',
        type: 'image/jpeg'
      }
    ],
    repairComparisons: [
      {
        id: 'cmp-401',
        partName: 'ชุดสลักล็อกเกลียวน็อตแป้นจมูก (Nosepad Bracket Screw Assembly)',
        beforeUrl: 'https://images.unsplash.com/photo-1591076482161-42ce6da69f68?w=800&auto=format&fit=crop&q=80',
        afterUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format&fit=crop&q=80',
        beforeDescription: 'น็อตยึดขนาด 1.0 มม. หลุดหาย แป้นจมูกแกว่งหลุด ก้านยึดสัมผัสผิวสันจมูกโดยตรง',
        afterDescription: 'ติดตั้งชุดน็อตไทเทเนียมพร้อมแหวนรองไนลอนซับแรงสั่นสะเทือน ปรับตำแหน่งก้านรับดั้งจมูกทั้งสองข้างให้สมมาตร',
        technicianNote: 'ช่างประจำสาขา: ประกอบทดสอบแรงยึดและทำความสะอาดกรอบไร้ขอบ (Rimless) เรียบร้อย',
        completedAt: 'วันนี้ • 10:15 น.',
        inspectorName: 'ช่างเทคนิคสาขาเอ็มควอเทียร์'
      }
    ],
    steps: [
      {
        ...CLAIM_STEPS_TEMPLATE[0],
        state: 'completed',
        timestamp: 'วันนี้ • 09:00 น.',
        location: 'ระบบออนไลน์ TATOE Portal'
      },
      {
        ...CLAIM_STEPS_TEMPLATE[1],
        state: 'in_progress',
        timestamp: 'วันนี้ • 10:15 น. (เจ้าหน้าที่กำลังตรวจเช็คสต็อกอะไหล่)',
        location: 'สาขาเอ็มควอเทียร์ ชั้น 3'
      },
      {
        ...CLAIM_STEPS_TEMPLATE[2],
        state: 'pending',
        timestamp: 'รอส่งต่อช่างเทคนิค'
      },
      {
        ...CLAIM_STEPS_TEMPLATE[3],
        state: 'pending',
        timestamp: 'รอการจัดส่ง'
      },
      {
        ...CLAIM_STEPS_TEMPLATE[4],
        state: 'pending',
        timestamp: 'รอการส่งมอบ'
      }
    ]
  }
];

const CLAIMS_STORAGE_KEY = 'tatoe_optical_claims';

export const loadStoredClaims = (): ClaimTicket[] => {
  try {
    const raw = localStorage.getItem(CLAIMS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure repairComparisons from INITIAL_MOCK_CLAIMS are preserved if missing in older cache
        return parsed.map((c: ClaimTicket) => {
          const defaultClaim = INITIAL_MOCK_CLAIMS.find((init) => init.claimId === c.claimId);
          if (defaultClaim && (!c.repairComparisons || c.repairComparisons.length === 0)) {
            return { ...c, repairComparisons: defaultClaim.repairComparisons };
          }
          return c;
        });
      }
    }
  } catch (e) {
    console.error('Failed to load stored claims:', e);
  }
  return INITIAL_MOCK_CLAIMS;
};

export const saveStoredClaims = (claims: ClaimTicket[]) => {
  try {
    localStorage.setItem(CLAIMS_STORAGE_KEY, JSON.stringify(claims));
  } catch (e) {
    console.error('Failed to save claims:', e);
  }
};

export const generateNextClaimId = (existingClaims: ClaimTicket[]): string => {
  const currentYearMonth = '202609';
  const prefix = `CLM-${currentYearMonth}`;
  const numbers = existingClaims
    .map((c) => {
      if (c.claimId.startsWith(prefix)) {
        const numPart = parseInt(c.claimId.replace(prefix, ''), 10);
        return isNaN(numPart) ? 0 : numPart;
      }
      return 0;
    })
    .filter((n) => n > 0);

  const nextNum = (numbers.length > 0 ? Math.max(...numbers) : 4) + 1;
  return `${prefix}${String(nextNum).padStart(3, '0')}`;
};
