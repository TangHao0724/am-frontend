import { useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  Polyline 
} from 'react-leaflet';
import L from 'leaflet';
import type { LatLngExpression, LatLng } from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';


delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

type Location = {
  lat: number;
  lng: number;
};

export type Stage = {
  name: string;
  lon: number;
  lat: number;
  qrcode_uid: string;
  determine_range: string;
  limit_seconds: number;
  quest: unknown[];
  is_end: boolean;
};

type Props = {
  initialPosition: LatLngExpression;
  stages: Stage[];
  onLocationChange: (location: Location) => void;
  onAddStage: (stage: Stage) => void;
};

type LocationClickProps = {
  onLocationChange: (location: Location) => void;
};

function MapClickHandler({ onLocationChange }: LocationClickProps) {
  useMapEvents({
    click(e) {
      onLocationChange({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      });
    },
  });

  return null;
}

export default function LocationPicker({
  initialPosition,
  stages,
  onLocationChange,
  onAddStage,
}: Props) {
  const [position, setPosition] = useState<LatLng | null>(null);
  const [stageName, setStageName] = useState('');

  function handleLocationChange(location: Location) {
    setPosition({
      lat: location.lat,
      lng: location.lng,
    } as LatLng);

    onLocationChange(location);
  }

  function addStage() {
    if (!position) {
      alert('請先在地圖上選擇位置');
      return;
    }

    if (!stageName.trim()) {
      alert('請輸入地點名稱');
      return;
    }

    const newStage: Stage = {
      name: stageName.trim(),
      lon: position.lng,
      lat: position.lat,
      qrcode_uid: crypto.randomUUID(),
      determine_range: '100',
      limit_seconds: 3000,
      quest: [],
      is_end: false,
    };

    // 將新關卡回傳給父元件
    onAddStage(newStage);

    // 清空名稱，準備新增下一個關卡
    setStageName('');
  }

  return (
    <MapContainer
      center={initialPosition}
      zoom={13}
      scrollWheelZoom={true}
      style={{ height: '1200px', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapClickHandler onLocationChange={handleLocationChange} />

      {/* 已加入的關卡 */}
      {stages.map((stage, index) => (
        <Marker
          key={stage.qrcode_uid}
          position={[stage.lat, stage.lon]}
        >
          <Popup minWidth={240} maxWidth={320}>
            <div className="space-y-2 p-1">
              <h3 className="text-base font-bold text-slate-800">
                第 {index + 1} 關：{stage.name}
              </h3>

              <div className="space-y-1 text-sm text-slate-600">
                <p>緯度：{stage.lat.toFixed(6)}</p>
                <p>經度：{stage.lon.toFixed(6)}</p>
                <p>判定範圍：{stage.determine_range} 公尺</p>
                <p>限時：{stage.limit_seconds} 秒</p>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}

      {stages.length >= 2 && (
        <Polyline
          positions={stages.map(
            (stage) => [stage.lat, stage.lon] as [number, number]
          )}
          pathOptions={{
            color: '#966888',
            weight: 4,
            opacity: 0.8,
            dashArray: '8 8',
          }}
        />
      )}

      {/* 目前選取的位置與新增關卡表單 */}
      {position && (
        <Marker position={[position.lat, position.lng]}>
          <Popup minWidth={260} maxWidth={320}>
            <div className="space-y-3 p-1">
              {/* 標題 */}
              <div className="border-b border-slate-200 pb-2">
                <h3 className="text-base font-bold text-slate-800">
                  地點資訊
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  輸入名稱，將此位置加入關卡
                </p>
              </div>

              {/* 地點名稱 */}
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700">
                  地點名稱
                </label>

                <input
                  type="text"
                  value={stageName}
                  onChange={(event) =>
                    setStageName(event.target.value)
                  }
                  className="w-full box-border rounded-md border border-slate-300 bg-white p-2 text-sm outline-none focus:border-[#966888] focus:ring-2 focus:ring-[#966888]/20"
                  placeholder="例如：台北 101"
                />
              </div>

              {/* 座標 */}
              <div className="space-y-2">
                <div className="rounded-md bg-slate-100 p-2">
                  <span className="block text-xs text-slate-500 mb-1">
                    經度
                  </span>
                  <span className="text-sm font-medium text-slate-800">
                    {position.lng.toFixed(6)}
                  </span>
                </div>

                <div className="rounded-md bg-slate-100 p-2">
                  <span className="block text-xs text-slate-500 mb-1">
                    緯度
                  </span>
                  <span className="text-sm font-medium text-slate-800">
                    {position.lat.toFixed(6)}
                  </span>
                </div>
              </div>

              {/* 新增按鈕 */}
              <button
                type="button"
                className="w-full rounded-md bg-[#966888] px-3 py-2 text-sm font-medium text-white transition hover:opacity-90"
                onClick={addStage}
              >
                + 添加至關卡
              </button>
            </div>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}