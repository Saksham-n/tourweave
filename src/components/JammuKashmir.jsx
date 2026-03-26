import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import jkDataRaw from '../data/jk.geojson?raw';
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

const jkData = fixGeoJSONCoordinates(JSON.parse(jkDataRaw));

const JammuKashmir = () => {
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [hoveredDistrict, setHoveredDistrict] = useState(null);
  const navigate = useNavigate();

  const districtDescriptions = {
            'Srinagar': 'Srinagar is the summer capital of Jammu and Kashmir and is known as the "Venice of the East" due to its numerous canals and houseboats on Dal Lake. The city is famous for its Mughal gardens, including Shalimar Bagh and Nishat Bagh. It\'s a major tourist destination and educational hub.',
            'Jammu': 'Jammu is the winter capital of Jammu and Kashmir and is known for its ancient temples and palaces. The city is home to the famous Raghunath Temple and has a rich Dogra culture. It\'s also known for its military history and serves as an important gateway to the region.',
            'Anantnag': 'Anantnag is known as the "Rice Bowl of Kashmir" due to its extensive rice cultivation. The district is famous for its saffron production and is home to the ancient Martand Temple. It\'s also known for its scenic beauty and traditional Kashmiri handicrafts.',
            'Baramulla': 'Baramulla is known as the "Gateway to Kashmir" and is famous for its apple orchards and fruit production. The district is home to ancient ruins like Parihaspora and has a rich archaeological heritage. It\'s also known for its traditional shawls and carpets.',
            'Budgam': 'Budgam is known for its agricultural produce and is a major producer of rice and vegetables. The district has several historical monuments and is known for its traditional Kashmiri culture. It\'s also famous for its handloom industry and local crafts.',
            'Ganderbal': 'Ganderbal is known for its natural beauty and is home to popular hill stations like Sonamarg. The district is famous for trout fishing and has rich flora and fauna. It\'s also known for its traditional Kashmiri cuisine and local festivals.',
            'Kulgam': 'Kulgam is known for its scenic landscapes and is home to several ancient temples and shrines. The district has a rich agricultural base and is known for its traditional Kashmiri culture. It\'s also famous for its local handicrafts and folk music.',
            'Pulwama': 'Pulwama is known as the "Apple Bowl of Kashmir" due to its extensive apple cultivation. The district is famous for its saffron and is home to several Mughal gardens. It\'s also known for its traditional shawls and local festivals.',
            'Shopiyan': 'Shopian is known for its agricultural produce and is a major producer of apples and saffron. The district has several historical sites and is known for its traditional Kashmiri culture. It\'s also famous for its local crafts and folk art.',
            'Bandipora': 'Bandipora is known for its natural beauty and is home to the famous Wular Lake. The district is famous for its fish production and has rich biodiversity. It\'s also known for its traditional Kashmiri handicrafts and local festivals.',
            'Kupwara': 'Kupwara is known for its scenic landscapes and is home to several ancient forts and monuments. The district has a rich tribal culture and is known for its traditional Kashmiri arts. It\'s also famous for its local cuisine and folk music.',
            'Punch': 'Punch is known for its historical significance and is home to several ancient forts and palaces. The district has a rich military history and is known for its traditional Dogra culture. It\'s also famous for its local crafts and agricultural produce.',
            'Rajouri': 'Rajouri is known for its diverse culture and is home to several religious sites. The district has a rich tribal heritage and is known for its traditional arts and crafts. It\'s also famous for its scenic beauty and local festivals.',
            'Reasi': 'Reasi is known for its natural beauty and is home to several ancient temples and shrines. The district has a rich agricultural base and is known for its traditional Dogra culture. It\'s also famous for its local handicrafts and folk music.',
            'Ramban': 'Ramban is known for its scenic landscapes and is home to several hydroelectric projects. The district has rich mineral resources and is known for its traditional Kashmiri culture. It\'s also famous for its local crafts and agricultural produce.',
            'Doda': 'Doda is known for its diverse culture and is home to several ancient temples and forts. The district has a rich tribal heritage and is known for its traditional arts and crafts. It\'s also famous for its scenic beauty and local festivals.',
            'Kathua': 'Kathua is known for its historical significance and is home to several ancient monuments. The district has a rich agricultural base and is known for its traditional Dogra culture. It\'s also famous for its local handicrafts and folk music.',
            'Samba': 'Samba is known for its industrial development and is home to several manufacturing units. The district has a rich history and is known for its palaces and temples. It\'s also famous for its agricultural produce and local crafts.',
            'Udhampur': 'Udhampur is known for its scenic beauty and is home to several ancient temples and shrines. The district has a rich agricultural base and is known for its traditional Dogra culture. It\'s also famous for its local handicrafts and folk music.',
            'Kishtwar': 'Kishtwar is known for its natural beauty and is home to several ancient temples and forts. The district has a rich tribal culture and is known for its traditional arts and crafts. It\'s also famous for its scenic landscapes and local festivals.',
            'Muzaffarabad': 'Muzaffarabad is located on the banks of the Jhelum and Neelum rivers. It is known for its stunning valleys and mountainous landscapes. The region has a rich cultural heritage and is a gateway to the Neelum Valley.',
            'Mirpur': 'Mirpur is known for its agricultural land and the Mangla Dam. It has a rich history and is often associated with the pottery industry. The district features a mix of plain and hilly terrain.'
        };

  const activeDistrict = hoveredDistrict || selectedDistrict;
  const activeTitle = activeDistrict || 'Jammu & Kashmir';
  const activeDesc = activeDistrict 
    ? (districtDescriptions[activeDistrict] || 'Information about this district is not available.')
    : 'Jammu and Kashmir is a region administered by India as a union territory and consisting of the southern portion of the larger Kashmir region.';
  
  const activeImage = '/images/dl.webp';

  // Styles specific to JK
  const jkStyles = {
    '--bg-color': '#f0f4f8',
    '--card-bg': '#ffffff',
    '--text-primary': '#2c3e50',
    '--text-secondary': '#546e7a',
    '--map-fill': '#b0bec5',
    '--map-hover': '#546e7a',
    '--map-stroke': '#f0f4f8',
    '--btn-gallery': '#455a64',
    '--btn-planner': '#f39c12'
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
    <div className="state-map-container" style={jkStyles}>
      <div className="dashboard-card">
        <div className="map-section" style={{ background: 'rgba(176, 190, 197, 0.1)' }}>
          <button className="back-btn" onClick={() => navigate(-1)}><i className="fa-solid fa-arrow-left"></i> Back</button>
          <MapContainer 
            center={[33.8, 75.0]} 
            zoom={7.5} 
            style={{ height: '100%', width: '100%', background: 'transparent' }}
            zoomControl={false}
            scrollWheelZoom={false}
            doubleClickZoom={false}
            dragging={false}
          >
            <GeoJSON 
              data={jkData} 
              style={styleFunction} 
              onEachFeature={onEachFeature} 
            />
          </MapContainer>
        </div>

        <div className="content-section">
          <div className="content-header">
            <h1>Discover J&K</h1>
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
                <i className="fa-solid fa-mountain-sun"></i>
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

export default JammuKashmir;
