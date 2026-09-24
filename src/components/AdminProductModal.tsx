import React, { useState, useEffect } from 'react';
import { Product } from '../types';

interface AdminProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  onSave: (productData: Partial<Product> & { id?: string }) => void;
}

const PRESET_IMAGES = [
  {
    label: 'Urban Black',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZMBqH7_MCWY1cBhlruy859V0cxY-NxSQUxCG4zmhZafutZ28DzT077CdnA1wp1WD-ExOa29UHOjFnOqLZlTEO_p-5SkNIfoNo4It2cze4a4yE5RQnz6XMQfglI8V1VIANCK_-GY6cHv7hmrt_7v1DMt767zG2xO0OUXG4F8S4YnoTiTXv_BYkka0zl0dDFZLzvhxA6nORP00LLfFvlhWKTbNa8kGEpaq0Jv8VrgyCp8iOzL1suXWc'
  },
  {
    label: 'Classic Tortoise',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC9HNbXRFZuqswBX2QX48TXQIqhDPMffK3LJpqoN0ShL2kB0uihjxU_JJ7bYxuP707KoBl2vBl6vIRkjxGYH6W4L0H9sHR_Eji3NwtLztxZpVp-d34ENg3N7kUwB3Jy4FudXqNTErJR8ZtIvGADkiP4KYGBjeYdQl86KtlTSBmOA0JVnqEaGavlFdKCi7d7k677k_eboPAMe6z6m7S_u4G_FmM_KffPP4grg-6Hxrl67ZZZuXtkhsYd'
  },
  {
    label: 'Blue Light Clear',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBf9W5H7aMvErlMvK4jL13x2aZ5h8o20y8qU91_ErhG78yG_x34kL5g7h1Zqj_8o20y8qU=w300'
  },
  {
    label: 'Sun Pro Dark',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCL3Jj59yE9L8mF2b8y24_G8c9K100Zk19y8U1_ErhG78yG_x34kL5g7h1Zqj_8o20y8qU=w300'
  },
  {
    label: 'Minimalist Silver',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCQb321_E5x2Y8L9K00z19y8U1_ErhG78yG_x34kL5g7h1Zqj_8o20y8qU9kZ5g8h1Zqj=w300'
  },
  {
    label: 'Retro Amber',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAIaiYIJW70zu6ufptXQ1BlKO7bgzb4GJD2OjUK4ZOlj9TozLwa-u64JwEuHy2i7QAPyDrxG3Amed5LrYj1XB3T1Ltew_ZUBJdn5SDwwZZlXJ5kCvuwZ43lpDAOA6ZVlQ-7oH-Xy4LOzUG7oPXrPmXmg6W-CEgO8_dKMOmsgrbtJxZJ6kwp9v73n7X05RdDRGBYEM5BmRGc8EcFXQ1Xvy4NYuSlOJwl8rb_UyyrjYvdmu75pGW0w1QE'
  }
];

