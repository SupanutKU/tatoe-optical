import React, { useMemo, useState } from 'react';
import type { Product, ScreenId } from '../types';
import { CATEGORY_LABELS, stockQuantity, stockState, summarizeCatalog } from '../lib/dashboardStats';

interface Props {
  products: Product[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  onRefresh: () => Promise<void>;
  onAdd: () => void;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onNavigate: (screen: ScreenId) => void;
}
const STATUS = {
  ready: { label: 'พร้อมจำหน่าย', className: 'bg-emerald-50 text-emerald-700' },
  low: { label: 'ใกล้หมด', className: 'bg-amber-50 text-amber-800' },
  out: { label: 'หมดสต็อก', className: 'bg-rose-50 text-rose-700' },
  unknown: { label: 'ไม่ระบุจำนวน', className: 'bg-slate-100 text-slate-600' },
};
export const AdminDashboard: React.FC<Props> = ({ products, loading, error, lastUpdated, onRefresh, onAdd, onEdit, onDelete, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [category, setCategory] = useState('all');
  const stats = useMemo(() => summarizeCatalog(products), [products]);
  const filtered = useMemo(() => products.filter(p =>
    `${p.id} ${p.name} ${p.colorName}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()) &&
    (filter === 'all' || stockState(p) === filter) && (category === 'all' || p.category === category)
  ), [products, query, filter, category]);
  const cards = [
    { label: 'สินค้าทั้งหมด', value: stats.total, unit: 'รุ่น', icon: 'inventory_2', color: 'text-blue-700 bg-blue-50' },
    { label: 'สต็อกที่ระบุจำนวน', value: stats.units, unit: 'ชิ้น', icon: 'shelves', color: 'text-emerald-700 bg-emerald-50' },
    { label: 'สินค้าใกล้หมด', value: stats.low, unit: 'รุ่น', icon: 'warning', color: 'text-amber-700 bg-amber-50' },
    { label: 'สินค้าหมดสต็อก', value: stats.out, unit: 'รุ่น', icon: 'remove_shopping_cart', color: 'text-rose-700 bg-rose-50' },
  ];
  return <div className="space-y-6 pb-6">
    <header className="rounded-3xl bg-[#003865] p-6 md:p-8 text-white shadow-lg">
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div><p className="text-xs tracking-widest text-blue-200">TATOE OPTICAL · ADMIN</p><h1 className="text-2xl md:text-3xl font-bold mt-2">ภาพรวมร้านแว่นตา</h1><p className="text-sm text-blue-100 mt-2">ติดตามสินค้าและจัดการคลังในหน้าเดียว</p></div>
        <button onClick={() => onNavigate('home')} className="rounded-xl bg-white/15 px-4 py-2 text-sm hover:bg-white/25">ดูหน้าร้าน ↗</button>
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/20 pt-4">
        <p className="text-xs text-blue-100">{lastUpdated ? `อัปเดต ${lastUpdated.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })} (เวลาไทย)` : 'ยังไม่ได้โหลดข้อมูลสินค้า'}</p>
        <div className="flex gap-2"><button disabled={loading} onClick={() => void onRefresh()} className="rounded-xl border border-white/30 px-3 py-2 text-sm disabled:opacity-50">{loading ? 'กำลังโหลด…' : '↻ รีเฟรช'}</button><button onClick={onAdd} className="rounded-xl bg-white text-[#003865] px-4 py-2 text-sm font-bold">+ เพิ่มสินค้า</button></div>
      </div>
    </header>
    {error && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">โหลดข้อมูลไม่สำเร็จ: {error} {lastUpdated && <span>กำลังแสดงข้อมูลที่โหลดสำเร็จครั้งก่อน</span>}<button onClick={() => void onRefresh()} disabled={loading} className="ml-3 underline font-bold">ลองใหม่</button></div>}
    {loading && <p role="status" className="text-sm text-slate-500">กำลังโหลดรายการสินค้า…</p>}
    <section aria-label="สรุปคลังสินค้า" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(card => <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><span className={`material-symbols-outlined rounded-xl p-2 ${card.color}`}>{card.icon}</span><p className="text-xs text-slate-500 mt-3">{card.label}</p><p className="text-3xl font-bold text-slate-900 mt-1">{!lastUpdated ? '—' : card.value.toLocaleString('th-TH')} <span className="text-xs font-normal text-slate-500">{card.unit}</span></p></div>)}
    </section>
    <div className="grid md:grid-cols-2 gap-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-bold text-slate-900">สัดส่วนสินค้าแต่ละหมวด</h2><p className="text-xs text-slate-500 mt-1">นับตามจำนวนรุ่นสินค้า</p><div className="mt-5 space-y-4">{Object.entries(stats.categories).map(([label, count]) => <div key={label}><div className="flex justify-between text-sm mb-2"><span>{label}</span><span className="text-slate-500">{count} รุ่น</span></div><div className="h-2.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-[#008b9a]" style={{ width: `${count / Math.max(1, stats.total) * 100}%` }} /></div></div>)}{!products.length && <p className="text-sm text-slate-500">ยังไม่มีข้อมูลสำหรับแสดงกราฟ</p>}</div></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-bold text-slate-900">รายการที่ควรตรวจสอบ</h2><div className="mt-4 space-y-3"><button className="w-full rounded-xl bg-amber-50 p-3 flex justify-between text-sm text-amber-900" onClick={() => { setFilter('low'); setCategory('all'); setQuery(''); }}>สินค้าใกล้หมด <strong>{stats.low} รุ่น →</strong></button><button className="w-full rounded-xl bg-rose-50 p-3 flex justify-between text-sm text-rose-900" onClick={() => { setFilter('out'); setCategory('all'); setQuery(''); }}>สินค้าหมดสต็อก <strong>{stats.out} รุ่น →</strong></button><p className="text-xs text-slate-500 leading-relaxed">เกณฑ์ใกล้หมด: คงเหลือ 1–5 ชิ้น หรือกำหนดสถานะใกล้หมดไว้ในสินค้า<br />มีสินค้าไม่ระบุจำนวน {stats.unknown} รุ่น ซึ่งไม่รวมในยอดสต็อกคงเหลือ</p></div></section>
    </div>
    <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div className="p-5 space-y-4"><div className="flex justify-between items-center gap-3"><h2 className="font-bold text-slate-900">จัดการสินค้า</h2><span className="text-xs text-slate-500">{filtered.length} / {products.length} รุ่น</span></div><div className="grid gap-3 md:grid-cols-3"><input aria-label="ค้นหาสินค้า" value={query} onChange={e => setQuery(e.target.value)} placeholder="ค้นหาชื่อ รหัส หรือสี…" className="rounded-xl border border-slate-200 p-3 text-sm w-full" /><select aria-label="หมวดสินค้า" value={category} onChange={e => setCategory(e.target.value)} className="rounded-xl border border-slate-200 p-3 text-sm"><option value="all">ทุกหมวดหมู่</option>{Object.entries(CATEGORY_LABELS).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select><select aria-label="สถานะสต็อก" value={filter} onChange={e => setFilter(e.target.value)} className="rounded-xl border border-slate-200 p-3 text-sm"><option value="all">ทุกสถานะสต็อก</option>{Object.entries(STATUS).map(([key,status]) => <option key={key} value={key}>{status.label}</option>)}</select></div></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-sm text-left"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{['สินค้า', 'หมวดหมู่', 'ราคา', 'คงเหลือ', 'สถานะ', 'จัดการ'].map(label => <th key={label} scope="col" className="px-5 py-3 font-medium">{label}</th>)}</tr></thead><tbody>{filtered.map(p => { const status = STATUS[stockState(p)]; return <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50"><td className="px-5 py-4"><div className="flex items-center gap-3">{p.images[0] ? <img src={p.images[0]} alt="" className="w-12 h-12 rounded-lg object-contain bg-slate-50" /> : <span className="material-symbols-outlined text-slate-300">eyeglasses</span>}<div><p className="font-semibold text-slate-900">{p.name}</p><p className="text-xs text-slate-500">#{p.id} · {p.colorName}</p></div></div></td><td className="px-5 py-4">{CATEGORY_LABELS[p.category] ?? 'อื่น ๆ'}</td><td className="px-5 py-4 whitespace-nowrap">฿{Number(p.price).toLocaleString('th-TH')}</td><td className="px-5 py-4">{stockQuantity(p) ?? 'ไม่ระบุ'}</td><td className="px-5 py-4"><span className={`text-xs rounded-full px-3 py-1 whitespace-nowrap ${status.className}`}>{status.label}</span></td><td className="px-5 py-4"><div className="flex gap-2"><button aria-label={`แก้ไข ${p.name}`} onClick={() => onEdit(p)} className="rounded-lg bg-blue-50 text-blue-700 px-3 py-2">แก้ไข</button><button aria-label={`ลบ ${p.name}`} onClick={() => onDelete(p.id)} className="rounded-lg bg-rose-50 text-rose-700 px-3 py-2">ลบ</button></div></td></tr>; })}</tbody></table></div>
      {!filtered.length && <div className="p-10 text-center text-sm text-slate-500">{loading ? 'กำลังโหลด…' : error && !lastUpdated ? 'ยังโหลดข้อมูลไม่ได้ กรุณาลองใหม่' : products.length ? 'ไม่พบสินค้าตามเงื่อนไข' : 'ยังไม่มีสินค้า เริ่มต้นด้วยปุ่มเพิ่มสินค้า'}{products.length > 0 && <button onClick={() => { setQuery('');setCategory('all');setFilter('all'); }} className="block mx-auto mt-3 text-blue-700 underline">ล้างตัวกรอง</button>}</div>}
    </section>
  </div>;
};
