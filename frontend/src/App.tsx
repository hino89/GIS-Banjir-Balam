import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ui/ProtectedRoute';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import AdminSidebar from './components/admin/AdminSidebar';

// Public Pages
import HomePage from './pages/HomePage';
import PetaInteraktif from './pages/PetaInteraktif';
import JalurEvakuasiPage from './pages/JalurEvakuasiPage';
import PengungsianPage from './pages/PengungsianPage';
import KondisiJalanPage from './pages/KondisiJalanPage';
import TentangPage from './pages/TentangPage';
import LoginPage from './pages/LoginPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminJalurEvakuasi from './pages/admin/AdminJalurEvakuasi';
import AdminPengungsian from './pages/admin/AdminPengungsian';
import AdminLaporan from './pages/admin/AdminLaporan';
import AdminUsers from './pages/admin/AdminUsers';

// Public Layout
function PublicLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

// Admin Layout
function AdminLayout() {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-slate-100">
        <AdminSidebar />
        <main className="flex-1 lg:ml-60 min-h-screen overflow-auto">
          <Outlet />
        </main>
      </div>
    </ProtectedRoute>
  );
}

// Placeholder admin pages
const AdminPlaceholder = ({ title }: { title: string }) => (
  <div className="p-6 animate-fade-in">
    <h1 className="page-title mb-2">{title}</h1>
    <p className="page-subtitle">Halaman ini sedang dalam pengembangan</p>
    <div className="card mt-6 text-center py-16">
      <div className="text-6xl mb-4">🚧</div>
      <p className="text-slate-500">Fitur CRUD {title} akan segera tersedia</p>
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { borderRadius: '10px', fontSize: '14px', fontFamily: 'Poppins, sans-serif' },
            success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
        <Routes>
          {/* Login */}
          <Route path="/login" element={<LoginPage />} />

          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/peta" element={<PetaInteraktif />} />
            <Route path="/jalur-evakuasi" element={<JalurEvakuasiPage />} />
            <Route path="/pengungsian" element={<PengungsianPage />} />
            <Route path="/kondisi-jalan" element={<KondisiJalanPage />} />
            <Route path="/tentang" element={<TentangPage />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="jalur-evakuasi" element={<AdminJalurEvakuasi />} />
            <Route path="pengungsian" element={<AdminPengungsian />} />
            <Route path="alat-berat" element={<AdminPlaceholder title="Alat Berat" />} />
            <Route path="kondisi-jalan" element={<AdminPlaceholder title="Kondisi Jalan" />} />
            <Route path="laporan" element={<AdminLaporan />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="pengaturan" element={<AdminPlaceholder title="Pengaturan" />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
