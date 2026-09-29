import { Product, UserProfile, CartItem, UserAddress, ChatThread } from '../types';

export const APP_LOGO = '/src/assets/images/tatoe_optical_logo_1790317254986.jpg';

export const USER_AVATAR = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAgfK7Go8t0q72RUgLa-XWGo7RtV9xjm3yg-D8dL6fuTyT4Rd8J-h-kpxXjlBONOGKFQXn9HM0Y9VZlUq61KYc15SQB1Om184Pn7dao0hpFA_xLTGGNCQ_ErMbQa9qo0f_n1nz_ACUdBRYGNfBzNbt-_xP4P24_h1X_laWzkmmYjr7i50uxSZQ9k-2jRPdCeSdmGpkgq9FyP2jVpogjkX3U67v2UXa0_MrYt30iaOGkk3G9kRQwmzfg';

export const MAP_IMAGE = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDMhzPbrVlJxFWN5s4pyJI8zwqS8zBtCAWKJLsHPjumQmQCCIpQKetBYhmMIVt-HjukKIR1GtyzDCQeby-3wctHNUiL2lZ62YDlFJ_u_0bcuPcZx0ogc6sHGKqXA9CJsdQ2q7a12aaQpTBjTzqLEll2ZdqoAByywT8nk4gPNFqHI3J02TQnm7teHBe7gAw1nkO4USQBJ10E8BKWrcw63OJYwrthblfyASitgYmOgz56lUymFGrh6wgV';

export const PRODUCTS: Product[] = [];

export const INITIAL_ADDRESSES: UserAddress[] = [
  {
    id: 'addr-1',
    title: 'หอพักจุฬาฯ (ที่อยู่หลัก)',
    type: 'home',
    recipientName: 'คุณพิชญา วงศ์สว่าง',
    phone: '089-123-4567',
    addressLine: 'หอพักนักศึกษาจุฬาฯ อาคาร A ห้อง 412 ถนนพญาไท',
    subdistrict: 'วังใหม่',
    district: 'ปทุมวัน',
    province: 'กรุงเทพฯ',
    postalCode: '10330',
    isDefault: true
  },
  {
    id: 'addr-2',
    title: 'บริษัท / ออฟฟิศ (จามจุรีสแควร์)',
    type: 'office',
    recipientName: 'คุณพิชญา (แผนก Data Science)',
    phone: '02-123-4567',
    addressLine: 'อาคารจัตุรัสจามจุรี ชั้น 18 ห้อง 1804 ถนนพระราม 4',
    subdistrict: 'ปทุมวัน',
    district: 'ปทุมวัน',
    province: 'กรุงเทพฯ',
    postalCode: '10330',
    isDefault: false
  },
  {
    id: 'addr-3',
    title: 'บ้านคุณพ่อคุณแม่',
    type: 'home',
    recipientName: 'คุณพิชญา วงศ์สว่าง',
    phone: '081-987-6543',
    addressLine: '88/14 หมู่บ้านพฤกษาภิรมย์ ซอย 5 ถนนบรมราชชนนี',
    subdistrict: 'ศาลาธรรมสพน์',
    district: 'ทวีวัฒนา',
    province: 'กรุงเทพฯ',
    postalCode: '10170',
    isDefault: false
  }
];

export const formatAddress = (addr: UserAddress): string => {
  return `${addr.addressLine} แขวง/ตำบล${addr.subdistrict} เขต/อำเภอ${addr.district} จ.${addr.province} ${addr.postalCode}`;
};

export const INITIAL_USER: UserProfile = {
  name: 'คุณพิชญา วงศ์สว่าง',
  role: 'admin', // Default to admin or allow toggle so user can directly use admin powers or switch
  tier: 'Big Eye Gold Member ⭐️',
  memberTier: 'Big Eye Club - Gold Member',
  points: 420,
  email: 'pichaya.w@student.chula.ac.th',
  phone: '089-123-4567',
  avatarUrl: USER_AVATAR,
  currentOrdersCount: 2,
  discountCouponsCount: 1,
  wishlistCount: 4,
  shippingAddress: formatAddress(INITIAL_ADDRESSES[0]),
  addresses: INITIAL_ADDRESSES,
  prescription: {
    od: { sphere: '-1.50', cylinder: '0.00' },
    os: { sphere: '-1.75', cylinder: '0.00' },
    lastChecked: '12 ม.ค. 2025'
  }
};

