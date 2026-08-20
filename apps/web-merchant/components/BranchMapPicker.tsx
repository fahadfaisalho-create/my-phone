'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useLocale } from '@/lib/i18n';

// يُحمَّل بدون SSR فقط — Leaflet يحتاج window/document وما يشتغل على السيرفر
const LeafletMapInner = dynamic(() => import('./LeafletMapInner'), {
  ssr: false,
  loading: () => (
    <MapLoading />
  ),
});

function MapLoading() {
  const { t } = useLocale();
  return (
    <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 13 }}>
      {t('mapPicker.loadingMap')}
    </div>
  );
}

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
  const { t } = useLocale();
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
        setError(t('mapPicker.notFound'));
        return;
      }
      handlePick(Number(data[0].lat), Number(data[0].lon));
    } catch {
      setError(t('mapPicker.searchError'));
    } finally {
      setSearching(false);
    }
  }

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setError(t('mapPicker.noGeoSupport'));
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
        setError(t('mapPicker.geoError'));
        setLocating(false);
      },
    );
  }

  return (
    <div style={{ marginBottom: 14 }}>
      <label>{t('mapPicker.pickBranchLocation')}</label>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input
          placeholder={t('mapPicker.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
          style={{ marginBottom: 0, flex: 1 }}
        />
        <button type="button" className="secondary" onClick={handleSearch} disabled={searching}>
          {searching ? '...' : t('mapPicker.search')}
        </button>
        <button type="button" className="secondary" onClick={handleUseCurrentLocation} disabled={locating}>
          {locating ? '...' : t('mapPicker.currentLocation')}
        </button>
      </div>
      {error && <div className="err" style={{ marginBottom: 8 }}>{error}</div>}
      <LeafletMapInner lat={current[0]} lng={current[1]} onPick={handlePick} />
      <p className="note" style={{ marginTop: 8, marginBottom: 0 }}>
        {t('mapPicker.branchHint')}
        {lat !== null && lng !== null && (
          <> {t('mapPicker.selectedLocation')}: {lat.toFixed(5)}, {lng.toFixed(5)}</>
        )}
      </p>
    </div>
  );
}
