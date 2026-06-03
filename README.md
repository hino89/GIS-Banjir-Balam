# SIG Mitigasi & Penanggulangan Bencana — Kota Bandar Lampung

Sistem Informasi Geografis fullstack untuk mitigasi dan penanggulangan bencana Kota Bandar Lampung.

## 🚀 Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | React.js + TypeScript + Vite |
| Styling | TailwindCSS |
| Map | React Leaflet |
| Charts | Recharts |
| HTTP | Axios |
| Backend | Node.js + Express.js |
| Auth | JWT |
| Database | PostgreSQL + PostGIS |
| GIS Source | QGIS → GeoJSON |

## 📁 Struktur Proyek

```
SIG/
├── backend/          # Express.js API
│   ├── src/
│   │   ├── db/       # Pool, schema, seed
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── index.js
│   ├── uploads/
│   └── .env
└── frontend/         # React + Vite
    ├── src/
    │   ├── pages/
    │   ├── components/
    │   ├── services/
    │   ├── context/
    │   └── utils/
    └── .env
```

## 🛠️ Instalasi

### Prasyarat
- Node.js >= 18
- PostgreSQL >= 14 dengan ekstensi PostGIS
- QGIS (opsional, untuk manajemen data spasial)

### 1. Clone / Download Project
```bash
cd C:\laragon\www\SIG
```

### 2. Setup Database
```bash
# Buat database
psql -U postgres -c "CREATE DATABASE sig_bandar_lampung;"

# Jalankan schema
psql -U postgres -d sig_bandar_lampung -f backend/src/db/schema.sql
```

### 3. Konfigurasi Backend
Edit `backend/.env`:
```env
DATABASE_URL=postgresql://postgres:PASSWORD@localhost:5432/sig_bandar_lampung
JWT_SECRET=your-secret-key
PORT=5000
FRONTEND_URL=http://localhost:5173
```

### 4. Install & Jalankan Backend
```bash
cd backend
npm install
npm run seed      # seed data dummy
npm run dev       # development
```

### 5. Install & Jalankan Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🔐 Akun Default

| Role | Email | Password |
|---|---|---|
| Super Admin | superadmin@sigbandar.go.id | admin123 |
| Admin | admin@sigbandar.go.id | admin123 |
| Operator | operator@sigbandar.go.id | admin123 |

## 📡 API Endpoints

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| POST | /api/auth/login | ❌ | Login |
| GET | /api/stats | ❌ | Statistik publik |
| GET | /api/rawan | ❌ | Daftar daerah rawan |
| GET | /api/rawan/geojson | ❌ | GeoJSON daerah rawan |
| POST | /api/rawan | ✅ | Tambah daerah rawan |
| PUT | /api/rawan/:id | ✅ | Update daerah rawan |
| DELETE | /api/rawan/:id | ✅ | Hapus daerah rawan |
| GET | /api/evakuasi | ❌ | Jalur evakuasi |
| GET | /api/evakuasi/geojson | ❌ | GeoJSON evakuasi |
| GET | /api/pengungsian | ❌ | Titik pengungsian |
| GET | /api/pengungsian/nearest | ❌ | Pengungsian terdekat |
| GET | /api/alat-berat | ❌ | Lokasi alat berat |
| GET | /api/kondisi-jalan | ❌ | Kondisi jalan |
| POST | /api/laporan | ❌ | Kirim laporan warga |
| GET | /api/laporan | ✅ | List laporan (admin) |
| PUT | /api/laporan/:id/verifikasi | ✅ | Verifikasi laporan |
| GET | /api/layer/banjir | ❌ | Layer banjir (QGIS compat) |
| GET | /api/layer/longsor | ❌ | Layer longsor |
| GET | /api/layer/pengungsian | ❌ | Layer pengungsian |
| GET | /api/layer/evakuasi | ❌ | Layer evakuasi |
| GET | /api/layer/alat-berat | ❌ | Layer alat berat |
| GET | /api/health | ❌ | Health check |

## 🗺️ Integrasi QGIS

1. Buka QGIS → Layer → Add PostGIS Layer
2. Koneksi: `host=localhost dbname=sig_bandar_lampung user=postgres`
3. Pilih tabel dengan kolom geometri (geom)
4. Export sebagai GeoJSON: Layer → Save As → Format GeoJSON
5. Upload via API: `POST /api/rawan` dengan body `{ geojson: {...} }`

## 🌐 URL

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- Health Check: http://localhost:5000/api/health
- Admin Panel: http://localhost:5173/admin
