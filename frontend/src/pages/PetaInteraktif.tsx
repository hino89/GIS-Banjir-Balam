import { useEffect, useState, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, ZoomControl, LayersControl, Marker, Popup, useMapEvents } from 'react-leaflet';
import { ChevronDown, Navigation, MapPin, X, AlertTriangle, CloudRain, Droplets, Thermometer } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import { divIcon } from 'leaflet';
import { layerAPI } from '../services/api';
import { getRisikoFillColor, getJalurColor, KECAMATAN_OPTIONS } from '../utils/helpers';

const { BaseLayer, Overlay } = LayersControl;
const CENTER: [number, number] = [-5.3971, 105.2668];

const risikoStyle = (risiko: string) => ({
  fillColor: getRisikoFillColor(risiko),
  weight: 1.5, opacity: 0.9, color: 'white', fillOpacity: 0.65,
});

const jalurStyle = (jenis: string) => ({
  color: getJalurColor(jenis), weight: 4, opacity: 0.9,
});

function createIcon(color: string, emoji: string) {
  const html = renderToStaticMarkup(
    <div style={{ background: color, width: 32, height: 32, borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)', border: '2px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ transform: 'rotate(45deg)', fontSize: 14 }}>{emoji}</span>
    </div>
  );
  return divIcon({ html, className: '', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -36] });
}

// Komponen penangkap klik peta
function MapClickHandler({ routingMode, routeStart, routeEnd, setRouteStart, setRouteEnd }: any) {
  useMapEvents({
    click(e) {
      if (!routingMode) return;
      if (!routeStart) {
        setRouteStart([e.latlng.lat, e.latlng.lng]);
      } else if (!routeEnd) {
        setRouteEnd([e.latlng.lat, e.latlng.lng]);
      }
    }
  });
  return null;
}

