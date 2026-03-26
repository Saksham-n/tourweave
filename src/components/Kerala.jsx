import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import keralaDataRaw from '../data/kerala.geojson?raw';
import './StateMap.css';

// Helper to fix coordinates
const normalizeCoordinates = (coords) => {
  if (!Array.isArray(coords)) return coords;
  if (coords.length === 2 && typeof coords[0] === 'number') {
      let lon = coords[0];
      let lat = coords[1];
      if (lon > 180) lon = lon / 1000000;
      if (lat > 90) lat = lat / 1000000;
      return [lon, lat];
  }
  return coords.map(item => {
      if (Array.isArray(item)) return normalizeCoordinates(item);
      return item;
  });
};

const fixGeoJSONCoordinates = (geoJSON) => {
  const fixed = JSON.parse(JSON.stringify(geoJSON));
  fixed.features.forEach(feature => {
      if (feature.geometry && feature.geometry.coordinates) {
          feature.geometry.coordinates = normalizeCoordinates(feature.geometry.coordinates);
      }
  });
  return fixed;
};

const keralaData = fixGeoJSONCoordinates(JSON.parse(keralaDataRaw));

const Kerala = () => {
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [hoveredDistrict, setHoveredDistrict] = useState(null);
  const navigate = useNavigate();

  const districtDescriptions = {
            'Kasaragod': 'Known for its rich cultural heritage, Kasaragod is famous for the traditional Theyyam dance and the historic Bekal Fort. It\'s the northernmost district of Kerala with beautiful beaches and a blend of Tulu and Malayalam cultures.',
            'Kannur': 'Famous for its martial arts tradition (Kalaripayattu), Kannur is home to the historic St. Angelo Fort and beautiful beaches. The district is known for its handloom industry and traditional arts.',
            'Wayanad': 'A hill district known for its wildlife sanctuaries, Wayanad features the prehistoric Edakkal Caves with ancient petroglyphs. It\'s a paradise for nature lovers with coffee plantations and misty hills.',
            'Kozhikode': 'Formerly known as Calicut, this district was a major spice trade center. It\'s home to the Dutch Cemetery, Kozhikode Beach, and is known for its cultural heritage and educational institutions.',
            'Malappuram': 'Known for its Islamic heritage, Malappuram has numerous mosques and is home to Kottakkal Arya Vaidya Sala, a renowned Ayurvedic treatment center. The district is famous for its traditional arts and crafts.',
            'Palakkad': 'Called the "Gateway to Kerala," Palakkad is known for its Palmyra trees, Silent Valley National Park, and a unique blend of Tamil and Malayalam cultures. It\'s famous for its jaggery production.',
            'Thrissur': 'Known as the "Cultural Capital of Kerala," Thrissur hosts the famous Thrissur Pooram festival. It\'s home to the Vadakkunnathan Temple and is a center for traditional arts and classical music.',
            'Ernakulam': 'The commercial capital of Kerala, Ernakulam is home to Kochi-Muziris Biennale and the historic Dutch Cemetery. It\'s a major business hub with beautiful backwaters and Chinese fishing nets.',
            'Idukki': 'Known for its dams and wildlife, Idukki is home to the Idukki Arch Dam and Periyar Tiger Reserve. The district offers stunning hill stations and is a major producer of hydroelectric power.',
            'Kottayam': 'Called the "Land of Lakes and Letters," Kottayam is the center of Malayalam literature and publishing. It\'s home to the famous rubber plantations and beautiful backwaters.',
            'Alappuzha': 'Known as the "Venice of the East," Alappuzha is famous for its backwater tourism, houseboat cruises, and the Nehru Trophy Boat Race. It\'s also known for coir industry and Chinese fishing nets.',
            'Pathanamthitta': 'A pilgrim center with numerous temples and churches, Pathanamthitta is known for the Sabarimala Temple. The district features beautiful hills and is rich in Christian and Hindu religious traditions.',
            'Kollam': 'Known as the "Gateway to the Backwaters," Kollam is famous for its cashew processing industry and Chinese fishing nets. It has a rich maritime history and beautiful Ashtamudi Lake.',
            'Thiruvananthapuram': 'The capital city of Kerala, Thiruvananthapuram is home to the famous Padmanabhaswamy Temple and Napier Museum. It\'s known for its cultural heritage, space research center, and beautiful beaches.'
        };

  const activeDistrict = hoveredDistrict || selectedDistrict;
  const activeTitle = activeDistrict || 'Kerala';
  const activeDesc = activeDistrict 
    ? (districtDescriptions[activeDistrict] || 'No description available for this district.')
    : 'Kerala, God\'s Own Country, is known for its palm-lined beaches, backwaters, a network of canals, and rich cultural heritage.';
  
  const activeImage = '/images/mh.webp';

  // Styles specific to Kerala
  const keralaStyles = {
    '--bg-color': '#e8f5e9',
    '--card-bg': '#ffffff',
    '--text-primary': '#1b5e20',
    '--text-secondary': '#2e7d32',
    '--map-fill': '#a5d6a7',
    '--map-hover': '#1b5e20',
    '--map-stroke': '#e8f5e9',
    '--btn-gallery': '#2e7d32',
    '--btn-planner': '#f9a825'
  };

  const styleFunction = (feature) => {
    const name = feature.properties.district || feature.properties.st_nm || feature.properties.name;
    const isActive = selectedDistrict === name || hoveredDistrict === name;
    return {
      fillColor: isActive ? 'var(--map-hover)' : 'var(--map-fill)',
      weight: 1.5,
      opacity: 1,
      color: 'var(--map-stroke)',
      fillOpacity: 1
    };
  };

  const onEachFeature = (feature, layer) => {
    const name = feature.properties.district || feature.properties.st_nm || feature.properties.name;
    layer.on({
      mouseover: () => setHoveredDistrict(name),
      mouseout: () => setHoveredDistrict(null),
      click: () => setSelectedDistrict(name === selectedDistrict ? null : name)
    });
  };

  return (
    <div className="state-map-container" style={keralaStyles}>
      <div className="dashboard-card">
        <div className="map-section" style={{ background: 'rgba(165, 214, 167, 0.1)' }}>
          <button className="back-btn" onClick={() => navigate(-1)}><i className="fa-solid fa-arrow-left"></i> Back</button>
          <MapContainer 
            center={[10.5, 76.5]} 
            zoom={7.2} 
            style={{ height: '100%', width: '100%', background: 'transparent' }}
            zoomControl={false}
            scrollWheelZoom={false}
            doubleClickZoom={false}
            dragging={false}
          >
            <GeoJSON 
              data={keralaData} 
              style={styleFunction} 
              onEachFeature={onEachFeature} 
            />
          </MapContainer>
        </div>

        <div className="content-section">
          <div className="content-header">
            <h1>Discover Kerala</h1>
          </div>
          
          <div className="featured-image-container">
            <img 
              src={activeImage} 
              className="featured-image" 
              alt={activeTitle}
              onError={(e) => e.target.src = 'https://via.placeholder.com/400x300/CCCCCC/FFFFFF?text=No+Image'}
            />
          </div>

          <div className="district-info">
            <h2 className="district-title">{activeTitle}</h2>
            <p className="district-desc">{activeDesc}</p>
          </div>

          <div className="footer-controls">
            <div className="custom-divider">
                <i className="fa-solid fa-leaf"></i>
            </div>
            <div className="action-buttons">
              {/* <button className="pill-btn btn-gallery" style={{ backgroundColor: 'var(--btn-gallery)', color: 'white' }}>
                <i className="fa-regular fa-images"></i> Gallery
              </button> */}
              <button className="pill-btn btn-planner" style={{ backgroundColor: 'var(--btn-planner)', color: 'white' }}>
                <i className="fa-solid fa-wand-magic-sparkles"></i> AI Planner
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

  );
};

export default Kerala;
