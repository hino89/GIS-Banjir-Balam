import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MapPin, Menu, X, ShieldAlert, Home, Map, Route, Building2, Navigation, AlertTriangle, Info } from 'lucide-react';

const navLinks = [
  { to: '/', label: 'Beranda', icon: Home },
  { to: '/peta', label: 'Peta Interaktif', icon: MapPin },
  { to: '/jalur-evakuasi', label: 'Jalur Evakuasi', icon: Route },
  { to: '/pengungsian', label: 'Pengungsian', icon: Building2 },
  { to: '/kondisi-jalan', label: 'Kondisi Jalan', icon: Navigation },
  { to: '/tentang', label: 'Tentang', icon: Info },
];

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => setIsMobileOpen(false), [location]);

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-200' : 'bg-white border-b border-slate-100'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center shadow-sm group-hover:bg-primary-500 transition-colors">
                <ShieldAlert className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="text-slate-800 font-bold text-sm leading-tight block">SIG Mitigasi Bencana</span>
                <span className="text-slate-500 text-xs">Kota Bandar Lampung</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-2">
              {navLinks.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    location.pathname === to
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 text-slate-500 text-xs font-medium bg-slate-50 px-2.5 py-1.5 rounded-full border border-slate-200">
                <MapPin className="w-3.5 h-3.5 text-primary-500" />
                <span>Bandar Lampung</span>
              </div>
              <Link
                to="/login"
                className="hidden sm:flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 shadow-sm"
              >
                <ShieldAlert className="w-4 h-4" />
                Login Admin
              </Link>
              <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
              >
                {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileOpen && (
          <div className="lg:hidden bg-white border-t border-slate-100 px-4 pb-4 animate-slide-up shadow-lg">
            <nav className="flex flex-col gap-1 pt-3">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    location.pathname === to
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
              <Link to="/login" className="mt-2 flex items-center gap-2 bg-slate-900 text-white px-3 py-2.5 rounded-lg text-sm font-medium justify-center">
                <ShieldAlert className="w-4 h-4" /> Login Admin
              </Link>
            </nav>
          </div>
        )}
      </header>
      <div className="h-16" />
    </>
  );
}