export default function PetaInteraktif() {
  const [layers, setLayers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [cuaca, setCuaca] = useState<any>(null);
  const [cuacaLoading, setCuacaLoading] = useState(false);
  
  // Floating Filters
  const [filterWilayah, setFilterWilayah] = useState('Semua Wilayah');
  const [filterBencana, setFilterBencana] = useState('Semua Bencana');

  // Routing State
  const [routingMode, setRoutingMode] = useState(false);
  const [routeStart, setRouteStart] = useState<[number, number] | null>(null);
  const [routeEnd, setRouteEnd] = useState<[number, number] | null>(null);
  const [routeGeoJSON, setRouteGeoJSON] = useState<any>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [cuaca, longsor, evakuasi, pengungsian, alatBerat, jalan, jaringanJalan, wilayah, pemukiman, desa] = await Promise.allSettled([
          layerAPI.getCuacaAllKelurahan(), layerAPI.getLongsor(), layerAPI.getEvakuasi(),
          layerAPI.getPengungsian(), layerAPI.getAlatBerat(), layerAPI.getKondisiJalan(), layerAPI.getJaringanJalan(), layerAPI.getWilayah(), layerAPI.getPemukiman(), layerAPI.getDesa()
        ]);
        setLayers({
          banjir: cuaca.status === 'fulfilled' ? cuaca.value.data : null, // we store cuaca in banjir for backward compatibility
          longsor: longsor.status === 'fulfilled' ? longsor.value.data : null,
          evakuasi: evakuasi.status === 'fulfilled' ? evakuasi.value.data : null,
          pengungsian: pengungsian.status === 'fulfilled' ? pengungsian.value.data : null,
          alatBerat: alatBerat.status === 'fulfilled' ? alatBerat.value.data : null,
          jalan: jalan.status === 'fulfilled' ? jalan.value.data : null,
          jaringan_jalan: jaringanJalan.status === 'fulfilled' ? jaringanJalan.value.data : null,
          wilayah: wilayah.status === 'fulfilled' ? wilayah.value.data : null,
          pemukiman: pemukiman.status === 'fulfilled' ? pemukiman.value.data : null,
          desa: desa.status === 'fulfilled' ? desa.value.data : null,
        });
      } finally {
        setLoading(false);
      }
      fetchCuaca();
    };
    fetchAll();
  }, []);

  const fetchCuaca = useCallback((lat?: number, lon?: number, lokasi?: string) => {
    setCuacaLoading(true);
    let url = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + '/cuaca/curah-hujan';
    const params = new URLSearchParams();
    if (lat) params.append('lat', lat.toString());
    if (lon) params.append('lon', lon.toString());
    if (lokasi) params.append('lokasi', lokasi);
    if (params.toString()) url += '?' + params.toString();

    fetch(url)
      .then(r => r.json())
      .then(d => { if (d.success) setCuaca(d.data); })
      .catch(console.error)
      .finally(() => setCuacaLoading(false));
  }, []);

  const filterFeatures = useCallback((geojson: any) => {
    if (!geojson) return geojson;
    return {
      ...geojson,
      features: geojson.features?.filter((f: any) => {
        if (filterWilayah !== 'Semua Wilayah' && f.properties?.kecamatan !== filterWilayah) return false;
        return true;
      }) || []
    };
  }, [filterWilayah]);

  // Combine Real-Time Weather into Desa boundaries
  const enrichedDesa = useMemo(() => {
    if (!layers.desa) return null;
    const cuacaMap = layers.banjir || {};

    return {
      ...layers.desa,
      features: layers.desa.features.map((f: any) => {
        const kelName = f.properties.desa?.trim().toUpperCase();
        const cuacaData = cuacaMap[kelName] || {};
        
        let elevasi = f.properties.elevasi ? Number(f.properties.elevasi) : 50;
        let presipitasi = cuacaData.presipitasi || 0;
        
        // Kalkulasi Risiko Real-Time
        let tingkat_risiko = 'RENDAH';
        if (presipitasi > 10 && elevasi < 50) tingkat_risiko = 'TINGGI';
        else if (presipitasi > 5 && elevasi < 100) tingkat_risiko = 'SEDANG';
        else if (elevasi < 20) tingkat_risiko = 'SEDANG'; // Dataran rendah
        if (presipitasi === 0 && elevasi > 100) tingkat_risiko = 'AMAN';

        const riskScore = tingkat_risiko === 'TINGGI' ? 3 : tingkat_risiko === 'SEDANG' ? 2 : tingkat_risiko === 'RENDAH' ? 1 : 0;

        return {
          ...f,
          properties: {
            ...f.properties,
            tingkat_risiko,
            riskScore,
            elevasi,
            presipitasi,
            hujan: cuacaData.hujan || 0,
            luas_area: 0 // Mock for sorting fallback
          }
        };
      })
    };
  }, [layers.desa, layers.banjir]);

  // Ranking Calculation
  const ranking = useMemo(() => {
    let all: any[] = [];
    if (filterBencana === 'Semua Bencana' || filterBencana === 'Banjir') {
      if (enrichedDesa?.features) {
        // Only include those that have SEDANG or TINGGI risk
        all = [...all, ...enrichedDesa.features.filter((f:any) => f.properties.riskScore > 1)];
      }
    }
    if (filterBencana === 'Semua Bencana' || filterBencana === 'Longsor') {
      if (layers.longsor?.features) all = [...all, ...layers.longsor.features];
    }

    if (filterWilayah !== 'Semua Wilayah') {
      all = all.filter(f => f.properties?.kecamatan === filterWilayah);
    }

    all.sort((a, b) => {
      const valA = a.properties?.riskScore || 0;
      const valB = b.properties?.riskScore || 0;
      if (valB !== valA) return valB - valA;
      // if same risk, sort by highest precipitation
      const precA = a.properties?.presipitasi || 0;
      const precB = b.properties?.presipitasi || 0;
      return precB - precA;
    });

    return all.slice(0, 20);
  }, [enrichedDesa, layers.longsor, filterWilayah, filterBencana]);

  // Handle Route Fetching
  useEffect(() => {
    if (routeStart && routeEnd) {
      const fetchRoute = async () => {
        setRouteLoading(true);
        setRouteError('');
        try {
          const res = await fetch(`http://localhost:5000/api/route?startLat=${routeStart[0]}&startLng=${routeStart[1]}&endLat=${routeEnd[0]}&endLng=${routeEnd[1]}`);
          const data = await res.json();
          if (res.ok) {
            setRouteGeoJSON(data);
          } else {
            setRouteError(data.error || 'Gagal mencari rute');
          }
        } catch (err: any) {
          setRouteError(err.message);
        } finally {
          setRouteLoading(false);
        }
      };
      fetchRoute();
    }
  }, [routeStart, routeEnd]);

  const resetRouting = () => {
    setRouteStart(null);
    setRouteEnd(null);
    setRouteGeoJSON(null);
    setRouteError('');
  };

  return (
    <div className="relative h-[calc(100vh-64px)] w-full overflow-hidden bg-slate-100">
      
      {/* FLOATING TOP CONTROLS */}
      <div className="absolute top-4 left-4 z-[400] flex flex-wrap gap-3 max-w-[60%]">
        <div className="relative bg-white rounded shadow-md border border-slate-200 w-48 shrink-0">
          <select 
            value={filterWilayah} 
            onChange={e => setFilterWilayah(e.target.value)}
            className="w-full appearance-none px-4 py-2.5 text-sm font-medium text-slate-700 bg-transparent outline-none cursor-pointer"
          >
            <option value="Semua Wilayah">Semua Wilayah</option>
            {KECAMATAN_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        <div className="relative bg-white rounded shadow-md border border-slate-200 w-48 shrink-0">
          <select 
            value={filterBencana} 
            onChange={e => setFilterBencana(e.target.value)}
            className="w-full appearance-none px-4 py-2.5 text-sm font-medium text-slate-700 bg-transparent outline-none cursor-pointer"
          >
            <option value="Semua Bencana">Semua Bencana</option>
            <option value="Banjir">Banjir</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        <button 
          onClick={() => {
            setRoutingMode(!routingMode);
            if (routingMode) resetRouting();
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded shadow-md font-bold transition-all ${routingMode ? 'bg-red-500 text-white' : 'bg-primary-600 text-white hover:bg-primary-700'}`}
        >
          <Navigation className="w-4 h-4" />
          {routingMode ? 'Tutup Navigasi' : 'Cari Rute Evakuasi'}
        </button>
      </div>

      {/* ROUTING UI PANEL */}
      {routingMode && (
        <div className="absolute top-20 left-4 z-[400] w-80 bg-white shadow-2xl rounded-lg overflow-hidden border border-slate-200 animate-slide-up">
          <div className="p-4 bg-primary-600 text-white flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2"><Navigation className="w-4 h-4"/> Rute Cerdas Evakuasi</h3>
            <button onClick={() => { setRoutingMode(false); resetRouting(); }}><X className="w-5 h-5 opacity-70 hover:opacity-100" /></button>
          </div>
          <div className="p-4 space-y-4">
            <div className="text-xs text-slate-500 bg-blue-50 p-2 rounded border border-blue-100 mb-2">
              💡 <b>Tips:</b> Klik pada peta untuk memilih titik awal dan tujuan. Sistem akan otomatis menghindari area yang sedang banjir.
            </div>

            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-xs">A</div>
              <div className="flex-1">
                <p className="text-xs text-slate-400 font-medium">Titik Awal</p>
                <p className="text-sm font-semibold text-slate-700">{routeStart ? `${routeStart[0].toFixed(4)}, ${routeStart[1].toFixed(4)}` : 'Klik di peta...'}</p>
              </div>
              {routeStart && !routeEnd && <button onClick={() => setRouteStart(null)} className="text-red-400 hover:text-red-600"><X className="w-4 h-4"/></button>}
            </div>

            <div className="w-0.5 h-6 bg-slate-200 ml-3"></div>

            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">B</div>
              <div className="flex-1">
                <p className="text-xs text-slate-400 font-medium">Tujuan Evakuasi</p>
                <p className="text-sm font-semibold text-slate-700">{routeEnd ? `${routeEnd[0].toFixed(4)}, ${routeEnd[1].toFixed(4)}` : 'Klik di peta...'}</p>
              </div>
              {routeEnd && <button onClick={() => setRouteEnd(null)} className="text-red-400 hover:text-red-600"><X className="w-4 h-4"/></button>}
            </div>

            {routeLoading && (
              <div className="mt-4 p-2 bg-slate-50 text-center text-sm font-medium text-slate-500 rounded animate-pulse">
                Sedang mengkalkulasi rute teraman...
              </div>
            )}

            {routeError && (
              <div className="mt-4 p-3 bg-red-50 text-red-600 text-xs rounded border border-red-200 flex gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{routeError}</span>
              </div>
            )}

            {routeGeoJSON && (
              <button onClick={resetRouting} className="w-full mt-2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold rounded transition">
                Reset Rute
              </button>
            )}
          </div>
        </div>
      )}

      {/* FLOATING CUACA WIDGET */}
      {cuaca && (
        <div className={`absolute top-4 right-4 z-[400] w-72 bg-white/95 backdrop-blur shadow-xl border border-blue-200 rounded-lg overflow-hidden animate-slide-up transition-opacity duration-300 ${cuacaLoading ? 'opacity-50' : 'opacity-100'}`}>
          <div className="p-3 bg-gradient-to-r from-blue-600 to-blue-400 text-white flex justify-between items-center">
            <span className="text-sm font-bold flex items-center gap-2 truncate pr-2"><CloudRain className="w-4 h-4 shrink-0" /> {cuaca.lokasi}</span>
            <span className="text-xs shrink-0">{new Date(cuaca.waktu).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          </div>
          <div className="p-4 grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center p-2 bg-blue-50 rounded border border-blue-100">
              <Thermometer className="w-5 h-5 text-blue-500 mb-1" />
              <span className="text-xs text-slate-500">Suhu</span>
              <span className="font-bold text-slate-700">{cuaca.temperatur}°C</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-blue-50 rounded border border-blue-100">
              <Droplets className="w-5 h-5 text-blue-500 mb-1" />
              <span className="text-xs text-slate-500">Curah Hujan</span>
              <span className="font-bold text-slate-700">{cuaca.presipitasi} mm</span>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING RANKING PANEL (RIGHT) */}
      <div className="absolute top-44 right-4 bottom-4 z-[400] w-96 bg-white/95 backdrop-blur shadow-xl border border-slate-200 rounded-lg overflow-hidden flex flex-col animate-slide-up hidden md:flex">
        <div className="p-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <span className="text-sm font-bold text-slate-700 tracking-wider">
            RANKING {filterBencana !== 'Semua Bencana' ? filterBencana.toUpperCase() : 'BENCANA'}
          </span>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </div>
        <div className="flex-1 overflow-y-auto p-0">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 z-10">
              <tr>
                <th className="px-3 py-2 text-slate-500 font-semibold w-8">NO</th>
                <th className="px-3 py-2 text-slate-500 font-semibold">WILAYAH</th>
                <th className="px-3 py-2 text-slate-500 font-semibold text-center">RISIKO</th>
              </tr>
            </thead>
            <tbody>
              {ranking.length > 0 ? (
                ranking.map((row, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-2.5 text-slate-400">{i + 1}.</td>
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-slate-700">{row.properties?.desa || row.properties?.nama_wilayah || 'Unknown'}</div>
                      <div className="text-[10px] text-slate-400">{row.properties?.kecamatan || '-'}</div>
                      <div className="text-[9px] text-blue-500 font-medium mt-0.5">Hujan: {row.properties?.presipitasi || 0}mm | Elevasi: {Math.round(row.properties?.elevasi || 0)}m</div>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        row.properties?.tingkat_risiko === 'TINGGI' ? 'bg-red-100 text-red-600' : 
                        row.properties?.tingkat_risiko === 'SEDANG' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'
                      }`}>
                        {row.properties?.tingkat_risiko || 'RENDAH'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-slate-400">
                    Tidak ada data ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MAP */}
      <MapContainer center={CENTER} zoom={12} zoomControl={false} className="w-full h-full z-10 cursor-crosshair">
        <MapClickHandler 
          routingMode={routingMode} 
          routeStart={routeStart} 
          routeEnd={routeEnd} 
          setRouteStart={setRouteStart} 
          setRouteEnd={setRouteEnd} 
        />

        <LayersControl position="bottomleft">
          <BaseLayer checked name="Peta Minimalis (Terang)">
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution="&copy; OpenStreetMap &copy; CARTO" />
          </BaseLayer>
          <BaseLayer name="Peta Topografi (Kontur Elevasi)">
            <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}" attribution="&copy; Esri, HERE, Garmin, Intermap, increment P Corp., GEBCO, USGS, FAO, NPS, NRCAN, GeoBase, IGN, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), (c) OpenStreetMap contributors, and the GIS User Community" />
          </BaseLayer>
          <BaseLayer name="OpenStreetMap">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
          </BaseLayer>

          {layers.jaringan_jalan && (
            <Overlay name="🕸️ Jaringan Jalan (Routing)">
              <GeoJSON 
                data={layers.jaringan_jalan} 
                style={{ color: '#94a3b8', weight: 1.5, opacity: 0.6 }}
                onEachFeature={(feature, layer) => {
                  layer.bindPopup(`<b>🛣️ ${feature.properties.nama || 'Jalan'}</b><br/>Tipe: ${feature.properties.tipe}<br/>ID: ${feature.properties.id}`);
                }}
              />
            </Overlay>
          )}

          {layers.wilayah && filterWilayah === 'Semua Wilayah' && (
            <Overlay checked name="🗺️ Batas Wilayah Kecamatan">
              <GeoJSON 
                data={layers.wilayah} 
                style={{ color: '#1e293b', weight: 3, opacity: 1, fillOpacity: 0.05, dashArray: '5, 5' }}
                onEachFeature={(feature, layer) => {
                  layer.bindTooltip(`<b>${feature.properties.kecamatan}</b>`, { sticky: true, className: 'bg-white/95 text-slate-800 font-extrabold border-0 shadow-md px-2 py-1 text-sm' });
                  layer.on('click', (e) => {
                    fetchCuaca(e.latlng.lat, e.latlng.lng, `Kec. ${feature.properties.kecamatan}`);
                  });
                }}
              />
            </Overlay>
          )}

          {layers.desa && filterWilayah !== 'Semua Wilayah' && (
            <Overlay checked name="📍 Batas Desa/Kelurahan">
              <GeoJSON 
                key={`desa-${filterWilayah}`}
                data={filterFeatures(enrichedDesa)} 
                style={(f: any) => {
                  const baseStyle = { color: '#047857', weight: 2.5, opacity: 0.9, fillOpacity: 0.1, dashArray: '3, 4' };
                  if (f.properties?.tingkat_risiko) {
                    const riskColor = getRisikoFillColor(f.properties.tingkat_risiko);
                    return { ...baseStyle, fillColor: riskColor, fillOpacity: 0.45, color: riskColor, opacity: 1, dashArray: '' };
                  }
                  return baseStyle;
                }}
                onEachFeature={(feature, layer) => {
                  const p = feature.properties;
                  const riskHtml = p.tingkat_risiko 
                    ? `<br/><span class="px-1.5 py-0.5 rounded text-[10px] text-white font-bold mt-1 inline-block shadow-sm" style="background:${getRisikoFillColor(p.tingkat_risiko)}">Risiko: ${p.tingkat_risiko}</span>` 
                    : '';
                  const weatherHtml = `<div class="text-[9px] mt-1 text-slate-600 font-medium">Elevasi: ${Math.round(p.elevasi || 0)}m | Hujan: ${p.presipitasi || 0}mm ${p.hujan ? '🌧️' : ''}</div>`;
                  layer.bindTooltip(`<div class="text-center"><span class="text-sm text-emerald-900 font-extrabold drop-shadow-sm">${p.desa}</span>${riskHtml}${weatherHtml}</div>`, { sticky: true, className: 'bg-white/95 border-0 shadow-lg px-3 py-1.5' });
                  layer.on('click', (e) => {
                    fetchCuaca(e.latlng.lat, e.latlng.lng, `Kel. ${p.desa}`);
                  });
                }}
              />
            </Overlay>
          )}

          {layers.pemukiman && (
            <Overlay checked name="🏘️ Pemukiman Warga">
              <GeoJSON 
                data={layers.pemukiman} 
                style={{ color: '#f97316', weight: 1, opacity: 0.8, fillColor: '#fdba74', fillOpacity: 0.4 }}
                onEachFeature={(feature, layer) => {
                  const p = feature.properties;
                  layer.bindPopup(`
                    <div class="map-popup p-3 min-w-[200px]">
                      <div class="font-bold text-slate-800 text-[15px] mb-2 border-b pb-2 border-slate-200 flex items-center gap-2">
                        🏘️ ${p.nama}
                      </div>
                      <table class="w-full text-xs text-slate-600">
                        <tr><td class="py-1 w-20 text-slate-400">Kecamatan</td><td class="py-1 font-medium">${p.kecamatan || '-'}</td></tr>
                        ${p.deskripsi ? `<tr><td colspan="2" class="pt-2"><div class="bg-slate-50 p-2 rounded text-slate-500 italic border border-slate-100">"${p.deskripsi}"</div></td></tr>` : ''}
                      </table>
                    </div>
                  `);
                }}
              />
            </Overlay>
          )}

          {/* DAERAH RAWAN BANJIR (MOCK) - HIDDEN TO PREVENT CLUTTER 
              Since we now map risk to enrichedDesa, we don't need the boxy shapes!
          */}
          
          {layers.evakuasi && (
            <Overlay name="🚗 Jalur Evakuasi">
              <GeoJSON 
                data={filterFeatures(layers.evakuasi)} 
                style={(f: any) => jalurStyle(f.properties?.jenis_jalur)}
                onEachFeature={(feature, layer) => {
                  layer.bindPopup(`<b>🚗 ${feature.properties.nama_jalur}</b><br/>Jenis: ${feature.properties.jenis_jalur}`);
                }}
              />
            </Overlay>
          )}

          {layers.pengungsian && layers.pengungsian.features?.map((f: any) => {
            if (filterWilayah !== 'Semua Wilayah' && f.properties.kecamatan !== filterWilayah) return null;
            return (
              <Overlay key={f.properties.id} name="🏠 Titik Pengungsian">
                <Marker position={[f.geometry.coordinates[1], f.geometry.coordinates[0]]} icon={createIcon('#3b82f6', '🏠')}>
                  <Popup><b>🏠 {f.properties.nama_lokasi}</b><br/>Kapasitas: {f.properties.kapasitas}</Popup>
                </Marker>
              </Overlay>
            );
          })}
          
        </LayersControl>

        {/* ROUTING RENDER */}
        {routeStart && (
          <Marker position={routeStart} icon={createIcon('#22c55e', 'A')} zIndexOffset={1000}>
            <Popup>Titik Awal</Popup>
          </Marker>
        )}
        {routeEnd && (
          <Marker position={routeEnd} icon={createIcon('#3b82f6', 'B')} zIndexOffset={1000}>
            <Popup>Titik Tujuan Evakuasi</Popup>
          </Marker>
        )}
        {routeGeoJSON && (
          <GeoJSON 
            key={JSON.stringify(routeGeoJSON)} 
            data={routeGeoJSON} 
            style={{ color: '#3b82f6', weight: 6, opacity: 0.8, dashArray: '10, 10' }} 
          />
        )}
        
        <ZoomControl position="bottomright" />
      </MapContainer>
    </div>
  );
}
