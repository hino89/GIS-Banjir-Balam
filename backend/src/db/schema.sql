-- =====================================================
-- SIG MITIGASI BENCANA BANDAR LAMPUNG
-- Database Schema PostgreSQL + PostGIS
-- =====================================================

-- Enable PostGIS Extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: users
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'OPERATOR' CHECK (role IN ('SUPERADMIN', 'ADMIN', 'OPERATOR')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- TABLE: daerah_rawan
-- =====================================================
CREATE TABLE IF NOT EXISTS daerah_rawan (
    id SERIAL PRIMARY KEY,
    nama_wilayah VARCHAR(255) NOT NULL,
    kecamatan VARCHAR(100) NOT NULL,
    kelurahan VARCHAR(100),
    jenis_bencana VARCHAR(100) NOT NULL,
    tingkat_risiko VARCHAR(50) CHECK (tingkat_risiko IN ('TINGGI', 'SEDANG', 'RENDAH')),
    luas_area DECIMAL(10,2),
    elevasi DECIMAL(10,2),
    frekuensi_hujan VARCHAR(100),
    deskripsi TEXT,
    geom GEOMETRY(POLYGON, 4326),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_daerah_rawan_geom ON daerah_rawan USING GIST(geom);

-- =====================================================
-- TABLE: jalur_evakuasi
-- =====================================================
CREATE TABLE IF NOT EXISTS jalur_evakuasi (
    id SERIAL PRIMARY KEY,
    nama_jalur VARCHAR(255) NOT NULL,
    jenis_jalur VARCHAR(100) DEFAULT 'EVAKUASI' CHECK (jenis_jalur IN ('EVAKUASI', 'DISTRIBUSI', 'ALTERNATIF')),
    panjang_jalur DECIMAL(10,3),
    status VARCHAR(50) DEFAULT 'AKTIF' CHECK (status IN ('AKTIF', 'TIDAK_AKTIF', 'DALAM_PERBAIKAN')),
    kapasitas INTEGER,
    tujuan_pengungsian VARCHAR(255),
    deskripsi TEXT,
    geom GEOMETRY(LINESTRING, 4326),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_jalur_evakuasi_geom ON jalur_evakuasi USING GIST(geom);

-- =====================================================
-- TABLE: titik_pengungsian
-- =====================================================
CREATE TABLE IF NOT EXISTS titik_pengungsian (
    id SERIAL PRIMARY KEY,
    nama_lokasi VARCHAR(255) NOT NULL,
    kapasitas INTEGER,
    fasilitas TEXT,
    alamat TEXT,
    kecamatan VARCHAR(100),
    kelurahan VARCHAR(100),
    latitude DECIMAL(10,6),
    longitude DECIMAL(10,6),
    status_aktif BOOLEAN DEFAULT true,
    kontak VARCHAR(100),
    geom GEOMETRY(POINT, 4326),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_titik_pengungsian_geom ON titik_pengungsian USING GIST(geom);

-- =====================================================
-- TABLE: wilayah_kecamatan
-- =====================================================
CREATE TABLE IF NOT EXISTS wilayah_kecamatan (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(100),
    geom GEOMETRY(MultiPolygon, 4326)
);

-- =====================================================
-- TABLE: wilayah_desa
-- =====================================================
CREATE TABLE IF NOT EXISTS wilayah_desa (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(100),
    kecamatan VARCHAR(100),
    latitude NUMERIC,
    longitude NUMERIC,
    elevasi NUMERIC,
    geom GEOMETRY(MultiPolygon, 4326)
);

-- =====================================================
-- TABLE: pemukiman
-- =====================================================
CREATE TABLE IF NOT EXISTS pemukiman (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(100),
    kecamatan VARCHAR(100),
    deskripsi TEXT,
    geom GEOMETRY(MultiPolygon, 4326)
);

-- =====================================================
-- TABLE: alat_berat
-- =====================================================
CREATE TABLE IF NOT EXISTS alat_berat (
    id SERIAL PRIMARY KEY,
    nama_alat VARCHAR(255) NOT NULL,
    jenis_alat VARCHAR(100) NOT NULL,
    instansi VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'TERSEDIA' CHECK (status IN ('TERSEDIA', 'DIGUNAKAN', 'PERBAIKAN')),
    lokasi VARCHAR(255),
    latitude DECIMAL(10,6),
    longitude DECIMAL(10,6),
    deskripsi TEXT,
    geom GEOMETRY(POINT, 4326),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_alat_berat_geom ON alat_berat USING GIST(geom);

-- =====================================================
-- TABLE: kondisi_jalan
-- =====================================================
CREATE TABLE IF NOT EXISTS kondisi_jalan (
    id SERIAL PRIMARY KEY,
    nama_jalan VARCHAR(255) NOT NULL,
    kecamatan VARCHAR(100),
    status VARCHAR(50) DEFAULT 'NORMAL' CHECK (status IN ('NORMAL', 'TERGENANG', 'TERPUTUS')),
    deskripsi TEXT,
    panjang DECIMAL(10,3),
    geom GEOMETRY(LINESTRING, 4326),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_kondisi_jalan_geom ON kondisi_jalan USING GIST(geom);

-- =====================================================
-- TABLE: jaringan_jalan (pgRouting)
-- =====================================================
CREATE TABLE IF NOT EXISTS jaringan_jalan (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(255),
    tipe VARCHAR(50),
    source INTEGER,
    target INTEGER,
    length FLOAT,
    geom GEOMETRY(LineString, 4326)
);
CREATE INDEX IF NOT EXISTS idx_jaringan_jalan_geom ON jaringan_jalan USING GIST(geom);

-- =====================================================
-- TABLE: laporan_warga
-- =====================================================
CREATE TABLE IF NOT EXISTS laporan_warga (
    id SERIAL PRIMARY KEY,
    nama_pelapor VARCHAR(255) NOT NULL,
    no_telp VARCHAR(20),
    lokasi VARCHAR(255) NOT NULL,
    latitude DECIMAL(10,6),
    longitude DECIMAL(10,6),
    jenis_kejadian VARCHAR(100) NOT NULL,
    deskripsi TEXT NOT NULL,
    foto_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'MENUNGGU' CHECK (status IN ('MENUNGGU', 'DIVERIFIKASI', 'DITOLAK')),
    admin_notes TEXT,
    geom GEOMETRY(POINT, 4326),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_laporan_warga_geom ON laporan_warga USING GIST(geom);

-- =====================================================
-- TABLE: gis_layers (untuk manajemen layer GIS)
-- =====================================================
CREATE TABLE IF NOT EXISTS gis_layers (
    id SERIAL PRIMARY KEY,
    nama_layer VARCHAR(255) NOT NULL,
    jenis_layer VARCHAR(100) NOT NULL,
    sumber_data VARCHAR(255),
    status BOOLEAN DEFAULT true,
    file_path VARCHAR(500),
    geojson_data JSONB,
    wms_url VARCHAR(500),
    wfs_url VARCHAR(500),
    deskripsi TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- TRIGGER: Update updated_at automatically
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_daerah_rawan_updated_at BEFORE UPDATE ON daerah_rawan FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jalur_evakuasi_updated_at BEFORE UPDATE ON jalur_evakuasi FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_titik_pengungsian_updated_at BEFORE UPDATE ON titik_pengungsian FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_alat_berat_updated_at BEFORE UPDATE ON alat_berat FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_kondisi_jalan_updated_at BEFORE UPDATE ON kondisi_jalan FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_laporan_warga_updated_at BEFORE UPDATE ON laporan_warga FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
