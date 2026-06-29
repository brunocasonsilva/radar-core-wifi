import React, { useRef, useState } from 'react';
import { GoogleMap, LoadScript, Marker, Circle } from '@react-google-maps/api';
import './App.css';

const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
const libraries = ['places'];

const mapContainerStyle = {
  width: '100%',
  height: '500px',
  borderRadius: '8px'
};

const defaultCenter = {
  lat: -23.5505,
  lng: -46.6333
};

function App() {
  const [map, setMap] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [radius, setRadius] = useState(5);
  const [competitors, setCompetitors] = useState([]);
  const [loading, setLoading] = useState(false);
  const serviceRef = useRef(null);

  const onMapLoad = (mapInstance) => {
    console.log('Mapa carregado!');
    setMap(mapInstance);
    serviceRef.current = new window.google.maps.places.PlacesService(mapInstance);
  };

  const handleSearchPlace = async () => {
    console.log('Iniciando busca por:', searchInput);
    
    if (!serviceRef.current || !searchInput) {
      console.log('Erro: serviceRef ou searchInput vazio');
      return;
    }

    setLoading(true);
    try {
      const request = {
        query: searchInput,
        fields: ['place_id', 'geometry', 'name', 'types', 'formatted_address', 'formatted_phone_number', 'opening_hours', 'rating']
      };

      console.log('Enviando request:', request);

      serviceRef.current.findPlaceFromQuery(request, (results, status) => {
        console.log('Status da busca:', status);
        console.log('Resultados:', results);

        if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
          const place = results[0];
          console.log('Lugar encontrado:', place.name);
          
          setSelectedPlace({
            id: place.place_id,
            name: place.name,
            location: place.geometry.location,
            address: place.formatted_address,
            phone: place.formatted_phone_number || 'N/A',
            website: 'N/A',
            types: place.types || [],
            hours: place.opening_hours?.weekday_text || [],
            rating: place.rating || 'N/A'
          });

          if (map) {
            map.panTo(place.geometry.location);
            map.setZoom(15);
          }

          setCompetitors([]);
        } else {
          alert('Estabelecimento não encontrado. Tente outro nome ou endereço.');
        }
        setLoading(false);
      });
    } catch (error) {
      console.error('Erro na busca:', error);
      alert('Erro ao buscar: ' + error.message);
      setLoading(false);
    }
  };

  const handleSearchCompetitors = async () => {
    console.log('Iniciando busca de concorrentes');
    
    if (!selectedPlace || !serviceRef.current || !map) {
      console.log('Erro: faltam dados para buscar concorrentes');
      return;
    }

    setLoading(true);
    try {
      const radiusInMeters = radius * 1000;
      const placeType = selectedPlace.types[0] || 'establishment';

      console.log('Tipo de lugar:', placeType);
      console.log('Raio:', radiusInMeters, 'metros');

      const request = {
        location: selectedPlace.location,
        radius: radiusInMeters,
        type: placeType,
        fields: ['place_id', 'name', 'geometry', 'formatted_address', 'formatted_phone_number', 'opening_hours', 'rating']
      };

      serviceRef.current.nearbySearch(request, (results, status) => {
        console.log('Status busca concorrentes:', status);
        console.log('Total encontrado:', results?.length);

        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          const filtered = results.filter(r => r.place_id !== selectedPlace.id);

          const competitorsList = filtered.map(place => ({
            id: place.place_id,
            name: place.name,
            location: place.geometry.location,
            address: place.formatted_address || 'N/A',
            phone: place.formatted_phone_number || 'N/A',
            website: 'N/A',
            hours: place.opening_hours?.weekday_text || [],
            rating: place.rating || 'N/A',
            distance: calculateDistance(selectedPlace.location, place.geometry.location)
          }));

          console.log('Concorrentes encontrados:', competitorsList.length);
          setCompetitors(competitorsList.sort((a, b) => a.distance - b.distance));
        }
        setLoading(false);
      });
    } catch (error) {
      console.error('Erro ao buscar concorrentes:', error);
      setLoading(false);
    }
  };

  const calculateDistance = (loc1, loc2) => {
    const R = 6371;
    const dLat = (loc2.lat() - loc1.lat()) * Math.PI / 180;
    const dLng = (loc2.lng() - loc1.lng()) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(loc1.lat() * Math.PI / 180) * Math.cos(loc2.lat() * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
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
    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={libraries}>
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
              <button onClick={handleSearchPlace} disabled={loading} className="btn btn-primary">
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
                  <button onClick={handleSearchCompetitors} disabled={loading} className="btn btn-secondary">
                    {loading ? 'Buscando...' : 'Buscar Concorrentes'}
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className="map-section">
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={selectedPlace?.location || defaultCenter}
              zoom={selectedPlace ? 15 : 12}
              onLoad={onMapLoad}
            >
              {selectedPlace && (
                <>
                  <Marker
                    position={selectedPlace.location}
                    title={selectedPlace.name}
                    icon="http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
                  />
                  <Circle
                    center={selectedPlace.location}
                    radius={radius * 1000}
                    options={{
                      fillColor: '#4285F4',
                      fillOpacity: 0.1,
                      strokeColor: '#4285F4',
                      strokeOpacity: 0.8,
                      strokeWeight: 2
                    }}
                  />
                </>
              )}

              {competitors.map((competitor, index) => (
                <Marker
                  key={index}
                  position={competitor.location}
                  title={competitor.name}
                  icon="http://maps.google.com/mapfiles/ms/icons/red-dot.png"
                />
              ))}
            </GoogleMap>
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
                      <th>Telefone</th>
                      <th>Site</th>
                      <th>Avaliação</th>
                      <th>Horário</th>
                    </tr>
                  </thead>
                  <tbody>
                    {competitors.map((competitor, index) => (
                      <tr key={index}>
                        <td>{competitor.name}</td>
                        <td>{competitor.distance.toFixed(2)} km</td>
                        <td>{competitor.phone}</td>
                        <td>{competitor.website}</td>
                        <td>⭐ {competitor.rating !== 'N/A' ? competitor.rating : 'N/A'}</td>
                        <td>{competitor.hours.length > 0 ? competitor.hours[0] : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </main>
      </div>
    </LoadScript>
  );
}