// Risk level badge
export const getRisikoColor = (risiko: string) => {
  switch (risiko) {
    case 'TINGGI': return 'badge-danger';
    case 'SEDANG': return 'badge-warning';
    case 'RENDAH': return 'badge-success';
    default: return 'badge-gray';
  }
};

// Jalan status badge
export const getJalanStatusColor = (status: string) => {
  switch (status) {
    case 'NORMAL': return 'badge-success';
    case 'TERGENANG': return 'badge-warning';
    case 'TERPUTUS': return 'badge-danger';
    default: return 'badge-gray';
  }
};

// Alat berat status
export const getAlatStatusColor = (status: string) => {
  switch (status) {
    case 'TERSEDIA': return 'badge-success';
    case 'DIGUNAKAN': return 'badge-info';
    case 'PERBAIKAN': return 'badge-warning';
    default: return 'badge-gray';
  }
};

// Jalur status
export const getJalurStatusColor = (status: string) => {
  switch (status) {
    case 'AKTIF': return 'badge-success';
    case 'TIDAK_AKTIF': return 'badge-gray';
    case 'DALAM_PERBAIKAN': return 'badge-warning';
    default: return 'badge-gray';
  }
};

// Laporan status
export const getLaporanStatusColor = (status: string) => {
  switch (status) {
    case 'DIVERIFIKASI': return 'badge-success';
    case 'MENUNGGU': return 'badge-warning';
    case 'DITOLAK': return 'badge-danger';
    default: return 'badge-gray';
  }
};

// Format date to Indonesian
export const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(date);
};

export const formatDateShort = (dateStr: string) => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(date);
};

// Format number
export const formatNumber = (num: number) => {
  return new Intl.NumberFormat('id-ID').format(num);
};

// Map color by jenis bencana
export const getBencanaColor = (jenis: string) => {
  switch (jenis.toLowerCase()) {
    case 'banjir': return '#3b82f6';
    case 'longsor': return '#f59e0b';
    case 'banjir rob': return '#6366f1';
    case 'kebakaran': return '#ef4444';
    default: return '#6b7280';
  }
};

// Map color by risiko
export const getRisikoFillColor = (risiko: string) => {
  switch (risiko) {
    case 'TINGGI': return '#ef4444';
    case 'SEDANG': return '#f59e0b';
    case 'RENDAH': return '#22c55e';
    default: return '#6b7280';
  }
};

// Map color by jalur type
export const getJalurColor = (jenis: string) => {
  switch (jenis) {
    case 'EVAKUASI': return '#22c55e';
    case 'DISTRIBUSI': return '#f59e0b';
    case 'ALTERNATIF': return '#8b5cf6';
    default: return '#6b7280';
  }
};

// Kecamatan options Bandar Lampung
export const KECAMATAN_OPTIONS = [
  'Bumi Waras', 'Enggal', 'Kedamaian', 'Kedaton', 'Kemiling',
  'Labuhan Ratu', 'Langkapura', 'Panjang', 'Rajabasa', 'Samber Budi Waras',
  'Sukabumi', 'Sukarame', 'Tanjung Karang Barat', 'Tanjung Karang Pusat',
  'Tanjung Karang Timur', 'Tanjung Senang', 'Teluk Betung Barat',
  'Teluk Betung Selatan', 'Teluk Betung Timur', 'Teluk Betung Utara', 'Way Halim',
];

export const JENIS_BENCANA_OPTIONS = ['Banjir', 'Longsor', 'Banjir Rob', 'Kebakaran', 'Angin Puting Beliung'];
export const TINGKAT_RISIKO_OPTIONS = ['TINGGI', 'SEDANG', 'RENDAH'];
export const JENIS_ALAT_OPTIONS = ['Excavator', 'Bulldozer', 'Dump Truck', 'Crane', 'Pompa Air', 'Motor Grader', 'Truk Tangki', 'Lainnya'];
export const JENIS_JALUR_OPTIONS = ['EVAKUASI', 'DISTRIBUSI', 'ALTERNATIF'];
