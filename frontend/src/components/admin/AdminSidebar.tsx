import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, AlertTriangle, Route, Building2, Truck,
  Navigation, FileText, Users, Settings, LogOut, Menu, X,
  ShieldAlert, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const sidebarLinks = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin/daerah-rawan', label: 'Daerah Rawan', icon: AlertTriangle },
  { to: '/admin/jalur-evakuasi', label: 'Jalur Evakuasi', icon: Route },
  { to: '/admin/pengungsian', label: 'Pengungsian', icon: Building2 },
  { to: '/admin/alat-berat', label: 'Alat Berat', icon: Truck },
  { to: '/admin/kondisi-jalan', label: 'Kondisi Jalan', icon: Navigation },
  { to: '/admin/laporan', label: 'Laporan Warga', icon: FileText },
  { to: '/admin/users', label: 'Manajemen User', icon: Users },
  { to: '/admin/pengaturan', label: 'Pengaturan', icon: Settings },
];

export default function AdminSidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast.success('Logout berhasil');
    navigate('/login');
  };

  const isActive = (to: string, exact?: boolean) => {
    if (exact) return location.pathname === to;
    return location.pathname.startsWith(to);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          {isOpen && (
            <div className="overflow-hidden">
              <span className="text-white font-bold text-sm block leading-tight">SIG Mitigasi</span>
              <span className="text-blue-300 text-xs">Admin Panel</span>
            </div>
          )}
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {sidebarLinks.map(({ to, label, icon: Icon, exact }) => (
          <Link
            key={to}
            to={to}
            onClick={() => setIsMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive(to, exact)
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {isOpen && <span className="flex-1">{label}</span>}
            {isOpen && isActive(to, exact) && <ChevronRight className="w-3.5 h-3.5" />}
          </Link>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        {isOpen && user && (
          <div className="mb-3 px-3 py-2.5 bg-white/5 rounded-lg">
            <div className="text-white text-sm font-medium truncate">{user.name}</div>
            <div className="text-blue-300 text-xs capitalize">{user.role.toLowerCase()}</div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-all duration-200 text-sm font-medium"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {isOpen && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col fixed left-0 top-0 h-full bg-navy-dark z-30 transition-all duration-300 ${isOpen ? 'w-60' : 'w-16'}`}>
        <SidebarContent />
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="absolute -right-3 top-20 bg-navy-dark text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg border border-white/20 hover:bg-navy-light transition-colors"
        >
          {isOpen ? <X className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
      </aside>

      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed bottom-4 left-4 z-30 bg-navy-dark text-white p-3 rounded-xl shadow-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setIsMobileOpen(false)} />
          <div className="relative w-64 bg-navy-dark h-full z-50">
            <button onClick={() => setIsMobileOpen(false)} className="absolute top-4 right-4 text-white">
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
}
