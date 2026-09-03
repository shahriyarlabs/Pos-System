import React, { useState } from 'react';
import {
  Package,
  AlertTriangle,
  Plus,
  Minus,
  Search,
  Layers,
  FileCheck,
  TrendingDown,
  DollarSign,
  Tag,
  CheckCircle2,
  X,
  RefreshCw,
} from 'lucide-react';
import { InventoryItem } from '../types';

interface InventoryManagerProps {
  inventory: InventoryItem[];
  onUpdateStock: (itemId: string, newQuantity: number) => void;
  onAddNewItem: (item: Omit<InventoryItem, 'id' | 'lastRestocked'>) => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  inventory,
  onUpdateStock,
  onAddNewItem,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Add Item Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [nameBn, setNameBn] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState<'paper' | 'stationery' | 'supplies' | 'electronics'>('paper');
  const [stockQuantity, setStockQuantity] = useState('10');
  const [unit, setUnit] = useState('Pcs');
  const [unitBn, setUnitBn] = useState('টি');
  const [purchasePrice, setPurchasePrice] = useState('100');
  const [sellingPrice, setSellingPrice] = useState('150');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');

  // Filter items
  const filteredItems = inventory.filter((item) => {
    const matchesSearch =
      item.nameBn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
    if (showLowStockOnly && item.stockQuantity > item.lowStockThreshold) return false;

    return true;
  });

  const lowStockCount = inventory.filter((i) => i.stockQuantity <= i.lowStockThreshold).length;
  const totalPurchaseValue = inventory.reduce((sum, i) => sum + i.stockQuantity * i.purchasePrice, 0);
  const totalRetailValue = inventory.reduce((sum, i) => sum + i.stockQuantity * i.sellingPrice, 0);

