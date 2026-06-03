import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, ZoomControl } from 'react-leaflet';
import { Route, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { evakuasiAPI } from '../services/api';
import { getJalurStatusColor, getJalurColor } from '../utils/helpers';

interface JalurEvakuasi {
  id: number; nama_jalur: string; jenis_jalur: string; panjang_jalur: number;
  status: string; kapasitas: number; tujuan_pengungsian: string; deskripsi: string;
  geojson: any;
}

const CENTER: [number, number] = [-5.3971, 105.2668];

export default function JalurEvakuasiPage() {
  const [data, setData] = useState<JalurEvakuasi[]>([]);
  const [geojson, setGeojson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<JalurEvakuasi | null>(null);
  const [filterJenis, setFilterJenis] = useState('');

  useEffect(() => {
    Promise.all([
      evakuasiAPI.getAll(),
      evakuasiAPI.getGeoJSON(),
    ]).then(([list, geo]) => {
      setData(list.data.data);
      setGeojson(geo.data);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = filterJenis ? data.filter(d => d.jenis_jalur === filterJenis) : data;
  const filteredGeo = filterJenis && geojson ? {
    ...geojson,
    features: geojson.features?.filter((f: any) => f.properties?.jenis_jalur === filterJenis) || []
  } : geojson;

  const statusIcon = (s: string) => s === 'AKTIF' ? <CheckCircle className="w-4 h-4 text-green-500" /> : s === 'DALAM_PERBAIKAN' ? <Clock className="w-4 h-4 text-yellow-500" /> : <AlertCircle className="w-4 h-4 text-red-500" />;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-r from-navy-dark to-primary-800 py-10 px-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
            <Route className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white text-2xl font-bold">Jalur Evakuasi</h1>
            <p className="text-blue-200 text-sm">Rute evakuasi, distribusi bantuan, dan jalur alternatif</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {['EVAKUASI', 'DISTRIBUSI', 'ALTERNATIF'].map(jenis => {
            const count = data.filter(d => d.jenis_jalur === jenis).length;
            const colors = { EVAKUASI: 'green', DISTRIBUSI: 'yellow', ALTERNATIF: 'purple' };
            const c = colors[jenis as keyof typeof colors];
            return (
              <div key={jenis} className={`stat-card border-l-4 border-${c}-500`}>
                <div className={`text-2xl font-bold text-${c}-600 mb-1`}>{count}</div>
                <div className="text-slate-500 text-sm capitalize">Jalur {jenis.charAt(0) + jenis.slice(1).toLowerCase()}</div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* List */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 mb-4">
              <select value={filterJenis} onChange={e => setFilterJenis(e.target.value)} className="form-select flex-1">
                <option value="">Semua Jenis Jalur</option>
                <option value="EVAKUASI">Evakuasi</option>
                <option value="DISTRIBUSI">Distribusi Bantuan</option>
                <option value="ALTERNATIF">Jalur Alternatif</option>
              </select>
            </div>

            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <div key={i} className="card"><div className="skeleton h-20 rounded" /></div>)
            ) : filtered.map(jalur => (
              <div
                key={jalur.id}
                onClick={() => setSelected(selected?.id === jalur.id ? null : jalur)}
                className={`card cursor-pointer transition-all duration-200 ${selected?.id === jalur.id ? 'border-primary-500 border-2 shadow-md' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {statusIcon(jalur.status)}
                      <span className="font-semibold text-slate-800 text-sm">{jalur.nama_jalur}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                      <span className="badge" style={{ backgroundColor: getJalurColor(jalur.jenis_jalur) + '20', color: getJalurColor(jalur.jenis_jalur) }}>
                        {jalur.jenis_jalur}
                      </span>
                      <span className={getJalurStatusColor(jalur.status)}>{jalur.status.replace('_', ' ')}</span>
                      {jalur.panjang_jalur && <span className="badge badge-gray">{jalur.panjang_jalur} km</span>}
                    </div>
                    {jalur.tujuan_pengungsian && (
                      <div className="mt-2 text-xs text-slate-500">🏠 Tujuan: <b className="text-slate-700">{jalur.tujuan_pengungsian}</b></div>
                    )}
                  </div>
                </div>

                {selected?.id === jalur.id && jalur.deskripsi && (
                  <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 leading-relaxed">
                    {jalur.deskripsi}
                    {jalur.kapasitas && <div className="mt-1 font-medium text-slate-600">Kapasitas: {jalur.kapasitas.toLocaleString('id')} orang</div>}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Map */}
          <div className="card p-0 overflow-hidden sticky top-20 h-[600px]">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="font-semibold text-slate-700 text-sm">Visualisasi Jalur pada Peta</h3>
            </div>
            <MapContainer center={CENTER} zoom={12} className="w-full h-[540px]" zoomControl={false}>
              <ZoomControl position="bottomright" />
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {filteredGeo && (
                <GeoJSON
                  key={JSON.stringify(filteredGeo)}
                  data={filteredGeo}
                  style={(f) => ({
                    color: getJalurColor(f?.properties?.jenis_jalur),
                    weight: selected && f?.properties?.id === selected.id ? 6 : 3,
                    opacity: 0.9,
                  })}
                  onEachFeature={(feature, layer) => {
                    const p = feature.properties;
                    layer.bindPopup(`<div class="p-3 text-xs"><b>${p.nama_jalur}</b><br>Jenis: ${p.jenis_jalur}<br>Status: ${p.status}</div>`);
                  }}
                />
              )}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
