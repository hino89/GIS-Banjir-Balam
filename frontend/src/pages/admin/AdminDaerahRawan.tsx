import { useEffect, useState, useRef } from 'react';
import { Plus, Edit2, Trash2, AlertTriangle, X, Search, Upload } from 'lucide-react';
import { rawanAPI, uploadAPI } from '../../services/api';
import { getRisikoColor, formatDateShort, KECAMATAN_OPTIONS, JENIS_BENCANA_OPTIONS, TINGKAT_RISIKO_OPTIONS } from '../../utils/helpers';
import toast from 'react-hot-toast';

interface DaerahRawan {
  id: number; nama_wilayah: string; kecamatan: string; kelurahan: string;
  jenis_bencana: string; tingkat_risiko: string; luas_area: number; deskripsi: string; created_at: string;
}

const emptyForm = { nama_wilayah: '', kecamatan: '', kelurahan: '', jenis_bencana: '', tingkat_risiko: 'SEDANG', luas_area: '', deskripsi: '' };

export default function AdminDaerahRawan() {
  const [data, setData] = useState<DaerahRawan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<DaerahRawan | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = () => {
    setLoading(true);
    rawanAPI.getAll().then(r => setData(r.data.data)).finally(() => setLoading(false));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const toastId = toast.loading('Mengimpor GeoJSON dari QGIS...');
    try {
      const res = await uploadAPI.uploadGeoJSON('daerah_rawan', file);
      toast.success(res.data.message || 'Berhasil mengimpor GeoJSON', { id: toastId });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengimpor file', { id: toastId });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = data.filter(d =>
    d.nama_wilayah.toLowerCase().includes(search.toLowerCase()) ||
    d.kecamatan.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setEditing(null); setForm({ ...emptyForm }); setShowModal(true); };
  const openEdit = (row: DaerahRawan) => {
    setEditing(row);
    setForm({ nama_wilayah: row.nama_wilayah, kecamatan: row.kecamatan, kelurahan: row.kelurahan || '', jenis_bencana: row.jenis_bencana, tingkat_risiko: row.tingkat_risiko, luas_area: row.luas_area?.toString() || '', deskripsi: row.deskripsi || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, luas_area: form.luas_area ? parseFloat(form.luas_area) : undefined };
      if (editing) {
        await rawanAPI.update(editing.id, payload);
        toast.success('Data berhasil diupdate');
      } else {
        await rawanAPI.create(payload);
        toast.success('Data berhasil ditambahkan');
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan data');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus data ini?')) return;
    setDeleting(id);
    try {
      await rawanAPI.delete(id);
      toast.success('Data berhasil dihapus');
      fetchData();
    } catch {
      toast.error('Gagal menghapus data');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="p-6 animate-fade-in">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Daerah Rawan</h1>
          <p className="page-subtitle">Manajemen data wilayah rawan bencana</p>
        </div>
        <div className="flex gap-3">
          <input 
            type="file" 
            accept=".json,.geojson" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileUpload}
          />
          <button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={uploading}
            className="btn-secondary"
          >
            {uploading ? <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /> : <Upload className="w-4 h-4" />} 
            Upload GeoJSON
          </button>
          <button onClick={openAdd} className="btn-primary">
            <Plus className="w-4 h-4" /> Tambah Data
          </button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <span className="font-medium text-slate-600 text-sm">{filtered.length} data</span>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari..." className="form-input !pl-9 w-64 py-2" />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="w-7 h-7 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama Wilayah</th>
                  <th>Kecamatan</th>
                  <th>Jenis Bencana</th>
                  <th>Risiko</th>
                  <th>Luas (Ha)</th>
                  <th>Update</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr key={row.id}>
                    <td className="text-slate-400 text-center">{i + 1}</td>
                    <td className="font-medium text-slate-800">{row.nama_wilayah}</td>
                    <td>{row.kecamatan}</td>
                    <td><span className="badge badge-info">{row.jenis_bencana}</span></td>
                    <td><span className={getRisikoColor(row.tingkat_risiko)}>{row.tingkat_risiko}</span></td>
                    <td>{row.luas_area ? Number(row.luas_area).toFixed(1) : '-'}</td>
                    <td className="text-xs text-slate-400">{formatDateShort(row.created_at)}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(row)} className="btn-icon text-blue-500 hover:bg-blue-50">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(row.id)} disabled={deleting === row.id} className="btn-icon text-red-500 hover:bg-red-50 disabled:opacity-40">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-12 text-center text-slate-400">
                <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                Tidak ada data
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">{editing ? 'Edit' : 'Tambah'} Daerah Rawan</h2>
              <button onClick={() => setShowModal(false)} className="btn-icon"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div className="form-group">
                <label className="form-label">Nama Wilayah <span className="text-red-500">*</span></label>
                <input value={form.nama_wilayah} onChange={e => setForm({ ...form, nama_wilayah: e.target.value })} className="form-input" required placeholder="Nama wilayah rawan" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Kecamatan <span className="text-red-500">*</span></label>
                  <select value={form.kecamatan} onChange={e => setForm({ ...form, kecamatan: e.target.value })} className="form-select" required>
                    <option value="">Pilih Kecamatan</option>
                    {KECAMATAN_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Kelurahan</label>
                  <input value={form.kelurahan} onChange={e => setForm({ ...form, kelurahan: e.target.value })} className="form-input" placeholder="Nama kelurahan" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Jenis Bencana <span className="text-red-500">*</span></label>
                  <select value={form.jenis_bencana} onChange={e => setForm({ ...form, jenis_bencana: e.target.value })} className="form-select" required>
                    <option value="">Pilih Jenis</option>
                    {JENIS_BENCANA_OPTIONS.map(j => <option key={j} value={j}>{j}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Tingkat Risiko</label>
                  <select value={form.tingkat_risiko} onChange={e => setForm({ ...form, tingkat_risiko: e.target.value })} className="form-select">
                    {TINGKAT_RISIKO_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Luas Area (Ha)</label>
                <input type="number" step="0.1" value={form.luas_area} onChange={e => setForm({ ...form, luas_area: e.target.value })} className="form-input" placeholder="0.0" />
              </div>
              <div className="form-group">
                <label className="form-label">Deskripsi</label>
                <textarea value={form.deskripsi} onChange={e => setForm({ ...form, deskripsi: e.target.value })} className="form-input" rows={3} placeholder="Keterangan tambahan..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline flex-1 justify-center">Batal</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center disabled:opacity-60">
                  {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Menyimpan...</> : (editing ? 'Simpan Perubahan' : 'Tambah Data')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
