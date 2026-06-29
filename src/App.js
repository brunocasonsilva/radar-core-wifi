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
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchInput)}&format=json&limit=1`
      );
      const results = await response.json();

      if (results.length > 0) {
        const place = results[0];
        const lat = parseFloat(place.lat);
        const lon = parseFloat(place.lon);

        setSelectedPlace({
          name: place.display_name.split(',')[0],
          address: place.display_name,
          lat: lat,
          lon: lon
        });

        setMapCenter([lat, lon]);
        setCompetitors([]);
      } else {
        alert('Local não encontrado. Tente outro nome ou endereço.');
      }
    } catch (error) {
      alert('Erro ao buscar local');
    }
    setLoading(false);
  };

  const searchCompetitors = async () => {
    if (!selectedPlace) return;

    setLoading(true);
    try {
      const keywords = ['restaurante', 'café', 'bar', 'padaria', 'lanchonete'];
      const allResults = [];

      for (let keyword of keywords) {
        const query = `${keyword} near ${selectedPlace.name}`;
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=10&viewbox=${selectedPlace.lon - radius/111},${selectedPlace.lat - radius/111},${selectedPlace.lon + radius/111},${selectedPlace.lat + radius/111}&bounded=1`
        );
        const results = await response.json();
        
        results.forEach(place => {
          const lat = parseFloat(place.lat);
          const lon = parseFloat(place.lon);
          const dist = calculateDistance(selectedPlace.lat, selectedPlace.lon, lat, lon);
          
          if (dist > 0.1 && dist <= radius) {
            allResults.push({
              id: place.place_id,
              name: place.display_name.split(',')[0],
              address: place.display_name,
              lat: lat,
              lon: lon,
              type: keyword,
              phone: 'N/A',
              hours: 'N/A',
              distance: dist
            });
          }
        });
      }

      // Remove duplicatas
      const unique = Array.from(
        new Map(allResults.map(item => [item.id, item])).values()
      ).sort((a, b) => a.distance - b.distance);

      setCompetitors(unique.slice(0, 50));
      if (unique.length === 0) {
        alert('Nenhum estabelecimento encontrado neste raio');
      }
    } catch (error) {
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
                  {comp.type}
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
                    <th>Endereço</th>
                  </tr>
                </thead>
                <tbody>
                  {competitors.map((comp) => (
                    <tr key={comp.id}>
                      <td>{comp.name}</td>
                      <td>{comp.distance.toFixed(2)} km</td>
                      <td>{comp.type}</td>
                      <td>{comp.address}</td>
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