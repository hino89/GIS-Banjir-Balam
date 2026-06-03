import { Link } from 'react-router-dom';
import { ShieldAlert, MapPin, Phone, Mail, Globe } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-navy-dark text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-base block">SIG Mitigasi Bencana</span>
                <span className="text-blue-300 text-xs">Kota Bandar Lampung</span>
              </div>
            </div>
            <p className="text-blue-200 text-sm leading-relaxed">
              Sistem Informasi Geografis untuk Mitigasi dan Penanggulangan Bencana Kota Bandar Lampung.
              Melayani masyarakat dengan data spasial yang akurat dan terkini.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold text-sm mb-4 text-blue-300 uppercase tracking-wide">Menu</h3>
            <div className="flex flex-col gap-2 text-sm text-blue-200">
              {[
                ['/', 'Beranda'], ['/peta', 'Peta Interaktif'],
                ['/daerah-rawan', 'Daerah Rawan'], ['/jalur-evakuasi', 'Jalur Evakuasi'],
                ['/pengungsian', 'Titik Pengungsian'], ['/kondisi-jalan', 'Kondisi Jalan'],
              ].map(([to, label]) => (
                <Link key={to} to={to} className="hover:text-white transition-colors">{label}</Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-sm mb-4 text-blue-300 uppercase tracking-wide">Kontak</h3>
            <div className="space-y-3 text-sm text-blue-200">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-blue-400 shrink-0" />
                <span>Jl. P. Antasari No. 4, Bandar Lampung, Lampung 35131</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                <span>(0721) 252580</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <span>bpbd@bandarlampungkota.go.id</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400 shrink-0" />
                <span>bandarlampungkota.go.id</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-blue-300">
          <span>© 2024 BPBD Kota Bandar Lampung. Hak Cipta Dilindungi.</span>
          <span>Dikembangkan oleh Tim IT BPBD Bandar Lampung</span>
        </div>
      </div>
    </footer>
  );
}
