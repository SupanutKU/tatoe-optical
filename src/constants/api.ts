// ที่อยู่ของ backend server (รองรับ unified dev server ในพอร์ต 3000 เดียวกัน และ external backend)
export const getApiBaseUrl = (): string => {
  const configured = (import.meta as any).env?.VITE_API_URL;

  // Login / register / password reset MUST use the SQL backend.
  // Do not silently fall back to the Vite/Express mock API when a backend URL
  // is configured, otherwise the browser can end up posting to localhost and
  // receiving an empty/non-JSON response.
  if (configured && String(configured).trim()) {
    return String(configured).trim().replace(/\/$/, '');
  }

  // Local development fallback when frontend + SQL backend run on the same origin.
  return '';
};

export const getApiLoginUrl = (): string => {
  const base = getApiBaseUrl();
  return base ? `${base}/api/login` : '/api/login';
};

export const API_LOGIN_URL = getApiLoginUrl();
export const API_REGISTER_URL = getApiBaseUrl() ? `${getApiBaseUrl()}/api/register` : '/api/register';
export const API_FORGOT_PASSWORD_URL = getApiBaseUrl() ? `${getApiBaseUrl()}/api/forgot-password` : '/api/forgot-password';
export const API_VERIFY_OTP_URL = getApiBaseUrl() ? `${getApiBaseUrl()}/api/verify-otp` : '/api/verify-otp';
export const API_RESET_PASSWORD_URL = getApiBaseUrl() ? `${getApiBaseUrl()}/api/reset-password` : '/api/reset-password';

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

// ============================================================================
// Biometric Authentication (Touch ID / Face ID) Storage & Configuration
// ============================================================================
const BIOMETRIC_KEY = 'tatoe_biometric_auth';

export interface BiometricAuthConfig {
  enabled: boolean;
  userEmail: string;
  userName: string;
  session: StoredSession;
  deviceType?: 'touch_id' | 'face_id' | 'fingerprint' | 'biometric';
  enabledAt: string;
}

export const saveBiometricConfig = (config: BiometricAuthConfig): void => {
  try {
    localStorage.setItem(BIOMETRIC_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('บันทึกการตั้งค่า Biometric ไม่สำเร็จ', e);
  }
};

export const loadBiometricConfig = (): BiometricAuthConfig | null => {
  try {
    const raw = localStorage.getItem(BIOMETRIC_KEY);
    return raw ? (JSON.parse(raw) as BiometricAuthConfig) : null;
  } catch {
    return null;
  }
};

export const clearBiometricConfig = (): void => {
  try {
    localStorage.removeItem(BIOMETRIC_KEY);
  } catch (e) {
    console.error('ลบการตั้งค่า Biometric ไม่สำเร็จ', e);
  }
};

