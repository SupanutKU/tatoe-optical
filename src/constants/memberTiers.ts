export interface TierPerk {
  id: string;
  icon: string;
  title: string;
  description: string;
  highlight?: boolean;
}

export interface MemberTierInfo {
  id: 'silver' | 'gold' | 'platinum' | 'diamond';
  name: string;
  nameEn: string;
  tagline: string;
  minPoints: number;
  maxPoints?: number;
  minSpendText: string;
  badgeBg: string;
  badgeText: string;
  cardGradient: string;
  icon: string;
  shippingBenefit: string;
  discountBenefit: string;
  perks: TierPerk[];
}

export const MEMBER_TIERS: MemberTierInfo[] = [
  {
    id: 'silver',
    name: 'Silver Member',
    nameEn: 'Silver Tier',
    tagline: 'จุดเริ่มต้นการดูแลสายตาระดับพรีเมียม',
    minPoints: 0,
    maxPoints: 249,
    minSpendText: 'สมัครสมาชิกฟรี (0 - 249 คะแนน)',
    badgeBg: 'bg-slate-100 border-slate-300',
    badgeText: 'text-slate-700',
    cardGradient: 'from-slate-600 via-slate-700 to-zinc-800',
    icon: 'shield',
    shippingBenefit: 'ฟรีค่าส่งเมื่อช้อปครบ ฿800',
    discountBenefit: 'คูปองต้อนรับ ฿50 สำหรับออเดอร์แรก',
    perks: [
      {
        id: 'silver-welcome',
        icon: 'confirmation_number',
        title: 'คูปองต้อนรับ ฿50',
        description: 'รับโค้ดส่วนลด EYELOVE50 ทันทีเมื่อสมัครสมาชิก สำหรับใช้ช้อปสินค้าทุกหมวดหมู่'
      },
      {
        id: 'silver-shipping',
        icon: 'local_shipping',
        title: 'จัดส่งฟรีเมื่อช้อปครบ ฿800',
        description: 'จัดส่งมาตรฐานฟรีทั่วประเทศสำหรับยอดคำสั่งซื้อตั้งแต่ ฿800 ขึ้นไป'
      },
      {
        id: 'silver-points',
        icon: 'toll',
        title: 'สะสมคะแนนทุกคำสั่งซื้อ',
        description: 'รับ 1 คะแนน ทุกๆ การช้อป 20 บาท นำคะแนนมาแลกส่วนลดได้ตลอดปี'
      },
      {
        id: 'silver-clean',
        icon: 'cleaning_services',
        title: 'บริการทำความสะอาดอัลตราโซนิกฟรี',
        description: 'ล้างทำความสะอาดแว่นและปรับดัดทรงแว่นฟรีตลอดชีพที่หน้าร้าน TATOE ทุกสาขา'
      },
      {
        id: 'silver-warranty',
        icon: 'verified_user',
        title: 'รับประกันสินค้า 6 เดือน',
        description: 'รับประกันคุณภาพกรอบแว่นตาและข้อต่อมาตรฐาน 6 เดือนเต็ม'
      }
    ]
  },
  {
    id: 'gold',
    name: 'Gold Member',
    nameEn: 'Gold Tier',
    tagline: 'ระดับสมาชิกยอดนิยม เพลิดเพลินกับส่งฟรีและส่วนลดพิเศษ',
    minPoints: 250,
    maxPoints: 999,
    minSpendText: 'สะสม 250 - 999 คะแนน (ยอดซื้อ ฿2,500+)',
    badgeBg: 'bg-amber-100 border-amber-300',
    badgeText: 'text-amber-900',
    cardGradient: 'from-amber-600 via-amber-700 to-yellow-800',
    icon: 'workspace_premium',
    shippingBenefit: 'ฟรีค่าจัดส่งทุกออเดอร์ ไม่มีขั้นต่ำ',
    discountBenefit: 'ส่วนลดพิเศษสมาชิก 5% ทุกคำสั่งซื้อ',
    perks: [
      {
        id: 'gold-shipping',
        icon: 'local_shipping',
        title: 'จัดส่งฟรีทุกออเดอร์ ไม่มีขั้นต่ำ',
        description: 'รับสิทธิ์ฟรีค่าจัดส่งด่วนมาตรฐานทั่วประเทศในทุกคำสั่งซื้อ ไม่มียอดขั้นต่ำ',
        highlight: true
      },
      {
        id: 'gold-discount',
        icon: 'sell',
        title: 'ส่วนลดพิเศษสมาชิก 5% ทุกชิ้น',
        description: 'รับส่วนลดพิเศษ On-Top 5% สำหรับกรอบแว่นตาและเลนส์ทุกรุ่น',
        highlight: true
      },
      {
        id: 'gold-bday',
        icon: 'cake',
        title: 'ของขวัญเดือนเกิด (Birthday Privilege)',
        description: 'รับคูปองส่วนลดพิเศษ 15% (สูงสุด ฿300) มอบให้ในเดือนเกิดของคุณ'
      },
      {
        id: 'gold-exam',
        icon: 'visibility',
        title: 'ตรวจวัดสายตา 16 ขั้นตอนฟรี',
        description: 'ตรวจวัดสายตาอย่างละเอียดด้วยระบบดิจิทัล 16 ขั้นตอน โดยทีมนักทัศนมาตรมืออาชีพ'
      },
      {
        id: 'gold-warranty',
        icon: 'verified_user',
        title: 'ขยายการรับประกัน 1 ปีเต็ม',
        description: 'คุ้มครองกรอบแว่นและสารเคลือบเลนส์นาน 1 ปีเต็ม พร้อมบริการอะไหล่แท้'
      },
      {
        id: 'gold-points',
        icon: 'stars',
        title: 'คะแนนโบนัส x1.2 เท่า',
        description: 'รับคะแนนสะสมคูณ 1.2 เท่าในเทศกาลพิเศษและแคมเปญ Brand Day'
      }
    ]
  },
  {
    id: 'platinum',
    name: 'Platinum Member',
    nameEn: 'Platinum Tier',
    tagline: 'เอกสิทธิ์ขั้นกว่าเพื่อประสบการณ์ดูแลสายตาไร้ขีดจำกัด',
    minPoints: 1000,
    maxPoints: 2499,
    minSpendText: 'สะสม 1,000 - 2,499 คะแนน (ยอดซื้อ ฿10,000+)',
    badgeBg: 'bg-indigo-100 border-indigo-300',
    badgeText: 'text-indigo-900',
    cardGradient: 'from-blue-700 via-indigo-800 to-slate-900',
    icon: 'military_tech',
    shippingBenefit: 'ส่งด่วนพิเศษ Same-Day / Next-Day ฟรี',
    discountBenefit: 'ส่วนลดพิเศษสมาชิก 10% ทุกคำสั่งซื้อ',
    perks: [
      {
        id: 'plat-shipping',
        icon: 'rocket_launch',
        title: 'จัดส่งด่วนพิเศษ Same-Day / Next-Day ฟรี',
        description: 'ส่งด่วนถึงมือทันใจภายในวันหรือวันถัดไป ฟรีไม่มีค่าบริการเพิ่มเติม',
        highlight: true
      },
      {
        id: 'plat-discount',
        icon: 'percent',
        title: 'ส่วนลดพิเศษ 10% ทุกคำสั่งซื้อ',
        description: 'รับส่วนลดพิเศษ 10% สำหรับแว่นตาทุกคอลเลกชันและเลนส์สั่งตัด',
        highlight: true
      },
      {
        id: 'plat-upgrade',
        icon: 'auto_awesome',
        title: 'อัปเกรดเลนส์กรองแสงสีฟ้าฟรี 1 ครั้ง/ปี',
        description: 'รับสิทธิ์อัปเกรดเป็นเลนส์บลูบล็อก Nano Shield ตัดแสงจอคอมพิวเตอร์ฟรีปีละ 1 ครั้ง'
      },
      {
        id: 'plat-rx-change',
        icon: 'published_with_changes',
        title: 'รับประกันเปลี่ยนเลนส์ฟรีหากสายตาเปลี่ยน',
        description: 'กรณีค่าสายตาเปลี่ยนภายใน 6 เดือนหลังจากตัดแว่น เปลี่ยนเลนส์ใหม่ฟรี 1 ครั้ง'
      },
      {
        id: 'plat-early',
        icon: 'lock_open_right',
        title: 'สิทธิ์ Early Access คอลเลกชันใหม่',
        description: 'ช้อปสินค้ารุ่นลิมิเต็ดและคอลเลกชันล่าสุดก่อนใคร 24 ชั่วโมง'
      },
      {
        id: 'plat-bday',
        icon: 'redeem',
        title: 'ของขวัญวันเกิดแว่นตากันแดดหรือกล่องหนังแท้',
        description: 'เลือกรับฟรีแว่นตากันแดด TATOE Signature หรือกระเป๋าหนังพรีเมียมในเดือนเกิด'
      }
    ]
  },
  {
    id: 'diamond',
    name: 'Diamond VIP',
    nameEn: 'Diamond VIP Tier',
    tagline: 'ที่สุดแห่งเอกสิทธิ์ระดับสูงสุด บริการส่วนบุคคลระดับอัลตราพรีเมียม',
    minPoints: 2500,
    minSpendText: 'สะสม 2,500 คะแนนขึ้นไป (ยอดซื้อ ฿25,000+)',
    badgeBg: 'bg-purple-100 border-purple-300',
    badgeText: 'text-purple-900',
    cardGradient: 'from-purple-800 via-fuchsia-900 to-slate-950',
    icon: 'diamond',
    shippingBenefit: 'ส่งด่วนพรีเมียม + บริการ Home Fitting ถึงบ้าน',
    discountBenefit: 'ส่วนลดพิเศษ VIP 15% ทุกชิ้นตลอดปี',
    perks: [
      {
        id: 'dia-home',
        icon: 'home_pin',
        title: 'บริการ Home Fitting ลองแว่นตาถึงบ้านฟรี',
        description: 'เลือกแว่นตาที่ชอบ 4 อันเพื่อส่งไปให้คุณลองสวมใส่ที่บ้านฟรี พร้อมรับคำแนะนำ',
        highlight: true
      },
      {
        id: 'dia-discount',
        icon: 'loyalty',
        title: 'ส่วนลดพิเศษ VIP 15% ทุกคำสั่งซื้อ',
        description: 'รับส่วนลดสูงสุด 15% สำหรับสินค้าทุกหมวดหมู่ กรอบแว่น เลนส์โปรเกรสซีฟ และอุปกรณ์',
        highlight: true
      },
      {
        id: 'dia-stylist',
        icon: 'person_celebrate',
        title: 'Personal Optical Stylist ผู้เชี่ยวชาญส่วนตัว',
        description: 'บริการผู้เชี่ยวชาญด้านสายตาและสไตล์แว่นตาดูแลเฉพาะคุณ พร้อม Fast-Track ไม่ต้องรอคิว'
      },
      {
        id: 'dia-acc-insurance',
        icon: 'health_and_safety',
        title: 'ประกันอุบัติเหตุแว่นตาตกแตก 50%',
        description: 'หากแว่นตาตกแตกหรือชำรุดจากอุบัติเหตุ รับสิทธิซื้อชิ้นใหม่ลดทันที 50% ภายใน 1 ปี'
      },
      {
        id: 'dia-gift',
        icon: 'card_giftcard',
        title: 'กล่องของขวัญ TATOE Exclusive ประจำปี',
        description: 'รับชุดของขวัญสุดหรูประจำปี เซตผ้าไมโครไฟเบอร์ลิมิเต็ด น้ำยาทำความสะอาดพรีเมียม'
      }
    ]
  }
];