  const handleStockAdjust = (itemId: string, currentQty: number, delta: number) => {
    const nextQty = Math.max(0, currentQty + delta);
    onUpdateStock(itemId, nextQty);
  };

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameBn.trim() || !code.trim()) {
      alert('পণ্যের নাম এবং কোড আবশ্যক');
      return;
    }

    onAddNewItem({
      code: code.trim().toUpperCase(),
      nameBn: nameBn.trim(),
      nameEn: nameEn.trim() || nameBn.trim(),
      category,
      stockQuantity: Number(stockQuantity) || 0,
      unit,
      unitBn,
      purchasePrice: Number(purchasePrice) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      lowStockThreshold: Number(lowStockThreshold) || 5,
    });

    setNameBn('');
    setNameEn('');
    setCode('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Overall Stock Metrics */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-600" />
              <span>স্টক ও ইনভেন্টরি ম্যানেজমেন্ট (Inventory Control)</span>
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
              কাগজ, প্রিন্টিং সামগ্রী ও স্টেশনারি
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            A4 পেপার রিম, ফটো পেপার, লেমিনেশন পাউচ, পেনড্রাইভ এবং স্টেশনারি সামগ্রীর মজুদ নিয়ন্ত্রণ
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-right">
            <p className="text-[10px] text-slate-500 font-semibold">মজুদ পণ্যের ক্রয়মূল্য</p>
            <p className="text-base font-black text-slate-800">
              ৳ {totalPurchaseValue.toLocaleString()}
            </p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl text-right">
            <p className="text-[10px] text-emerald-700 font-semibold">সম্ভাব্য বিক্রয়মূল্য</p>
            <p className="text-base font-black text-emerald-900">
              ৳ {totalRetailValue.toLocaleString()}
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন পণ্য যোগ</span>
          </button>
        </div>
      </div>

      {/* Low Stock Warning Banner if any */}
      {lowStockCount > 0 && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-rose-900">
                {lowStockCount}টি পণ্যের স্টক ন্যূনতম সীমার নিচে নেমে গেছে!
              </h4>
              <p className="text-xs text-rose-700 mt-0.5">
                ফটো পেপার বা A4 রিম দ্রুত রিস্টক করুন যেন সেবা প্রদানে কোনো বিঘ্ন না ঘটে।
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className="text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-xl transition shrink-0"
          >
            {showLowStockOnly ? 'সব পণ্য দেখুন' : 'শুধুমাত্র সতর্কবার্তা ফিল্টার'}
          </button>
        </div>
      )}

      {/* Search & Category Filter Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="পণ্যের নাম বা কোড দিয়ে খুঁজুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden transition"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto text-xs">
          {[
            { id: 'ALL', label: 'সকল মালামাল' },
            { id: 'paper', label: 'কাগজ ও রিম (Paper)' },
            { id: 'supplies', label: 'ল্যাব ও প্রিন্ট সামগ্রী' },
            { id: 'electronics', label: 'পেনড্রাইভ ও ক্যাবল' },
            { id: 'stationery', label: 'স্ট্যাম্প ও স্টেশনারি' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white font-bold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stock Items Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">আইটেম কোড</th>
                <th className="py-3 px-4">পণ্যের নাম (Product Name)</th>
                <th className="py-3 px-4">ক্যাটাগরি</th>
                <th className="py-3 px-4 text-right">ক্রয়মূল্য</th>
                <th className="py-3 px-4 text-right">বিক্রয়মূল্য</th>
                <th className="py-3 px-4 text-center">বর্তমান স্টক (Stock)</th>
                <th className="py-3 px-4 text-center">স্ট্যাটাস</th>
                <th className="py-3 px-4 text-center">কুইক স্টক অ্যাডজাস্ট</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    কোনো পণ্য পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isLow = item.stockQuantity <= item.lowStockThreshold;
                  const isOut = item.stockQuantity === 0;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/50 transition ${
                        isLow ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-semibold text-slate-500">
                        {item.code}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{item.nameBn}</div>
                        <div className="text-[10px] text-slate-400">{item.nameEn}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="capitalize px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-600">
                        ৳ {item.purchasePrice}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700">
                        ৳ {item.sellingPrice}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-sm font-black ${
                            isLow ? 'text-rose-600' : 'text-slate-800'
                          }`}
                        >
                          {item.stockQuantity}{' '}
                          <span className="text-[10px] font-normal text-slate-500">
                            {item.unitBn}
                          </span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isOut ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                            স্টক শেষ
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>পুনঃক্রয় সতর্কতা</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>পর্যাপ্ত</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                          <button
                            onClick={() => handleStockAdjust(item.id, item.stockQuantity, -1)}
                            className="w-6 h-6 rounded-lg bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 flex items-center justify-center font-bold text-xs shadow-xs transition"
                            title="১টি কমান (বিক্রি বা ব্যবহার)"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center font-mono font-bold text-xs">
                            {item.stockQuantity}
                          </span>
                          <button
                            onClick={() => handleStockAdjust(item.id, item.stockQuantity, 1)}
                            className="w-6 h-6 rounded-lg bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 flex items-center justify-center font-bold text-xs shadow-xs transition"
                            title="১টি বাড়ান (রিস্টক)"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleStockAdjust(item.id, item.stockQuantity, 5)}
                            className="px-1.5 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] shadow-xs transition ml-1"
                            title="৫টি রিস্টক করুন"
                          >
                            +৫
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Inventory Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">নতুন পণ্য / স্টক আইটেম যোগ করুন</h3>
                <p className="text-xs text-slate-300">Brothers Digital Center Inventory</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="p-6 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">আইটেম কোড *</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="উদাঃ PAP-A4-80"
                    className="w-full px-3 py-2 border rounded-xl font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ক্যাটাগরি *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-xl bg-white"
                  >
                    <option value="paper">কাগজ ও রিম (Paper)</option>
                    <option value="supplies">কালি ও ফটো পেপার (Supplies)</option>
                    <option value="electronics">ইলেকট্রনিক্স ও পেনড্রাইভ (Electronics)</option>
                    <option value="stationery">অন্যান্য স্টেশনারি (Stationery)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">পণ্যের নাম (বাংলা) *</label>
                <input
                  type="text"
                  required
                  value={nameBn}
                  onChange={(e) => setNameBn(e.target.value)}
                  placeholder="উদাঃ A4 পেপার রিম (ডাবল এ ৮০ জিএসএম)"
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">পণ্যের নাম (ইংরেজি)</label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="Double A 80GSM A4 Paper Ream"
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">মজুদ সংখ্যা</label>
                  <input
                    type="number"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">একক (Unit)</label>
                  <input
                    type="text"
                    value={unitBn}
                    onChange={(e) => setUnitBn(e.target.value)}
                    placeholder="রিম / প্যাকেট / টি"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">সতর্কবার্তা সীমা</label>
                  <input
                    type="number"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-rose-600 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ক্রয়মূল্য (৳)</label>
                  <input
                    type="number"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">বিক্রয়মূল্য (৳)</label>
                  <input
                    type="number"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border rounded-xl font-semibold text-slate-600"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition"
                >
                  পণ্য সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
