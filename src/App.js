import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import './App.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const blueIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const redIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function App() {
  const [searchInput, setSearchInput] = useState('');
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [radius, setRadius] = useState(5);
  const [competitors, setCompetitors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState([-23.5505, -46.6333]);

  const searchPlace = async () => {
    if (!searchInput) return;

    setLoading(true);
    try {
      console.log('Buscando:', searchInput);
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchInput)}&format=json&limit=1`
      );
      const results = await response.json();

      if (results.length > 0) {
        const place = results[0];
        console.log('Lugar encontrado:', place.display_name);
        
        const lat = parseFloat(place.lat);
        const lon = parseFloat(place.lon);

        setSelectedPlace({
          name: place.display_name.split(',')[0],
          address: place.display_name,
          lat: lat,
          lon: lon,
          type: 'restaurant'
        });

        setMapCenter([lat, lon]);
        setCompetitors([]);
      } else {
        alert('Local não encontrado. Tente outro nome ou endereço.');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao buscar local');
    }
    setLoading(false);
  };

  const searchCompetitors = async () => {
    if (!selectedPlace) return;

    setLoading(true);
    try {
      console.log('Buscando estabelecimentos próximos...');
      
      const south = selectedPlace.lat - (radius / 111);
      const north = selectedPlace.lat + (radius / 111);
      const west = selectedPlace.lon - (radius / 111);
      const east = selectedPlace.lon + (radius / 111);

      const query = `[bbox:${south},${west},${north},${east}];(node["amenity"~"restaurant|cafe|bar|fast_food|pub"];);out center;`;

      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query
      });

      const data = await response.json();
      console.log('Encontrados:', data.elements?.length || 0);

      if (data.elements && data.elements.length > 0) {
        const places = data.elements
          .filter(el => el.lat && el.lon)
          .map(el => ({
            id: el.id,
            name: el.tags?.name || 'Sem nome',
            lat: el.lat,
            lon: el.lon,
            phone: el.tags?.['contact:phone'] || 'N/A',
            hours: el.tags?.['opening_hours'] || 'N/A',
            type: el.tags?.amenity || 'Estabelecimento',
            distance: calculateDistance(selectedPlace.lat, selectedPlace.lon, el.lat, el.lon)
          }))
          .filter(p => p.distance > 0.1) // Remove o próprio lugar
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 50);

        setCompetitors(places);
      } else {
        alert('Nenhum estabelecimento encontrado neste raio');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao buscar concorrentes. Tente novamente.');
    }
    setLoading(false);
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const generatePDF = () => {
    const html2pdf = require('html2pdf.js');
    const element = document.getElementById('report-content');
    const opt = {
      margin: 10,
      filename: `radar-core-${Date.now()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>🎯 Radar Core Wi-Fi</h1>
        <p>Análise de Concorrentes por Raio de Cobertura</p>
      </header>

      <main className="app-main">
        <section className="search-section">
          <div className="search-container">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Digite o nome do estabelecimento ou endereço"
              className="search-input"
            />
            <button onClick={searchPlace} disabled={loading} className="btn btn-primary">
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>

          {selectedPlace && (
            <div className="selected-place-info">
              <h3>{selectedPlace.name}</h3>
              <p>{selectedPlace.address}</p>
              <div className="radius-selector">
                <label>Raio de Busca:</label>
                <select value={radius} onChange={(e) => setRadius(Number(e.target.value))}>
                  <option value={1}>1 km</option>
                  <option value={5}>5 km</option>
                  <option value={10}>10 km</option>
                </select>
                <button onClick={searchCompetitors} disabled={loading} className="btn btn-secondary">
                  {loading ? 'Buscando...' : 'Buscar Concorrentes'}
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="map-section">
          <MapContainer center={mapCenter} zoom={13} style={{ height: '500px', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            
            {selectedPlace && (
              <>
                <Marker position={[selectedPlace.lat, selectedPlace.lon]} icon={blueIcon}>
                  <Popup>{selectedPlace.name}</Popup>
                </Marker>
                <Circle
                  center={[selectedPlace.lat, selectedPlace.lon]}
                  radius={radius * 1000}
                  pathOptions={{ color: '#4285F4', fillOpacity: 0.1 }}
                />
              </>
            )}

            {competitors.map((comp) => (
              <Marker key={comp.id} position={[comp.lat, comp.lon]} icon={redIcon}>
                <Popup>
                  <strong>{comp.name}</strong><br />
                  {comp.distance.toFixed(2)} km<br />
                  {comp.type}<br />
                  {comp.phone}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </section>

        {competitors.length > 0 && (
          <section className="results-section">
            <div className="results-header">
              <h2>Concorrentes Encontrados ({competitors.length})</h2>
              <button onClick={generatePDF} className="btn btn-export">
                📄 Exportar PDF
              </button>
            </div>

            <div id="report-content" className="results-table">
              <table>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Distância</th>
                    <th>Tipo</th>
                    <th>Telefone</th>
                    <th>Horário</th>
                  </tr>
                </thead>
                <tbody>
                  {competitors.map((comp) => (
                    <tr key={comp.id}>
                      <td>{comp.name}</td>
                      <td>{comp.distance.toFixed(2)} km</td>
                      <td>{comp.type}</td>
                      <td>{comp.phone}</td>
                      <td>{comp.hours}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;