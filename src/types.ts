export type ScreenId = 
  | 'home'
  | 'search'
  | 'detail'
  | 'cart'
  | 'checkout'
  | 'orders'
  | 'profile'
  | 'claims'
  | 'welcome'
  | 'login'
  | 'register'
  | 'forgot-password';

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
  /** Optional transparent-background cutout used for AR overlay in Virtual Try-On.
   *  Falls back to images[0] when not provided. */
  overlayImage?: string;
  /** Optional real 3D GLB/GLTF model used by the 3D try-on renderer. */
  model3d?: string;
  /** Per-model fit calibration for the 3D try-on renderer. */
  tryOnScale?: number;
  tryOnOffsetX?: number;
  tryOnOffsetY?: number;
  tryOnOffsetZ?: number;
  lensType: string;
  weight: string;
  warranty: string;
  size: string;
  description: string;
}

export interface CartItem {
  id: string;
  product: Product;
  selectedColor: string;
  quantity: number;
  prescriptionNote: string;
  hasPrescription: boolean;
  selected: boolean;
  lensUpgrade?: string;
}

export interface Prescription {
  od: {
    sphere: string;
    cylinder?: string;
    axis?: string;
  };
  os: {
    sphere: string;
    cylinder?: string;
    axis?: string;
  };
  lastChecked: string;
}

export type AddressType = 'home' | 'office' | 'other';

export interface UserAddress {
  id: string;
  title: string;
  type: AddressType;
  recipientName: string;
  phone: string;
  addressLine: string;
  subdistrict: string;
  district: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
}

export interface UserProfile {
  id?: number;
  name: string;
  role: 'customer' | 'admin';
  tier: string;
  memberTier?: string;
  points?: number;
  email: string;
  phone: string;
  avatarUrl: string;
  currentOrdersCount: number;
  discountCouponsCount: number;
  wishlistCount: number;
  shippingAddress: string;
  addresses: UserAddress[];
  prescription: Prescription;
}

export interface ChatProductAttachment {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  category?: string;
  lensType?: string;
  colorName?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'customer' | 'admin' | 'store';
  senderName: string;
  text: string;
  time: string;
  product?: ChatProductAttachment;
}

export interface ChatThread {
  id: string;
  customerName: string;
  customerPhone?: string;
  product?: ChatProductAttachment;
  unread: boolean;
  messages: ChatMessage[];
}

export interface ProductReview {
  id: string;
  productId: string;
  authorName: string;
  authorAvatar?: string;
  rating: number;
  date: string;
  comment: string;
  photos: string[];
  colorName?: string;
  lensType?: string;
  verifiedPurchase?: boolean;
  helpfulCount?: number;
}

export type DeliveryStage =
  | 'order_placed'
  | 'crafting'
  | 'in_transit'
  | 'at_sorting_hub'
  | 'out_for_delivery'
  | 'delivered';

export interface DeliveryTimelineStep {
  id: string;
  stage: DeliveryStage;
  title: string;
  detail: string;
  time: string;
  completed: boolean;
  current?: boolean;
}

export interface DeliveryOrder {
  orderId: string;
  trackingNumber: string;
  courier: string;
  currentStage: DeliveryStage;
  statusLabel: string;
  statusDescription: string;
  estimatedDelivery: string;
  updatedTime: string;
  steps: DeliveryTimelineStep[];
  itemsCount: number;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  type: 'delivery' | 'order' | 'promo' | 'system';
  orderId?: string;
  stage?: DeliveryStage;
  read: boolean;
}

// ==========================================
// Claim System (ระบบใบเคลมสินค้า)
// ==========================================
export type ClaimStepId =
  | 'submitted'      // 1. ยื่นคำร้องเคลมสำเร็จ (Claim Submitted)
  | 'received'       // 2. ร้านค้า/ศูนย์บริการรับเรื่อง (Claim Received)
  | 'inspecting'     // 3. อยู่ระหว่างการตรวจสอบ/ซ่อมแซม (Under Inspection/Repair)
  | 'dispatched'     // 4. ดำเนินการเสร็จสิ้น/จัดส่งไปยังสาขา (Completed/Dispatched)
  | 'delivered';     // 5. ลูกค้ารับสินค้าเรียบร้อย (Delivered)

export type ClaimStepState = 'completed' | 'in_progress' | 'pending';

export interface ClaimStepInfo {
  id: ClaimStepId;
  stepNumber: number;
  title: string;
  englishTitle: string;
  description: string;
  timestamp?: string;
  location?: string;
  state: ClaimStepState;
}

export interface ClaimAttachedFile {
  id: string;
  name: string;
  size: string;
  type: string;
  url?: string;
}

export interface ClaimComparisonPhoto {
  id: string;
  partName: string;
  beforeUrl: string;
  afterUrl: string;
  beforeDescription: string;
  afterDescription: string;
  technicianNote?: string;
  completedAt?: string;
  inspectorName?: string;
}

export interface ClaimTicket {
  claimId: string;
  customerName: string;
  phoneNumber: string;
  branch: string;
  issueDescription: string;
  attachedFiles: ClaimAttachedFile[];
  productName?: string;
  orderId?: string;
  submittedAt: string;
  currentStepId: ClaimStepId;
  steps: ClaimStepInfo[];
  estimatedCompletion?: string;
  repairComparisons?: ClaimComparisonPhoto[];
}

