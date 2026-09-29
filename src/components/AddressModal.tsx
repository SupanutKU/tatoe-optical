import React, { useState, useEffect } from 'react';
import { UserAddress, AddressType } from '../types';

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (addressData: Omit<UserAddress, 'id'> & { id?: string }) => void;
  editingAddress: UserAddress | null;
}

export const AddressModal: React.FC<AddressModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingAddress
}) => {
  const [type, setType] = useState<AddressType>('home');
  const [title, setTitle] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [subdistrict, setSubdistrict] = useState('');
  const [district, setDistrict] = useState('');
  const [province, setProvince] = useState('กรุงเทพฯ');
  const [postalCode, setPostalCode] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    if (editingAddress) {
      setType(editingAddress.type);
      setTitle(editingAddress.title);
      setRecipientName(editingAddress.recipientName);
      setPhone(editingAddress.phone);
      setAddressLine(editingAddress.addressLine);
      setSubdistrict(editingAddress.subdistrict);
      setDistrict(editingAddress.district);
      setProvince(editingAddress.province);
      setPostalCode(editingAddress.postalCode);
      setIsDefault(editingAddress.isDefault);
    } else {
      setType('home');
      setTitle('');
      setRecipientName('คุณพิชญา วงศ์สว่าง');
      setPhone('089-123-4567');
      setAddressLine('');
      setSubdistrict('');
      setDistrict('');
      setProvince('กรุงเทพฯ');
      setPostalCode('');
      setIsDefault(false);
    }
  }, [editingAddress, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressLine.trim() || !recipientName.trim() || !phone.trim()) return;

    const defaultTitle =
      title.trim() ||
      (type === 'home'
        ? 'ที่บ้าน'
        : type === 'office'
        ? 'บริษัท / ที่ทำงาน'
        : 'ที่อยู่อื่นๆ');

    onSave({
      id: editingAddress?.id,
      type,
      title: defaultTitle,
      recipientName: recipientName.trim(),
      phone: phone.trim(),
      addressLine: addressLine.trim(),
      subdistrict: subdistrict.trim(),
      district: district.trim(),
      province: province.trim(),
      postalCode: postalCode.trim(),
      isDefault
    });
    onClose();
  };

  return (
    <div
      id="address-modal-overlay"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="address-modal-container"
        className="w-full max-w-md bg-surface-container-lowest rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] border border-outline-variant/20 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-5 border-b border-outline-variant/15 bg-surface-container-low/60">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">
              {editingAddress ? 'edit_location_alt' : 'add_location_alt'}
            </span>
            <h2 className="font-bold text-base text-on-surface">
              {editingAddress ? 'แก้ไขที่อยู่จัดส่ง' : 'เพิ่มที่อยู่จัดส่งใหม่'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-high text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 text-xs">
          {/* Address Type Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-on-surface text-[11px]">ประเภทสถานที่จัดส่ง</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setType('home');
                  if (!title || title.includes('บริษัท')) setTitle('ที่บ้าน');
                }}
                className={`py-2 px-2.5 rounded-xl border flex items-center justify-center gap-1.5 font-bold text-xs transition-all ${
                  type === 'home'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-900 shadow-xs'
                    : 'bg-surface-container-low border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <span className="material-symbols-outlined text-[16px] text-amber-600">home</span>
                <span>บ้าน</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('office');
                  if (!title || title.includes('บ้าน')) setTitle('บริษัท / ที่ทำงาน');
                }}
                className={`py-2 px-2.5 rounded-xl border flex items-center justify-center gap-1.5 font-bold text-xs transition-all ${
                  type === 'office'
                    ? 'bg-primary/10 border-primary text-primary shadow-xs'
                    : 'bg-surface-container-low border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <span className="material-symbols-outlined text-[16px] text-primary">domain</span>
                <span>บริษัท</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('other');
                  if (!title) setTitle('คอนโด / ที่อยู่อื่นๆ');
                }}
                className={`py-2 px-2.5 rounded-xl border flex items-center justify-center gap-1.5 font-bold text-xs transition-all ${
                  type === 'other'
                    ? 'bg-secondary/15 border-secondary text-secondary shadow-xs'
                    : 'bg-surface-container-low border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">location_on</span>
                <span>อื่นๆ</span>
              </button>
            </div>
          </div>

          {/* Title / Nickname */}
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-on-surface text-[11px]">
              ชื่อเรียกที่อยู่นี้ (เช่น บ้าน, ออฟฟิศสาทร, คอนโด)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === 'home' ? 'เช่น ที่บ้าน, บ้านคุณพ่อ' : type === 'office' ? 'เช่น บริษัท ออฟฟิศสาขาใหญ่' : 'เช่น คอนโดสุขุมวิท'}
              className="h-10 px-3 rounded-xl bg-surface-container-low text-on-surface focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary focus:outline-none transition-all"
            />
          </div>

          {/* Recipient Name & Phone */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-on-surface text-[11px]">
                ชื่อ-นามสกุล ผู้รับ <span className="text-error">*</span>
              </label>
              <input
                type="text"
                required
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="ชื่อผู้รับพัสดุ"
                className="h-10 px-3 rounded-xl bg-surface-container-low text-on-surface focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary focus:outline-none transition-all"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-on-surface text-[11px]">
                เบอร์โทรศัพท์ <span className="text-error">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08X-XXX-XXXX"
                className="h-10 px-3 rounded-xl bg-surface-container-low text-on-surface focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Address Line */}
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-on-surface text-[11px]">
              บ้านเลขที่, อาคาร, ชั้น, ซอย, ถนน <span className="text-error">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={addressLine}
              onChange={(e) => setAddressLine(e.target.value)}
              placeholder="เช่น 123/45 อาคาร ABC ชั้น 4 ซอยสุขุมวิท 21 ถนนสุขุมวิท"
              className="p-3 rounded-xl bg-surface-container-low text-on-surface focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary focus:outline-none transition-all resize-none"
            />
          </div>

          {/* Subdistrict & District */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-on-surface text-[11px]">แขวง / ตำบล</label>
              <input
                type="text"
                value={subdistrict}
                onChange={(e) => setSubdistrict(e.target.value)}
                placeholder="แขวง / ตำบล"
                className="h-10 px-3 rounded-xl bg-surface-container-low text-on-surface focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary focus:outline-none transition-all"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-on-surface text-[11px]">เขต / อำเภอ</label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="เขต / อำเภอ"
                className="h-10 px-3 rounded-xl bg-surface-container-low text-on-surface focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Province & Postal Code */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-on-surface text-[11px]">จังหวัด</label>
              <input
                type="text"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                placeholder="กรุงเทพฯ หรือ จังหวัด"
                className="h-10 px-3 rounded-xl bg-surface-container-low text-on-surface focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary focus:outline-none transition-all"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-on-surface text-[11px]">รหัสไปรษณีย์</label>
              <input
                type="text"
                maxLength={5}
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="เช่น 10330"
                className="h-10 px-3 rounded-xl bg-surface-container-low text-on-surface focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary focus:outline-none transition-all font-mono"
              />
            </div>
          </div>

          {/* Is Default Checkbox */}
          <label className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-container-low/70 cursor-pointer select-none border border-outline-variant/15 mt-1 hover:bg-surface-container-low transition-colors">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
            />
            <div className="flex flex-col">
              <span className="font-bold text-xs text-on-surface flex items-center gap-1">
                <span className="material-symbols-outlined text-amber-500 text-[16px]">star</span>
                ตั้งเป็นที่อยู่จัดส่งหลัก (Default Address)
              </span>
              <span className="text-[10px] text-on-surface-variant">
                ระบบจะเลือกที่อยู่นี้เป็นค่าเริ่มต้นเมื่อสั่งซื้อสินค้า
              </span>
            </div>
          </label>

          {/* Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/15 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-outline-variant/30 text-on-surface-variant font-bold text-xs hover:bg-surface-container-high transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-primary text-on-primary font-bold text-xs hover:bg-primary-container shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              <span>บันทึกที่อยู่</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