export const INITIAL_CART_ITEMS: CartItem[] = [];

// Initial Chat Threads (Product inquiries and customer chats)
export const INITIAL_CHAT_THREADS: ChatThread[] = [];

// Convenience Aliases for imports
export const MOCK_PRODUCTS = PRODUCTS;
export const MOCK_USER = INITIAL_USER;
export const INITIAL_CART = INITIAL_CART_ITEMS;

export const INITIAL_DELIVERY_ORDER: import('../types').DeliveryOrder = {
  orderId: '#BEY-2025058',
  trackingNumber: 'TH8492048201',
  courier: 'Flash Express',
  currentStage: 'in_transit',
  statusLabel: 'อยู่ระหว่างการขนส่ง',
  statusDescription: 'พัสดุกำลังเดินทางไปยังศูนย์กระจายสินค้าปลายทาง',
  estimatedDelivery: '17 พ.ค. 2025',
  updatedTime: '16 พ.ค. 2025 • 09:15 น.',
  itemsCount: 2,
  steps: [
    {
      id: 'step-1',
      stage: 'order_placed',
      title: 'สั่งซื้อสำเร็จและชำระเงินแล้ว',
      detail: 'ชำระผ่าน PromptPay QR Code เรียบร้อย ตรวจสอบยอดเงินถูกต้อง',
      time: '14 พ.ค. 2025 • 10:30 น.',
      completed: true
    },
    {
      id: 'step-2',
      stage: 'crafting',
      title: 'ตัดเลนส์และประกอบแว่นโดยช่างชำนาญการ',
      detail: 'ตรวจสอบจุดกึ่งกลางตาดำ (PD) และ QC ค่าสายตาตามใบสั่งแพทย์',
      time: '15 พ.ค. 2025 • 14:00 น.',
      completed: true
    },
    {
      id: 'step-3',
      stage: 'in_transit',
      title: 'อยู่ระหว่างการขนส่ง',
      detail: 'พัสดุออกจากศูนย์กระจายสินค้าหลักวังน้อย จ.พระนครศรีอยุธยา',
      time: '16 พ.ค. 2025 • 09:15 น.',
      completed: true,
      current: true
    },
    {
      id: 'step-4',
      stage: 'at_sorting_hub',
      title: 'พัสดุถึงสาขาปลายทางแล้ว',
      detail: 'พัสดุถึงศูนย์คัดแยกสาขาปลายทาง (DC ลาดพร้าว/จตุจักร) รอคัดแยกเตรียมนำจ่าย',
      time: 'คาดการณ์ 16 พ.ค. 2025 • 18:30 น.',
      completed: false
    },
    {
      id: 'step-5',
      stage: 'out_for_delivery',
      title: 'พนักงานกำลังนำจ่ายพัสดุ',
      detail: 'พนักงานนำจ่าย Flash Express (คุณสมชาย บุญมี 089-456-7890) กำลังนำส่งให้คุณ',
      time: 'คาดการณ์ 17 พ.ค. 2025 • 10:00 น.',
      completed: false
    },
    {
      id: 'step-6',
      stage: 'delivered',
      title: 'จัดส่งสำเร็จเรียบร้อย',
      detail: 'ผู้รับได้รับพัสดุเรียบร้อย เซ็นรับมอบพัสดุ',
      time: 'คาดการณ์ 17 พ.ค. 2025 • 13:45 น.',
      completed: false
    }
  ]
};

export const DELIVERY_STAGE_CONFIG: Record<
  import('../types').DeliveryStage,
  {
    label: string;
    description: string;
    icon: string;
    badgeColor: string;
    pushTitle: string;
    pushBody: string;
  }
