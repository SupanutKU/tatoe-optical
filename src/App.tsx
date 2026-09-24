import React, { useState } from 'react';
import { ScreenId, Product, CartItem, UserProfile, Prescription, UserAddress, ChatThread, ChatProductAttachment, ProductReview, DeliveryOrder, DeliveryStage, AppNotification } from './types';
import { MOCK_PRODUCTS, MOCK_USER, INITIAL_CART, formatAddress, INITIAL_CHAT_THREADS, INITIAL_REVIEWS, INITIAL_DELIVERY_ORDER, INITIAL_NOTIFICATIONS, DELIVERY_STAGE_CONFIG } from './data/mockData';
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './components/HomeScreen';
import { SearchScreen } from './components/SearchScreen';
import { ProductDetailScreen } from './components/ProductDetailScreen';
import { CartScreen } from './components/CartScreen';
import { CheckoutScreen } from './components/CheckoutScreen';
import { OrdersScreen } from './components/OrdersScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { WelcomeScreen } from './components/WelcomeScreen';
import { LoginScreen } from './components/LoginScreen';
import { RegisterScreen } from './components/RegisterScreen';
import { ForgotPasswordScreen } from './components/ForgotPasswordScreen';
import { loadSession, clearSession, StoredSession } from './constants/api';
import { VirtualTryOnModal } from './components/VirtualTryOnModal';
import { PrescriptionModal } from './components/PrescriptionModal';
import { ReceiptModal } from './components/ReceiptModal';
import { ChatModal } from './components/ChatModal';
import { AdminProductModal } from './components/AdminProductModal';
import { PushNotificationBanner } from './components/PushNotificationBanner';
import { NotificationsModal } from './components/NotificationsModal';

