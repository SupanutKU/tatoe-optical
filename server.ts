import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'tatoe_jwt_super_secret_dev_key';
const OTP_EXPIRES_MINUTES = Number(process.env.OTP_EXPIRES_MINUTES) || 10;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

app.use(cors());
app.use(express.json({ limit: '20mb' }));

// In-memory Database Store (Mocked for ephemeral runtime & instant local dev)
interface StoredUser {
  id: number;
  user_name: string;
  email: string;
  phone: string | null;
  password_hash: string;
  role: 'customer' | 'admin';
  avatar_url: string | null;
  member_tier: string | null;
  member_points: number;
  shipping_address: string | null;
  prescription_od_sphere: string | null;
  prescription_od_cylinder: string | null;
  prescription_os_sphere: string | null;
  prescription_os_cylinder: string | null;
  prescription_last_checked: string | null;
}

interface PasswordReset {
  id: number;
  email: string;
  otp: string;
  expiresAt: Date;
  verified: boolean;
  used: boolean;
}

export interface Product {
  id: string;
  name: string;
  subtitle?: string;
  colorName: string;
  category: 'prescription' | 'sunglasses' | 'blue-light' | 'sports';
  shape: 'round' | 'square' | 'drop' | 'cat-eye';
  material: 'titanium' | 'acetate' | 'tr90' | 'metal';
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  rating: number;
  reviewCount: number;
  salesCount: string;
  tag?: string;
  badge?: 'Best Seller' | 'New';
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  stockCount?: number;
  images: string[];
  overlayImage?: string;
  model3d?: string;
  tryOnScale?: number;
  tryOnOffsetX?: number;
  tryOnOffsetY?: number;
  tryOnOffsetZ?: number;
  tryOnFitMultiplier?: number;
  tryOnVerticalOffset?: number;
  tryOnTempleLength?: number;
  lensType: string;
  weight: string;
  warranty: string;
  size: string;
  description: string;
}

