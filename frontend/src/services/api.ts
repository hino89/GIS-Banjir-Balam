import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sig_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sig_token');
      localStorage.removeItem('sig_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH ====================
export const authAPI = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

// ==================== STATS ====================
export const statsAPI = {
  getPublic: () => api.get('/stats'),
  getAdmin: () => api.get('/stats/admin'),
};

// ==================== DAERAH RAWAN ====================
export const rawanAPI = {
  getAll: (params?: Record<string, string>) => api.get('/rawan', { params }),
  getGeoJSON: (params?: Record<string, string>) => api.get('/rawan/geojson', { params }),
  getById: (id: number) => api.get(`/rawan/${id}`),
  getSummary: () => api.get('/rawan/stats/summary'),
  create: (data: FormData | object) => api.post('/rawan', data),
  update: (id: number, data: object) => api.put(`/rawan/${id}`, data),
  delete: (id: number) => api.delete(`/rawan/${id}`),
};

// ==================== JALUR EVAKUASI ====================
export const evakuasiAPI = {
  getAll: (params?: Record<string, string>) => api.get('/evakuasi', { params }),
  getGeoJSON: (params?: Record<string, string>) => api.get('/evakuasi/geojson', { params }),
  getById: (id: number) => api.get(`/evakuasi/${id}`),
  create: (data: object) => api.post('/evakuasi', data),
  update: (id: number, data: object) => api.put(`/evakuasi/${id}`, data),
  delete: (id: number) => api.delete(`/evakuasi/${id}`),
};

// ==================== TITIK PENGUNGSIAN ====================
export const pengungsianAPI = {
  getAll: (params?: Record<string, string>) => api.get('/pengungsian', { params }),
  getGeoJSON: () => api.get('/pengungsian/geojson'),
  getNearest: (lat: number, lng: number, radius?: number) => api.get('/pengungsian/nearest', { params: { lat, lng, radius } }),
  getById: (id: number) => api.get(`/pengungsian/${id}`),
  create: (data: object) => api.post('/pengungsian', data),
  update: (id: number, data: object) => api.put(`/pengungsian/${id}`, data),
  delete: (id: number) => api.delete(`/pengungsian/${id}`),
};

// ==================== ALAT BERAT ====================
export const alatBeratAPI = {
  getAll: (params?: Record<string, string>) => api.get('/alat-berat', { params }),
  getGeoJSON: () => api.get('/alat-berat/geojson'),
  getById: (id: number) => api.get(`/alat-berat/${id}`),
  create: (data: object) => api.post('/alat-berat', data),
  update: (id: number, data: object) => api.put(`/alat-berat/${id}`, data),
  delete: (id: number) => api.delete(`/alat-berat/${id}`),
};

// ==================== KONDISI JALAN ====================
export const jalanAPI = {
  getAll: (params?: Record<string, string>) => api.get('/kondisi-jalan', { params }),
  getGeoJSON: () => api.get('/kondisi-jalan/geojson'),
  getById: (id: number) => api.get(`/kondisi-jalan/${id}`),
  create: (data: object) => api.post('/kondisi-jalan', data),
  update: (id: number, data: object) => api.put(`/kondisi-jalan/${id}`, data),
  delete: (id: number) => api.delete(`/kondisi-jalan/${id}`),
};

// ==================== LAPORAN ====================
export const laporanAPI = {
  getAll: (params?: Record<string, string>) => api.get('/laporan', { params }),
  create: (data: FormData) => api.post('/laporan', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  verifikasi: (id: number, data: { status: string; admin_notes?: string }) => api.put(`/laporan/${id}/verifikasi`, data),
  delete: (id: number) => api.delete(`/laporan/${id}`),
};

// ==================== UPLOAD ====================
export const uploadAPI = {
  uploadGeoJSON: (table: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/upload/geojson/${table}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }
};

// ==================== USERS ====================
export const usersAPI = {
  getAll: () => api.get('/users'),
  create: (data: object) => api.post('/users', data),
  update: (id: number, data: object) => api.put(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
};

// ==================== LAYER ====================
export const layerAPI = {
  getCuacaAllKelurahan: () => api.get('/cuaca/all-kelurahan'),
  getLongsor: () => api.get('/layer/longsor'),
  getPengungsian: () => api.get('/layer/pengungsian'),
  getEvakuasi: () => api.get('/layer/evakuasi'),
  getAlatBerat: () => api.get('/layer/alat-berat'),
  getKondisiJalan: () => api.get('/kondisi-jalan/geojson'),
  getJaringanJalan: () => api.get('/layer/jaringan-jalan'),
  getWilayah: () => api.get('/layer/wilayah-kecamatan'),
  getPemukiman: () => api.get('/layer/pemukiman'),
  getDesa: () => api.get('/layer/wilayah-desa'),
};

export default api;
