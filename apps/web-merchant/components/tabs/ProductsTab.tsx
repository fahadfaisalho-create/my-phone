'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError, fileUrl, CONSUMER_APP_ORIGIN } from '@/lib/api';
import { Branch, Product } from '@/lib/types';
import FileField from '@/components/FileField';
import { useLocale } from '@/lib/i18n';

export default function ProductsTab({ onChanged }: { onChanged?: () => void }) {
  const { t, tf } = useLocale();
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [storeId, setStoreId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [qty, setQty] = useState('');
  const [desc, setDesc] = useState('');
  const [image, setImage] = useState<File | null>(null);
  // فارغ = مشترك بين كل فروع المحل، أو معرّف فرع محدد = مخزون منفصل خاص بهذا الفرع
  const [branchId, setBranchId] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [productsData, branchesData, store] = await Promise.all([
        apiFetch<Product[]>('/stores/me/products'),
        apiFetch<Branch[]>('/stores/me/branches'),
        apiFetch<{ id: string }>('/stores/me'),
      ]);
      setProducts(productsData);
      setBranches(branchesData);
      setStoreId(store.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('products.loadError'));
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyLink(productId: string) {
    try {
      await navigator.clipboard.writeText(`${CONSUMER_APP_ORIGIN}/store/${storeId}?product=${productId}`);
      setCopiedId(productId);
      setTimeout(() => setCopiedId((v) => (v === productId ? null : v)), 2000);
    } catch {
      // بعض المتصفحات تمنع الوصول للحافظة بدون HTTPS — نتجاهل بصمت
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ميزة إزالة الخلفية بالذكاء الاصطناعي معطّلة مؤقتاً (راجع تعليق
  // lib/removeImageBackground.ts) — الصورة تُعتمد كما هي حالياً.
  async function handlePickImage(file: File | null) {
    setImage(file);
  }

  async function handleAdd() {
    if (!name.trim() || !price) return;
    if (!image) {
      setError(t('products.imageRequired'));
      return;
    }
    setSaving(true);
    setError('');
    try {
      const form = new FormData();
      form.append('name', name.trim());
      if (category.trim()) form.append('category', category.trim());
      form.append('price', price);
      if (qty) form.append('quantity', qty);
      if (desc.trim()) form.append('description', desc.trim());
      form.append('image', image);
      if (branchId) form.append('branchId', branchId);

      await apiFetch('/stores/me/products', { method: 'POST', body: form });
      setName('');
      setCategory('');
      setPrice('');
      setQty('');
      setDesc('');
      setImage(null);
      setBranchId('');
      await load();
      onChanged?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('products.saveError'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiFetch(`/stores/me/products/${id}`, { method: 'DELETE' });
      await load();
      onChanged?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('products.deleteError'));
    }
  }

  return (
    <div>
      <div className="card">
        <h3>{t('products.addHeading')}</h3>
        <div className="row2">
          <input placeholder={t('products.namePlaceholder')} value={name} onChange={(e) => setName(e.target.value)} />
          <input
            placeholder={t('products.categoryPlaceholder')}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>
        <div className="row2">
          <input
            placeholder={t('products.pricePlaceholder')}
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <input
            placeholder={t('products.qtyPlaceholder')}
            type="number"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
        </div>
        <textarea
          placeholder={t('products.descPlaceholder')}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
        {branches.length > 1 && (
          <>
            <label htmlFor="productBranch">{t('products.stockLabel')}</label>
            <select id="productBranch" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
              <option value="">{t('products.stockShared')}</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {tf('products.stockBranch', b.name)}
                </option>
              ))}
            </select>
          </>
        )}
        <FileField
          label={`${t('products.imageLabel')} *`}
          required
          accept="image/*"
          file={image}
          onChange={handlePickImage}
          previewAsImage
        />
        {processingImage && <p className="note">{t('products.processingImage')}</p>}
        {error && <div className="err">{error}</div>}
        <button className="primary" onClick={handleAdd} disabled={saving || processingImage || !name.trim() || !price || !image}>
          {saving ? t('common.saving') : t('products.saveAndPublish')}
        </button>
      </div>

      <div className="card">
        <h3>{t('products.listHeading')}</h3>
        {loading ? (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>{t('common.loading')}</p>
        ) : products.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>{t('products.empty')}</p>
        ) : (
          products.map((p) => (
            <div className="rowline" key={p.id}>
              <span style={{ display: 'flex', alignItems: 'center' }}>
                {p.imageUrl && <img src={fileUrl(p.imageUrl)!} className="thumb" alt={p.name} />}
                {p.name}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: 'var(--muted)' }}>
                  {p.price} ﷼ · {t('products.available')} {p.quantity}
                  {branches.length > 1 && (
                    <> · {p.branch ? p.branch.name : t('products.shared')}</>
                  )}
                </span>
                <button className="link" onClick={() => handleCopyLink(p.id)} disabled={!storeId}>
                  {copiedId === p.id ? t('products.copied') : t('products.copyLink')}
                </button>
                <button className="link" onClick={() => handleDelete(p.id)}>
                  {t('common.delete')}
                </button>
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
