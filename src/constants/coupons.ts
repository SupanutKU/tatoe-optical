export interface Coupon {
  code: string;
  title: string;
  discountAmount: number;
  discount: string;
  description: string;
  minSpendText: string;
  expires: string;
  tag: string;
  color: string;
}

export const COUPONS: Coupon[] = [
  {
    code: 'STUDENT100',
    title: 'ส่วนลดพิเศษสำหรับนักเรียน/นักศึกษา',
    discountAmount: 100,
    discount: 'ลด ฿100',
    description: 'ใช้ได้กับสินค้าทุกรายการในร้าน ยอดสั่งซื้อต้องสูงกว่า ฿100 (เช่น สินค้าราคา ฿10 จะไม่สามารถใช้โค้ด ฿100 ได้)',
    minSpendText: 'ยอดสินค้าต้องมากกว่า ฿100',
    expires: 'หมดอายุ 31 ก.ค. 2025',
    tag: 'คูปองแนะนำ',
    color: 'from-amber-500 to-orange-600'
  },
  {
    code: 'EYELOVE50',
    title: 'ส่วนลดสมาชิก Big Eye Club',
    discountAmount: 50,
    discount: 'ลด ฿50',
    description: 'รับส่วนลดทันทีสำหรับการสั่งซื้อทุกประเภท ยอดสั่งซื้อต้องสูงกว่า ฿50',
    minSpendText: 'ยอดสินค้าต้องมากกว่า ฿50',
    expires: 'หมดอายุ 30 มิ.ย. 2025',
    tag: 'ใช้ได้เลย',
    color: 'from-emerald-500 to-teal-600'
  },
  {
    code: 'BIGEYEFREE',
    title: 'ฟรีค่าจัดส่งด่วนพิเศษ EMS ทั่วประเทศ',
    discountAmount: 60,
    discount: 'ฟรีค่าส่ง ฿60',
    description: 'จัดส่งด่วนพร้อมกล่องพัสดุกันกระแทกและประกันสินค้าเสียหาย 100% ยอดสั่งซื้อต้องสูงกว่า ฿60',
    minSpendText: 'ยอดสินค้าต้องมากกว่า ฿60',
    expires: 'หมดอายุ 31 ธ.ค. 2025',
    tag: 'จัดส่งฟรี',
    color: 'from-blue-500 to-indigo-600'
  },
  {
    code: 'BIGEYE',
    title: 'ส่วนลดพิเศษ BIGEYE',
    discountAmount: 100,
    discount: 'ลด ฿100',
    description: 'ส่วนลดพิเศษต้อนรับลูกค้า ยอดสั่งซื้อต้องสูงกว่า ฿100',
    minSpendText: 'ยอดสินค้าต้องมากกว่า ฿100',
    expires: 'หมดอายุ 31 ธ.ค. 2025',
    tag: 'โค้ดพิเศษ',
    color: 'from-purple-500 to-pink-600'
  }
];

export interface CouponValidationResult {
  valid: boolean;
  coupon?: Coupon;
  error?: string;
}

/**
 * ตรวจสอบความถูกต้องของโค้ดส่วนลดตามเงื่อนไข:
 * "โค้ดส่วนลด จะลดเฉพาะราคาที่สูงกว่าโค้ดส่วนลด เช่นสินค้าราคา10บาท โค้ดส่วนลด 100 จะไม่สามารถใช้ได้"
 */
export function validateCoupon(code: string, subtotal: number): CouponValidationResult {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) {
    return { valid: false, error: 'กรุณากรอกโค้ดส่วนลด' };
  }

  const coupon = COUPONS.find((c) => c.code.toUpperCase() === cleanCode);
  if (!coupon) {
    return {
      valid: false,
      error: 'โค้ดส่วนลดไม่ถูกต้อง ลองใช้ "STUDENT100", "EYELOVE50", หรือ "BIGEYEFREE"'
    };
  }

  // เงื่อนไขหลัก: ยอดสั่งซื้อต้องมากกว่ามูลค่าโค้ดส่วนลดเท่านั้น (subtotal > discountAmount)
  if (subtotal <= coupon.discountAmount) {
    return {
      valid: false,
      coupon,
      error: `ไม่สามารถใช้โค้ด ${coupon.code} ได้: ราคาสินค้าต้องสูงกว่ามูลค่าโค้ดส่วนลด (ยอดสินค้า ฿${subtotal.toLocaleString()} ไม่สามารถใช้โค้ดส่วนลด ฿${coupon.discountAmount} ได้)`
    };
  }

  return {
    valid: true,
    coupon
  };
}

/**
 * ฟังก์ชันคำนวณส่วนลดจริงตามกฎความถูกต้อง:
 * จะคืนค่า 0 หากยอดสั่งซื้อไม่สูงกว่ามูลค่าโค้ดส่วนลด
 */
export function calculateEffectiveDiscount(discountAmount: number, subtotal: number): number {
  if (subtotal <= discountAmount) {
    return 0;
  }
  return discountAmount;
}
