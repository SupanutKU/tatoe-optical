// ที่อยู่ของ backend server (รองรับทั้ง unified dev server ในพอร์ต 3000 เดียวกัน และ external backend)
export const getApiBaseUrl = (): string => {
  return (import.meta as any).env?.VITE_API_URL || '';
};

export const API_LOGIN_URL = `${getApiBaseUrl()}/api/login`;
export const API_REGISTER_URL = `${getApiBaseUrl()}/api/register`;
export const API_FORGOT_PASSWORD_URL = `${getApiBaseUrl()}/api/forgot-password`;
export const API_VERIFY_OTP_URL = `${getApiBaseUrl()}/api/verify-otp`;
export const API_RESET_PASSWORD_URL = `${getApiBaseUrl()}/api/reset-password`;

// สร้าง header สำหรับเรียก endpoint ที่ต้องแนบ JWT token (Authorization: Bearer <token>)
export const buildAuthHeaders = (token?: string | null): Record<string, string> => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

// เก็บ/อ่าน/ลบ session (token + user) ใน localStorage ฝั่งเบราว์เซอร์
const STORAGE_KEY = 'tatoe_auth_session';

export interface StoredSession {
  token: string;
  user: {
    id: number;
    user_name: string;
    email: string;
    phone: string | null;
    role: 'customer' | 'admin';
    avatar_url: string | null;
    member_tier: string | null;
    member_points: number | null;
    shipping_address: string | null;
    prescription_od_sphere: string | null;
    prescription_od_cylinder: string | null;
    prescription_os_sphere: string | null;
    prescription_os_cylinder: string | null;
    prescription_last_checked: string | null;
  };
}

export const saveSession = (session: StoredSession): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch (e) {
    console.error('บันทึก session ไม่สำเร็จ', e);
  }
};

export const loadSession = (): StoredSession | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch (e) {
    return null;
  }
};

export const clearSession = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('ล้าง session ไม่สำเร็จ', e);
  }
};