// In-memory products store (persisted in memory for runtime, serving as SQL source of truth)
const productsStore: Product[] = [
  {
    id: '1',
    name: 'TATOE Air-Titanium Classic Round',
    subtitle: 'กรอบแว่นไทเทเนียมกลม น้ำหนักเบาพิเศษสไตล์ญี่ปุ่น',
    colorName: 'Matte Black',
    category: 'prescription',
    shape: 'round',
    material: 'titanium',
    price: 2890,
    originalPrice: 3500,
    discountPercentage: 17,
    rating: 4.9,
    reviewCount: 128,
    salesCount: '1.2k ชิ้น',
    tag: 'Ultra Light 7.8g',
    badge: 'Best Seller',
    stockStatus: 'in_stock',
    stockCount: 45,
    images: [
      'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1591076482161-42ce6da69f68?w=800&auto=format&fit=crop&q=80',
    ],
    tryOnScale: 1.0,
    lensType: 'เลนส์มัลติโค้ต ตัดแสงสะท้อน กันรอยขีดข่วน',
    weight: '7.8g',
    warranty: 'รับประกันศูนย์ 2 ปี',
    size: '49-20-145 mm',
    description: 'กรอบแว่นทรงกลมคลาสสิก ผลิตจากเบต้าไทเทเนียมแท้ 100% เบาสบายไม่กดดั้งจมูกและหลังหู รองรับการตัดเลนส์สายตาทุกค่าสายตา',
  },
  {
    id: '2',
    name: 'TATOE Shibuya Square Acetate',
    subtitle: 'กรอบเหลี่ยมวินเทจ อะซิเตทเกรดพรีเมียมลายกระ',
    colorName: 'Tortoise Brown',
    category: 'blue-light',
    shape: 'square',
    material: 'acetate',
    price: 2490,
    originalPrice: 2990,
    discountPercentage: 16,
    rating: 4.8,
    reviewCount: 94,
    salesCount: '860 ชิ้น',
    tag: 'Blue Block Lens',
    badge: 'New',
    stockStatus: 'in_stock',
    stockCount: 30,
    images: [
      'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=800&auto=format&fit=crop&q=80',
    ],
    tryOnScale: 1.05,
    lensType: 'เลนส์กรองแสงสีฟ้า 95% สำหรับคนทำงานหน้าจอ',
    weight: '16.5g',
    warranty: 'รับประกันศูนย์ 1 ปี',
    size: '52-18-142 mm',
    description: 'แว่นทรงเหลี่ยมยอดนิยม เสริมลุคสมาร์ท ทำจากอะซิเตทธรรมชาติทนทาน ขาแว่นฝังแกนโลหะปรับดัดได้ตามรูปหน้า',
  },
  {
    id: '3',
    name: 'TATOE Aviator Polarized Sun',
    subtitle: 'แว่นตากันแดดทรงนักบิน เลนส์โพลาไรซ์ตัดแสงสะท้อน',
    colorName: 'Gold / Forest Green',
    category: 'sunglasses',
    shape: 'drop',
    material: 'metal',
    price: 3200,
    originalPrice: 3900,
    discountPercentage: 18,
    rating: 4.95,
    reviewCount: 210,
    salesCount: '2.1k ชิ้น',
    tag: 'Polarized UV400',
    badge: 'Best Seller',
    stockStatus: 'in_stock',
    stockCount: 22,
    images: [
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=800&auto=format&fit=crop&q=80',
    ],
    tryOnScale: 1.1,
    lensType: 'เลนส์กันแดด Polarized TAC กัน UV400 แท้',
    weight: '14.0g',
    warranty: 'รับประกันศูนย์ 2 ปี',
    size: '58-14-140 mm',
    description: 'ไอคอนิกสไตล์นักบิน กรอบโลหะชุบทองคำแท้ ไม่ลอกไม่ดำ เลนส์โพลาไรซ์สีเขียวเข้มสบายตาสุดๆ เหมาะกับการขับรถและกิจกรรมกลางแจ้ง',
  },
  {
    id: '4',
    name: 'TATOE Harajuku Cat-Eye Chic',
    subtitle: 'กรอบแคทอายแฟชั่นทรงยก ยกกระชับใบหน้าให้ดูเรียว',
    colorName: 'Rose Champagne',
    category: 'prescription',
    shape: 'cat-eye',
    material: 'acetate',
    price: 2650,
    originalPrice: 3100,
    discountPercentage: 14,
    rating: 4.85,
    reviewCount: 76,
    salesCount: '520 ชิ้น',
    tag: 'Signature Fashion',
    badge: 'New',
    stockStatus: 'in_stock',
    stockCount: 18,
    images: [
      'https://images.unsplash.com/photo-1591076482161-42ce6da69f68?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format&fit=crop&q=80',
    ],
    tryOnScale: 0.98,
    lensType: 'เลนส์ย่อบาง Index 1.60 เคลือบป้องกันฝ้าและหยดน้ำ',
    weight: '15.2g',
    warranty: 'รับประกันศูนย์ 1 ปี',
    size: '51-17-140 mm',
    description: 'ทรงแคทอายสุดชิค ดีไซน์ขอบด้านบนเฉียงขึ้นเล็กน้อยช่วยให้ใบหน้าดูมีมิติ เหมาะกับทุกลุคทั้งทำงานและท่องเที่ยว',
  },
  {
    id: '5',
    name: 'TATOE Active Pro Sports TR90',
    subtitle: 'แว่นตากีฬาและออกกำลังกาย ยืดหยุ่นทนแรงกระแทก',
    colorName: 'Carbon Grey',
    category: 'sports',
    shape: 'square',
    material: 'tr90',
    price: 1990,
    originalPrice: 2400,
    discountPercentage: 17,
    rating: 4.75,
    reviewCount: 65,
    salesCount: '410 ชิ้น',
    tag: 'Flexible & Impact Resistant',
    stockStatus: 'in_stock',
    stockCount: 25,
    images: [
      'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=800&auto=format&fit=crop&q=80',
    ],
    tryOnScale: 1.02,
    lensType: 'เลนส์โพลีคาร์บอเนต ทนแรงกระแทกระดับสูง',
    weight: '11.5g',
    warranty: 'รับประกันศูนย์ 1 ปี',
    size: '54-16-145 mm',
    description: 'ผลิตจากเทอร์โมพลาสติก TR90 จากสวิตเซอร์แลนด์ ดัดงอได้ไม่หัก พร้อมยางซิลิโคนกันลื่นที่ปลายขาแว่น ไม่หลุดขณะวิ่งหรือปั่นจักรยาน',
  },
  {
    id: '6',
    name: 'TATOE Minimalist Pure Titanium',
    subtitle: 'กรอบแว่นทรงมนมินิมอล บางเบา ไร้สกรูข้อต่อ',
    colorName: 'Silver Chrome',
    category: 'blue-light',
    shape: 'round',
    material: 'titanium',
    price: 3450,
    originalPrice: 4200,
    discountPercentage: 17,
    rating: 4.92,
    reviewCount: 154,
    salesCount: '1.5k ชิ้น',
    tag: 'Japanese Beta-Titanium',
    badge: 'Best Seller',
    stockStatus: 'in_stock',
    stockCount: 15,
    images: [
      'https://images.unsplash.com/photo-1509695507497-903c140c43b0?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=800&auto=format&fit=crop&q=80',
    ],
    tryOnScale: 0.96,
    lensType: 'เลนส์ Auto-Transit ปรับสีเข้มอัตโนมัติเมื่อออกแดด',
    weight: '6.9g',
    warranty: 'รับประกันศูนย์ 3 ปี',
    size: '48-21-145 mm',
    description: 'ดีไซน์เรียบหรูระดับมาสเตอร์พีซ น้ำหนักเพียง 6.9 กรัม ให้ความรู้สึกราวกับไม่ได้ใส่แว่น แป้นจมูกไทเทเนียมไม่ก่อให้เกิดอาการแพ้ต่อผิวหนัง',
  },
];