> = {
  order_placed: {
    label: 'สั่งซื้อสำเร็จ',
    description: 'ทางร้านได้รับคำสั่งซื้อและยอดชำระเงินเรียบร้อยแล้ว',
    icon: 'receipt_long',
    badgeColor: 'bg-blue-100 text-blue-800',
    pushTitle: '💳 ยืนยันคำสั่งซื้อสำเร็จ',
    pushBody: 'คำสั่งซื้อ #BEY-2025058 ได้รับการยืนยันแล้ว ทางร้านกำลังส่งใบสั่งเลนส์ไปยังห้องปฏิบัติการ'
  },
  crafting: {
    label: 'กำลังประกอบแว่น',
    description: 'ช่างผู้ชำนาญการกำลังตัดประกอบเลนส์และตรวจสอบมาตรฐาน QC',
    icon: 'construction',
    badgeColor: 'bg-amber-100 text-amber-800',
    pushTitle: '🔬 แว่นตาของคุณกำลังประกอบ',
    pushBody: 'ช่างเทคนิคกำลังเจียรประกอบเลนส์มัลติโค้ตและวัดจุดกึ่งกลางตาดำ (PD) อย่างแม่นยำ'
  },
  in_transit: {
    label: 'อยู่ระหว่างการขนส่ง',
    description: 'พัสดุออกจากศูนย์กระจายสินค้าวังน้อย จ.พระนครศรีอยุธยา',
    icon: 'local_shipping',
    badgeColor: 'bg-primary-fixed text-on-primary-fixed',
    pushTitle: '🚚 พัสดุเริ่มออกเดินทางแล้ว!',
    pushBody: 'Flash Express รับพัสดุ #BEY-2025058 ออกจากคลังสินค้าหลักแล้ว กำลังมุ่งหน้าสู่กรุงเทพฯ'
  },
  at_sorting_hub: {
    label: 'พัสดุถึงสาขาปลายทางแล้ว',
    description: 'พัสดุถึงศูนย์คัดแยกสาขาปลายทาง (DC ลาดพร้าว) รอจัดเตรียมนำจ่าย',
    icon: 'warehouse',
    badgeColor: 'bg-emerald-100 text-emerald-800',
    pushTitle: '📍 พัสดุถึงสาขาปลายทางแล้ว!',
    pushBody: 'คำสั่งซื้อ #BEY-2025058 เดินทางถึงศูนย์กระจายสินค้าปลายทาง (DC ลาดพร้าว) เรียบร้อยแล้ว พร้อมนำจ่ายในรอบถัดไป'
  },
  out_for_delivery: {
    label: 'กำลังนำจ่ายพัสดุ',
    description: 'พนักงานส่งพัสดุกำลังเดินทางนำส่งพัสดุไปยังที่อยู่ของคุณ',
    icon: 'delivery_dining',
    badgeColor: 'bg-orange-100 text-orange-900',
    pushTitle: '🛵 พนักงานกำลังนำจ่ายพัสดุให้คุณ!',
    pushBody: 'คุณสมชาย บุญมี (Flash Express 089-456-7890) กำลังนำส่งพัสดุ #BEY-2025058 โปรดเตรียมรับสาย'
  },
  delivered: {
    label: 'จัดส่งสำเร็จเรียบร้อย',
    description: 'ผู้รับได้รับพัสดุเรียบร้อย ขอบคุณที่ไว้วางใจร้านTATOE Optical',
    icon: 'check_circle',
    badgeColor: 'bg-emerald-500 text-white',
    pushTitle: '🎉 จัดส่งพัสดุสำเร็จเรียบร้อยแล้ว!',
    pushBody: 'คำสั่งซื้อ #BEY-2025058 ส่งถึงมือคุณเรียบร้อยแล้ว ขอให้มีความสุขกับการสวมใส่แว่นตานะคะ ✨'
  }
};

export const INITIAL_NOTIFICATIONS: import('../types').AppNotification[] = [
  {
    id: 'notif-1',
    title: '🚚 พัสดุกำลังจัดส่ง!',
    body: 'คำสั่งซื้อ #BEY-2025058 พัสดุออกจากศูนย์กระจายสินค้าวังน้อยแล้ว',
    timestamp: '16 พ.ค. 2025 • 09:15 น.',
    type: 'delivery',
    orderId: '#BEY-2025058',
    stage: 'in_transit',
    read: false
  },
  {
    id: 'notif-2',
    title: '🔬 ประกอบแว่นตาเสร็จสิ้น',
    body: 'คำสั่งซื้อกำลังเตรียมและผ่านการตรวจสอบคุณภาพพร้อมส่งมอบ',
    timestamp: '15 พ.ค. 2025 • 14:00 น.',
    type: 'delivery',
    orderId: '#BEY-2025058',
    stage: 'crafting',
    read: true
  }
];

export const INITIAL_REVIEWS: import('../types').ProductReview[] = [];