export const AdminProductModal: React.FC<AdminProductModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  onSave
}) => {
  const [name, setName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [colorName, setColorName] = useState('');
  const [price, setPrice] = useState('1290');
  const [originalPrice, setOriginalPrice] = useState('1890');
  const [category, setCategory] = useState<'prescription' | 'sunglasses' | 'blue-light' | 'sports'>('prescription');
  const [shape, setShape] = useState<'round' | 'square' | 'drop' | 'cat-eye'>('square');
  const [material, setMaterial] = useState<'titanium' | 'acetate' | 'tr90' | 'metal'>('titanium');
  const [lensType, setLensType] = useState('เลนส์บลูบล็อกปรับแสงอัตโนมัติ');
  const [weight, setWeight] = useState('8.5g');
  const [size, setSize] = useState('51-18-142 mm');
  const [tag, setTag] = useState('Ultra Light');
  const [badge, setBadge] = useState<'Best Seller' | 'New' | ''>('New');
  const [stockStatus, setStockStatus] = useState<'in_stock' | 'low_stock' | 'out_of_stock'>('in_stock');
  const [imageUrl, setImageUrl] = useState(PRESET_IMAGES[0].url);
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setSubtitle(productToEdit.subtitle || '');
      setColorName(productToEdit.colorName);
      setPrice(productToEdit.price.toString());
      setOriginalPrice(productToEdit.originalPrice ? productToEdit.originalPrice.toString() : '');
      setCategory(productToEdit.category);
      setShape(productToEdit.shape);
      setMaterial(productToEdit.material);
      setLensType(productToEdit.lensType);
      setWeight(productToEdit.weight);
      setSize(productToEdit.size);
      setTag(productToEdit.tag || '');
      setBadge(productToEdit.badge || '');
      setStockStatus(productToEdit.stockStatus);
      setImageUrl(productToEdit.images[0] || PRESET_IMAGES[0].url);
      setDescription(productToEdit.description);
    } else {
      setName('');
      setSubtitle('(รุ่นใหม่ 2025)');
      setColorName('ดำด้าน Matte Black');
      setPrice('1290');
      setOriginalPrice('1890');
      setCategory('prescription');
      setShape('square');
      setMaterial('titanium');
      setLensType('เลนส์บลูบล็อกปรับแสงอัตโนมัติ');
      setWeight('8.5g');
      setSize('51-18-142 mm');
      setTag('Ultra Light');
      setBadge('New');
      setStockStatus('in_stock');
      setImageUrl(PRESET_IMAGES[0].url);
      setDescription('กรอบแว่นตาน้ำหนักเบาพิเศษ ผลิตจากวัสดุพรีเมียม ใส่สบายตลอดวัน');
    }
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('กรุณากรอกชื่อสินค้า');
      return;
    }

    const numPrice = parseFloat(price) || 990;
    const numOriginal = originalPrice ? parseFloat(originalPrice) : undefined;
    const discountPct = numOriginal && numOriginal > numPrice
      ? Math.round(((numOriginal - numPrice) / numOriginal) * 100)
      : undefined;

    onSave({
      id: productToEdit?.id,
      name: name.trim(),
      subtitle: subtitle.trim() || undefined,
      colorName: colorName.trim() || 'สีมาตรฐาน',
      price: numPrice,
      originalPrice: numOriginal,
      discountPercentage: discountPct,
      category,
      shape,
      material,
      lensType: lensType.trim(),
      weight: weight.trim(),
      size: size.trim(),
      tag: tag.trim() || undefined,
      badge: (badge as 'Best Seller' | 'New') || undefined,
      stockStatus,
      images: [imageUrl, imageUrl, imageUrl],
      description: description.trim() || 'แว่นตาคุณภาพสูงจากร้านTATOE Optical'
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-inverse-surface/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-[430px] bg-surface-container-lowest rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-outline-variant/20 bg-surface-container-low">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">
              {productToEdit ? 'edit_note' : 'add_circle'}
            </span>
            <h3 className="font-bold text-[16px] text-on-surface">
              {productToEdit ? 'แก้ไขข้อมูลสินค้า' : 'เพิ่มสินค้าใหม่ (Admin)'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors active:scale-90"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex flex-col gap-4 text-xs">
          {/* Product Name */}
          <div className="flex flex-col gap-1">
            <label className="font-bold text-on-surface text-[11px]">ชื่อรุ่นแว่นตา *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น Big Eye Urban Titanium"
              className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface font-semibold focus:border-primary focus:outline-none"
            />
          </div>

          {/* Subtitle & Tag */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-on-surface text-[11px]">คำขยาย (Subtitle)</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="เช่น (Titanium Edition)"
                className="w-full h-9 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface focus:border-primary focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-on-surface text-[11px]">ป้ายแท็ก (Tag)</label>
              <input
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="เช่น Ultra Light, Blue Block"
                className="w-full h-9 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Price & Original Price */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-bold text-primary text-[11px]">ราคาขาย (฿) *</label>
              <input
                type="number"
                required
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="1290"
                className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 text-primary font-bold focus:border-primary focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-on-surface-variant text-[11px]">ราคาเดิม (฿)</label>
              <input
                type="number"
                min="0"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="1890"
                className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface-variant focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Color & Stock Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-on-surface text-[11px]">สีกรอบแว่น</label>
              <input
                type="text"
                value={colorName}
                onChange={(e) => setColorName(e.target.value)}
                placeholder="เช่น ดำด้าน Matte Black"
                className="w-full h-9 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface focus:border-primary focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-on-surface text-[11px]">สถานะสินค้า</label>
              <select
                value={stockStatus}
                onChange={(e) => setStockStatus(e.target.value as any)}
                className="w-full h-9 px-2 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface font-medium focus:border-primary focus:outline-none"
              >
                <option value="in_stock">มีสินค้าพร้อมส่ง</option>
                <option value="low_stock">เหลือจำนวนจำกัด</option>
                <option value="out_of_stock">สินค้าหมดชั่วคราว</option>
              </select>
            </div>
          </div>

          {/* Category, Shape & Material */}
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-on-surface text-[11px]">หมวดหมู่</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full h-9 px-1.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface focus:border-primary focus:outline-none text-[11px]"
              >
                <option value="prescription">แว่นสายตา</option>
                <option value="sunglasses">แว่นกันแดด</option>
                <option value="blue-light">แว่นกรองแสง</option>
                <option value="sports">แว่นกีฬา</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-on-surface text-[11px]">ทรงแว่น</label>
              <select
                value={shape}
                onChange={(e) => setShape(e.target.value as any)}
                className="w-full h-9 px-1.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface focus:border-primary focus:outline-none text-[11px]"
              >
                <option value="square">ทรงเหลี่ยม</option>
                <option value="round">ทรงหยดน้ำ/กลม</option>
                <option value="drop">ทรงหยดน้ำ</option>
                <option value="cat-eye">แคทอาย</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-on-surface text-[11px]">วัสดุกรอบ</label>
              <select
                value={material}
                onChange={(e) => setMaterial(e.target.value as any)}
                className="w-full h-9 px-1.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface focus:border-primary focus:outline-none text-[11px]"
              >
                <option value="titanium">ไทเทเนียม</option>
                <option value="acetate">อะซิเตท</option>
                <option value="tr90">TR90 ยืดหยุ่น</option>
                <option value="metal">โลหะผสม</option>
              </select>
            </div>
          </div>

          {/* Lens Type & Weight */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-on-surface text-[11px]">ชนิดเลนส์</label>
              <input
                type="text"
                value={lensType}
                onChange={(e) => setLensType(e.target.value)}
                placeholder="เช่น เลนส์บลูบล็อกปรับแสง"
                className="w-full h-9 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface focus:border-primary focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-on-surface text-[11px]">น้ำหนักกรอบ</label>
              <input
                type="text"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="เช่น 8.5g"
                className="w-full h-9 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Image Presets Picker */}
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-on-surface text-[11px]">เลือกภาพตัวอย่างสินค้า</label>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_IMAGES.map((preset, idx) => {
                const isSelected = imageUrl === preset.url;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setImageUrl(preset.url)}
                    className={`relative p-1.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                      isSelected
                        ? 'border-primary bg-primary-fixed/20 ring-2 ring-primary/40'
                        : 'border-outline-variant/30 bg-surface-container-low hover:border-primary/40'
                    }`}
                  >
                    <img src={preset.url} alt={preset.label} className="w-12 h-10 object-contain" />
                    <span className="text-[10px] text-on-surface truncate w-full text-center">
                      {preset.label}
                    </span>
                    {isSelected && (
                      <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-primary text-white flex items-center justify-center text-[10px]">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-on-surface text-[11px]">รายละเอียดสินค้า</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ระบุจุดเด่นและความสบายในการสวมใส่..."
              className="w-full p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface focus:border-primary focus:outline-none text-xs"
            ></textarea>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-2 pt-2 border-t border-outline-variant/20">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-xl bg-surface-container-high text-on-surface font-semibold text-xs active:scale-98 transition-all"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 h-11 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              <span>{productToEdit ? 'บันทึกการแก้ไข' : 'บันทึกสินค้าใหม่'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
