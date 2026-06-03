import { useEffect, useState } from 'react';
import { Trash2, X, Search, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { laporanAPI } from '../../services/api';
import { getLaporanStatusColor, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

interface Laporan {
  id: number; nama_pelapor: string; no_telp: string; lokasi: string;
  jenis_kejadian: string; deskripsi: string; foto_url: string;
  status: string; admin_notes: string; created_at: string;
}

export default function AdminLaporan() {
  const [data, setData] = useState<Laporan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState<Laporan | null>(null);
  const [verifikasi, setVerifikasi] = useState<Laporan | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = () => {
    setLoading(true);
    laporanAPI.getAll({ ...(filterStatus ? { status: filterStatus } : {}) })
      .then(r => setData(r.data.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [filterStatus]);

  const filtered = data.filter(d =>
    d.nama_pelapor.toLowerCase().includes(search.toLowerCase()) ||
    d.lokasi.toLowerCase().includes(search.toLowerCase()) ||
    d.jenis_kejadian.toLowerCase().includes(search.toLowerCase())
  );

  const handleVerifikasi = async (status: 'DIVERIFIKASI' | 'DITOLAK') => {
    if (!verifikasi) return;
    setSaving(true);
    try {
      await laporanAPI.verifikasi(verifikasi.id, { status, admin_notes: notes });
      toast.success(`Laporan berhasil ${status === 'DIVERIFIKASI' ? 'diverifikasi' : 'ditolak'}`);
      setVerifikasi(null);
      setNotes('');
      fetchData();
    } catch {
      toast.error('Gagal memproses laporan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus laporan ini?')) return;
    try {
      await laporanAPI.delete(id);
      toast.success('Laporan dihapus');
      fetchData();
    } catch {
      toast.error('Gagal menghapus');
    }
  };

  const statusIcon = (s: string) => s === 'DIVERIFIKASI' ? <CheckCircle className="w-4 h-4 text-green-500" /> : s === 'DITOLAK' ? <XCircle className="w-4 h-4 text-red-500" /> : <Clock className="w-4 h-4 text-yellow-500" />;

  const counts = { MENUNGGU: data.filter(d => d.status === 'MENUNGGU').length, DIVERIFIKASI: data.filter(d => d.status === 'DIVERIFIKASI').length, DITOLAK: data.filter(d => d.status === 'DITOLAK').length };

  return (
    <div className="p-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Laporan Warga</h1>
        <p className="page-subtitle">Manajemen laporan bencana dari masyarakat</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { key: 'MENUNGGU', label: 'Menunggu', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-100' },
          { key: 'DIVERIFIKASI', label: 'Terverifikasi', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
          { key: 'DITOLAK', label: 'Ditolak', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
        ].map(({ key, label, color, bg, border }) => (
          <button key={key} onClick={() => setFilterStatus(filterStatus === key ? '' : key)}
            className={`stat-card border text-left transition-all ${filterStatus === key ? `${border} ${bg} ring-2 ring-offset-1 ring-primary-400` : 'border-slate-100'}`}
          >
            <div className={`text-2xl font-bold ${color} mb-0.5`}>{counts[key as keyof typeof counts]}</div>
            <div className="text-slate-500 text-sm">{label}</div>
          </button>
        ))}
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari laporan..." className="form-input !pl-9 py-2" />
          </div>
          {filterStatus && (
            <button onClick={() => setFilterStatus('')} className="badge badge-gray flex items-center gap-1.5 py-1.5">
              {filterStatus} <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-8 text-center"><div className="w-7 h-7 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Pelapor</th>
                  <th>Lokasi</th>
                  <th>Jenis Kejadian</th>
                  <th>Status</th>
                  <th>Tanggal</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr key={row.id}>
                    <td className="text-slate-400 text-center">{i + 1}</td>
                    <td>
                      <div className="font-medium text-slate-800">{row.nama_pelapor}</div>
                      {row.no_telp && <div className="text-xs text-slate-400">{row.no_telp}</div>}
                    </td>
                    <td className="text-slate-600 max-w-48">
                      <div className="truncate">{row.lokasi}</div>
                    </td>
                    <td><span className="badge badge-info">{row.jenis_kejadian}</span></td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        {statusIcon(row.status)}
                        <span className={getLaporanStatusColor(row.status)}>{row.status.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="text-xs text-slate-400">{formatDate(row.created_at)}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setSelected(row)} className="btn-icon text-blue-500 hover:bg-blue-50" title="Detail">
                          <FileText className="w-4 h-4" />
                        </button>
                        {row.status === 'MENUNGGU' && (
                          <button onClick={() => { setVerifikasi(row); setNotes(''); }} className="btn-icon text-green-500 hover:bg-green-50" title="Verifikasi">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => handleDelete(row.id)} className="btn-icon text-red-500 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="py-12 text-center text-slate-400">Tidak ada laporan</div>}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">Detail Laporan</h2>
              <button onClick={() => setSelected(null)} className="btn-icon"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="form-label">Pelapor</span><div className="font-medium">{selected.nama_pelapor}</div></div>
                <div><span className="form-label">No. Telepon</span><div>{selected.no_telp || '-'}</div></div>
                <div className="col-span-2"><span className="form-label">Lokasi</span><div>{selected.lokasi}</div></div>
                <div><span className="form-label">Jenis Kejadian</span><div className="badge badge-info">{selected.jenis_kejadian}</div></div>
                <div><span className="form-label">Status</span><div className={getLaporanStatusColor(selected.status)}>{selected.status}</div></div>
                <div className="col-span-2"><span className="form-label">Deskripsi</span><div className="text-slate-600">{selected.deskripsi}</div></div>
                {selected.admin_notes && <div className="col-span-2"><span className="form-label">Catatan Admin</span><div className="text-slate-600 italic">{selected.admin_notes}</div></div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verifikasi Modal */}
      {verifikasi && (
        <div className="modal-overlay" onClick={() => setVerifikasi(null)}>
          <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">Proses Laporan</h2>
              <button onClick={() => setVerifikasi(null)} className="btn-icon"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="bg-slate-50 rounded-lg p-3 text-sm">
                <div className="font-medium">{verifikasi.nama_pelapor}</div>
                <div className="text-slate-500">{verifikasi.jenis_kejadian} — {verifikasi.lokasi}</div>
              </div>
              <div className="form-group">
                <label className="form-label">Catatan Admin (opsional)</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} className="form-input" rows={3} placeholder="Tambahkan catatan..." />
              </div>
              <div className="flex gap-3">
                <button onClick={() => handleVerifikasi('DITOLAK')} disabled={saving} className="btn-danger flex-1 justify-center">
                  <XCircle className="w-4 h-4" /> Tolak
                </button>
                <button onClick={() => handleVerifikasi('DIVERIFIKASI')} disabled={saving} className="btn-success flex-1 justify-center">
                  <CheckCircle className="w-4 h-4" /> Verifikasi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