export const PERKS_COMPARISON_MATRIX = [
  {
    feature: 'ฟรีค่าจัดส่ง (Free Shipping)',
    silver: 'ยอดครบ ฿800',
    gold: 'ฟรีทุกออเดอร์ ไม่มีขั้นต่ำ 🚚',
    platinum: 'ฟรี ส่งด่วน Same-Day 🚀',
    diamond: 'ฟรี พรีเมียม + Home Fitting 👑'
  },
  {
    feature: 'ส่วนลดพิเศษสมาชิก (Exclusive Discount)',
    silver: 'คูปอง ฿50',
    gold: 'ลด 5% ทุกคำสั่งซื้อ 🏷️',
    platinum: 'ลด 10% ทุกคำสั่งซื้อ 🏷️',
    diamond: 'ลด 15% ทุกคำสั่งซื้อ 🏷️'
  },
  {
    feature: 'อัตราการสะสมคะแนน',
    silver: '1 คะแนน / 20 บาท',
    gold: '1.2 เท่า ในวันพิเศษ ⭐',
    platinum: '1.5 เท่า ในวันพิเศษ ⭐',
    diamond: '2 เท่า ทุกเทศกาล ⭐'
  },
  {
    feature: 'ตรวจวัดสายตา 16 ขั้นตอน',
    silver: 'ปีละ 1 ครั้ง',
    gold: 'ฟรี ไม่จำกัดครั้ง 👁️',
    platinum: 'ฟรี ไม่จำกัดครั้ง 👁️',
    diamond: 'ฟรี ส่วนบุคคล + VIP Room 👁️'
  },
  {
    feature: 'ของขวัญเดือนเกิด (Birthday Gift)',
    silver: 'คูปอง ฿100',
    gold: 'ส่วนลด 15% (฿300) 🎂',
    platinum: 'ฟรีแว่นกันแดด/เคสหนัง 🎁',
    diamond: 'กล่องของขวัญ VIP พรีเมียม 🎁'
  },
  {
    feature: 'ระยะเวลารับประกันสินค้า',
    silver: '6 เดือน',
    gold: '1 ปีเต็ม 🛡️',
    platinum: '1 ปี + เปลี่ยนเลนส์ฟรี 1 ครั้ง 🔄',
    diamond: '1 ปี + ประกันตกแตก 50% 🛡️'
  },
  {
    feature: 'สิทธิ์สั่งซื้อก่อนใคร (Early Access)',
    silver: '-',
    gold: 'ล่วงหน้า 2 ชม.',
    platinum: 'ล่วงหน้า 24 ชม. 🌟',
    diamond: 'จองส่วนตัวก่อนเปิดตัว 👑'
  }
];
