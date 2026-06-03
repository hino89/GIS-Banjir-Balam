import { ShieldAlert, MapPin, Users, Target, Globe, Award } from 'lucide-react';

export default function TentangPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-navy-dark to-primary-800 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <ShieldAlert className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-white text-3xl font-bold mb-3">Tentang Sistem</h1>
          <p className="text-blue-200 text-lg max-w-2xl mx-auto leading-relaxed">
            Sistem Informasi Geografis Mitigasi dan Penanggulangan Bencana Kota Bandar Lampung
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        {/* About */}
        <div className="card">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Tentang Sistem</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Sistem Informasi Geografis (SIG) Mitigasi dan Penanggulangan Bencana Kota Bandar Lampung merupakan
            platform digital berbasis web yang dikembangkan oleh Badan Penanggulangan Bencana Daerah (BPBD)
            Kota Bandar Lampung untuk mendukung upaya mitigasi dan penanggulangan bencana secara terpadu.
          </p>
          <p className="text-slate-600 leading-relaxed">
            Sistem ini mengintegrasikan data spasial dari QGIS dengan database PostgreSQL+PostGIS untuk
            menghasilkan visualisasi yang akurat dan informatif bagi seluruh pemangku kepentingan kebencanaan.
          </p>
        </div>

        {/* Features */}
        <div className="card">
          <h2 className="text-xl font-bold text-slate-800 mb-5">Fitur Utama</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: MapPin, title: 'Peta Interaktif GIS', desc: 'Visualisasi data spasial dengan React Leaflet dan PostGIS' },
              { icon: Target, title: 'Monitoring Risiko', desc: 'Klasifikasi daerah rawan bencana berdasarkan tingkat risiko' },
              { icon: Users, title: 'Pelaporan Masyarakat', desc: 'Platform laporan bencana berbasis komunitas' },
              { icon: Globe, title: 'Integrasi QGIS', desc: 'Kompatibel dengan data spasial QGIS via GeoJSON/WMS/WFS' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-primary-700" />
                </div>
                <div>
                  <div className="font-semibold text-slate-800 text-sm">{title}</div>
                  <div className="text-slate-500 text-xs mt-0.5">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tech Stack */}
        <div className="card">
          <h2 className="text-xl font-bold text-slate-800 mb-5 flex items-center gap-2">
            <Award className="w-5 h-5 text-primary-600" /> Teknologi
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['React.js + TypeScript', 'Vite', 'TailwindCSS', 'React Leaflet', 'Recharts', 'Node.js + Express', 'PostgreSQL + PostGIS', 'JWT Auth', 'QGIS', 'GeoJSON', 'Framer Motion', 'Axios'].map(tech => (
              <span key={tech} className="badge badge-info text-xs py-1.5 px-3 justify-center">{tech}</span>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="card bg-gradient-to-r from-navy-dark to-primary-800 text-white">
          <h2 className="text-xl font-bold mb-4">Kontak BPBD Bandar Lampung</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-200">
            <div className="space-y-2">
              <div>📍 Jl. P. Antasari No. 4, Bandar Lampung</div>
              <div>📞 (0721) 252580</div>
              <div>📧 bpbd@bandarlampungkota.go.id</div>
            </div>
            <div className="space-y-2">
              <div>🕒 Senin – Jumat: 08.00 – 16.00 WIB</div>
              <div>🆘 Hotline 24 Jam: 119 ext 1</div>
              <div>🌐 bandarlampungkota.go.id/bpbd</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
