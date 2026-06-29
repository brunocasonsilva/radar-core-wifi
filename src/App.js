import React, { useState, useRef, useEffect } from 'react';
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

const GOOGLE_MAPS_API_KEY = 'AIzaSyCsXzMSKKBHMqTuy4dRW7sOL0d3NgAk4JI';

function App() {
  const [searchInput, setSearchInput] = useState('');
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [radius, setRadius] = useState(5);
  const [competitors, setCompetitors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState([-23.5505, -46.6333]);
  const serviceRef = useRef(null);
  const detailsServiceRef = useRef(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      const mapDiv = document.createElement('div');
      serviceRef.current = new window.google.maps.places.PlacesService(mapDiv);
      detailsServiceRef.current = new window.google.maps.places.PlacesService(mapDiv);
      setMapsLoaded(true);
      console.log('Google Maps carregado!');
    };
    document.head.appendChild(script);
  }, []);

  const getPlaceDetails = (placeId) => {
    return new Promise((resolve, reject) => {
      const request = {
        placeId: placeId,
        fields: ['name', 'formatted_address', 'formatted_phone_number', 'opening_hours', 'website', 'rating']
      };

      detailsServiceRef.current.getDetails(request, (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          resolve({
            phone: place.formatted_phone_number || 'N/A',
            hours: place.opening_hours?.weekday_text?.[0] || 'N/A',
            address: place.formatted_address || 'N/A',
            website: place.website || 'N/A',
            rating: place.rating || 'N/A'
          });
        } else {
          reject(status);
        }
      });
    });
  };

  const searchPlace = async () => {
    if (!searchInput || !mapsLoaded) {
      alert('Digite um local e aguarde o Google Maps carregar');
      return;
    }

    setLoading(true);
    try {
      console.log('Buscando:', searchInput);
      
      const request = {
        query: searchInput,
        fields: ['place_id', 'geometry', 'name', 'formatted_address', 'types']
      };

      serviceRef.current.findPlaceFromQuery(request, async (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results?.[0]) {
          const place = results[0];
          const lat = place.geometry.location.lat();
          const lon = place.geometry.location.lng();

          // Busca detalhes do lugar
          try {
            const details = await getPlaceDetails(place.place_id);
            setSelectedPlace({
              id: place.place_id,
              name: place.name,
              address: details.address,
              lat: lat,
              lon: lon,
              location: place.geometry.location,
              types: place.types || [],
              phone: details.phone,
              hours: details.hours,
              website: details.website,
              rating: details.rating
            });
          } catch (e) {
            setSelectedPlace({
              id: place.place_id,
              name: place.name,
              address: place.formatted_address,
              lat: lat,
              lon: lon,
              location: place.geometry.location,
              types: place.types || [],
              phone: 'N/A',
              hours: 'N/A',
              website: 'N/A',
              rating: 'N/A'
            });
          }

          setMapCenter([lat, lon]);
          setCompetitors([]);
          console.log('Local encontrado:', place.name);
        } else {
          alert('Local não encontrado. Tente outro nome ou endereço.');
        }
        setLoading(false);
      });
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao buscar local');
      setLoading(false);
    }
  };

  const searchCompetitors = async () => {
    if (!selectedPlace || !mapsLoaded) return;

    setLoading(true);
    try {
      console.log('Buscando concorrentes...');
      
      const radiusMeters = radius * 1000;
      const types = selectedPlace.types.filter(t => t !== 'point_of_interest' && t !== 'establishment');
      const searchType = types[0] || 'restaurant';

      const request = {
        location: selectedPlace.location,
        radius: radiusMeters,
        type: searchType,
        fields: ['place_id', 'name', 'geometry', 'rating']
      };

      serviceRef.current.nearbySearch(request, async (results, status) => {
        console.log('Status:', status);
        console.log('Resultados:', results?.length || 0);

        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          const places = [];
          
          for (let p of results) {
            if (p.place_id === selectedPlace.id) continue;

            try {
              const details = await getPlaceDetails(p.place_id);
              places.push({
                id: p.place_id,
                name: p.name,
                address: details.address,
                lat: p.geometry.location.lat(),
                lon: p.geometry.location.lng(),
                phone: details.phone,
                rating: details.rating,
                hours: details.hours,
                website: details.website,
                distance: calculateDistance(selectedPlace.lat, selectedPlace.lon, p.geometry.location.lat(), p.geometry.location.lng())
              });
            } catch (e) {
              places.push({
                id: p.place_id,
                name: p.name,
                address: 'N/A',
                lat: p.geometry.location.lat(),
                lon: p.geometry.location.lng(),
                phone: 'N/A',
                rating: p.rating || 'N/A',
                hours: 'N/A',
                website: 'N/A',
                distance: calculateDistance(selectedPlace.lat, selectedPlace.lon, p.geometry.location.lat(), p.geometry.location.lng())
              });
            }
          }

          const sorted = places.sort((a, b) => a.distance - b.distance);
          setCompetitors(sorted);
          console.log('Concorrentes encontrados:', sorted.length);

          if (sorted.length === 0) {
            alert('Nenhum estabelecimento similar encontrado neste raio.');
          }
        } else {
          alert('Erro ao buscar concorrentes: ' + status);
        }
        setLoading(false);
      });
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao buscar concorrentes');
      setLoading(false);
    }
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
              onKeyPress={(e) => e.key === 'Enter' && searchPlace()}
              placeholder="Ex: Starbucks São Paulo, McDonald's Av Paulista"
              className="search-input"
            />
            <button onClick={searchPlace} disabled={loading || !mapsLoaded} className="btn btn-primary">
              {!mapsLoaded ? 'Carregando...' : loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>

          {selectedPlace && (
            <div className="selected-place-info">
              <h3>{selectedPlace.name}</h3>
              <p>{selectedPlace.address}</p>
              <p style={{ fontSize: '0.9rem', color: '#666' }}>
                📞 {selectedPlace.phone} | 🌐 {selectedPlace.website}
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
                    <th>Avaliação</th>
                    <th>Telefone</th>
                    <th>Horário</th>
                    <th>Endereço</th>
                  </tr>
                </thead>
                <tbody>
                  {competitors.map((comp) => (
                    <tr key={comp.id}>
                      <td>{comp.name}</td>
                      <td>{comp.distance.toFixed(2)} km</td>
                      <td>⭐ {comp.rating}</td>
                      <td>{comp.phone}</td>
                      <td>{comp.hours}</td>
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