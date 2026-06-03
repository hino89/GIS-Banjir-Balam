import { useEffect, useState } from 'react';
import { Navigation, Search } from 'lucide-react';
import { jalanAPI } from '../services/api';
import { formatDate } from '../utils/helpers';

interface KondisiJalan {
  id: number; nama_jalan: string; kecamatan: string; status: string;
  deskripsi: string; panjang: number; updated_at: string;
}

const statusInfo = {
  NORMAL: { label: 'Normal', bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', dot: 'bg-green-500', desc: 'Jalan dalam kondisi baik dan dapat dilalui' },
  TERGENANG: { label: 'Tergenang', bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200', dot: 'bg-yellow-500', desc: 'Jalan tergenang air, perhatikan ketinggian kendaraan' },
  TERPUTUS: { label: 'Terputus', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500', desc: 'Jalan terputus, tidak dapat dilalui' },
};

export default function KondisiJalanPage() {
  const [data, setData] = useState<KondisiJalan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterKecamatan, _setFilterKecamatan] = useState('');

  useEffect(() => {
    jalanAPI.getAll().then(r => setData(r.data.data)).finally(() => setLoading(false));
  }, []);

  const filtered = data.filter(d => {
    const matchSearch = d.nama_jalan.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || d.status === filterStatus;
    const matchKec = !filterKecamatan || d.kecamatan === filterKecamatan;
    return matchSearch && matchStatus && matchKec;
  });

  const counts = { NORMAL: data.filter(d => d.status === 'NORMAL').length, TERGENANG: data.filter(d => d.status === 'TERGENANG').length, TERPUTUS: data.filter(d => d.status === 'TERPUTUS').length };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-r from-navy-dark to-primary-800 py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
              <Navigation className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white text-2xl font-bold">Kondisi Jalan</h1>
              <p className="text-blue-200 text-sm">Pantauan status jalan terdampak bencana</p>
            </div>
          </div>

          {/* Status summary */}
          <div className="grid grid-cols-3 gap-4 max-w-md">
            {Object.entries(counts).map(([status, count]) => {
              const info = statusInfo[status as keyof typeof statusInfo];
              return (
                <div key={status} className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <div className={`w-2 h-2 rounded-full ${info.dot}`} />
                    <span className="text-white text-xs font-medium">{info.label}</span>
                  </div>
                  <div className="text-white font-bold text-2xl">{count}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filter */}
        <div className="card mb-6 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama jalan..." className="form-input !pl-9" />
          </div>
          <div className="flex gap-2">
            {['', 'NORMAL', 'TERGENANG', 'TERPUTUS'].map(s => {
              const info = s ? statusInfo[s as keyof typeof statusInfo] : null;
              return (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                    filterStatus === s
                      ? (info ? `${info.bg} ${info.text} ${info.border}` : 'bg-primary-800 text-white border-primary-800')
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {s ? (
                    <span className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${info?.dot}`} />
                      {info?.label}
                    </span>
                  ) : 'Semua'}
                </button>
              );
            })}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="card"><div className="skeleton h-16 rounded" /></div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((jalan, i) => {
              const info = statusInfo[jalan.status as keyof typeof statusInfo] || statusInfo.NORMAL;
              return (
                <div key={jalan.id} className={`card border-l-4 ${info.border} animate-fade-in`} style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-slate-800">{jalan.nama_jalan}</h3>
                        <span className={`badge ${info.bg} ${info.text} border ${info.border} flex items-center gap-1`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${info.dot}`} />
                          {info.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                        {jalan.kecamatan && <span>📍 {jalan.kecamatan}</span>}
                        {jalan.panjang && <span>📏 {jalan.panjang} km</span>}
                        <span>🕒 {formatDate(jalan.updated_at)}</span>
                      </div>
                      {jalan.deskripsi && (
                        <p className="mt-2 text-sm text-slate-500 leading-relaxed">{jalan.deskripsi}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="text-center py-16">
                <Navigation className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400">Tidak ada data jalan ditemukan</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
