'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

// يُحمَّل بدون SSR فقط — Leaflet يحتاج window/document وما يشتغل على السيرفر
const LeafletMapInner = dynamic(() => import('./LeafletMapInner'), {
  ssr: false,
  loading: () => (
    <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 13 }}>
      جارٍ تحميل الخريطة...
    </div>
  ),
});

const RIYADH: [number, number] = [24.7136, 46.6753];

export default function BranchMapPicker({
  lat,
  lng,
  onPick,
  onAddressSuggestion,
}: {
  lat: number | null;
  lng: number | null;
  onPick: (lat: number, lng: number) => void;
  onAddressSuggestion?: (address: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');

  const current: [number, number] = lat !== null && lng !== null ? [lat, lng] : RIYADH;

  async function reverseGeocode(la: number, ln: number) {
    if (!onAddressSuggestion) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${la}&lon=${ln}&accept-language=ar`,
      );
      const data = await res.json();
      if (data?.display_name) onAddressSuggestion(data.display_name);
    } catch {
      // العنوان النصي اقتراح فقط — تجاهل صامت لو فشل الاتصال بخدمة الترميز الجغرافي
    }
  }

  function handlePick(la: number, ln: number) {
    onPick(la, ln);
    reverseGeocode(la, ln);
  }

  async function handleSearch() {
    if (!search.trim()) return;
    setSearching(true);
    setError('');
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(search.trim())}&accept-language=ar&limit=1`,
      );
      const data = await res.json();
      if (!data?.length) {
        setError('ما لقينا هذا الموقع، جرّب اسم مكان أوضح');
        return;
      }
      handlePick(Number(data[0].lat), Number(data[0].lon));
    } catch {
      setError('تعذّر البحث عن الموقع — تحقق من الاتصال');
    } finally {
      setSearching(false);
    }
  }

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setError('المتصفح لا يدعم تحديد الموقع');
      return;
    }
    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handlePick(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      () => {
        setError('تعذّر الحصول على موقعك — تأكد من صلاحية الوصول للموقع بالمتصفح');
        setLocating(false);
      },
    );
  }

  return (
    <div style={{ marginBottom: 14 }}>
      <label>حدد موقع الفرع على الخريطة</label>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input
          placeholder="ابحث عن اسم حي أو مكان..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
          style={{ marginBottom: 0, flex: 1 }}
        />
        <button type="button" className="secondary" onClick={handleSearch} disabled={searching}>
          {searching ? '...' : '🔍 بحث'}
        </button>
        <button type="button" className="secondary" onClick={handleUseCurrentLocation} disabled={locating}>
          {locating ? '...' : '📍 موقعي الحالي'}
        </button>
      </div>
      {error && <div className="err" style={{ marginBottom: 8 }}>{error}</div>}
      <LeafletMapInner lat={current[0]} lng={current[1]} onPick={handlePick} />
      <p className="note" style={{ marginTop: 8, marginBottom: 0 }}>
        اضغط على أي نقطة بالخريطة لتحديد موقع الفرع بدقة، أو ابحث باسم الحي/المكان.
        {lat !== null && lng !== null && (
          <> الموقع المحدد: {lat.toFixed(5)}, {lng.toFixed(5)}</>
        )}
      </p>
    </div>
  );
}
