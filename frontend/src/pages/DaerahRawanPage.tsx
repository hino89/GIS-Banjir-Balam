import { useEffect, useState } from 'react';
import { Search, AlertTriangle, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { rawanAPI } from '../services/api';
import { getRisikoColor, getBencanaColor, formatDateShort, KECAMATAN_OPTIONS, JENIS_BENCANA_OPTIONS, TINGKAT_RISIKO_OPTIONS } from '../utils/helpers';

interface DaerahRawan {
  id: number; nama_wilayah: string; kecamatan: string; kelurahan: string;
  jenis_bencana: string; tingkat_risiko: string; luas_area: number;
  elevasi?: number; frekuensi_hujan?: string;
  deskripsi: string; created_at: string;
}

export default function DaerahRawanPage() {
  const [data, setData] = useState<DaerahRawan[]>([]);
  const [filtered, setFiltered] = useState<DaerahRawan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterKecamatan, setFilterKecamatan] = useState('');
  const [filterBencana, setFilterBencana] = useState('');
  const [filterRisiko, setFilterRisiko] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    rawanAPI.getAll().then(r => {
      setData(r.data.data);
      setFiltered(r.data.data);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = data;
    if (search) result = result.filter(d => d.nama_wilayah.toLowerCase().includes(search.toLowerCase()) || d.kecamatan.toLowerCase().includes(search.toLowerCase()));
    if (filterKecamatan) result = result.filter(d => d.kecamatan === filterKecamatan);
    if (filterBencana) result = result.filter(d => d.jenis_bencana === filterBencana);
    if (filterRisiko) result = result.filter(d => d.tingkat_risiko === filterRisiko);
    setFiltered(result);
    setPage(1);
  }, [search, filterKecamatan, filterBencana, filterRisiko, data]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const risikoCounts = {
    TINGGI: data.filter(d => d.tingkat_risiko === 'TINGGI').length,
    SEDANG: data.filter(d => d.tingkat_risiko === 'SEDANG').length,
    RENDAH: data.filter(d => d.tingkat_risiko === 'RENDAH').length,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Banner */}
      <div className="bg-gradient-to-r from-navy-dark to-primary-800 py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white text-2xl font-bold">Daerah Rawan Bencana</h1>
              <p className="text-blue-200 text-sm">Peta dan data wilayah rawan bencana Kota Bandar Lampung</p>
            </div>
          </div>

          {/* Mini stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 max-w-sm">
            {[{ label: 'Risiko Tinggi', count: risikoCounts.TINGGI },
              { label: 'Risiko Sedang', count: risikoCounts.SEDANG },
              { label: 'Risiko Rendah', count: risikoCounts.RENDAH },
            ].map(({ label, count }) => (
              <div key={label} className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                <div className={`text-2xl font-bold text-white`}>{count}</div>
                <div className="text-blue-200 text-xs">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari wilayah..." className="form-input !pl-9" />
            </div>
            <select value={filterKecamatan} onChange={e => setFilterKecamatan(e.target.value)} className="form-select w-auto">
              <option value="">Semua Kecamatan</option>
              {KECAMATAN_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
            <select value={filterBencana} onChange={e => setFilterBencana(e.target.value)} className="form-select w-auto">
              <option value="">Semua Bencana</option>
              {JENIS_BENCANA_OPTIONS.map(j => <option key={j} value={j}>{j}</option>)}
            </select>
            <select value={filterRisiko} onChange={e => setFilterRisiko(e.target.value)} className="form-select w-auto">
              <option value="">Semua Risiko</option>
              {TINGKAT_RISIKO_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            {(search || filterKecamatan || filterBencana || filterRisiko) && (
              <button onClick={() => { setSearch(''); setFilterKecamatan(''); setFilterBencana(''); setFilterRisiko(''); }} className="btn-outline text-sm py-2">
                Reset Filter
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Data Daerah Rawan ({filtered.length} wilayah)</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Memuat data...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400">Tidak ada data yang ditemukan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-modern">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Nama Wilayah</th>
                    <th>Kecamatan</th>
                    <th>Jenis Bencana</th>
                    <th>Tingkat Risiko</th>
                    <th>Luas Area</th>
                    <th>Elevasi</th>
                    <th>Frekuensi Hujan</th>
                    <th>Update</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((row, i) => (
                    <tr key={row.id} className="animate-fade-in">
                      <td className="text-slate-400 text-center">{(page - 1) * perPage + i + 1}</td>
                      <td>
                        <div className="font-medium text-slate-800">{row.nama_wilayah}</div>
                        {row.kelurahan && <div className="text-xs text-slate-400">{row.kelurahan}</div>}
                      </td>
                      <td className="text-slate-600">{row.kecamatan}</td>
                      <td>
                        <span className="badge" style={{ backgroundColor: getBencanaColor(row.jenis_bencana) + '20', color: getBencanaColor(row.jenis_bencana), borderColor: getBencanaColor(row.jenis_bencana) + '40' }}>
                          {row.jenis_bencana}
                        </span>
                      </td>
                      <td><span className={getRisikoColor(row.tingkat_risiko)}>{row.tingkat_risiko}</span></td>
                      <td className="text-slate-600">{row.luas_area ? `${row.luas_area.toFixed(1)} Ha` : '-'}</td>
                      <td className="text-slate-600">{row.elevasi ? `${row.elevasi} mdpl` : '-'}</td>
                      <td className="text-slate-600">{row.frekuensi_hujan || '-'}</td>
                      <td className="text-slate-400 text-xs">{formatDateShort(row.created_at)}</td>
                      <td>
                        <button className="btn-icon text-primary-600 hover:bg-primary-50">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm text-slate-500">Halaman {page} dari {totalPages}</span>
              <div className="flex items-center gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-icon disabled:opacity-40">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium text-slate-700 px-2">{page}</span>
                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="btn-icon disabled:opacity-40">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
