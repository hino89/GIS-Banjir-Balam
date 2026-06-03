import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, AlertTriangle, Route, Building2, Navigation, Truck, ArrowRight, ChevronDown, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { statsAPI } from '../services/api';

interface StatsData {
  total_daerah_rawan: number;
  total_jalur_evakuasi: number;
  total_pengungsian: number;
  total_alat_tersedia: number;
  jalan_terdampak: number;
  laporan_menunggu: number;
  rawan_by_bencana: Array<{ jenis_bencana: string; count: string }>;
  kecamatan_stats: Array<{ kecamatan: string; rawan_count: string }>;
}

const statCards = [
  { key: 'total_daerah_rawan', label: 'Daerah Rawan', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50', link: '/daerah-rawan' },
  { key: 'total_jalur_evakuasi', label: 'Jalur Evakuasi', icon: Route, color: 'text-green-500', bg: 'bg-green-50', link: '/jalur-evakuasi' },
  { key: 'total_pengungsian', label: 'Titik Pengungsian', icon: Building2, color: 'text-blue-500', bg: 'bg-blue-50', link: '/pengungsian' },
  { key: 'jalan_terdampak', label: 'Jalan Terdampak', icon: Navigation, color: 'text-orange-500', bg: 'bg-orange-50', link: '/kondisi-jalan' },
  { key: 'total_alat_tersedia', label: 'Alat Berat Tersedia', icon: Truck, color: 'text-purple-500', bg: 'bg-purple-50', link: '/peta' },
  { key: 'laporan_menunggu', label: 'Laporan Menunggu', icon: Activity, color: 'text-yellow-500', bg: 'bg-yellow-50', link: '/peta' },
];

function useCounter(target: number, duration = 1500) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

function StatCard({ card, value }: { card: typeof statCards[0]; value: number }) {
  const animated = useCounter(value);
  const Icon = card.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="stat-card group cursor-pointer"
    >
      <Link to={card.link} className="block">
        <div className="flex items-center justify-between mb-3">
          <div className={`w-10 h-10 ${card.bg} rounded-lg flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${card.color}`} />
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary-600 group-hover:translate-x-1 transition-all duration-200" />
        </div>
        <div className={`text-3xl font-bold ${card.color} mb-1`}>{animated}</div>
        <div className="text-slate-500 text-sm font-medium">{card.label}</div>
      </Link>
    </motion.div>
  );
}

export default function HomePage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    statsAPI.getPublic()
      .then(r => setStats(r.data.data))
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, []);

  return (
    <div>
      {/* ==================== HERO ==================== */}
      <section className="relative min-h-[700px] flex flex-col items-center justify-center overflow-hidden bg-slate-50">
        {/* Minimalist Grid pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />
        
        {/* Gradient Blur Background Element */}
        <div className="absolute top-0 right-0 -mr-40 -mt-40 w-96 h-96 rounded-full bg-primary-100/50 blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-96 h-96 rounded-full bg-blue-100/50 blur-3xl" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center animate-fade-in pt-20">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white shadow-sm border border-slate-200 text-slate-600 px-4 py-1.5 rounded-full text-sm font-medium mb-8">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Sistem Aktif & Terupdate
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-800 tracking-tight leading-[1.15] mb-6">
            Sistem Informasi Geografis
            <span className="block text-primary-600">Mitigasi & Penanggulangan</span>
            <span className="block">Bencana Bandar Lampung</span>
          </h1>

          <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
            Platform GIS terpadu untuk pemetaan daerah rawan, jalur evakuasi, titik pengungsian,
            dan koordinasi penanggulangan bencana Kota Bandar Lampung secara real-time.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/peta" className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3.5 text-base rounded-xl shadow-lg hover:shadow-primary-500/25 transition-all font-medium inline-flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Lihat Peta Interaktif
            </Link>
            <Link to="/daerah-rawan" className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-8 py-3.5 text-base rounded-xl shadow-sm transition-all font-medium inline-flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Informasi Bencana
            </Link>
          </div>

          <div className="mt-16 flex items-center justify-center gap-2 text-slate-400 text-sm animate-bounce">
            <span>Scroll untuk lihat statistik</span>
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </section>

      {/* ==================== STATS ==================== */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Statistik Mitigasi Bencana</h2>
            <p className="text-slate-500">Data terkini sistem penanggulangan bencana Kota Bandar Lampung</p>
          </div>

          {statsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card p-5"><div className="skeleton h-16 w-full rounded" /></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {statCards.map((card) => (
                <StatCard key={card.key} card={card} value={(stats as any)?.[card.key] ?? 0} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ==================== FEATURES ==================== */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Fitur Unggulan Sistem</h2>
            <p className="text-slate-500">Solusi GIS terpadu untuk manajemen kebencanaan modern</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: MapPin, color: 'blue', title: 'Peta Interaktif', desc: 'Visualisasi data spasial dengan 10+ layer peta yang dapat dikonfigurasi secara dinamis menggunakan Leaflet.js' },
              { icon: AlertTriangle, color: 'red', title: 'Monitoring Daerah Rawan', desc: 'Pemantauan real-time daerah rawan banjir, longsor, dan bencana lainnya dengan tingkat risiko terklasifikasi' },
              { icon: Route, color: 'green', title: 'Jalur Evakuasi', desc: 'Manajemen jalur evakuasi, distribusi bantuan, dan jalur alternatif yang terintegrasi dengan peta digital' },
              { icon: Building2, color: 'purple', title: 'Titik Pengungsian', desc: 'Informasi lengkap kapasitas, fasilitas, dan status aktif setiap titik pengungsian di seluruh kota' },
              { icon: Truck, color: 'orange', title: 'Tracking Alat Berat', desc: 'Pemantauan lokasi dan status alat berat untuk optimasi pengerahan sumber daya penanggulangan' },
              { icon: Activity, color: 'yellow', title: 'Laporan Warga', desc: 'Platform pelaporan bencana berbasis komunitas dengan verifikasi admin dan notifikasi real-time' },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="card group"
              >
                <div className={`w-12 h-12 bg-${feature.color}-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                  <feature.icon className={`w-6 h-6 text-${feature.color}-600`} />
                </div>
                <h3 className="font-semibold text-slate-800 mb-2">{feature.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== CTA ==================== */}
      <section className="py-20 px-4 bg-primary-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Siap Menghadapi Bencana?</h2>
          <p className="text-primary-100 mb-8 leading-relaxed font-light">
            Laporkan kejadian bencana di sekitar Anda atau akses informasi jalur evakuasi terdekat.
            Sistem kami siap membantu 24/7.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/peta" className="bg-white text-primary-700 hover:bg-slate-50 px-8 py-3.5 rounded-xl font-medium transition-all duration-200 shadow-md inline-flex items-center gap-2">
              <MapPin className="w-5 h-5" /> Buka Peta Sekarang
            </Link>
            <Link to="/pengungsian" className="bg-primary-700/50 hover:bg-primary-700 text-white border border-primary-500 px-8 py-3.5 rounded-xl font-medium transition-all duration-200 inline-flex items-center gap-2">
              <Building2 className="w-5 h-5" /> Cari Pengungsian
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
