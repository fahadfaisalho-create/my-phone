'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError, fileUrl } from '@/lib/api';
import { Product } from '@/lib/types';
import FileField from '@/components/FileField';

export default function ProductsTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [qty, setQty] = useState('');
  const [desc, setDesc] = useState('');
  const [image, setImage] = useState<File | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<Product[]>('/stores/me/products');
      setProducts(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذّر تحميل المنتجات');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd() {
    if (!name.trim() || !price) return;
    setSaving(true);
    setError('');
    try {
      const form = new FormData();
      form.append('name', name.trim());
      if (category.trim()) form.append('category', category.trim());
      form.append('price', price);
      if (qty) form.append('quantity', qty);
      if (desc.trim()) form.append('description', desc.trim());
      if (image) form.append('image', image);

      await apiFetch('/stores/me/products', { method: 'POST', body: form });
      setName('');
      setCategory('');
      setPrice('');
      setQty('');
      setDesc('');
      setImage(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذّر حفظ المنتج');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiFetch(`/stores/me/products/${id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذّر حذف المنتج');
    }
  }

  return (
    <div>
      <div className="card">
        <h3>إضافة منتج جديد</h3>
        <div className="row2">
          <input placeholder="اسم المنتج" value={name} onChange={(e) => setName(e.target.value)} />
          <input
            placeholder="النوع: إكسسوار / قطعة غيار"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>
        <div className="row2">
          <input
            placeholder="السعر بدون ضريبة"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <input
            placeholder="الكمية المتوفرة"
            type="number"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
        </div>
        <textarea
          placeholder="وصف المنتج (اختياري)"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
        <FileField label="صورة المنتج" accept="image/*" file={image} onChange={setImage} previewAsImage />
        {error && <div className="err">{error}</div>}
        <button className="primary" onClick={handleAdd} disabled={saving || !name.trim() || !price}>
          {saving ? 'جارٍ الحفظ...' : 'حفظ ونشر المنتج'}
        </button>
      </div>

      <div className="card">
        <h3>منتجاتك</h3>
        {loading ? (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>جارٍ التحميل...</p>
        ) : products.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>لا يوجد منتجات بعد</p>
        ) : (
          products.map((p) => (
            <div className="rowline" key={p.id}>
              <span style={{ display: 'flex', alignItems: 'center' }}>
                {p.imageUrl && <img src={fileUrl(p.imageUrl)!} className="thumb" alt={p.name} />}
                {p.name}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: 'var(--muted)' }}>
                  {p.price} ﷼ · متوفر {p.quantity}
                </span>
                <button className="link" onClick={() => handleDelete(p.id)}>
                  حذف
                </button>
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
