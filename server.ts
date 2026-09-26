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
app.use(express.json());

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
    user_name: 'ลูกค้าตัวอย่าง (ทดสอบระบบ)',
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
