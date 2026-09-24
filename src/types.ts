export type ScreenId = 
  | 'home'
  | 'search'
  | 'detail'
  | 'cart'
  | 'checkout'
  | 'orders'
  | 'profile'
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
