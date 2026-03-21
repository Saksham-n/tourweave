import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import indiaDataRaw from '../data/india.geojson?raw'; // Import as raw string
import './IndiaMap.css';

// Parse the raw string into a JSON object
const indiaData = JSON.parse(indiaDataRaw);

const IndiaMap = () => {
  const [selectedState, setSelectedState] = useState(null);
  const [hoveredState, setHoveredState] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.targetState) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedState(location.state.targetState);
    }
  }, [location]);

  // State Data (Descriptions and Images) from original india.html
  const stateInfo = {
    'Mizoram': {
      image: '/images/mizoram.webp',
      desc: "Mizoram, the 'Land of the Hill People,' is Northeast India's greenest state with breathtaking hills and lush forests. It boasts incredible biodiversity with over 1,000 orchid species and shares borders with Myanmar and Bangladesh. The state has India's highest literacy rate at over 91% and celebrates unique festivals like Chapchar Kut. Mizo culture features traditional music, dance, and cuisine with bamboo shoots and fermented foods. Despite its remote location, Mizoram is rapidly developing with growing tourism infrastructure.",
      route: null
    },
    'Tamil Nadu': {
      image: '/images/t.webp',
      desc: "Tamil Nadu, India's southernmost state, is a cradle of Dravidian civilization spanning 2,000 years. Famous for magnificent temples like Brihadeeswarar and Meenakshi, it's a UNESCO World Heritage site. The state leads in IT and automobile industries, with Chennai as India's Silicon Valley equivalent. Its world-renowned cuisine includes dosas, idlis, and spicy curries. Tamil Nadu is a cultural powerhouse, originating Bharatanatyam dance and Carnatic music.",
      route: null
    },
    'Jammu & Kashmir': {
      image: '/images/jk.webp',
      desc: "Jammu & Kashmir, northern India's paradise, features majestic Himalayas, serene Kashmir Valley with Dal Lake, and arid Ladakh. It's a haven for adventure tourism including trekking, skiing, and houseboating. The region produces world-famous saffron, apples, and handicrafts. Rich cultural heritage blends Kashmiri, Dogri, and Ladakhi traditions. Known for hospitality, Mughal architecture, and spiritual sites like Vaishno Devi Temple.",
      route: '/jk'
    },
    'Madhya Pradesh': {
      image: '/images/mp.webp',
      desc: "Madhya Pradesh, India's 'Heart,' is the second-largest state with ancient history and natural beauty. Home to Khajuraho's UNESCO temples showcasing erotic art, and magnificent Sanchi Stupa. A wildlife paradise with Kanha and Bandhavgarh national parks famous for tiger safaris. Rich tribal culture with 40+ communities and unique art forms. Known for Chanderi sarees and produces major portions of India's pulses and oilseeds.",
      route: '/mp'
    },
    'Goa': {
      image: '/images/goa.webp',
      desc: "Goa, India's smallest state, is a tropical paradise with pristine beaches and Portuguese colonial heritage. A 450-year Portuguese colony, it blends Indian and European influences in architecture and cuisine. Renowned for 103 km coastline with beaches like Anjuna, Calangute, and Palolem. Celebrates unique festivals like Carnival and Shigmo with Portuguese flair. Features delicious seafood, vindaloo, feni liquor, and thriving IT industry.",
      route: '/goa'
    },
    'Kerala': {
      image: '/images/k.webp',
      desc: "Kerala, 'God's Own Country,' is southern India's tropical paradise with natural beauty and high quality of life. Famous for serene backwaters, palm-fringed lagoons, and houseboat cruises called the 'Venice of the East.' Leads in literacy (over 96%) and has India's highest Human Development Index. Pioneer in Ayurveda and wellness tourism with numerous centers. Celebrates Onam festival and features Kathakali dance and Kalaripayattu martial arts.",
      route: '/kerala'
    }
  };

  // Style function for the map polygons
  const styleFunction = (feature) => {
    const stateName = feature.properties.st_nm;
    const isActive = selectedState === stateName || hoveredState === stateName;

    return {
      fillColor: isActive ? '#ef6c00' : '#ffcc80', // Orange on hover, Light Orange default
      weight: 1,
      opacity: 1,
      color: 'white',
      fillOpacity: 1
    };
  };

  // Event handlers for each state
  const onEachFeature = (feature, layer) => {
    const stateName = feature.properties.st_nm;

    layer.on({
      mouseover: () => setHoveredState(stateName),
      mouseout: () => setHoveredState(null),
      click: () => setSelectedState(stateName)
    });
  };

  // Determine what to show in the side panel
  const activeStateName = hoveredState || selectedState || 'India';
  const activeInfo = stateInfo[activeStateName] || {
    image: '/images/India.webp',
    desc: "India is a land of diversity, culture, and heritage. Explore the various states and their unique offerings."
  };

  return (
    <div className="india-map-container">
      <div className="dashboard-card">
        <div className="map-section">
          <MapContainer 
            center={[23.5937, 82.5629]} 
            zoom={4.5} 
            style={{ height: '100%', width: '100%', background: 'transparent' }}
            zoomControl={false}
            scrollWheelZoom={true}
            doubleClickZoom={true}
          >
            <GeoJSON 
              data={indiaData} 
              style={styleFunction} 
              onEachFeature={onEachFeature} 
            />
          </MapContainer>
        </div>

        <div className="content-section">
          <div className="content-header">
            <h1>Incredible India</h1>
          </div>
          
          <div className="featured-image-container">
            <img 
              src={activeInfo.image} 
              className="featured-image" 
              alt={activeStateName} 
              onError={(e) => e.target.src = 'https://via.placeholder.com/300x200?text=No+Image'}
            />
          </div>

          <div className="district-info">
            <h2 className="district-title">{activeStateName}</h2>
            <p className="district-desc">{activeInfo.desc}</p>
          </div>

          <div className="footer-controls">
            <div className="custom-divider">
                <i className="fa-solid fa-om"></i>
            </div>
            <div className="action-buttons">
              {selectedState && activeInfo.route && (
                <button 
                  className="pill-btn btn-gallery"
                  onClick={() => navigate(activeInfo.route)}
                >
                  <i className="fa-solid fa-compass"></i> Explore {selectedState}
                </button>
              )}
              <button className="pill-btn btn-planner">
                <i className="fa-solid fa-wand-magic-sparkles"></i> AI Planner
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndiaMap;