// แปลงข้อมูลผู้ใช้ที่ backend ส่งกลับมา (คอลัมน์จากตาราง `group`) ให้เป็นรูปแบบ UserProfile
// ของแอป ฟิลด์ที่ backend ยังไม่มี (ที่อยู่ทั้งหมด, จำนวนออเดอร์ ฯลฯ) จะ fallback ไปใช้ค่า mock เดิม
const mapSessionUserToProfile = (apiUser: StoredSession['user']): UserProfile => ({
  ...MOCK_USER,
  id: apiUser.id,
  name: apiUser.user_name || MOCK_USER.name,
  role: apiUser.role || 'customer',
  email: apiUser.email || MOCK_USER.email,
  phone: apiUser.phone || MOCK_USER.phone,
  avatarUrl: apiUser.avatar_url || MOCK_USER.avatarUrl,
  memberTier: apiUser.member_tier || MOCK_USER.memberTier,
  points: apiUser.member_points ?? MOCK_USER.points,
  shippingAddress: apiUser.shipping_address || MOCK_USER.shippingAddress,
  prescription: {
    od: {
      sphere: apiUser.prescription_od_sphere || MOCK_USER.prescription.od.sphere,
      cylinder: apiUser.prescription_od_cylinder || MOCK_USER.prescription.od.cylinder
    },
    os: {
      sphere: apiUser.prescription_os_sphere || MOCK_USER.prescription.os.sphere,
      cylinder: apiUser.prescription_os_cylinder || MOCK_USER.prescription.os.cylinder
    },
    lastChecked: apiUser.prescription_last_checked || MOCK_USER.prescription.lastChecked
  }
});

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('login');
  const [previousScreen, setPreviousScreen] = useState<ScreenId>('login');
  const [user, setUser] = useState<UserProfile>(MOCK_USER);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // กู้คืน session (token + user) จาก localStorage ตอนเปิดแอปครั้งแรก ถ้าเคยติ๊ก "จดจำการเข้าสู่ระบบ" ไว้
  React.useEffect(() => {
    const session = loadSession();
    if (session) {
      setAuthToken(session.token);
      setUser(mapSessionUserToProfile(session.user));
      setIsAuthenticated(true);
    }
  }, []);

  // ผู้ใช้ที่ยังไม่ได้เข้าสู่ระบบจะอยู่ที่หน้า Login เท่านั้น
  React.useEffect(() => {
    if (!isAuthenticated && !['login', 'register', 'forgot-password'].includes(currentScreen)) {
      setCurrentScreen('login');
    }
  }, [isAuthenticated, currentScreen]);

  const handleLoginSuccess = (session: StoredSession) => {
    setAuthToken(session.token);
    setUser(mapSessionUserToProfile(session.user));
    setIsAuthenticated(true);
    navigateTo('home');
  };

  const handleLogout = () => {
    clearSession();
    setAuthToken(null);
    setIsAuthenticated(false);
    setUser(MOCK_USER);
    navigateTo('login');
  };
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [cartItems, setCartItems] = useState<CartItem[]>(INITIAL_CART);
  const [selectedProduct, setSelectedProduct] = useState<Product>(MOCK_PRODUCTS[0]);
  const [wishlist, setWishlist] = useState<string[]>(['urban-black', 'classic-01']);
  const [reviews, setReviews] = useState<ProductReview[]>(INITIAL_REVIEWS);

  // AI Recommendation shape tracking (คลิกดูบ่อยที่สุด)
  const [viewedShapes, setViewedShapes] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('bigeye_viewed_shapes');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    // ค่าเริ่มต้นจำลองประวัติการเข้าชมทรงสี่เหลี่ยมมากที่สุดเพื่อความสมบูรณ์แบบ
    return { square: 4, round: 2, drop: 1 };
  });

  const recordShapeView = (shape?: string) => {
    if (!shape) return;
    const key = shape.toLowerCase();
    setViewedShapes((prev) => {
      const updated = { ...prev, [key]: (prev[key] || 0) + 1 };
      try {
        localStorage.setItem('bigeye_viewed_shapes', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleResetShapeHistory = () => {
    const emptyHistory = { square: 0, round: 0, drop: 0 };
    setViewedShapes(emptyHistory);
    try {
      localStorage.setItem('bigeye_viewed_shapes', JSON.stringify(emptyHistory));
    } catch (e) {}
    showToast('ล้างประวัติการคลิกดูแว่นตาสำหรับระบบ AI เรียบร้อยแล้ว');
  };

  const handleSimulateClickShape = (shape: string) => {
    recordShapeView(shape);
    showToast(`AI บันทึกสถิติความสนใจ "${shape.toUpperCase()}" เพิ่มขึ้นแล้ว ✨`);
  };

  // Modals & Chat
  const [isVirtualTryOnOpen, setIsVirtualTryOnOpen] = useState(false);
  const [isPrescriptionOpen, setIsPrescriptionOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAdminProductModalOpen, setIsAdminProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [chatThreads, setChatThreads] = useState<ChatThread[]>(INITIAL_CHAT_THREADS);
  const [chatProduct, setChatProduct] = useState<Product | null>(null);

  // Delivery & Push Notification Simulation State
  const [deliveryOrder, setDeliveryOrder] = useState<DeliveryOrder>(INITIAL_DELIVERY_ORDER);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [activePushNotification, setActivePushNotification] = useState<AppNotification | null>(null);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);

  const STAGES_ORDER: DeliveryStage[] = [
    'order_placed',
    'crafting',
    'in_transit',
    'at_sorting_hub',
    'out_for_delivery',
    'delivered'
  ];

  const handleUpdateDeliveryStage = (newStage: DeliveryStage) => {
    const stageCfg = DELIVERY_STAGE_CONFIG[newStage];
    const nowTimeStr = `วันนี้ • ${new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.`;

    setDeliveryOrder((prev) => {
      const targetIndex = STAGES_ORDER.indexOf(newStage);
      const updatedSteps = prev.steps.map((step) => {
        const stepIndex = STAGES_ORDER.indexOf(step.stage);
        if (stepIndex < targetIndex) {
          return { ...step, completed: true, current: false };
        } else if (stepIndex === targetIndex) {
          return {
            ...step,
            completed: true,
            current: true,
            time: nowTimeStr
          };
        } else {
          return { ...step, completed: false, current: false };
        }
      });

      return {
        ...prev,
        currentStage: newStage,
        statusLabel: stageCfg.label,
        statusDescription: stageCfg.description,
        updatedTime: nowTimeStr,
        steps: updatedSteps
      };
    });

    // Create & Trigger Push Notification
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: stageCfg.pushTitle,
      body: stageCfg.pushBody,
      timestamp: nowTimeStr,
      type: 'delivery',
      orderId: deliveryOrder.orderId,
      stage: newStage,
      read: false
    };

    setNotifications((prev) => [newNotif, ...prev]);
    setActivePushNotification(newNotif);
  };

  const handleSelectNotification = (notif: AppNotification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    );
    navigateTo('orders');
  };

  const handleMarkAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast('ทำเครื่องหมายอ่านการแจ้งเตือนทั้งหมดแล้ว');
  };

  // Notifications & UI Helpers
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3500);
  };

  const navigateTo = (screen: ScreenId) => {
    setPreviousScreen(currentScreen);
    setCurrentScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProduct = (product: Product) => {
    // Record shape for AI recommendation
    if (product.shape) {
      recordShapeView(product.shape);
    }
    setSelectedProduct(product);
    navigateTo('detail');
  };

  const handleAddToCart = (product: Product, quantity = 1, selectedColor = 'ดำด้าน Matte Black') => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity, selected: true }
            : item
        );
      }
      const newItem: CartItem = {
        id: `cart-${Date.now()}`,
        product,
        quantity,
        selectedColor: selectedColor || product.colorName,
        selected: true,
        hasPrescription: true,
        prescriptionNote: `ค่าสายตา R: ${user.prescription.od.sphere} | L: ${user.prescription.os.sphere}`,
        lensUpgrade: product.lensType
      };
      return [newItem, ...prev];
    });
    showToast(`เพิ่ม "${product.name}" ลงในตะกร้าแล้ว`);
  };

  const handleUpdateCartQuantity = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveCartItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleToggleSelectCartItem = (id: string) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const handleToggleSelectAllCart = (selected: boolean) => {
    setCartItems((prev) => prev.map((item) => ({ ...item, selected })));
  };

  const handleToggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      const isExist = prev.includes(productId);
      const next = isExist ? prev.filter((id) => id !== productId) : [...prev, productId];
      showToast(isExist ? 'ลบออกจากรายการโปรดแล้ว' : 'เพิ่มในรายการโปรดแล้ว ❤️');
      return next;
    });
  };

  const handleConfirmOrder = () => {
    // Clear purchased items from cart
    setCartItems((prev) => prev.filter((item) => !item.selected));
    navigateTo('orders');
    showToast('สั่งซื้อสำเร็จ! เริ่มต้นขั้นตอนตัดเลนส์ตามค่าสายตาแล้ว');
  };

  const handleSavePrescription = (newRx: Prescription) => {
    setUser((prev) => ({
      ...prev,
      prescription: newRx
    }));
    setIsPrescriptionOpen(false);
    showToast('บันทึกค่าสายตาใหม่เรียบร้อยแล้ว');
  };

  // --- Address Management Handlers ---
  const handleAddAddress = (newAddrData: Omit<UserAddress, 'id'>) => {
    const newId = `addr-${Date.now()}`;
    const newAddress: UserAddress = {
      ...newAddrData,
      id: newId
    };

    setUser((prev) => {
      let updatedAddresses = [...(prev.addresses || [])];
      if (newAddress.isDefault || updatedAddresses.length === 0) {
        newAddress.isDefault = true;
        updatedAddresses = updatedAddresses.map((a) => ({ ...a, isDefault: false }));
      }
      const finalAddresses = [newAddress, ...updatedAddresses];
      const defaultAddr = finalAddresses.find((a) => a.isDefault) || finalAddresses[0];

      return {
        ...prev,
        addresses: finalAddresses,
        shippingAddress: defaultAddr ? formatAddress(defaultAddr) : prev.shippingAddress
      };
    });

    showToast(`เพิ่มที่อยู่ "${newAddress.title}" เรียบร้อยแล้ว`);
  };

  const handleUpdateAddress = (updatedAddr: UserAddress) => {
    setUser((prev) => {
      let updatedAddresses = (prev.addresses || []).map((a) =>
        a.id === updatedAddr.id ? updatedAddr : a
      );

      if (updatedAddr.isDefault) {
        updatedAddresses = updatedAddresses.map((a) =>
          a.id === updatedAddr.id ? { ...a, isDefault: true } : { ...a, isDefault: false }
        );
      }

      const defaultAddr = updatedAddresses.find((a) => a.isDefault) || updatedAddresses[0];

      return {
        ...prev,
        addresses: updatedAddresses,
        shippingAddress: defaultAddr ? formatAddress(defaultAddr) : prev.shippingAddress
      };
    });

    showToast(`อัปเดตที่อยู่ "${updatedAddr.title}" เรียบร้อยแล้ว`);
  };

  const handleDeleteAddress = (addressId: string) => {
    setUser((prev) => {
      const remaining = (prev.addresses || []).filter((a) => a.id !== addressId);
      if (remaining.length === 0) {
        return prev;
      }
      // If deleted was default, make the first one default
      const wasDefault = prev.addresses.find((a) => a.id === addressId)?.isDefault;
      let finalAddresses = remaining;
      if (wasDefault) {
        finalAddresses = remaining.map((a, idx) => ({ ...a, isDefault: idx === 0 }));
      }
      const defaultAddr = finalAddresses.find((a) => a.isDefault) || finalAddresses[0];

      return {
        ...prev,
        addresses: finalAddresses,
        shippingAddress: defaultAddr ? formatAddress(defaultAddr) : prev.shippingAddress
      };
    });

    showToast('ลบที่อยู่เรียบร้อยแล้ว');
  };

  const handleSetDefaultAddress = (addressId: string) => {
    setUser((prev) => {
      const updated = (prev.addresses || []).map((a) => ({
        ...a,
        isDefault: a.id === addressId
      }));
      const defaultAddr = updated.find((a) => a.id === addressId);

      return {
        ...prev,
        addresses: updated,
        shippingAddress: defaultAddr ? formatAddress(defaultAddr) : prev.shippingAddress
      };
    });

    showToast('ตั้งเป็นที่อยู่จัดส่งหลักเรียบร้อยแล้ว ⭐');
  };

  // --- Store Chat & Admin Support Handlers ---
  const unreadChatCount = chatThreads.filter((t) => t.unread).length;

  const handleOpenChat = (productToInquire?: Product) => {
    if (productToInquire) {
      setChatProduct(productToInquire);
      // Ensure there is an active thread or inquiry context for this product
      setChatThreads((prev) => {
        const existing = prev.find((t) => t.product?.id === productToInquire.id);
        if (existing) return prev;
        const newThread: ChatThread = {
          id: `thread-${Date.now()}`,
          customerName: user.name,
          customerPhone: user.phone,
          product: {
            id: productToInquire.id,
            name: productToInquire.name,
            price: productToInquire.price,
            imageUrl: productToInquire.images[0],
            category: productToInquire.category,
            lensType: productToInquire.lensType,
            colorName: productToInquire.colorName
          },
          unread: false,
          messages: [
            {
              id: `msg-${Date.now()}`,
              sender: 'store',
              senderName: 'ร้านTATOE Optical',
              text: `สวัสดีค่ะคุณ ${user.name} ยินดีให้บริการค่ะ 👓 มีคำถามเกี่ยวกับขนาดกรอบ ${productToInquire.name} การเลือกชนิดเลนส์ หรือค่าสายตา ปรึกษากับแอดมินหรือนักทัศนมาตรได้เลยนะคะ`,
              time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.'
            }
          ]
        };
        return [newThread, ...prev];
      });
    } else {
      setChatProduct(null);
    }
    setIsChatOpen(true);
  };

  const handleSendMessage = (
    threadId: string,
    text: string,
    sender: 'customer' | 'admin',
    senderName: string,
    productAttachment?: ChatProductAttachment
  ) => {
    const timeStr =
      new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';

    setChatThreads((prev) =>
      prev.map((thread) => {
        if (thread.id !== threadId) return thread;

        const newMsg = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          sender,
          senderName,
          text,
          time: timeStr,
          product: productAttachment
        };

        return {
          ...thread,
          product: thread.product || productAttachment,
          unread: sender === 'customer', // Customer message marks as unread for admin
          messages: [...thread.messages, newMsg]
        };
      })
    );
  };

  // --- Product Reviews Handler ---
  const handleAddReview = (newReviewData: Omit<ProductReview, 'id' | 'date'>) => {
    const todayStr = new Intl.DateTimeFormat('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(new Date());

    const newReview: ProductReview = {
      ...newReviewData,
      id: `rev-${Date.now()}`,
      date: todayStr,
      helpfulCount: 0
    };

    setReviews((prev) => [newReview, ...prev]);

    // Recalculate product rating & reviewCount
    setProducts((prevProducts) =>
      prevProducts.map((p) => {
        if (p.id !== newReviewData.productId) return p;
        const matchingReviews = [...reviews.filter((r) => r.productId === p.id), newReview];
        const newAvg = Number(
          (matchingReviews.reduce((sum, r) => sum + r.rating, 0) / matchingReviews.length).toFixed(1)
        );
        const updated = {
          ...p,
          rating: newAvg,
          reviewCount: (p.reviewCount || 0) + 1
        };
        if (selectedProduct.id === p.id) {
          setSelectedProduct(updated);
        }
        return updated;
      })
    );

    showToast('ขอบคุณสำหรับความคิดเห็น! บันทึกรีวิวสินค้าเรียบร้อยแล้วค่ะ ✨');
  };

  // --- Admin Role & CRUD Handlers ---
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setIsAdminProductModalOpen(true);
  };

  const handleOpenEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsAdminProductModalOpen(true);
  };

  const handleSaveProduct = (data: Partial<Product> & { id?: string }) => {
    if (data.id) {
      // Edit existing product
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === data.id) {
            return {
              ...p,
              ...data,
              images: data.images && data.images.length > 0 ? data.images : p.images
            } as Product;
          }
          return p;
        })
      );
      if (selectedProduct.id === data.id) {
        setSelectedProduct((prev) => ({
          ...prev,
          ...data,
          images: data.images && data.images.length > 0 ? data.images : prev.images
        } as Product));
      }
      setCartItems((prev) =>
        prev.map((item) =>
          item.product.id === data.id
            ? { ...item, product: { ...item.product, ...data } as Product }
            : item
        )
      );
      showToast(`บันทึกการแก้ไข "${data.name}" เรียบร้อยแล้ว`);
    } else {
      // Add new product
      const newId = `product-${Date.now()}`;
      const defaultImg =
        data.images && data.images.length > 0
          ? data.images
          : [
              'https://lh3.googleusercontent.com/aida-public/AB6AXuAZMBqH7_MCWY1cBhlruy859V0cxY-NxSQUxCG4zmhZafutZ28DzT077CdnA1wp1WD-ExOa29UHOjFnOqLZlTEO_p-5SkNIfoNo4It2cze4a4yE5RQnz6XMQfglI8V1VIANCK_-GY6cHv7hmrt_7v1DMt767zG2xO0OUXG4F8S4YnoTiTXv_BYkka0zl0dDFZLzvhxA6nORP00LLfFvlhWKTbNa8kGEpaq0Jv8VrgyCp8iOzL1suXWc'
            ];

      const newProduct: Product = {
        id: newId,
        name: data.name || 'แว่นตารุ่นใหม่',
        subtitle: data.subtitle || 'Big Eye Premium Collection',
        price: Number(data.price) || 1290,
        originalPrice: Number(data.originalPrice) || 1890,
        rating: Number(data.rating) || 5.0,
        reviewCount: Number(data.reviewCount) || 1,
        salesCount: '1.2k+ ชิ้น',
        category: data.category || 'prescription',
        shape: data.shape || 'round',
        material: data.material || 'titanium',
        colorName: data.colorName || 'ดำด้าน Matte Black',
        images: defaultImg,
        tag: data.tag || 'ใหม่ New',
        badge: data.badge || 'New',
        lensType: data.lensType || 'เลนส์มัลติโค้ต กรองแสง UV400',
        weight: data.weight || '8.5 กรัม',
        warranty: data.warranty || 'รับประกันกรอบแว่น 1 ปีเต็ม',
        size: data.size || '51-18-142 มม.',
        description: data.description || 'แว่นตาน้ำหนักเบาพิเศษ ออกแบบสำหรับสรีระใบหน้าชาวเอเชีย',
        stockStatus: data.stockStatus || 'in_stock',
        stockCount: Number(data.stockCount) || 15
      };

      setProducts((prev) => [newProduct, ...prev]);
      showToast(`เพิ่มสินค้าใหม่ "${newProduct.name}" สำเร็จแล้ว!`);
    }

    setIsAdminProductModalOpen(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = (productId: string) => {
    const target = products.find((p) => p.id === productId);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    setWishlist((prev) => prev.filter((id) => id !== productId));
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));

    if (selectedProduct.id === productId) {
      const remaining = products.filter((p) => p.id !== productId);
      if (remaining.length > 0) {
        setSelectedProduct(remaining[0]);
      }
    }
    showToast(`ลบสินค้า "${target?.name || ''}" ออกจากระบบแล้ว`);
  };

  const handleResetProducts = () => {
    setProducts(MOCK_PRODUCTS);
    showToast('รีเซ็ตรายการสินค้ากลับสู่ค่าเริ่มต้นแล้ว');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: 'TATOE Optical',
          text: 'สัมผัสประสบการณ์เลือกซื้อและลองแว่นตาออนไลน์ที่สมบูรณ์แบบ',
          url: window.location.href
        })
        .catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      showToast('คัดลอกลิงก์ร้านแว่นตาเรียบร้อยแล้ว');
    }
  };

  const cartCount = cartItems.filter((i) => i.selected).reduce((acc, i) => acc + i.quantity, 0);

  // List of all 9 screens for testing and quick jumping
  const allScreens: { id: ScreenId; label: string; icon: string }[] = [
    { id: 'welcome', label: 'หน้าแรกต้อนรับ', icon: 'waving_hand' },
    { id: 'login', label: 'เข้าสู่ระบบ', icon: 'login' },
    { id: 'home', label: 'หน้าหลักร้าน', icon: 'home' },
    { id: 'search', label: 'ค้นหาและตัวกรอง', icon: 'search' },
    { id: 'detail', label: 'รายละเอียดสินค้า', icon: 'visibility' },
    { id: 'cart', label: 'ตะกร้าสินค้า', icon: 'shopping_bag' },
    { id: 'checkout', label: 'ชำระเงิน', icon: 'payment' },
    { id: 'orders', label: 'ติดตามคำสั่งซื้อ', icon: 'local_shipping' },
    { id: 'profile', label: 'โปรไฟล์ & ค่าสายตา', icon: 'person' }
  ];

  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface flex flex-col items-center">
      {/* Container simulating mobile frame */}
      <div className="w-full max-w-[430px] min-h-screen bg-surface relative flex flex-col shadow-2xl overflow-x-hidden">
        {/* Main Content Area - with generous padding for smooth scrolling */}
        <main
          className={`flex-1 flex flex-col px-margin ${
            isAuthenticated ? 'pt-4 pb-20' : 'pt-4'
          }`}
        >
          {currentScreen === 'home' && (
            <HomeScreen
              user={user}
              products={products}
              wishlist={wishlist}
              viewedShapes={viewedShapes}
              onToggleWishlist={handleToggleWishlist}
              onSelectProduct={handleSelectProduct}
              onAddToCart={(p) => handleAddToCart(p, 1)}
              onNavigate={navigateTo}
              onOpenVirtualTryOn={() => setIsVirtualTryOnOpen(true)}
              onOpenVirtualTryOnWithProduct={(p) => {
                setSelectedProduct(p);
                setIsVirtualTryOnOpen(true);
              }}
              onResetShapeHistory={handleResetShapeHistory}
              onSimulateClickShape={handleSimulateClickShape}
              onOpenAddProduct={handleOpenAddProduct}
              onEditProduct={handleOpenEditProduct}
              onDeleteProduct={handleDeleteProduct}
              onResetProducts={handleResetProducts}
            />
          )}

          {currentScreen === 'search' && (
            <SearchScreen
              products={products}
              wishlist={wishlist}
              isAdmin={user.role === 'admin'}
              onToggleWishlist={handleToggleWishlist}
              onSelectProduct={handleSelectProduct}
              onAddToCart={(p) => handleAddToCart(p, 1)}
              onOpenPrescriptionModal={() => setIsPrescriptionOpen(true)}
              onOpenAddProduct={handleOpenAddProduct}
              onEditProduct={handleOpenEditProduct}
              onDeleteProduct={handleDeleteProduct}
            />
          )}

          {currentScreen === 'detail' && (
            <ProductDetailScreen
              product={selectedProduct}
              isFavorite={wishlist.includes(selectedProduct.id)}
              isAdmin={user.role === 'admin'}
              reviews={reviews}
              currentUser={user}
              onToggleFavorite={() => handleToggleWishlist(selectedProduct.id)}
              onAddToCart={handleAddToCart}
              onOpenChat={(p) => handleOpenChat(p || selectedProduct)}
              onEditProduct={handleOpenEditProduct}
              onDeleteProduct={(id) => {
                handleDeleteProduct(id);
                navigateTo('home');
              }}
              onAddReview={handleAddReview}
            />
          )}

          {currentScreen === 'cart' && (
            <CartScreen
              cartItems={cartItems}
              onUpdateQuantity={handleUpdateCartQuantity}
              onRemoveItem={handleRemoveCartItem}
              onToggleSelectItem={handleToggleSelectCartItem}
              onToggleSelectAll={handleToggleSelectAllCart}
              onNavigate={navigateTo}
              onOpenPrescriptionModal={() => setIsPrescriptionOpen(true)}
            />
          )}

          {currentScreen === 'checkout' && (
            <CheckoutScreen
              user={user}
              cartItems={cartItems}
              onConfirmOrder={handleConfirmOrder}
              onOpenPrescriptionModal={() => setIsPrescriptionOpen(true)}
              onNavigate={navigateTo}
            />
          )}

          {currentScreen === 'orders' && (
            <OrdersScreen
              user={user}
              deliveryOrder={deliveryOrder}
              onUpdateDeliveryStage={handleUpdateDeliveryStage}
              onOpenReceipt={() => setIsReceiptOpen(true)}
              onOpenChat={() => handleOpenChat()}
              onNavigate={navigateTo}
            />
          )}

          {currentScreen === 'profile' && (
            <ProfileScreen
              user={user}
              wishlistCount={wishlist.length}
              onOpenPrescriptionModal={() => setIsPrescriptionOpen(true)}
              onNavigate={navigateTo}
              onLogout={handleLogout}
              onOpenAddProduct={handleOpenAddProduct}
              onResetProducts={handleResetProducts}
              onAddAddress={handleAddAddress}
              onUpdateAddress={handleUpdateAddress}
              onDeleteAddress={handleDeleteAddress}
              onSetDefaultAddress={handleSetDefaultAddress}
              onOpenChat={() => handleOpenChat()}
              unreadChatCount={unreadChatCount}
            />
          )}

          {currentScreen === 'welcome' && (
            <WelcomeScreen onNavigate={navigateTo} />
          )}

          {currentScreen === 'login' && (
            <LoginScreen
              onLoginSuccess={handleLoginSuccess}
              onNavigate={navigateTo}
            />
          )}

          {currentScreen === 'register' && (
            <RegisterScreen
              onRegisterSuccess={() => navigateTo('login')}
              onNavigate={navigateTo}
            />
          )}

          {currentScreen === 'forgot-password' && (
            <ForgotPasswordScreen onNavigate={navigateTo} />
          )}
        </main>

        {isAuthenticated && (
          <BottomNav
            currentScreen={currentScreen}
            cartCount={cartCount}
            onNavigate={navigateTo}
          />
        )}

        {/* Global Feedback Toast */}
        {toastMessage && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[390px] bg-surface-container-lowest p-3.5 rounded-2xl shadow-xl border border-primary/30 flex items-start gap-3 animate-in slide-in-from-top duration-200">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">info</span>
            </div>
            <div className="flex-1 text-xs">
              <p className="font-bold text-on-surface">การแจ้งเตือน</p>
              <p className="text-on-surface-variant text-[11px] mt-0.5">
                {toastMessage}
              </p>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-on-surface-variant p-0.5 hover:text-on-surface"
              aria-label="ปิดการแจ้งเตือน"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        )}

        {/* Admin Product Management Modal */}
        <AdminProductModal
          isOpen={isAdminProductModalOpen}
          onClose={() => {
            setIsAdminProductModalOpen(false);
            setEditingProduct(null);
          }}
          productToEdit={editingProduct}
          onSave={handleSaveProduct}
        />

        {/* 3D Virtual Try-On Modal */}
        <VirtualTryOnModal
          isOpen={isVirtualTryOnOpen}
          onClose={() => setIsVirtualTryOnOpen(false)}
          products={products}
          currentProduct={selectedProduct}
          onSelectProduct={(p) => setSelectedProduct(p)}
        />

        {/* Prescription Modal */}
        <PrescriptionModal
          isOpen={isPrescriptionOpen}
          onClose={() => setIsPrescriptionOpen(false)}
          prescription={user.prescription}
          onSave={handleSavePrescription}
        />

        {/* Receipt Modal */}
        <ReceiptModal
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
        />

        {/* Optometrist & Store Admin Chat Modal */}
        <ChatModal
          isOpen={isChatOpen}
          onClose={() => {
            setIsChatOpen(false);
            setChatProduct(null);
          }}
          currentUser={user}
          initialProduct={chatProduct}
          threads={chatThreads}
          onSendMessage={handleSendMessage}
          onNavigateToProduct={(prodId) => {
            const prod = products.find((p) => p.id === prodId);
            if (prod) {
              setSelectedProduct(prod);
              navigateTo('detail');
            }
          }}
        />

        {/* Real-time Push Notification Banner */}
        <PushNotificationBanner
          notification={activePushNotification}
          onClose={() => setActivePushNotification(null)}
          onClick={(notif) => handleSelectNotification(notif)}
        />

        {/* Notifications History Center Modal */}
        <NotificationsModal
          isOpen={isNotificationsModalOpen}
          onClose={() => setIsNotificationsModalOpen(false)}
          notifications={notifications}
          onMarkAllAsRead={handleMarkAllNotificationsAsRead}
          onSelectNotification={handleSelectNotification}
          onTriggerTestStage={handleUpdateDeliveryStage}
        />
      </div>
    </div>
  );
}