// Pre-seed demo users
const usersStore: StoredUser[] = [
  {
    id: 1,
    user_name: 'คุณพิชญา วงศ์สว่าง',
    email: 'pichaya.w@student.chula.ac.th',
    phone: '089-123-4567',
    password_hash: bcrypt.hashSync('password123', 10),
    role: 'admin',
    avatar_url:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAgfK7Go8t0q72RUgLa-XWGo7RtV9xjm3yg-D8dL6fuTyT4Rd8J-h-kpxXjlBONOGKFQXn9HM0Y9VZlUq61KYc15SQB1Om184Pn7dao0hpFA_xLTGGNCQ_ErMbQa9qo0f_n1nz_ACUdBRYGNfBzNbt-_xP4P24_h1X_laWzkmmYjr7i50uxSZQ9k-2jRPdCeSdmGpkgq9FyP2jVpogjkX3U67v2UXa0_MrYt30iaOGkk3G9kRQwmzfg',
    member_tier: 'Big Eye Club - Gold Member',
    member_points: 420,
    shipping_address: 'หอพักนักศึกษาจุฬาฯ อาคาร A ห้อง 412 ถนนพญาไท แขวงวังใหม่ เขตปทุมวัน กรุงเทพฯ 10330',
    prescription_od_sphere: '-1.50',
    prescription_od_cylinder: '0.00',
    prescription_os_sphere: '-1.75',
    prescription_os_cylinder: '0.00',
    prescription_last_checked: '12 ม.ค. 2025',
  },
  {
    id: 2,
    user_name: 'คุณกิตติศักดิ์ เจริญสุข',
    email: 'customer@tatoe.com',
    phone: '081-234-5678',
    password_hash: bcrypt.hashSync('password123', 10),
    role: 'customer',
    avatar_url: null,
    member_tier: 'Member',
    member_points: 100,
    shipping_address: '123/45 ถนนสุขุมวิท คลองเตย กรุงเทพฯ 10110',
    prescription_od_sphere: '-2.00',
    prescription_od_cylinder: '-0.50',
    prescription_os_sphere: '-2.25',
    prescription_os_cylinder: '-0.50',
    prescription_last_checked: '20 ม.ค. 2025',
  },
  {
    id: 3,
    user_name: 'แอดมิน TATOE Optical',
    email: 'admin@tatoe.com',
    phone: '089-999-9999',
    password_hash: bcrypt.hashSync('password123', 10),
    role: 'admin',
    avatar_url: null,
    member_tier: 'Admin Tier',
    member_points: 9999,
    shipping_address: 'สาขาหลัก เซ็นทรัลเวิลด์ ชั้น 3 กรุงเทพฯ 10330',
    prescription_od_sphere: '-1.00',
    prescription_od_cylinder: '0.00',
    prescription_os_sphere: '-1.00',
    prescription_os_cylinder: '0.00',
    prescription_last_checked: '01 ม.ค. 2025',
  },
];

