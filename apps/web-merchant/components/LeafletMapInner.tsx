'use client';

// المكوّن الفعلي لخريطة Leaflet — يُحمَّل من BranchMapPicker.tsx عبر next/dynamic بدون SSR فقط،
// لأن مكتبة leaflet تستخدم window/document وقت الاستيراد وتكسر أي تصيير على السيرفر
import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// أيقونة العلامة الافتراضية بمكتبة Leaflet تعتمد مسارات صور تنكسر مع باندلر Next.js —
// نستبدلها بروابط CDN صريحة بدل ملفات محلية
const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// يعيد توسيط الخريطة برمجياً لما center يتغيّر من خارج الخريطة (بحث أو "موقعي الحالي")
function RecenterOnChange({ center }: { center: [number, number] }) {
  const map = useMapEvents({});
  useEffect(() => {
    map.setView(center, map.getZoom() < 13 ? 13 : map.getZoom());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center[0], center[1]]);
  return null;
}

export default function LeafletMapInner({
  lat,
  lng,
  onPick,
  radiusKm,
}: {
  lat: number;
  lng: number;
  onPick: (lat: number, lng: number) => void;
  // نطاق تغطية دائري اختياري (بالكيلومتر) — يُرسم حول النقطة المختارة (لنطاق توصيل المناديب)
  radiusKm?: number;
}) {
  const center = useMemo<[number, number]>(() => [lat, lng], [lat, lng]);

  return (
    <MapContainer center={center} zoom={13} style={{ height: 280, width: '100%', borderRadius: 12 }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={center} icon={markerIcon} />
      {radiusKm && radiusKm > 0 && (
        <Circle center={center} radius={radiusKm * 1000} pathOptions={{ color: '#111111', fillOpacity: 0.08 }} />
      )}
      <ClickHandler onPick={onPick} />
      <RecenterOnChange center={center} />
    </MapContainer>
  );
}
