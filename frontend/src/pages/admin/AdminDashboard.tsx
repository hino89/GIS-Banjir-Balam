import { useEffect, useState } from 'react';
import { AlertTriangle, Route, Building2, Truck, Navigation, FileText, TrendingUp, Users, Upload } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { uploadAPI, statsAPI } from '../../services/api';
import toast from 'react-hot-toast';

interface AdminStats {
  total_rawan: number; total_evakuasi: number; total_pengungsian: number;
  total_alat_berat: number; total_jalan: number; total_laporan: number;
  laporan_menunggu: number; laporan_terverifikasi: number;
  laporan_by_jenis: Array<{ jenis_kejadian: string; count: string }>;
}

const COLORS = ['#1e40af', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    statsAPI.getAdmin().then(r => setStats(r.data.data)).finally(() => setLoading(false));
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, table: string, loadingMsg: string, successMsg: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading(loadingMsg);
    try {
      const res = await uploadAPI.uploadGeoJSON(table, file);
      toast.success(res.data.message || successMsg, { id: toastId });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengimpor', { id: toastId });
    } finally {
      e.target.value = '';
    }
  };

  const statCards = stats ? [
    { label: 'Daerah Rawan', value: stats.total_rawan, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' },
    { label: 'Jalur Evakuasi', value: stats.total_evakuasi, icon: Route, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-100' },
    { label: 'Titik Pengungsian', value: stats.total_pengungsian, icon: Building2, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' },
    { label: 'Alat Berat', value: stats.total_alat_berat, icon: Truck, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-100' },
    { label: 'Data Jalan', value: stats.total_jalan, icon: Navigation, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100' },
    { label: 'Total Laporan', value: stats.total_laporan, icon: FileText, color: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-100' },
    { label: 'Laporan Menunggu', value: stats.laporan_menunggu, icon: TrendingUp, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
    { label: 'Laporan Diverifikasi', value: stats.laporan_terverifikasi, icon: Users, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
  ] : [];

  const chartData = stats?.laporan_by_jenis?.map(d => ({
    name: d.jenis_kejadian, value: parseInt(d.count)
  })) || [];

  const mockBarData = [
    { kecamatan: 'Sukabumi', rawan: 3, laporan: 5 },
    { kecamatan: 'Panjang', rawan: 2, laporan: 8 },
    { kecamatan: 'Kedamaian', rawan: 2, laporan: 3 },
    { kecamatan: 'Langkapura', rawan: 2, laporan: 4 },
    { kecamatan: 'Way Halim', rawan: 1, laporan: 2 },
    { kecamatan: 'Tel. Betung', rawan: 1, laporan: 3 },
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Dashboard Admin</h1>
        <p className="page-subtitle">Selamat datang di panel administrasi SIG Mitigasi Bencana Bandar Lampung</p>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card p-4"><div className="skeleton h-16 rounded" /></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map(({ label, value, icon: Icon, color, bg, border }, i) => (
            <div key={i} className={`stat-card border ${border}`}>
              <div className="flex items-center justify-between mb-2">
                <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
              </div>
              <div className={`text-2xl font-bold ${color} mb-0.5`}>{value}</div>
              <div className="text-slate-500 text-xs font-medium">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="card">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary-600" />
            Statistik per Kecamatan
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={mockBarData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="kecamatan" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="rawan" name="Daerah Rawan" fill="#1e40af" radius={[4, 4, 0, 0]} />
              <Bar dataKey="laporan" name="Laporan" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="card">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary-600" />
            Laporan per Jenis Kejadian
          </h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`} labelLine={true} fontSize={11}>
                  {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-slate-300 text-sm">Belum ada data laporan</div>
          )}
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-primary-800 to-primary-700 rounded-xl p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg mb-1">SIG Mitigasi Bencana v1.0</h3>
            <p className="text-blue-200 text-sm">Sistem aktif dan terhubung ke database PostgreSQL + PostGIS</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Upload Routing (Jalan) */}
            <input type="file" accept=".json,.geojson" className="hidden" id="uploadRouting" onChange={(e) => handleFileUpload(e, 'jaringan_jalan', 'Memproses Topologi Jaringan Jalan...', 'Routing Topology Berhasil Diupdate!')} />
            <label htmlFor="uploadRouting" className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm cursor-pointer flex items-center gap-2 transition font-medium">
              <Upload className="w-4 h-4" />
              Update Routing (Jalan)
            </label>

            {/* Upload Wilayah Kecamatan */}
            <input type="file" accept=".json,.geojson" className="hidden" id="uploadWilayah" onChange={(e) => handleFileUpload(e, 'wilayah_kecamatan', 'Memproses Batas Wilayah Kecamatan...', 'Batas Wilayah Berhasil Diupdate!')} />
            <label htmlFor="uploadWilayah" className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm cursor-pointer flex items-center gap-2 transition font-medium">
              <Upload className="w-4 h-4" />
              Update Wilayah Kecamatan
            </label>

            {/* Upload Pemukiman */}
            <input type="file" accept=".json,.geojson" className="hidden" id="uploadPemukiman" onChange={(e) => handleFileUpload(e, 'pemukiman', 'Memproses Data Pemukiman Warga...', 'Data Pemukiman Berhasil Diupdate!')} />
            <label htmlFor="uploadPemukiman" className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm cursor-pointer flex items-center gap-2 transition font-medium">
              <Upload className="w-4 h-4" />
              Update Pemukiman Warga
            </label>

            {/* Upload Desa/Kelurahan */}
            <input type="file" accept=".json,.geojson" className="hidden" id="uploadDesa" onChange={(e) => handleFileUpload(e, 'wilayah_desa', 'Memproses Batas Desa/Kelurahan...', 'Batas Desa/Kelurahan Berhasil Diupdate!')} />
            <label htmlFor="uploadDesa" className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm cursor-pointer flex items-center gap-2 transition font-medium">
              <Upload className="w-4 h-4" />
              Update Batas Desa
            </label>

            <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg text-sm font-medium">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Online
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
