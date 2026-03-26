import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import goaDataRaw from '../data/goa.geojson?raw';
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

const goaData = fixGeoJSONCoordinates(JSON.parse(goaDataRaw));

const Goa = () => {
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [hoveredDistrict, setHoveredDistrict] = useState(null);
  const navigate = useNavigate();

  const districtDescriptions = {
    'North Goa': 'North Goa is known for its vibrant beaches, historic forts, and Portuguese colonial architecture. It\'s home to popular tourist destinations like Calangute and Baga beaches, as well as the historic Fort Aguada. The district is famous for its cashew plantations and is a major hub for tourism and agriculture.',
    'South Goa': 'South Goa is renowned for its pristine beaches, spice plantations, and rich cultural heritage. It\'s home to the famous Colva and Margao beaches, and is known for its Portuguese-influenced cuisine and architecture. The district is a major producer of cashews and spices, and hosts various cultural festivals.'
  };

  const activeDistrict = hoveredDistrict || selectedDistrict;
  const activeTitle = activeDistrict || 'Goa';
  const activeDesc = activeDistrict 
    ? (districtDescriptions[activeDistrict] || 'No description available for this district.')
    : 'Goa is known for its striking landscape, famous beaches in India, astounding monuments and churches and bustling nightlife.';
  
  const activeImage = '/images/ds.jpg';

  // Styles specific to Goa
  const goaStyles = {
    '--bg-color': '#e0f7fa',
    '--card-bg': '#ffffff',
    '--text-primary': '#006064',
    '--text-secondary': '#00838f',
    '--map-fill': '#4dd0e1',
    '--map-hover': '#0097a7',
    '--map-stroke': '#e0f7fa',
    '--btn-gallery': '#006064',
    '--btn-planner': '#fbc02d'
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
    <div className="state-map-container" style={goaStyles}>
      <div className="dashboard-card">
        <div className="map-section" style={{ background: 'rgba(77, 208, 225, 0.1)' }}>
          <button className="back-btn" onClick={() => navigate(-1)}><i className="fa-solid fa-arrow-left"></i> Back</button>
          <MapContainer 
            center={[15.3, 74.1]} 
            zoom={9} 
            style={{ height: '100%', width: '100%', background: 'transparent' }}
            zoomControl={false}
            scrollWheelZoom={false}
            doubleClickZoom={false}
            dragging={false}
          >
            <GeoJSON 
              data={goaData} 
              style={styleFunction} 
              onEachFeature={onEachFeature} 
            />
          </MapContainer>
        </div>

        <div className="content-section">
          <div className="content-header">
            <h1>Discover Goa</h1>
          </div>
          
          <div className="featured-image-container">
            <img 
              src={activeImage} 
              className="featured-image" 
              alt={activeTitle}
              onError={(e) => e.target.src = '/images/goa.webp'}
            />
          </div>

          <div className="district-info">
            <h2 className="district-title">{activeTitle}</h2>
            <p className="district-desc">{activeDesc}</p>
          </div>

          <div className="footer-controls">
            <div className="custom-divider">
                <i className="fa-solid fa-umbrella-beach"></i>
            </div>
            <div className="action-buttons">
              {/* <button className="pill-btn btn-gallery" style={{ backgroundColor: 'var(--btn-gallery)', color: 'white' }}>
                <i className="fa-regular fa-images"></i> Gallery
              </button> */}
              <button 
                className="pill-btn btn-planner" 
                style={{ backgroundColor: 'var(--btn-planner)', color: 'var(--text-primary)' }}
                onClick={() => navigate('/planner/Goa')}
              >
                <i className="fa-solid fa-wand-magic-sparkles"></i> AI Planner
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

  );
};

export default Goa;