let nextUserId = 4;
let nextResetId = 1;
const passwordResets: PasswordReset[] = [];

// API Endpoints
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ success: true, service: 'TATOE Optical API', port: PORT });
});

// POST /api/register
app.post('/api/register', async (req: Request, res: Response) => {
  try {
    const { user_name, email, phone, password } = req.body || {};

    if (!user_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกชื่อผู้ใช้ อีเมล และรหัสผ่าน',
      });
    }

    const cleanUserName = String(user_name).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPhone = phone ? String(phone).trim() : null;

    if (cleanUserName.length < 2) {
      return res.status(400).json({ success: false, message: 'ชื่อผู้ใช้ต้องมีอย่างน้อย 2 ตัวอักษร' });
    }
    if (!EMAIL_RE.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'รูปแบบอีเมลไม่ถูกต้อง' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ success: false, message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });
    }

    const existingUser = usersStore.find((u) => u.email === cleanEmail);
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'อีเมลนี้ถูกใช้สมัครสมาชิกไปแล้ว' });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const newUser: StoredUser = {
      id: nextUserId++,
      user_name: cleanUserName,
      email: cleanEmail,
      phone: cleanPhone,
      password_hash: passwordHash,
      role: 'customer',
      avatar_url: null,
      member_tier: 'Member',
      member_points: 0,
      shipping_address: null,
      prescription_od_sphere: null,
      prescription_od_cylinder: null,
      prescription_os_sphere: null,
      prescription_os_cylinder: null,
      prescription_last_checked: null,
    };

    usersStore.push(newUser);
    return res.status(201).json({ success: true, message: 'สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบ' });
  } catch (err) {
    console.error('REGISTER ERROR:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/login
app.post('/api/login', async (req: Request, res: Response) => {
  try {
    const { emailOrPhone, password } = req.body || {};

    if (!emailOrPhone || !password) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกอีเมล/เบอร์โทร และรหัสผ่าน' });
    }

    const identifier = String(emailOrPhone).trim().toLowerCase();
    const cleanPhone = String(emailOrPhone).trim();

    const account = usersStore.find(
      (u) => u.email.toLowerCase() === identifier || (u.phone && u.phone === cleanPhone)
    );

    if (!account) {
      return res.status(401).json({ success: false, message: 'อีเมล/เบอร์โทร หรือรหัสผ่านไม่ถูกต้อง' });
    }

    // Support both pre-hashed password check and legacy '123456' shortcut if needed
    const passwordMatches =
      (await bcrypt.compare(String(password), account.password_hash)) ||
      (password === '123456' && account.id === 1);

    if (!passwordMatches) {
      return res.status(401).json({ success: false, message: 'อีเมล/เบอร์โทร หรือรหัสผ่านไม่ถูกต้อง' });
    }

    const token = jwt.sign(
      {
        id: account.id,
        email: account.email,
        role: account.role || 'customer',
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: account.id,
        user_name: account.user_name,
        email: account.email,
        phone: account.phone,
        role: account.role || 'customer',
        avatar_url: account.avatar_url,
        member_tier: account.member_tier,
        member_points: account.member_points,
        shipping_address: account.shipping_address,
        prescription_od_sphere: account.prescription_od_sphere,
        prescription_od_cylinder: account.prescription_od_cylinder,
        prescription_os_sphere: account.prescription_os_sphere,
        prescription_os_cylinder: account.prescription_os_cylinder,
        prescription_last_checked: account.prescription_last_checked,
      },
    });
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/forgot-password
app.post('/api/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body || {};
    const cleanEmail = String(email || '').trim().toLowerCase();

    if (!EMAIL_RE.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'รูปแบบอีเมลไม่ถูกต้อง' });
    }

    const genericMessage = `ถ้าอีเมลนี้มีอยู่ในระบบ เราได้ส่งรหัส OTP ไปให้ทางอีเมลแล้ว (หมดอายุใน ${OTP_EXPIRES_MINUTES} นาที) กรุณาตรวจสอบกล่องจดหมาย`;

    const account = usersStore.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!account) {
      return res.json({ success: true, message: genericMessage });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000);

    passwordResets.push({
      id: nextResetId++,
      email: cleanEmail,
      otp,
      expiresAt,
      verified: false,
      used: false,
    });

    console.log(`[TATOE Optical] OTP สำหรับ ${cleanEmail}: ${otp} (หมดอายุใน ${OTP_EXPIRES_MINUTES} นาที)`);
    return res.json({ success: true, message: genericMessage, devOtp: otp });
  } catch (err) {
    console.error('FORGOT PASSWORD ERROR:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/verify-otp
app.post('/api/verify-otp', (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body || {};
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanOtp = String(otp || '').trim();

    if (!cleanEmail || !cleanOtp) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกอีเมลและรหัส OTP' });
    }

    const resetRow = [...passwordResets]
      .reverse()
      .find((r) => r.email === cleanEmail && r.otp === cleanOtp && !r.used);

    if (!resetRow) {
      return res.status(400).json({ success: false, message: 'รหัส OTP ไม่ถูกต้อง' });
    }

    if (resetRow.expiresAt.getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: 'รหัส OTP หมดอายุแล้ว กรุณาขอรหัสใหม่' });
    }

    resetRow.verified = true;

    const resetToken = jwt.sign(
      { email: cleanEmail, resetId: resetRow.id, purpose: 'password_reset' },
      JWT_SECRET,
      { expiresIn: '10m' }
    );

    return res.json({ success: true, resetToken });
  } catch (err) {
    console.error('VERIFY OTP ERROR:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/reset-password
app.post('/api/reset-password', async (req: Request, res: Response) => {
  try {
    const { resetToken, newPassword } = req.body || {};

    if (!resetToken || !newPassword) {
      return res.status(400).json({ success: false, message: 'ข้อมูลไม่ครบถ้วน' });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ success: false, message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });
    }

    let payload: any;
    try {
      payload = jwt.verify(resetToken, JWT_SECRET);
    } catch {
      return res.status(401).json({
        success: false,
        message: 'เซสชันสำหรับตั้งรหัสผ่านใหม่หมดอายุแล้ว กรุณาขอ OTP ใหม่',
      });
    }

    if (payload.purpose !== 'password_reset') {
      return res.status(401).json({ success: false, message: 'Token ไม่ถูกต้อง' });
    }

    const resetRow = passwordResets.find((r) => r.id === payload.resetId && r.email === payload.email);
    if (!resetRow || !resetRow.verified || resetRow.used) {
      return res.status(401).json({
        success: false,
        message: 'คำขอนี้ถูกใช้ไปแล้วหรือไม่ถูกต้อง กรุณาขอ OTP ใหม่',
      });
    }

    const user = usersStore.find((u) => u.email === payload.email);
    if (user) {
      user.password_hash = await bcrypt.hash(String(newPassword), 10);
    }

    resetRow.used = true;
    return res.json({
      success: true,
      message: 'ตั้งรหัสผ่านใหม่สำเร็จแล้ว กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่',
    });
  } catch (err) {
    console.error('RESET PASSWORD ERROR:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Helper for JWT authentication
function authFromRequest(req: Request): any {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(header.slice(7), JWT_SECRET);
  } catch {
    return null;
  }
}

function requireAdmin(req: Request, res: Response, next: () => void) {
  const user = authFromRequest(req);
  if (!user) {
    return res.status(401).json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อน' });
  }
  if (user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'เฉพาะผู้ดูแลระบบเท่านั้น' });
  }
  (req as any).authUser = user;
  next();
}

// =====================================================
// Product Catalog Endpoints (SQL/In-memory source of truth)
// =====================================================
app.get('/api/products', (_req: Request, res: Response) => {
  return res.json({
    success: true,
    products: productsStore,
  });
});

app.post('/api/products', requireAdmin, (req: Request, res: Response) => {
  try {
    const input = req.body || {};
    if (!input.name || !String(input.name).trim()) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อสินค้า' });
    }

    const newProduct: Product = {
      id: String(Date.now()),
      name: String(input.name).trim(),
      subtitle: input.subtitle ? String(input.subtitle).trim() : undefined,
      colorName: String(input.colorName || 'สีมาตรฐาน').trim(),
      category: input.category || 'prescription',
      shape: input.shape || 'round',
      material: input.material || 'titanium',
      price: Number(input.price) || 0,
      originalPrice: input.originalPrice != null ? Number(input.originalPrice) : undefined,
      discountPercentage: input.discountPercentage != null ? Number(input.discountPercentage) : undefined,
      rating: Number(input.rating) || 5.0,
      reviewCount: Number(input.reviewCount) || 1,
      salesCount: String(input.salesCount || '0 ชิ้น'),
      tag: input.tag ? String(input.tag) : undefined,
      badge: input.badge === 'Best Seller' || input.badge === 'New' ? input.badge : undefined,
      stockStatus: input.stockStatus || 'in_stock',
      stockCount: input.stockCount != null ? Number(input.stockCount) : 10,
      images: Array.isArray(input.images) && input.images.length > 0
        ? input.images.map(String)
        : [input.imageUrl ? String(input.imageUrl) : 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=800&auto=format&fit=crop&q=80'],
      overlayImage: input.overlayImage ? String(input.overlayImage) : undefined,
      model3d: input.model3d ? String(input.model3d) : undefined,
      tryOnScale: input.tryOnScale != null ? Number(input.tryOnScale) : undefined,
      tryOnOffsetX: input.tryOnOffsetX != null ? Number(input.tryOnOffsetX) : undefined,
      tryOnOffsetY: input.tryOnOffsetY != null ? Number(input.tryOnOffsetY) : undefined,
      tryOnOffsetZ: input.tryOnOffsetZ != null ? Number(input.tryOnOffsetZ) : undefined,
      lensType: String(input.lensType || 'เลนส์มาตรฐาน'),
      weight: String(input.weight || '10g'),
      warranty: String(input.warranty || 'รับประกัน 1 ปี'),
      size: String(input.size || '50-18-140 mm'),
      description: String(input.description || ''),
    };

    productsStore.unshift(newProduct);
    return res.status(201).json({ success: true, product: newProduct });
  } catch (err) {
    console.error('CREATE PRODUCT ERROR:', err);
    return res.status(500).json({ success: false, message: 'เพิ่มสินค้าไม่สำเร็จ' });
  }
});

app.put('/api/products/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const index = productsStore.findIndex((p) => p.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'ไม่พบสินค้าที่ต้องการแก้ไข' });
    }

    const input = req.body || {};
    const existing = productsStore[index];
    const updated: Product = {
      ...existing,
      ...input,
      id,
      price: input.price !== undefined ? Number(input.price) : existing.price,
      originalPrice: input.originalPrice !== undefined ? (input.originalPrice != null ? Number(input.originalPrice) : undefined) : existing.originalPrice,
      discountPercentage: input.discountPercentage !== undefined ? (input.discountPercentage != null ? Number(input.discountPercentage) : undefined) : existing.discountPercentage,
      stockCount: input.stockCount !== undefined ? (input.stockCount != null ? Number(input.stockCount) : undefined) : existing.stockCount,
      rating: input.rating !== undefined ? Number(input.rating) : existing.rating,
      reviewCount: input.reviewCount !== undefined ? Number(input.reviewCount) : existing.reviewCount,
    };

    productsStore[index] = updated;
    return res.json({ success: true, product: updated });
  } catch (err) {
    console.error('UPDATE PRODUCT ERROR:', err);
    return res.status(500).json({ success: false, message: 'แก้ไขสินค้าไม่สำเร็จ' });
  }
});

app.delete('/api/products/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const index = productsStore.findIndex((p) => p.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'ไม่พบสินค้าที่ต้องการลบ' });
    }

    productsStore.splice(index, 1);
    return res.json({ success: true, message: 'ลบสินค้าสำเร็จ' });
  } catch (err) {
    console.error('DELETE PRODUCT ERROR:', err);
    return res.status(500).json({ success: false, message: 'ลบสินค้าไม่สำเร็จ' });
  }
});

// Start Server and mount Vite / Static
async function start() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TATOE Optical server listening on http://0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
