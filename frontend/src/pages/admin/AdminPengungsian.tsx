import { useEffect, useState, useRef } from 'react';
import { Plus, Edit2, Trash2, AlertTriangle, X, Search, Upload } from 'lucide-react';
import { pengungsianAPI, uploadAPI } from '../../services/api';
import { formatDateShort } from '../../utils/helpers';
import toast from 'react-hot-toast';

interface Pengungsian {
  id: number; nama_lokasi: string; kecamatan: string; kapasitas: number; status_aktif: boolean; created_at: string;
}

const emptyForm = { nama_lokasi: '', kecamatan: '', kapasitas: '', status_aktif: true };

export default function AdminPengungsian() {
  const [data, setData] = useState<Pengungsian[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Pengungsian | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = () => {
    setLoading(true);
    pengungsianAPI.getAll().then(r => setData(r.data.data)).finally(() => setLoading(false));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const toastId = toast.loading('Mengimpor GeoJSON...');
    try {
      const res = await uploadAPI.uploadGeoJSON('titik_pengungsian', file);
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

  const filtered = data.filter(d => d.nama_lokasi.toLowerCase().includes(search.toLowerCase()));
  const openAdd = () => { setEditing(null); setForm({ ...emptyForm }); setShowModal(true); };
  const openEdit = (row: Pengungsian) => {
    setEditing(row);
    setForm({ nama_lokasi: row.nama_lokasi, kecamatan: row.kecamatan || '', kapasitas: row.kapasitas?.toString() || '', status_aktif: row.status_aktif });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, kapasitas: form.kapasitas ? parseInt(form.kapasitas) : undefined };
      if (editing) {
        await pengungsianAPI.update(editing.id, payload);
        toast.success('Data berhasil diupdate');
      } else {
        await pengungsianAPI.create(payload);
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
      await pengungsianAPI.delete(id);
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
          <h1 className="page-title">Titik Pengungsian</h1>
          <p className="page-subtitle">Manajemen lokasi pengungsian dan fasilitas</p>
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
              <thead><tr><th>No</th><th>Nama Lokasi</th><th>Kecamatan</th><th>Kapasitas</th><th>Status</th><th>Aksi</th></tr></thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr key={row.id}>
                    <td className="text-slate-400 text-center">{i + 1}</td>
                    <td className="font-medium text-slate-800">{row.nama_lokasi}</td>
                    <td>{row.kecamatan || '-'}</td>
                    <td>{row.kapasitas} orang</td>
                    <td>{row.status_aktif ? <span className="badge badge-success">Aktif</span> : <span className="badge badge-error">Tidak Aktif</span>}</td>
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
              <h2 className="font-semibold text-slate-800">{editing ? 'Edit' : 'Tambah'} Titik Pengungsian</h2>
              <button onClick={() => setShowModal(false)} className="btn-icon"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div className="form-group">
                <label className="form-label">Nama Lokasi</label>
                <input value={form.nama_lokasi} onChange={e => setForm({ ...form, nama_lokasi: e.target.value })} className="form-input" required />
              </div>
              <div className="form-group">
                <label className="form-label">Kecamatan</label>
                <input value={form.kecamatan} onChange={e => setForm({ ...form, kecamatan: e.target.value })} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Kapasitas (Orang)</label>
                <input type="number" value={form.kapasitas} onChange={e => setForm({ ...form, kapasitas: e.target.value })} className="form-input" />
              </div>
              <div className="form-group">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.status_aktif} onChange={e => setForm({ ...form, status_aktif: e.target.checked })} />
                  <span className="text-sm font-medium text-slate-700">Status Aktif</span>
                </label>
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
