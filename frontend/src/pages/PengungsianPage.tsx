import { useEffect, useState } from 'react';
import { Building2, Users, Wifi, CheckCircle, XCircle, Phone, MapPin, Search } from 'lucide-react';
import { pengungsianAPI } from '../services/api';

interface TitikPengungsian {
  id: number; nama_lokasi: string; kapasitas: number; fasilitas: string;
  alamat: string; kecamatan: string; latitude: number; longitude: number;
  status_aktif: boolean; kontak: string;
}

export default function PengungsianPage() {
  const [data, setData] = useState<TitikPengungsian[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterKecamatan, setFilterKecamatan] = useState('');

  useEffect(() => {
    pengungsianAPI.getAll().then(r => setData(r.data.data)).finally(() => setLoading(false));
  }, []);

  const filtered = data.filter(d => {
    const matchSearch = d.nama_lokasi.toLowerCase().includes(search.toLowerCase()) ||
      d.kecamatan?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === '' || (filterStatus === 'aktif' ? d.status_aktif : !d.status_aktif);
    const matchKec = !filterKecamatan || d.kecamatan === filterKecamatan;
    return matchSearch && matchStatus && matchKec;
  });

  const totalKapasitas = filtered.reduce((sum, d) => sum + (d.kapasitas || 0), 0);
  const kecamatanList = [...new Set(data.map(d => d.kecamatan).filter(Boolean))].sort();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-r from-navy-dark to-primary-800 py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white text-2xl font-bold">Titik Pengungsian</h1>
              <p className="text-blue-200 text-sm">Lokasi shelter darurat Kota Bandar Lampung</p>
            </div>
          </div>
          <div className="flex gap-4 text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <div className="text-white font-bold text-xl">{data.filter(d => d.status_aktif).length}</div>
              <div className="text-blue-200 text-xs">Aktif</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <div className="text-white font-bold text-xl">{totalKapasitas.toLocaleString('id')}</div>
              <div className="text-blue-200 text-xs">Total Kapasitas</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="card mb-6 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari lokasi pengungsian..." className="form-input !pl-9" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="form-select w-auto">
            <option value="">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="nonaktif">Tidak Aktif</option>
          </select>
          <select value={filterKecamatan} onChange={e => setFilterKecamatan(e.target.value)} className="form-select w-auto">
            <option value="">Semua Kecamatan</option>
            {kecamatanList.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>

        {/* Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card"><div className="skeleton h-48 rounded" /></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((p, i) => (
              <div key={p.id} className="card group hover:shadow-lg transition-all duration-300 animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className={`badge ${p.status_aktif ? 'badge-success' : 'badge-danger'} flex items-center gap-1`}>
                    {p.status_aktif ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {p.status_aktif ? 'Aktif' : 'Tidak Aktif'}
                  </span>
                </div>

                <h3 className="font-semibold text-slate-800 mb-1 group-hover:text-primary-700 transition-colors">{p.nama_lokasi}</h3>

                <div className="space-y-2 text-sm">
                  {p.kapasitas && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Users className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Kapasitas <b>{p.kapasitas.toLocaleString('id')}</b> jiwa</span>
                    </div>
                  )}
                  {p.alamat && (
                    <div className="flex items-start gap-2 text-slate-500 text-xs">
                      <MapPin className="w-3.5 h-3.5 mt-0.5 text-slate-400 shrink-0" />
                      <span>{p.alamat}</span>
                    </div>
                  )}
                  {p.kontak && (
                    <div className="flex items-center gap-2 text-slate-500 text-xs">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{p.kontak}</span>
                    </div>
                  )}
                </div>

                {p.fasilitas && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                      <Wifi className="w-3.5 h-3.5 text-slate-400" /> Fasilitas:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {p.fasilitas.split(',').map((f, i) => (
                        <span key={i} className="badge badge-info text-xs">{f.trim()}</span>
                      ))}
                    </div>
                  </div>
                )}

                {p.latitude && p.longitude && (
                  <a
                    href={`https://www.google.com/maps?q=${p.latitude},${p.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 block text-center text-xs text-primary-600 hover:text-primary-800 font-medium transition-colors"
                  >
                    📍 Lihat di Google Maps →
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16">
            <Building2 className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">Tidak ada data pengungsian ditemukan</p>
          </div>
        )}
      </div>
    </div>
  );
}
