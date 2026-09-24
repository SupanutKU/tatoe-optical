import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Product, ChatThread, ChatMessage, ChatProductAttachment } from '../types';
import { APP_LOGO } from '../data/mockData';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  initialProduct?: Product | null;
  threads: ChatThread[];
  onSendMessage: (
    threadId: string,
    text: string,
    sender: 'customer' | 'admin',
    senderName: string,
    productAttachment?: ChatProductAttachment
  ) => void;
  onNavigateToProduct?: (productId: string) => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialProduct,
  threads,
  onSendMessage,
  onNavigateToProduct
}) => {
  const [activeThreadId, setActiveThreadId] = useState<string>(threads[0]?.id || 'thread-1');
  const [inputVal, setInputVal] = useState('');
  const [replyMode, setReplyMode] = useState<'admin' | 'customer'>(
    currentUser.role === 'admin' ? 'admin' : 'customer'
  );
  const [showThreadList, setShowThreadList] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync mode with user role on open
  useEffect(() => {
    if (isOpen) {
      setReplyMode(currentUser.role === 'admin' ? 'admin' : 'customer');
    }
  }, [isOpen, currentUser.role]);

  // When initialProduct is provided, locate or match thread
  useEffect(() => {
    if (initialProduct && isOpen) {
      const existing = threads.find((t) => t.product?.id === initialProduct.id);
      if (existing) {
        setActiveThreadId(existing.id);
      }
    }
  }, [initialProduct, isOpen, threads]);

  const activeThread =
    threads.find((t) => t.id === activeThreadId) || threads[0];

  // Auto scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.messages, isOpen]);

  if (!isOpen) return null;

  const currentProductAttachment: ChatProductAttachment | undefined =
    initialProduct
      ? {
          id: initialProduct.id,
          name: initialProduct.name,
          price: initialProduct.price,
          imageUrl: initialProduct.images[0],
          category: initialProduct.category,
          lensType: initialProduct.lensType,
          colorName: initialProduct.colorName
        }
      : activeThread?.product;

  const handleSend = (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText !== undefined ? customText : inputVal;
    if (!textToSend.trim() || !activeThread) return;

    const senderName =
      replyMode === 'admin'
        ? 'แอดมิน TATOE Optical (Admin)'
        : `${currentUser.name} (ลูกค้า)`;

    // Attach product only if customer is inquiring, or if explicitly passed
    const attachProd =
      replyMode === 'customer' && currentProductAttachment
        ? currentProductAttachment
        : undefined;

    onSendMessage(activeThread.id, textToSend.trim(), replyMode, senderName, attachProd);
    setInputVal('');

    // If admin replies, simulate realistic customer follow-up acknowledgment after 2 seconds
    if (replyMode === 'admin') {
      setTimeout(() => {
        const customerReplies = [
          'ขอบคุณสำหรับคำแนะนำมากค่ะแอดมิน เดี๋ยวขอกดสั่งซื้อในระบบนะคะ ✨',
          'รับทราบข้อมูลค่ะ เดี๋ยวลองเลือกสีในระบบ 3D ก่อนนะคะ ขอบคุณมากค่ะ 🙏',
          'ขอบคุณค่ะแอดมิน ตอบรวดเร็วมากเลยค่ะ เดี๋ยวแจ้งค่าสายตาในขั้นตอนสั่งซื้อนะคะ 😊'
        ];
        const randomReply =
          customerReplies[Math.floor(Math.random() * customerReplies.length)];

        onSendMessage(
          activeThread.id,
          randomReply,
          'customer',
          activeThread.customerName
        );
      }, 2000);
    }
  };

  const adminQuickReplies = [
    'มีสินค้าพร้อมส่ง สั่งตัดเลนส์ได้ทันทีค่ะ 📦',
    'รุ่นนี้ใช้วัสดุไทเทเนียมแท้ น้ำหนักเบาเพียง 12 กรัม ไม่กดดั้งค่ะ 👓',
    'รองรับค่าสายตาสั้นได้ถึง -8.00D รวมเลนส์ Blue Block ให้เรียบร้อยค่ะ ✨',
    'ลูกค้าสามารถใช้ฟังก์ชัน 3D Virtual Try-On สแกนลองแว่นได้ในแอพเลยนะคะ 📷',
    'หน้าร้านเปิดบริการ 10:00 - 20:00 น. มีนักทัศนมาตรวัดสายตาฟรีค่ะ 🏬'
  ];

  const customerQuickQuestions = [
    `สินค้ารุ่นนี้มีของพร้อมส่งไหมคะ?`,
    `สายตาสั้น -1.75 ตัดเลนส์กรองแสงบลูบล็อคได้ไหมคะ?`,
    `กรอบแว่นรุ่นนี้เหมาะกับคนหน้ากลมไหมคะ?`,
    `มีหน้าร้านให้ลองแว่นตัวจริงไหมคะ?`
  ];

  return (
    <div
      id="chat-modal-backdrop"
      className="fixed inset-0 z-50 bg-inverse-surface/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        id="chat-modal-container"
        className="w-full max-w-[440px] bg-surface-container-lowest rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[90vh] sm:h-[85vh] border border-outline-variant/20"
      >
        {/* Top Header */}
        <div className="px-4 py-3 bg-primary text-on-primary flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <img
                src={APP_LOGO}
                alt="Support"
                className="w-9 h-9 rounded-full bg-white object-contain p-0.5 ring-2 ring-white/20"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-primary"></span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm leading-tight">แชทร้านTATOE Optical</h3>
                <span className="px-1.5 py-0.2 bg-white/20 rounded-md text-[10px] font-semibold">
                  Online
                </span>
              </div>
              <p className="text-[11px] text-on-primary/80">
                {replyMode === 'admin'
                  ? '👑 โหมดแอดมิน: คุณกำลังตอบแชทลูกค้า'
                  : '💬 ปรึกษาผู้เชี่ยวชาญ & สอบถามสินค้า'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Thread List Drawer Toggle */}
            <button
              type="button"
              onClick={() => setShowThreadList(!showThreadList)}
              className="px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold flex items-center gap-1 transition-colors active:scale-95"
              title="รายการแชทลูกค้า"
            >
              <span className="material-symbols-outlined text-[16px]">forum</span>
              <span className="hidden xs:inline">รายการแชท</span>
              {threads.filter((t) => t.unread).length > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
              )}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors active:scale-90"
              aria-label="ปิดแชท"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        {/* Sender Role Switcher Banner */}
        <div className="bg-surface-container-low px-4 py-2 border-b border-outline-variant/15 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-on-surface">
            <span className="text-[11px] text-on-surface-variant font-medium">ตอบในฐานะ:</span>
            <div className="flex bg-surface-container-high rounded-xl p-0.5">
              <button
                type="button"
                onClick={() => setReplyMode('admin')}
                className={`py-1 px-2.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                  replyMode === 'admin'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span>👑 แอดมินร้านค้า</span>
              </button>
              <button
                type="button"
                onClick={() => setReplyMode('customer')}
                className={`py-1 px-2.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                  replyMode === 'customer'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span>👤 ลูกค้า</span>
              </button>
            </div>
          </div>

          {activeThread && (
            <span className="text-[10px] text-on-surface-variant truncate max-w-[120px]">
              คุยกับ: <span className="font-bold text-on-surface">{activeThread.customerName}</span>
            </span>
          )}
        </div>

        {/* Thread List Dropdown / Overlay (for Admins to select which customer conversation to view/reply) */}
        {showThreadList && (
          <div className="bg-surface-container border-b border-outline-variant/20 p-3 max-h-56 overflow-y-auto animate-in slide-in-from-top-2 duration-150 flex flex-col gap-1.5 z-20 shadow-md">
            <div className="flex items-center justify-between pb-1 text-[11px] font-bold text-on-surface-variant">
              <span>เลือกห้องแชทลูกค้า ({threads.length})</span>
              <button
                type="button"
                onClick={() => setShowThreadList(false)}
                className="text-primary hover:underline text-[10px]"
              >
                ปิดรายการ
              </button>
            </div>
            {threads.map((thread) => {
              const isSelected = thread.id === activeThread?.id;
              const lastMsg = thread.messages[thread.messages.length - 1];

              return (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => {
                    setActiveThreadId(thread.id);
                    setShowThreadList(false);
                  }}
                  className={`w-full p-2.5 rounded-xl text-left border flex items-center gap-2.5 transition-all ${
                    isSelected
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-surface-container-lowest border-outline-variant/15 text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                    {thread.customerName.charAt(3) || 'C'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs truncate text-on-surface">
                        {thread.customerName}
                      </span>
                      <span className="text-[9px] text-on-surface-variant shrink-0">
                        {lastMsg?.time || ''}
                      </span>
                    </div>
                    {thread.product && (
                      <p className="text-[10px] text-primary truncate font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-[11px]">shopping_bag</span>
                        สอบถาม: {thread.product.name}
                      </p>
                    )}
                    <p className="text-[10px] text-on-surface-variant truncate">
                      {lastMsg?.text || 'ไม่มีข้อความ'}
                    </p>
                  </div>
                  {thread.unread && (
                    <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Product Context Banner (Shows which product this chat is about) */}
        {currentProductAttachment && (
          <div className="bg-surface-container-low/90 px-3.5 py-2 border-b border-outline-variant/15 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <img
                src={currentProductAttachment.imageUrl}
                alt={currentProductAttachment.name}
                className="w-10 h-10 rounded-lg object-contain bg-white p-0.5 border border-outline-variant/20 shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-secondary bg-secondary-fixed/50 px-1.5 py-0.2 rounded">
                    สินค้าที่สอบถาม
                  </span>
                  <span className="font-bold text-xs text-on-surface truncate">
                    {currentProductAttachment.name}
                  </span>
                </div>
                <p className="text-[11px] font-bold text-primary">
                  ฿{currentProductAttachment.price.toLocaleString()}
                  <span className="font-normal text-[10px] text-on-surface-variant ml-1.5">
                    {currentProductAttachment.lensType || 'เลนส์มัลติโค้ต'}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {onNavigateToProduct && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToProduct(currentProductAttachment.id);
                  }}
                  className="py-1 px-2.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-[10px] font-semibold flex items-center gap-0.5 transition-colors"
                >
                  <span>ดูสินค้า</span>
                  <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Messages Body */}
        <div className="flex-1 p-3.5 overflow-y-auto flex flex-col gap-3 bg-surface-container-low/50 text-xs">
          <div className="text-center my-0.5">
            <span className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant text-[10px]">
              วันนี้ • บริการให้คำปรึกษาและตอบคำถามสินค้า
            </span>
          </div>

          {activeThread?.messages.map((m) => {
            const isStoreOrAdmin = m.sender === 'store' || m.sender === 'admin';

            return (
              <div
                key={m.id}
                className={`flex flex-col max-w-[85%] ${
                  isStoreOrAdmin ? 'self-start items-start' : 'self-end items-end'
                }`}
              >
                {/* Sender Label */}
                <div className="flex items-center gap-1 mb-0.5 px-1 text-[10px] text-on-surface-variant">
                  {isStoreOrAdmin ? (
                    <>
                      <span className="font-bold text-primary flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[12px]">verified</span>
                        {m.sender === 'admin' ? 'แอดมิน TATOE Optical (Admin)' : 'ร้านTATOE Optical'}
                      </span>
                    </>
                  ) : (
                    <span className="font-medium">{m.senderName || 'ลูกค้า'}</span>
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`p-3 rounded-2xl leading-relaxed shadow-xs flex flex-col gap-2 ${
                    isStoreOrAdmin
                      ? 'bg-surface-container-lowest text-on-surface rounded-tl-xs border border-outline-variant/30'
                      : 'bg-primary text-on-primary rounded-tr-xs'
                  }`}
                >
                  {/* Embedded Product Card if message has product inquiry */}
                  {m.product && (
                    <div
                      className={`p-2 rounded-xl flex items-center gap-2 border transition-all ${
                        isStoreOrAdmin
                          ? 'bg-surface-container-low border-outline-variant/20'
                          : 'bg-white/10 border-white/20 text-on-primary'
                      }`}
                    >
                      <img
                        src={m.product.imageUrl}
                        alt={m.product.name}
                        className="w-12 h-12 rounded-lg object-contain bg-white p-0.5 shrink-0 shadow-xs"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-[9px] font-semibold opacity-80 block">
                          [อ้างอิงสินค้าที่สอบถาม]
                        </span>
                        <p className="font-bold text-xs truncate leading-snug">{m.product.name}</p>
                        <p className="font-bold text-[11px] text-amber-500">
                          ฿{m.product.price.toLocaleString()}
                        </p>
                      </div>
                      {onNavigateToProduct && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onNavigateToProduct(m.product!.id);
                          }}
                          className={`p-1.5 rounded-lg text-[10px] font-bold shrink-0 ${
                            isStoreOrAdmin
                              ? 'bg-primary/10 text-primary hover:bg-primary/20'
                              : 'bg-white text-primary hover:bg-white/90'
                          }`}
                        >
                          ดูตัวนี้
                        </button>
                      )}
                    </div>
                  )}

                  <p className="whitespace-pre-wrap">{m.text}</p>
                </div>

                {/* Timestamp */}
                <span className="text-[9px] text-on-surface-variant mt-0.5 px-1">{m.time}</span>
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="bg-surface-container-lowest px-3 py-1.5 border-t border-outline-variant/15 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-bold text-on-surface-variant shrink-0 flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[12px]">
              {replyMode === 'admin' ? 'quickreply' : 'help_outline'}
            </span>
            {replyMode === 'admin' ? 'คำตอบด่วน (Admin):' : 'ถามคำถามด่วน:'}
          </span>

          {(replyMode === 'admin' ? adminQuickReplies : customerQuickQuestions).map(
            (reply, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(undefined, reply)}
                className={`text-[10px] py-1 px-2.5 rounded-full border whitespace-nowrap shrink-0 transition-all active:scale-95 ${
                  replyMode === 'admin'
                    ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                    : 'bg-surface-container-low text-on-surface border-outline-variant/30 hover:bg-surface-container-high'
                }`}
              >
                {reply}
              </button>
            )
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => handleSend(e)}
          className={`p-3 border-t flex items-center gap-2 transition-colors ${
            replyMode === 'admin'
              ? 'bg-amber-500/5 border-amber-500/20'
              : 'bg-surface-container-lowest border-outline-variant/20'
          }`}
        >
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={
              replyMode === 'admin'
                ? '👑 พิมพ์ข้อความตอบกลับลูกค้าในฐานะแอดมินร้าน...'
                : 'พิมพ์ข้อความสอบถามทางร้านเกี่ยวกับสินค้านี้...'
            }
            className="flex-1 h-10 px-3.5 rounded-full bg-surface-container-low text-on-surface text-xs focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary focus:outline-none transition-all"
          />

          <button
            type="submit"
            disabled={!inputVal.trim()}
            className={`h-10 px-4 rounded-full font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${
              replyMode === 'admin'
                ? 'bg-amber-600 text-white hover:bg-amber-700'
                : 'bg-primary text-on-primary hover:bg-primary-container'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">send</span>
            <span>{replyMode === 'admin' ? 'ตอบลูกค้า' : 'ส่ง'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
