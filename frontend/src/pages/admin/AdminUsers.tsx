import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X, Search } from 'lucide-react';
import { usersAPI } from '../../services/api';
import { formatDateShort } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

interface User { id: number; name: string; email: string; role: string; is_active: boolean; created_at: string; }
const emptyForm = { name: '', email: '', password: '', role: 'OPERATOR', is_active: true };

export default function AdminUsers() {
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const { user: currentUser } = useAuth();

  const fetchData = () => { setLoading(true); usersAPI.getAll().then(r => setData(r.data.data)).finally(() => setLoading(false)); };
  useEffect(() => { fetchData(); }, []);

  const filtered = data.filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || d.email.toLowerCase().includes(search.toLowerCase()));

  const openAdd = () => { setEditing(null); setForm({ ...emptyForm }); setShowModal(true); };
  const openEdit = (row: User) => {
    setEditing(row);
    setForm({ name: row.name, email: row.email, password: '', role: row.role, is_active: row.is_active });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await usersAPI.update(editing.id, form);
        toast.success('User diupdate');
      } else {
        await usersAPI.create(form);
        toast.success('User ditambahkan');
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus user ini?')) return;
    try {
      await usersAPI.delete(id);
      toast.success('User dihapus');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menghapus');
    }
  };

  const roleColors: Record<string, string> = { SUPERADMIN: 'badge-danger', ADMIN: 'badge-info', OPERATOR: 'badge-gray' };

  return (
    <div className="p-6 animate-fade-in">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Manajemen User</h1>
          <p className="page-subtitle">Kelola akun pengguna sistem admin</p>
        </div>
        {currentUser?.role === 'SUPERADMIN' && (
          <button onClick={openAdd} className="btn-primary"><Plus className="w-4 h-4" /> Tambah User</button>
        )}
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-sm text-slate-500">{filtered.length} user</span>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari user..." className="form-input !pl-9 py-2 w-56" />
          </div>
        </div>
        {loading ? <div className="p-8 text-center"><div className="w-7 h-7 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" /></div> : (
          <div className="overflow-x-auto">
            <table className="table-modern">
              <thead>
                <tr><th>No</th><th>Nama</th><th>Email</th><th>Role</th><th>Status</th><th>Dibuat</th><th>Aksi</th></tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr key={row.id}>
                    <td className="text-slate-400 text-center">{i + 1}</td>
                    <td className="font-medium text-slate-800">{row.name}</td>
                    <td className="text-slate-500 text-sm">{row.email}</td>
                    <td><span className={`badge ${roleColors[row.role] || 'badge-gray'}`}>{row.role}</span></td>
                    <td><span className={`badge ${row.is_active ? 'badge-success' : 'badge-danger'}`}>{row.is_active ? 'Aktif' : 'Nonaktif'}</span></td>
                    <td className="text-xs text-slate-400">{formatDateShort(row.created_at)}</td>
                    <td>
                      {currentUser?.role === 'SUPERADMIN' && (
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(row)} className="btn-icon text-blue-500 hover:bg-blue-50"><Edit2 className="w-4 h-4" /></button>
                          {row.id !== currentUser.id && (
                            <button onClick={() => handleDelete(row.id)} className="btn-icon text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                          )}
                        </div>
                      )}
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
              <h2 className="font-semibold text-slate-800">{editing ? 'Edit User' : 'Tambah User'}</h2>
              <button onClick={() => setShowModal(false)} className="btn-icon"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div className="form-group">
                <label className="form-label">Nama Lengkap *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="form-input" required />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="form-input" required />
              </div>
              <div className="form-group">
                <label className="form-label">{editing ? 'Password Baru (kosongkan jika tidak diubah)' : 'Password *'}</label>
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="form-input" required={!editing} minLength={6} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="form-select">
                    <option value="OPERATOR">Operator</option>
                    <option value="ADMIN">Admin</option>
                    <option value="SUPERADMIN">Super Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select value={String(form.is_active)} onChange={e => setForm({ ...form, is_active: e.target.value === 'true' })} className="form-select">
                    <option value="true">Aktif</option>
                    <option value="false">Nonaktif</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline flex-1 justify-center">Batal</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? 'Menyimpan...' : (editing ? 'Simpan' : 'Tambah')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
