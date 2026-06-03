import { useEffect, useState, useRef } from 'react';
import { Plus, Edit2, Trash2, AlertTriangle, X, Search, Upload } from 'lucide-react';
import { evakuasiAPI, uploadAPI } from '../../services/api';
import { formatDateShort } from '../../utils/helpers';
import toast from 'react-hot-toast';

interface JalurEvakuasi {
  id: number; nama_jalur: string; jenis_jalur: string; panjang_jalur: number; status: string; deskripsi: string; created_at: string;
}

const emptyForm = { nama_jalur: '', jenis_jalur: 'EVAKUASI', status: 'AKTIF', panjang_jalur: '', deskripsi: '' };

export default function AdminJalurEvakuasi() {
  const [data, setData] = useState<JalurEvakuasi[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<JalurEvakuasi | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = () => {
    setLoading(true);
    evakuasiAPI.getAll().then(r => setData(r.data.data)).finally(() => setLoading(false));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const toastId = toast.loading('Mengimpor GeoJSON...');
    try {
      const res = await uploadAPI.uploadGeoJSON('jalur_evakuasi', file);
      toast.success(res.data.message || 'Berhasil mengimpor', { id: toastId });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengimpor', { id: toastId });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = data.filter(d => d.nama_jalur.toLowerCase().includes(search.toLowerCase()));
  const openAdd = () => { setEditing(null); setForm({ ...emptyForm }); setShowModal(true); };
  const openEdit = (row: JalurEvakuasi) => {
    setEditing(row);
    setForm({ nama_jalur: row.nama_jalur, jenis_jalur: row.jenis_jalur, status: row.status, panjang_jalur: row.panjang_jalur?.toString() || '', deskripsi: row.deskripsi || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, panjang_jalur: form.panjang_jalur ? parseFloat(form.panjang_jalur) : undefined };
      if (editing) {
        await evakuasiAPI.update(editing.id, payload);
        toast.success('Data berhasil diupdate');
      } else {
        await evakuasiAPI.create(payload);
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
    if (!confirm('Yakin ingin menghapus?')) return;
    setDeleting(id);
    try {
      await evakuasiAPI.delete(id);
      toast.success('Data dihapus');
      fetchData();
    } catch {
      toast.error('Gagal menghapus');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="p-6 animate-fade-in">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Jalur Evakuasi</h1>
          <p className="page-subtitle">Manajemen rute evakuasi dan distribusi</p>
        </div>
        <div className="flex gap-3">
          <input type="file" accept=".json,.geojson" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="btn-secondary">
            {uploading ? <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /> : <Upload className="w-4 h-4" />} Upload GeoJSON
          </button>
          <button onClick={openAdd} className="btn-primary"><Plus className="w-4 h-4" /> Tambah Data</button>
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
          <div className="p-8 text-center"><div className="w-7 h-7 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-modern">
              <thead><tr><th>No</th><th>Nama Jalur</th><th>Jenis</th><th>Status</th><th>Aksi</th></tr></thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr key={row.id}>
                    <td className="text-slate-400 text-center">{i + 1}</td>
                    <td className="font-medium text-slate-800">{row.nama_jalur}</td>
                    <td>{row.jenis_jalur}</td>
                    <td>{row.status}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(row)} className="btn-icon text-blue-500"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(row.id)} className="btn-icon text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">{editing ? 'Edit' : 'Tambah'} Jalur</h2>
              <button onClick={() => setShowModal(false)} className="btn-icon"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div className="form-group">
                <label className="form-label">Nama Jalur</label>
                <input value={form.nama_jalur} onChange={e => setForm({ ...form, nama_jalur: e.target.value })} className="form-input" required />
              </div>
              <div className="form-group">
                <label className="form-label">Jenis</label>
                <select value={form.jenis_jalur} onChange={e => setForm({ ...form, jenis_jalur: e.target.value })} className="form-select">
                  <option value="EVAKUASI">Evakuasi</option>
                  <option value="DISTRIBUSI">Distribusi</option>
                  <option value="ALTERNATIF">Alternatif</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="form-select">
                  <option value="AKTIF">Aktif</option>
                  <option value="TIDAK_AKTIF">Tidak Aktif</option>
                  <option value="DALAM_PERBAIKAN">Dalam Perbaikan</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline flex-1">Batal</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Menyimpan...' : 'Simpan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
