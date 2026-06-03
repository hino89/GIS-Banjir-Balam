const pool = require('./pool');
const bcrypt = require('bcryptjs');

async function seed() {
  console.log('🌱 Starting database seed...');

  // ==================== USERS ====================
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  await pool.query(`
    INSERT INTO users (name, email, password, role) VALUES
    ('Super Administrator', 'superadmin@sigbandar.go.id', $1, 'SUPERADMIN'),
    ('Admin BPBD', 'admin@sigbandar.go.id', $1, 'ADMIN'),
    ('Operator Lapangan', 'operator@sigbandar.go.id', $1, 'OPERATOR')
    ON CONFLICT (email) DO NOTHING
  `, [hashedPassword]);
  console.log('✅ Users seeded');

  // ==================== DAERAH RAWAN ====================
  const daerahRawanData = [
    ['Kelurahan Campang Raya', 'Sukabumi', 'Campang Raya', 'Banjir', 'TINGGI', 125.5, 'Daerah dataran rendah sering tergenang saat hujan deras', 'POLYGON((105.2450 -5.3750, 105.2520 -5.3750, 105.2520 -5.3820, 105.2450 -5.3820, 105.2450 -5.3750))'],
    ['Kelurahan Way Halim', 'Way Halim', 'Way Halim Permai', 'Banjir', 'SEDANG', 89.3, 'Permukiman padat dengan drainase kurang memadai', 'POLYGON((105.2800 -5.3950, 105.2870 -5.3950, 105.2870 -5.4020, 105.2800 -5.4020, 105.2800 -5.3950))'],
    ['Kelurahan Kedamaian', 'Kedamaian', 'Kedamaian', 'Banjir', 'TINGGI', 210.8, 'Dekat sungai Way Kuripan rawan banjir kiriman', 'POLYGON((105.2600 -5.3600, 105.2700 -5.3600, 105.2700 -5.3700, 105.2600 -5.3700, 105.2600 -5.3600))'],
    ['Bukit Camang', 'Langkapura', 'Langkapura', 'Longsor', 'TINGGI', 45.2, 'Lereng bukit kemiringan >40 derajat rentan longsor', 'POLYGON((105.2200 -5.3800, 105.2280 -5.3800, 105.2280 -5.3870, 105.2200 -5.3870, 105.2200 -5.3800))'],
    ['Kawasan Bukit Sukamenanti', 'Sukabumi', 'Sukamenanti', 'Longsor', 'SEDANG', 67.9, 'Area perbukitan dengan vegetasi berkurang', 'POLYGON((105.2350 -5.3700, 105.2430 -5.3700, 105.2430 -5.3780, 105.2350 -5.3780, 105.2350 -5.3700))'],
    ['Kelurahan Sawah Lama', 'Tanjung Karang Timur', 'Sawah Lama', 'Banjir', 'SEDANG', 156.4, 'Area persawahan berubah fungsi menjadi permukiman', 'POLYGON((105.2900 -5.4100, 105.2980 -5.4100, 105.2980 -5.4180, 105.2900 -5.4180, 105.2900 -5.4100))'],
    ['Panjang Utara', 'Panjang', 'Panjang Utara', 'Banjir Rob', 'TINGGI', 312.7, 'Kawasan pesisir rentan banjir rob dan abrasi', 'POLYGON((105.2950 -5.4600, 105.3100 -5.4600, 105.3100 -5.4750, 105.2950 -5.4750, 105.2950 -5.4600))'],
    ['Kelurahan Gedong Pakuon', 'Teluk Betung Selatan', 'Gedong Pakuon', 'Banjir', 'RENDAH', 78.5, 'Daerah risiko banjir rendah sistem drainase baik', 'POLYGON((105.2750 -5.4350, 105.2820 -5.4350, 105.2820 -5.4420, 105.2750 -5.4420, 105.2750 -5.4350))'],
    ['Kawasan Rajabasa', 'Rajabasa', 'Rajabasa', 'Longsor', 'SEDANG', 134.6, 'Kawasan perbukitan dengan permukiman padat', 'POLYGON((105.2280 -5.3600, 105.2380 -5.3600, 105.2380 -5.3700, 105.2280 -5.3700, 105.2280 -5.3600))'],
    ['Kelurahan Jagabaya III', 'Way Halim', 'Jagabaya III', 'Banjir', 'SEDANG', 92.1, 'Kawasan elevasi rendah di tepi sungai kecil', 'POLYGON((105.2720 -5.3900, 105.2800 -5.3900, 105.2800 -5.3970, 105.2720 -5.3970, 105.2720 -5.3900))'],
  ];

  for (const row of daerahRawanData) {
    await pool.query(`
      INSERT INTO daerah_rawan (nama_wilayah, kecamatan, kelurahan, jenis_bencana, tingkat_risiko, luas_area, deskripsi, geom)
      VALUES ($1, $2, $3, $4, $5, $6, $7, ST_GeomFromText($8, 4326))
    `, row);
  }
  console.log('✅ Daerah rawan seeded');

  // ==================== JALUR EVAKUASI ====================
  const jalurEvakuasiData = [
    ['Jalur Evakuasi Utama Tanjung Karang', 'EVAKUASI', 8.5, 'AKTIF', 500, 'GOR Saburai', 'Jalur utama dari pusat kota menuju GOR Saburai', 'LINESTRING(105.2668 -5.3971, 105.2600 -5.3800, 105.2500 -5.3700)'],
    ['Jalur Evakuasi Pesisir Panjang', 'EVAKUASI', 12.3, 'AKTIF', 300, 'SDN 2 Panjang', 'Jalur evakuasi warga pesisir Panjang ke dataran tinggi', 'LINESTRING(105.3000 -5.4600, 105.2900 -5.4400, 105.2800 -5.4200)'],
    ['Jalur Evakuasi Way Halim', 'EVAKUASI', 5.2, 'AKTIF', 400, 'Lapangan Enggal', 'Jalur evakuasi kawasan Way Halim', 'LINESTRING(105.2850 -5.3980, 105.2750 -5.3900, 105.2668 -5.3850)'],
    ['Jalur Distribusi Bantuan Barat', 'DISTRIBUSI', 15.7, 'AKTIF', 200, 'Posko BPBD Bandar Lampung', 'Jalur distribusi bantuan dari posko BPBD ke wilayah barat', 'LINESTRING(105.2400 -5.3800, 105.2300 -5.3900, 105.2200 -5.4000)'],
    ['Jalur Distribusi Bantuan Timur', 'DISTRIBUSI', 11.2, 'AKTIF', 150, 'Posko Panjang', 'Jalur distribusi ke wilayah timur kota', 'LINESTRING(105.2668 -5.3971, 105.2800 -5.4100, 105.2950 -5.4300)'],
    ['Jalur Alternatif Sukabumi', 'ALTERNATIF', 6.8, 'AKTIF', 250, 'Gedung Pusiban', 'Jalur alternatif ketika jalur utama terputus', 'LINESTRING(105.2450 -5.3780, 105.2550 -5.3750, 105.2668 -5.3720)'],
    ['Jalur Evakuasi Teluk Betung', 'EVAKUASI', 7.4, 'DALAM_PERBAIKAN', 350, 'SMAN 2 Bandar Lampung', 'Jalur evakuasi kawasan Teluk Betung dalam perbaikan jembatan', 'LINESTRING(105.2750 -5.4350, 105.2700 -5.4200, 105.2668 -5.4050)'],
    ['Jalur Alternatif Rajabasa', 'ALTERNATIF', 9.1, 'AKTIF', 300, 'Gedung Olah Raga Way Halim', 'Jalur alternatif dari Rajabasa menuju pengungsian', 'LINESTRING(105.2350 -5.3650, 105.2500 -5.3780, 105.2668 -5.3900)'],
  ];

  for (const row of jalurEvakuasiData) {
    await pool.query(`
      INSERT INTO jalur_evakuasi (nama_jalur, jenis_jalur, panjang_jalur, status, kapasitas, tujuan_pengungsian, deskripsi, geom)
      VALUES ($1, $2, $3, $4, $5, $6, $7, ST_GeomFromText($8, 4326))
    `, row);
  }
  console.log('✅ Jalur evakuasi seeded');

  // ==================== TITIK PENGUNGSIAN ====================
  const titikPengungsianData = [
    ['GOR Saburai Bandar Lampung', 2000, 'Toilet, Air Bersih, Listrik, Dapur Umum, Tempat Tidur', 'Jl. Jend. Sudirman, Enggal', 'Enggal', -5.3860, 105.2550, true, '0721-123456'],
    ['Lapangan Enggal', 5000, 'Area Terbuka, Toilet Portabel, Tenda Darurat, Posko Medis', 'Jl. Jend. Sudirman, Enggal', 'Enggal', -5.3870, 105.2560, true, '0721-123457'],
    ['SDN 2 Panjang', 500, 'Toilet, Air Bersih, Ruang Kelas, Kantin', 'Jl. Yos Sudarso, Panjang', 'Panjang', -5.4620, 105.2980, true, '0721-234567'],
    ['SMAN 2 Bandar Lampung', 800, 'Toilet, Kantin, Aula, Lapangan, Posko Kesehatan', 'Jl. Amir Hamzah, Gotong Royong', 'Tanjung Karang Pusat', -5.4050, 105.2700, true, '0721-345678'],
    ['Gedung Pusiban Pemprov Lampung', 1200, 'AC, Toilet, Air Bersih, Dapur Umum, Genset, Ruang VIP', 'Jl. Wolter Monginsidi, Teluk Betung Utara', 'Teluk Betung Utara', -5.4280, 105.2600, true, '0721-456789'],
    ['Masjid Agung Al-Furqon', 1000, 'Toilet, Air Bersih, Area Wudu, Ruang Sholat, AC', 'Jl. Kartini, Enggal', 'Enggal', -5.3900, 105.2620, true, '0721-567890'],
    ['Gedung Olah Raga Way Halim', 600, 'Toilet, Air Bersih, Listrik, Lapangan Indoor', 'Jl. Pramuka, Way Halim', 'Way Halim', -5.3960, 105.2820, true, '0721-678901'],
    ['Balai Kelurahan Sukabumi', 300, 'Toilet, Air Bersih, Ruang Rapat', 'Jl. Sukabumi, Sukabumi', 'Sukabumi', -5.3780, 105.2470, false, '0721-789012'],
    ['Gedung Serbaguna Rajabasa', 450, 'Toilet, Air Bersih, Aula, Dapur', 'Jl. Radin Inten, Rajabasa', 'Rajabasa', -5.3620, 105.2380, true, '0721-890123'],
    ['Gedung PLN UIW Lampung', 700, 'AC, Toilet, Listrik Prioritas, Genset, Dapur Umum', 'Jl. ZA Pagar Alam, Rajabasa', 'Rajabasa', -5.3680, 105.2450, true, '0721-901234'],
  ];

  for (const row of titikPengungsianData) {
    await pool.query(`
      INSERT INTO titik_pengungsian (nama_lokasi, kapasitas, fasilitas, alamat, kecamatan, latitude, longitude, status_aktif, kontak, geom)
      VALUES ($1, $2, $3, $4, $5, $6::numeric, $7::numeric, $8, $9, ST_SetSRID(ST_MakePoint($7::float, $6::float), 4326))
    `, row);
  }
  console.log('✅ Titik pengungsian seeded');

  // ==================== ALAT BERAT ====================
  const alatBeratData = [
    ['Excavator Komatsu PC200-8', 'Excavator', 'Dinas PU Kota Bandar Lampung', 'TERSEDIA', 'Depo PU Kota, Jl. A. Yani', -5.3970, 105.2680],
    ['Bulldozer Caterpillar D6K', 'Bulldozer', 'BPBD Kota Bandar Lampung', 'TERSEDIA', 'Gudang BPBD, Tanjung Karang', -5.4100, 105.2700],
    ['Dump Truck Hino 500 Series', 'Dump Truck', 'Dinas PU Kota Bandar Lampung', 'DIGUNAKAN', 'Lokasi Pengerjaan Jl. Radin Inten', -5.3800, 105.2600],
    ['Pompa Air Portable 6 inch', 'Pompa Air', 'BPBD Kota Bandar Lampung', 'TERSEDIA', 'Gudang BPBD, Tanjung Karang', -5.4105, 105.2705],
    ['Motor Grader CASE 740B', 'Motor Grader', 'Dinas PU Provinsi Lampung', 'PERBAIKAN', 'Bengkel PU Provinsi, Rajabasa', -5.3650, 105.2500],
    ['Crane Truck 25 Ton', 'Crane', 'TNI AD Korem 043 Gatam', 'TERSEDIA', 'Korem 043 Gatam, Teluk Betung', -5.4300, 105.2650],
    ['Amphibious Excavator', 'Excavator Amfibi', 'BNPB Pusat (Pinjaman)', 'TERSEDIA', 'Depo Sementara Panjang', -5.4550, 105.2930],
    ['Truk Tangki Air 5000L', 'Truk Tangki', 'PDAM Way Rilau', 'TERSEDIA', 'Depo PDAM, Rajabasa', -5.3700, 105.2580],
  ];

  for (const row of alatBeratData) {
    await pool.query(`
      INSERT INTO alat_berat (nama_alat, jenis_alat, instansi, status, lokasi, latitude, longitude, geom)
      VALUES ($1, $2, $3, $4, $5, $6::numeric, $7::numeric, ST_SetSRID(ST_MakePoint($7::float, $6::float), 4326))
    `, row);
  }
  console.log('✅ Alat berat seeded');

  // ==================== KONDISI JALAN ====================
  const kondisiJalanData = [
    ['Jl. Yos Sudarso (Kawasan Panjang)', 'Panjang', 'TERGENANG', 'Tergenang 30-50cm saat hujan deras, butuh pompa', 2.1, 'LINESTRING(105.2900 -5.4500, 105.3000 -5.4600)'],
    ['Jl. Raden Imba Kusuma', 'Teluk Betung Selatan', 'TERPUTUS', 'Terputus akibat longsor material dari tebing tidak dapat dilalui', 0.8, 'LINESTRING(105.2700 -5.4400, 105.2750 -5.4450)'],
    ['Jl. Jend. Sudirman', 'Enggal', 'NORMAL', 'Kondisi normal dapat dilalui semua kendaraan', 3.5, 'LINESTRING(105.2500 -5.3900, 105.2668 -5.3971)'],
    ['Jl. Sultan Agung (Way Lunik)', 'Panjang', 'TERGENANG', 'Genangan 20-30cm masih bisa dilalui kendaraan tinggi', 1.4, 'LINESTRING(105.2850 -5.4550, 105.2950 -5.4620)'],
    ['Jl. R.A. Kartini', 'Tanjung Karang Pusat', 'NORMAL', 'Kondisi baik tidak ada gangguan', 2.8, 'LINESTRING(105.2600 -5.4000, 105.2700 -5.4050)'],
    ['Jl. Pangeran Antasari', 'Kedaton', 'NORMAL', 'Kondisi normal arus lalu lintas lancar', 4.2, 'LINESTRING(105.2600 -5.3700, 105.2700 -5.3750)'],
    ['Jl. Hayam Wuruk (Kedamaian)', 'Kedamaian', 'TERGENANG', 'Tergenang akibat luapan sungai ketinggian 40-60cm', 1.7, 'LINESTRING(105.2630 -5.3620, 105.2700 -5.3660)'],
    ['Jl. Radin Inten II (Langkapura)', 'Langkapura', 'TERPUTUS', 'Material longsor menutup badan jalan alat berat sedang membersihkan', 0.5, 'LINESTRING(105.2230 -5.3820, 105.2290 -5.3870)'],
    ['Jl. ZA Pagar Alam', 'Rajabasa', 'NORMAL', 'Kondisi normal lancar', 5.1, 'LINESTRING(105.2400 -5.3600, 105.2500 -5.3700)'],
    ['Jl. Teuku Umar', 'Kedaton', 'NORMAL', 'Kondisi baik arus lancar', 3.9, 'LINESTRING(105.2550 -5.3800, 105.2680 -5.3870)'],
  ];

  for (const row of kondisiJalanData) {
    await pool.query(`
      INSERT INTO kondisi_jalan (nama_jalan, kecamatan, status, deskripsi, panjang, geom)
      VALUES ($1, $2, $3, $4, $5, ST_GeomFromText($6, 4326))
    `, row);
  }
  console.log('✅ Kondisi jalan seeded');

  // ==================== LAPORAN WARGA ====================
  const laporanWargaData = [
    ['Budi Santoso', '081234567890', 'Jl. Yos Sudarso No. 45, Panjang', -5.4580, 105.2920, 'Banjir', 'Air sudah masuk ke dalam rumah setinggi lutut butuh bantuan evakuasi untuk lansia', 'DIVERIFIKASI', ''],
    ['Siti Rahma', '082345678901', 'Jl. Radin Inten, Langkapura', -5.3850, 105.2260, 'Longsor', 'Tanah longsor menutup akses jalan kampung 3 rumah terancam', 'MENUNGGU', ''],
    ['Ahmad Fauzi', '083456789012', 'Kelurahan Kedamaian Dekat Sungai Way Kuripan', -5.3650, 105.2650, 'Banjir', 'Sungai meluap air mulai naik ke pemukiman warga', 'DIVERIFIKASI', ''],
    ['Dewi Kurniasih', '084567890123', 'Jl. Sultan Agung, Way Lunik', -5.4560, 105.2880, 'Jalan Terputus', 'Jembatan kecil di jalan kampung mulai retak berbahaya untuk dilalui', 'MENUNGGU', ''],
    ['Hendra Wijaya', '085678901234', 'Bukit Camang, Langkapura', -5.3840, 105.2240, 'Longsor', 'Retakan tanah mulai terlihat di lereng bukit dekat permukiman', 'DITOLAK', 'Setelah pengecekan lapangan retakan adalah alami dan tidak berbahaya'],
  ];

  for (const row of laporanWargaData) {
    const [nama_pelapor, no_telp, lokasi, latitude, longitude, jenis_kejadian, deskripsi, status, admin_notes] = row;
    await pool.query(`
      INSERT INTO laporan_warga (nama_pelapor, no_telp, lokasi, latitude, longitude, jenis_kejadian, deskripsi, status, admin_notes, geom)
      VALUES ($1, $2, $3, $4::numeric, $5::numeric, $6, $7, $8, $9, ST_SetSRID(ST_MakePoint($5::float, $4::float), 4326))
    `, [nama_pelapor, no_telp, lokasi, latitude, longitude, jenis_kejadian, deskripsi, status, admin_notes || null]);
  }
  console.log('✅ Laporan warga seeded');

  console.log('🎉 Seed selesai!');
  pool.end();
}

seed().catch(err => {
  console.error('❌ Error:', err);
  pool.end();
});
