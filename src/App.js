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

const CLIENT_ID = process.env.REACT_APP_FOURSQUARE_CLIENT_ID;
const CLIENT_SECRET = process.env.REACT_APP_FOURSQUARE_CLIENT_SECRET;

function App() {
  const [searchInput, setSearchInput] = useState('');
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [radius, setRadius] = useState(5);
  const [competitors, setCompetitors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState([-23.5505, -46.6333]);

  const searchPlace = async () => {
    if (!searchInput) {
      alert('Digite um nome ou endereço');
      return;
    }

    setLoading(true);
    try {
      console.log('Buscando com Foursquare:', searchInput);
      
      const response = await fetch(
        `https://api.foursquare.com/v2/venues/search?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&query=${encodeURIComponent(searchInput)}&limit=1&v=20230101`
      );
      const data = await response.json();

      if (data.response.venues && data.response.venues.length > 0) {
        const venue = data.response.venues[0];
        const lat = venue.location.lat;
        const lon = venue.location.lng;

        setSelectedPlace({
          id: venue.id,
          name: venue.name,
          address: venue.location.address || 'Sem endereço',
          city: venue.location.city || '',
          lat: lat,
          lon: lon,
          category: venue.categories[0]?.name || 'Estabelecimento',
          phone: venue.contact?.phone || 'N/A',
          hours: venue.hours?.status || 'N/A'
        });

        setMapCenter([lat, lon]);
        setCompetitors([]);
        console.log('Lugar encontrado:', venue.name);
      } else {
        alert('Local não encontrado no Foursquare. Tente outro nome.');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao buscar local: ' + error.message);
    }
    setLoading(false);
  };

  const searchCompetitors = async () => {
    if (!selectedPlace) return;

    setLoading(true);
    try {
      console.log('Buscando concorrentes perto de:', selectedPlace.name);
      
      // Usa a categoria do lugar encontrado para buscar similares
      const query = selectedPlace.category;
      const radiusMeters = radius * 1000;

      const response = await fetch(
        `https://api.foursquare.com/v2/venues/search?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&ll=${selectedPlace.lat},${selectedPlace.lon}&query=${encodeURIComponent(query)}&radius=${radiusMeters}&limit=50&v=20230101`
      );
      const data = await response.json();

      if (data.response.venues) {
        const venues = data.response.venues
          .filter(v => v.id !== selectedPlace.id)
          .map(v => ({
            id: v.id,
            name: v.name,
            address: v.location.address || 'Sem endereço',
            city: v.location.city || '',
            lat: v.location.lat,
            lon: v.location.lng,
            category: v.categories[0]?.name || 'Estabelecimento',
            phone: v.contact?.phone || 'N/A',
            hours: v.hours?.status || 'N/A',
            rating: v.rating || 'N/A',
            distance: calculateDistance(selectedPlace.lat, selectedPlace.lon, v.location.lat, v.location.lng)
          }))
          .sort((a, b) => a.distance - b.distance);

        setCompetitors(venues);
        console.log('Concorrentes encontrados:', venues.length);
        
        if (venues.length === 0) {
          alert('Nenhum estabelecimento similar encontrado neste raio.');
        }
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao buscar concorrentes: ' + error.message);
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
              placeholder="Ex: Starbucks Av Paulista, McDonald's São Paulo, Bar Vila Madalena"
              className="search-input"
            />
            <button onClick={searchPlace} disabled={loading} className="btn btn-primary">
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>

          {selectedPlace && (
            <div className="selected-place-info">
              <h3>{selectedPlace.name}</h3>
              <p>
                {selectedPlace.address} {selectedPlace.city && `- ${selectedPlace.city}`}
              </p>
              <p style={{ fontSize: '0.9rem', color: '#666' }}>
                📂 {selectedPlace.category} | 📞 {selectedPlace.phone}
              </p>
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
                  <Popup>
                    <strong>{selectedPlace.name}</strong><br />
                    {selectedPlace.category}<br />
                    {selectedPlace.phone}
                  </Popup>
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
                  ⭐ {comp.rating}<br />
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
                    <th>Categoria</th>
                    <th>Avaliação</th>
                    <th>Telefone</th>
                    <th>Endereço</th>
                  </tr>
                </thead>
                <tbody>
                  {competitors.map((comp) => (
                    <tr key={comp.id}>
                      <td>{comp.name}</td>
                      <td>{comp.distance.toFixed(2)} km</td>
                      <td>{comp.category}</td>
                      <td>⭐ {comp.rating}</td>
                      <td>{comp.phone}</td>
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