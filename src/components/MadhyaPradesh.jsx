import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import mpDataRaw from '../data/mp.geojson?raw';
import './StateMap.css';

// Helper to fix coordinates if they are scaled incorrectly (from your HTML logic)
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

const mpData = fixGeoJSONCoordinates(JSON.parse(mpDataRaw));

const MadhyaPradesh = () => {
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [hoveredDistrict, setHoveredDistrict] = useState(null);
  const navigate = useNavigate();



  const districtDescriptions = {
            'Burhanpur': 'Burhanpur is known for its rich history and was once the capital of the Faruqi dynasty. The district is famous for its handloom sarees and traditional crafts. It\'s located on the banks of the Tapti River and has numerous historical monuments.',
            'Chhindwara': 'Chhindwara is known as the "Rice Bowl of Madhya Pradesh" due to its extensive rice cultivation. The district is home to the famous Chhindwara Fort and is surrounded by dense forests. It\'s also known for its tribal culture and wildlife sanctuaries.',
            'Bhopal': 'Bhopal, the capital city of Madhya Pradesh, is known for its lakes and Mughal architecture. The city is home to the Taj-ul-Masajid, one of the largest mosques in Asia, and the famous Bhopal Gas Tragedy memorial. It\'s a major educational and administrative hub.',
            'Indore': 'Indore is the largest city in Madhya Pradesh and is known as the "Cleanest City of India." It\'s famous for its food culture, especially street food, and hosts the famous Indore Food Festival. The city has a rich history dating back to the Holkar dynasty.',
            'Jabalpur': 'Jabalpur is known as the "City of Marble Rocks" due to the stunning marble formations in the Narmada River. The city is home to the famous Dumna Nature Reserve and has a rich military history. It\'s also known for its educational institutions.',
            'Gwalior': 'Gwalior is famous for its magnificent Gwalior Fort, one of the largest forts in India. The city is known for its classical music heritage and hosts the famous Tansen Music Festival. It\'s home to several UNESCO World Heritage Sites.',
            'Ujjain': 'Ujjain is one of the seven sacred cities of Hinduism and is famous for the Mahakaleshwar Temple. The city is known for its ancient astronomical observatory (Jantar Mantar) and hosts the famous Kumbh Mela. It\'s considered the Greenwich of India.',
            'Sagar': 'Sagar is known for its educational institutions and is home to the famous Sagar University. The district is rich in Buddhist heritage with numerous stupas and monasteries. It\'s also known for its handloom industry and tribal culture.',
            'Rewa': 'Rewa is known as the "Land of White Tigers" and is home to the famous Bandhavgarh National Park. The district is rich in mineral resources and has a strong agricultural base. It\'s also known for its tribal communities and traditional arts.',
            'Satna': 'Satna is a major industrial hub and is known for its cement and power industries. The district is home to the famous Maihar temple and has rich coal reserves. It\'s also known for its agricultural produce and tribal culture.',
            'Katni': 'Katni is known as the "Gateway to Bandhavgarh" and serves as an entry point to several wildlife sanctuaries. The district is rich in mineral resources and has a strong railway network. It\'s also known for its tribal communities and traditional crafts.',
            'Damoh': 'Damoh is known for its ancient temples and historical monuments. The district is rich in mineral resources and has a strong agricultural base. It\'s also known for its tribal culture and traditional arts.',
            'Panna': 'Panna is famous for its diamond mines and is known as the "Diamond District of India." The district is home to the Panna National Park and has rich wildlife. It\'s also known for its historical forts and tribal communities.',
            'Tikamgarh': 'Tikamgarh is known for its historical forts and palaces. The district has a rich military history and is home to several ancient temples. It\'s also known for its agricultural produce and tribal culture.',
            'Chhatarpur': 'Chhatarpur is known for its Khajuraho temples, a UNESCO World Heritage Site. The district is rich in mineral resources and has a strong agricultural base. It\'s also known for its tribal communities and traditional arts.',
            'Datia': 'Datia is famous for its palaces and forts built by the Bundela rulers. The district has a rich architectural heritage and is home to several historical monuments. It\'s also known for its agricultural produce.',
            'Shivpuri': 'Shivpuri is known for its wildlife sanctuaries and is home to the famous Madhav National Park. The district was once the summer capital of the Scindia rulers. It\'s also known for its lakes and historical monuments.',
            'Guna': 'Guna is known for its agricultural produce and is a major producer of soybeans. The district has several historical monuments and is home to the famous Chanderi sarees. It\'s also known for its tribal communities.',
            'Ashoknagar': 'Ashoknagar is known for its historical significance and is home to several ancient monuments. The district has a rich agricultural base and is known for its tribal culture. It\'s also famous for its handloom industry.',
            'Vidisha': 'Vidisha is known for its ancient Buddhist heritage and is home to numerous stupas and monasteries. The district has a rich archaeological history and is famous for its Malwa region culture. It\'s also known for its agricultural produce.',
            'Raisen': 'Raisen is known for its historical forts and palaces. The district is home to the famous Sanchi Stupa, a UNESCO World Heritage Site. It\'s also known for its agricultural produce and tribal communities.',
            'Rajgarh': 'Rajgarh is known for its agricultural produce and is a major producer of wheat and soybeans. The district has several historical monuments and is known for its tribal culture. It\'s also famous for its handloom industry.',
            'Shajapur': 'Shajapur is known for its historical significance and is home to several ancient monuments. The district has a rich agricultural base and is known for its Malwa region culture. It\'s also famous for its traditional crafts.',
            'Dewas': 'Dewas is known for its industrial development and is home to several manufacturing units. The district has a rich history and is known for its palaces and forts. It\'s also famous for its agricultural produce.',
            'Ratlam': 'Ratlam is known for its industrial development and is a major railway junction. The district has a rich history and is known for its palaces and temples. It\'s also famous for its agricultural produce.',
            'Mandsaur': 'Mandsaur is known for its historical monuments and is home to several ancient temples. The district has a rich archaeological heritage and is famous for its Malwa region culture. It\'s also known for its agricultural produce.',
            'Neemuch': 'Neemuch is known for its industrial development and is home to several manufacturing units. The district has a rich history and is known for its forts and palaces. It\'s also famous for its agricultural produce.',
            'Agar Malwa': 'Agar Malwa is known for its historical forts and palaces. The district has a rich agricultural base and is known for its tribal communities. It\'s also famous for its traditional crafts.',
            'Harda': 'Harda is known for its forest resources and is home to the famous Handi Khoh. The district has a rich tribal culture and is known for its agricultural produce. It\'s also famous for its wildlife.',
            'Betul': 'Betul is known for its forest resources and is home to several wildlife sanctuaries. The district has a rich tribal culture and is known for its agricultural produce. It\'s also famous for its bamboo crafts.',
            'Narsinghpur': 'Narsinghpur is known for its agricultural produce and is a major producer of wheat and rice. The district has several historical monuments and is known for its tribal culture. It\'s also famous for its handloom industry.',
            'Seoni': 'Seoni is known for its forest resources and is home to several wildlife sanctuaries. The district has a rich tribal culture and is known for its agricultural produce. It\'s also famous for its bamboo and wood crafts.',
            'Mandla': 'Mandla is known for its tribal culture and is home to several indigenous communities. The district has rich forest resources and is known for its wildlife. It\'s also famous for its traditional arts and crafts.',
            'Dindori': 'Dindori is known for its forest resources and is home to several wildlife sanctuaries. The district has a rich tribal culture and is known for its agricultural produce. It\'s also famous for its bamboo crafts.',
            'Balaghat': 'Balaghat is known for its forest resources and is home to several wildlife sanctuaries. The district has a rich tribal culture and is known for its agricultural produce. It\'s also famous for its bamboo and wood crafts.',
            'Sehore': 'Sehore is known for its agricultural produce and is a major producer of wheat and soybeans. The district has several historical monuments and is known for its Malwa region culture. It\'s also famous for its handloom industry.',
            'Hoshangabad': 'Hoshangabad is known for its historical significance and is home to several ancient monuments. The district has a rich agricultural base and is known for its tribal culture. It\'s also famous for its wildlife sanctuaries.',
            'Alirajpur': 'Alirajpur is known for its tribal culture and is home to several indigenous communities. The district has rich forest resources and is known for its agricultural produce. It\'s also famous for its traditional arts and crafts.',
            'Anuppur': 'Anuppur is known for its forest resources and is home to several wildlife sanctuaries. The district has a rich tribal culture and is known for its agricultural produce. It\'s also famous for its bamboo crafts.',
            'Barwani': 'Barwani is known for its tribal culture and is home to several indigenous communities. The district has rich forest resources and is known for its agricultural produce. It\'s also famous for its traditional arts and crafts.',
            'Bhind': 'Bhind is known for its historical significance and is home to several ancient monuments. The district has a rich agricultural base and is known for its Chambal region culture. It\'s also famous for its traditional crafts.',
            'Dhar': 'Dhar is known for its historical significance and is home to several ancient monuments. The district has a rich agricultural base and is known for its Malwa region culture. It\'s also famous for its traditional crafts.',
            'Jhabua': 'Jhabua is known for its tribal culture and is home to several indigenous communities. The district has rich forest resources and is known for its agricultural produce. It\'s also famous for its traditional arts and crafts.',
            'Khandwa': 'Khandwa is known for its agricultural produce and is a major producer of cotton and soybeans. The district has several historical monuments and is known for its tribal culture. It\'s also famous for its handloom industry.',
            'Khargone': 'Khargone is known for its agricultural produce and is a major producer of cotton and soybeans. The district has several historical monuments and is known for its tribal culture. It\'s also famous for its handloom industry.',
            'Morena': 'Morena is known for its historical forts and palaces. The district has a rich agricultural base and is known for its Chambal region culture. It\'s also famous for its traditional crafts.',
            'Niwari': 'Niwari is known for its historical significance and is home to several ancient monuments. The district has a rich agricultural base and is known for its tribal culture. It\'s also famous for its handloom industry.',
            'Shahdol': 'Shahdol is known for its forest resources and is home to several wildlife sanctuaries. The district has a rich tribal culture and is known for its agricultural produce. It\'s also famous for its bamboo crafts.',
            'Sheopur': 'Sheopur is known for its wildlife sanctuaries and is home to several national parks. The district has a rich tribal culture and is known for its agricultural produce. It\'s also famous for its traditional arts.',
            'Sidhi': 'Sidhi is known as the "Land of Gods" and is home to several religious sites. The district has a rich agricultural base and is known for its tribal communities. It\'s also famous for its traditional arts and crafts.',
            'Singrauli': 'Singrauli is a major industrial hub and is known for its power plants and coal mines. The district has rich mineral resources and is known for its agricultural produce. It\'s also famous for its wildlife sanctuaries.',
            'Umaria': 'Umaria is known for its forest resources and is home to several wildlife sanctuaries. The district has a rich tribal culture and is known for its agricultural produce. It\'s also famous for its bamboo crafts.'
        };

  const activeDistrict = hoveredDistrict || selectedDistrict;
  const activeTitle = activeDistrict || 'Madhya Pradesh';
  const activeDesc = activeDistrict 
    ? (districtDescriptions[activeDistrict] || 'Information about this district is not available.')
    : 'Madhya Pradesh, the "Heart of India," is a land of ancient history, rich culture, and diverse wildlife. From the erotic temples of Khajuraho to the tiger reserves of Kanha and Bandhavgarh, it offers a journey through time and nature.';
  
  const activeImage ='/images/mp.webp';

  // Styles specific to MP
  const mpStyles = {
    '--bg-color': '#f4f1ea',
    '--card-bg': '#ffffff',
    '--text-primary': '#2c3e50',
    '--text-secondary': '#5d6d7e',
    '--map-fill': '#8F9779',
    '--map-hover': '#556B2F',
    '--map-stroke': '#f4f1ea',
    '--btn-gallery': '#3E4B34',
    '--btn-planner': '#9C824A'
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
    <div className="state-map-container" style={mpStyles}>
      <div className="dashboard-card">
        <div className="map-section" style={{ background: 'rgba(143, 151, 121, 0.1)' }}>
          <button className="back-btn" onClick={() => navigate(-1)}><i className="fa-solid fa-arrow-left"></i> Back</button>
          <MapContainer 
            center={[23.5, 78.5]} 
            zoom={6.2} 
            style={{ height: '100%', width: '100%', background: 'transparent' }}
            zoomControl={false}
            scrollWheelZoom={false}
            doubleClickZoom={false}
            dragging={false}
          >
            <GeoJSON 
              data={mpData} 
              style={styleFunction} 
              onEachFeature={onEachFeature} 
            />
          </MapContainer>
        </div>

        <div className="content-section">
          <div className="content-header">
            <h1>Discover the Districts</h1>
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
                <i className="fa-solid fa-seedling"></i>
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

export default MadhyaPradesh;
