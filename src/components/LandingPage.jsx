import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logout } from '../services/auth/authService';
import AuthModal from './AuthModal';
import './LandingPage.css';

const translations = {
  en: {
    nav_home: "Home",
    nav_explore: "Explore",
    nav_about: "About",
    nav_contact: "Contact",
    hero_title: "Escape the City,<br>Find Your Peace",
    widget_header: "Plan Your AI-Curated Journey",
    label_destination: "Destination",
    placeholder_where: "Where to?",
    label_interest: "Interest",
    opt_heritage: "Heritage",
    opt_nature: "Nature",
    opt_spirituality: "Spirituality",
    label_type: "Type",
    opt_hill: "Hill Side",
    opt_lake: "Lake Side",
    opt_forest: "Forest",
    since_2026: "Since 2026",
    editorial_title: "An Unmissable<br>Heritage Attraction",
    city_agra: "Agra",
    city_kochi: "Kochi",
    city_panjim: "Panjim",
    city_jaipur: "Jaipur",
    city_varanasi: "Varanasi",
    city_ladakh: "Ladakh",
    banner_1: "DIVING",
    banner_2: "INTO INDIA",
    bento_title: "Top Heritage Picks<br>in India",
    bento_desc: "Paradise Found: Unveiling India's Top Heritage Picks For Your Ultimate Cultural Getaway.",
    btn_get_started: "Get Started",
    state_mp: "Madhya Pradesh",
    place_sanchi: "Sanchi Stupa",
    state_kashmir: "Kashmir",
    place_dal: "Dal Lake",
    state_goa: "Goa",
    place_dudhsagar: "Dudhsagar Falls",
    state_kerala: "Kerala",
    place_munnar: "Munnar Hills",
    bottom_title: "A Popular Tourist<br>Hotspot Region",
    bottom_desc: "Embark on an Oasis Adventure: Discover the vibrant charms, scenic allure, and serene atmosphere of India's beloved tourist hotspots.",
    footer_brand: "The Official Tourism<br>Website for TourWeave",
    link_things: "Things to Do",
    link_dest: "Destinations",
    link_heritage: "Heritage Sites",
    link_planner: "AI Planner",
    link_contact: "Contact Us",
    contact_us_title: "Contact Us",
    agree_policy: "I agree to privacy policy",
    btn_send: "Send",
    privacy: "Privacy Policy",
    built_by: "Built by MS",
    choose_dest: "Choose Destination",
    card_mp_title: "Madhya Pradesh",
    card_mp_desc: "The heart of incredible India, located in the center.",
    card_jk_title: "Kashmir",
    card_jk_desc: "An island surrounded by rocks and also very blue ocean.",
    card_goa_title: "Goa",
    card_goa_desc: "A place with an extended bridge along the oceanfront is very iconic.",
    card_kerala_title: "Kerala",
    card_kerala_desc: "Places that can be visited using a small boat."
  },
  hi: {
    nav_home: "होम",
    nav_explore: "एक्सप्लोर",
    nav_about: "बारे में",
    nav_contact: "संपर्क",
    hero_title: "शहर से दूर,<br>अपनी शांति खोजें",
    widget_header: "अपनी एआई-क्यूरेटेड यात्रा की योजना बनाएं",
    label_destination: "गंतव्य",
    placeholder_where: "कहाँ जाना है?",
    label_interest: "रुचि",
    opt_heritage: "विरासत",
    opt_nature: "प्रकृति",
    opt_spirituality: "आध्यात्मिकता",
    label_type: "प्रकार",
    opt_hill: "पहाड़ी क्षेत्र",
    opt_lake: "झील के किनारे",
    opt_forest: "जंगल",
    since_2026: "2026 से",
    editorial_title: "एक अविस्मरणीय<br>विरासत आकर्षण",
    city_agra: "आगरा",
    city_kochi: "कोच्चि",
    city_panjim: "पणजी",
    city_jaipur: "जयपुर",
    city_varanasi: "वाराणसी",
    city_ladakh: "लद्दाख",
    banner_1: "भारत",
    banner_2: "दर्शन",
    bento_title: "भारत के शीर्ष<br>विरासत स्थल",
    bento_desc: "स्वर्ग मिल गया: अपनी अंतिम सांस्कृतिक छुट्टी के लिए भारत के शीर्ष विरासत स्थलों का अनावरण।",
    btn_get_started: "शुरू करें",
    state_mp: "मध्य प्रदेश",
    place_sanchi: "सांची स्तूप",
    state_kashmir: "कश्मीर",
    place_dal: "डल झील",
    state_goa: "गोवा",
    place_dudhsagar: "दूधसागर जलप्रपात",
    state_kerala: "केरल",
    place_munnar: "मुन्नार की पहाड़ियाँ",
    bottom_title: "एक लोकप्रिय पर्यटक<br>आकर्षण क्षेत्र",
    bottom_desc: "एक ओएसिस एडवेंचर पर निकलें: भारत के प्रिय पर्यटक आकर्षणों के जीवंत आकर्षण, सुंदर नज़ारों और शांत वातावरण की खोज करें।",
    footer_brand: "TourWeave की आधिकारिक<br>पर्यटन वेबसाइट",
    link_things: "करने के लिए काम",
    link_dest: "गंतव्य",
    link_heritage: "विरासत स्थल",
    link_planner: "एआई प्लानर",
    link_contact: "संपर्क करें",
    contact_us_title: "संपर्क करें",
    agree_policy: "मैं गोपनीयता नीति से सहमत हूं",
    btn_send: "भेजें",
    privacy: "गोपनीयता नीति",
    built_by: "MS द्वारा निर्मित",
    choose_dest: "गंतव्य चुनें",
    card_mp_title: "मध्य प्रदेश",
    card_mp_desc: "अतुल्य भारत का हृदय, जो केंद्र में स्थित है।",
    card_jk_title: "कश्मीर",
    card_jk_desc: "चट्टानों और बहुत नीले सागर से घिरा एक द्वीप।",
    card_goa_title: "गोवा",
    card_goa_desc: "समुद्र के किनारे एक विस्तारित पुल वाला स्थान बहुत प्रतिष्ठित है।",
    card_kerala_title: "केरल",
    card_kerala_desc: "ऐसी जगहें जिन्हें छोटी नाव का उपयोग करके देखा जा सकता है."
  }
};

const LandingPage = () => {
  const [lang, setLang] = useState('en');
  const [isNavVisible, setIsNavVisible] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  
  // Auth Modal State
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const { user } = useAuth();
  
  const navigate = useNavigate();
  const location = useLocation();
  const t = translations[lang];

  // Handle Scroll for Vertical Nav
  useEffect(() => {
    const handleScroll = () => {
      const destSection = document.getElementById('destinations');
      if (destSection) {
        const trigger = destSection.offsetTop - 400;
        setIsNavVisible(window.scrollY >= trigger);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle Hash Scroll on Mount (Instant Jump)
  useEffect(() => {
    if (location.hash) {
      const element = document.querySelector(location.hash);
      if (element) {
        document.documentElement.style.scrollBehavior = 'auto';
        element.scrollIntoView({ behavior: 'auto' });
        setTimeout(() => {
          document.documentElement.style.scrollBehavior = 'smooth';
        }, 0);
      }
    }
    
    // Auto-open Auth modal if redirected from a Protected Route
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('auth') === 'open') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsAuthOpen(true);
      // Clean up the URL to just /
      navigate('/', { replace: true });
    }
  }, [location, navigate]);

  // Helper to render HTML strings safely (for <br> tags in translations)
  const renderHTML = (html) => ({ __html: html });

  return (
    <div>
      <section className="hero-section">
        <div className="hero-overlay"></div>

        <div className={`vertical-nav ${isNavVisible ? 'visible' : ''}`} id="verticalNav">
          <a href="#" className="v-nav-item"><i className="fa-solid fa-house"></i></a>
          <a href="#destinations" className="v-nav-item"><i className="fa-solid fa-compass"></i></a>
          <a href="#contact-form" className="v-nav-item"><i className="fa-solid fa-envelope"></i></a>
        </div>

        <nav className="nav-bar">
          <div className="logo">TourWeave</div>
          <div className="nav-links">
            <a href="#destinations">{t.nav_explore}</a>
            {user && (
              <a href="/trips" onClick={(e) => { e.preventDefault(); navigate('/trips'); }}>
                My Trips
              </a>
            )}
            <a href="#contact-form">{t.nav_contact}</a>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            {/* Language Selector */}
            <div className={`custom-select lang-dropdown ${isLangOpen ? 'active' : ''}`}>
              <div className="dropdown-trigger" onClick={() => setIsLangOpen(!isLangOpen)}>
                <svg className="location-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '5px' }}>
                    <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="white"/>
                </svg>
                <span>{lang === 'en' ? 'EN' : 'HI'}</span>
                <i className="fa-solid fa-chevron-down" style={{ fontSize: '0.7rem', marginLeft: '5px' }}></i>
              </div>
              <div className="dropdown-content">
                <div className="dropdown-option" onClick={() => { setLang('en'); setIsLangOpen(false); }}>English</div>
                <div className="dropdown-option" onClick={() => { setLang('hi'); setIsLangOpen(false); }}>Hindi</div>
              </div>
            </div>

            {/* Auth Injection */}
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span 
                  onClick={() => navigate('/profile')} 
                  style={{ color: 'white', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', borderBottom: '1px solid transparent', paddingBottom: '2px', transition: '0.3s' }}
                  onMouseEnter={e => e.currentTarget.style.borderBottomColor = 'white'}
                  onMouseLeave={e => e.currentTarget.style.borderBottomColor = 'transparent'}
                  title="Manage your Travel DNA & Profile"
                >
                  Hi, {user.user_metadata?.display_name || 'Adventurer'}!
                </span>
                <button 
                  onClick={async () => { await logout(); window.location.reload(); }} 
                  style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '20px', padding: '6px 16px', cursor: 'pointer', transition: '0.3s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                >
                  Logout
                </button>
              </div>
            ) : (
              <button 
                className="pill-btn orange" 
                style={{ padding: '8px 24px', margin: 0 }} 
                onClick={() => setIsAuthOpen(true)}
              >
                Join Now
              </button>
            )}
          </div>
        </nav>

        {/* Auth Modal Overlay */}
        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

        <div className="hero-content">
          <div className="hero-text">
            <h1 dangerouslySetInnerHTML={renderHTML(t.hero_title)}></h1>
          </div>

          <div className="booking-widget">
            <div className="widget-header">{t.widget_header}</div>
            <form className="booking-form" onSubmit={(e) => { e.preventDefault(); window.location.href='#destinations'; }}>
              <div className="form-group">
                <label>{t.label_destination}</label>
                <input type="text" className="form-input" placeholder={t.placeholder_where} />
              </div>
              <div className="form-group">
                <label>{t.label_interest}</label>
                <div className="custom-select">
                    <div className="dropdown-trigger">
                        <span>{t.opt_heritage}</span>
                        <i className="fa-solid fa-chevron-down" style={{ fontSize: '0.7rem', marginLeft: 'auto' }}></i>
                    </div>
                </div>
              </div>
              <div className="form-group">
                <label>{t.label_type}</label>
                <div className="custom-select">
                    <div className="dropdown-trigger">
                        <span>{t.opt_hill}</span>
                        <i className="fa-solid fa-chevron-down" style={{ fontSize: '0.7rem', marginLeft: 'auto' }}></i>
                    </div>
                </div>
              </div>
              <button type="submit" className="search-btn">
                <span className="btn-text-desktop"><b style={{ fontSize: '1.5rem' }}>&gt;</b></span>
                <span className="btn-text-mobile">Find <i className="fa-solid fa-magnifying-glass"></i></span>
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="editorial-section" id="explore">
        
        <div className="editorial-header">
            <div className="header-left">
                <span className="year-tag">{t.since_2026}</span>
                <h2 dangerouslySetInnerHTML={renderHTML(t.editorial_title)}></h2>
            </div>
            
            <div className="thumb-grid">
                <div className="thumb-card">
                    <img src="https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=1776&auto=format&fit=crop" alt="Agra" />
                    <div className="thumb-label">{t.city_agra}</div>
                </div>
                <div className="thumb-card">
                    <img src="https://images.unsplash.com/photo-1593693397690-362cb9666fc2?q=80&w=1768&auto=format&fit=crop" alt="Kochi" />
                    <div className="thumb-label">{t.city_kochi}</div>
                </div>
                <div className="thumb-card">
                    <img src="https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=1776&auto=format&fit=crop" alt="Goa" />
                    <div className="thumb-label">{t.city_panjim}</div>
                </div>
                <div className="thumb-card">
                    <img src="https://images.unsplash.com/photo-1477587458883-47145ed94245?q=80&w=1776&auto=format&fit=crop" alt="Jaipur" />
                    <div className="thumb-label">{t.city_jaipur}</div>
                </div>
                <div className="thumb-card">
                    <img src="https://images.unsplash.com/photo-1561361513-2d000a50f0dc?q=80&w=1776&auto=format&fit=crop" alt="Varanasi" />
                    <div className="thumb-label">{t.city_varanasi}</div>
                </div>
                <div className="thumb-card">
                    <img src="https://images.unsplash.com/photo-1482160549825-59d1b23cb208?q=80&w=1776&auto=format&fit=crop" alt="Ladakh" />
                    <div className="thumb-label">{t.city_ladakh}</div>
                </div>
            </div>
        </div>

        <div className="big-banner" id="destinations">
            <span>{t.banner_1}</span> <img src="/images/India.webp" className="banner-img" alt="India" /> <span>{t.banner_2}</span>
        </div>

        <div className="carousel-section">
            <h2 className="carousel-heading">{t.choose_dest}</h2>
            <div className="carousel-container">
                
                <div className="carousel-card" onClick={() => navigate('/mp')}>
                    <div className="card-image-box">
                        <img src="/images/ss.webp" alt="Madhya Pradesh" />
                    </div>
                    <div className="card-title">{t.card_mp_title}</div>
                    <div className="card-desc">{t.card_mp_desc}</div>
                </div>
        
                <div className="carousel-card" onClick={() => navigate('/jk')}>
                    <div className="card-image-box">
                        <img src="/images/dl.webp" alt="Kashmir" />
                    </div>
                    <div className="card-title">{t.card_jk_title}</div>
                    <div className="card-desc">{t.card_jk_desc}</div>
                </div>
        
                <div className="carousel-card" onClick={() => navigate('/goa')}>
                    <div className="card-image-box">
                        <img src="/images/ds.webp" alt="Goa" />
                    </div>
                    <div className="card-title">{t.card_goa_title}</div>
                    <div className="card-desc">{t.card_goa_desc}</div>
                </div>
        
                <div className="carousel-card" onClick={() => navigate('/kerala')}>
                    <div className="card-image-box">
                        <img src="/images/mh.webp" alt="Kerala" />
                    </div>
                    <div className="card-title">{t.card_kerala_title}</div>
                    <div className="card-desc">{t.card_kerala_desc}</div>
                </div>
                
            </div>
        </div>

        <div className="bento-grid">
            
            <div className="intro-block">
                <h3 dangerouslySetInnerHTML={renderHTML(t.bento_title)}></h3>
                <p>{t.bento_desc}</p>
                <a href="#" className="pill-btn">{t.btn_get_started}</a>
            </div>

            <div className="grid-item card-mp" onClick={() => navigate('/mp')}>
                <img src="/images/ss.webp" className="grid-img" alt="MP" />
                <div className="img-overlay-tag">
                    <i className="fa-regular fa-heart"></i> <span>{t.state_mp}</span>
                </div>
                <div className="img-bottom-text">{t.place_sanchi}</div>
            </div>

            <div className="grid-item card-jk" onClick={() => navigate('/jk')}>
                <img src="/images/dl.webp" className="grid-img" alt="JK" />
                <div className="img-overlay-tag">
                    <i className="fa-solid fa-mountain"></i> <span>{t.state_kashmir}</span>
                </div>
                <div className="img-bottom-text">{t.place_dal}</div>
            </div>

            <div className="grid-item card-goa" onClick={() => navigate('/goa')}>
                <img src="/images/ds.webp" className="grid-img" alt="Goa" />
                <div className="img-overlay-tag">
                    <i className="fa-solid fa-water"></i> <span>{t.state_goa}</span>
                </div>
                <div className="img-bottom-text">{t.place_dudhsagar}</div>
            </div>

            <div className="grid-item card-kerala" onClick={() => navigate('/kerala')}>
                <img src="/images/mh.webp" className="grid-img" alt="Kerala" />
                <div className="img-overlay-tag">
                    <i className="fa-solid fa-leaf"></i> <span>{t.state_kerala}</span>
                </div>
                <div className="img-bottom-text">{t.place_munnar}</div>
            </div>

        </div>

        <div style={{ marginTop: '4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
                <span className="year-tag">{t.since_2026}</span>
                <h3 dangerouslySetInnerHTML={renderHTML(t.bottom_title)} style={{ fontSize: '2rem' }}></h3>
            </div>
            <div style={{ maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right' }}>
                <p style={{ marginBottom: '1rem', color: '#666', fontSize: '0.9rem' }}>{t.bottom_desc}</p>
                <a href="#" className="pill-btn orange">{t.btn_get_started}</a>
            </div>
        </div>

      </section>

      <footer className="site-footer">
        <div className="footer-content">
            <div className="footer-top">
                <div className="footer-brand">
                    <h2 dangerouslySetInnerHTML={renderHTML(t.footer_brand)}></h2>
                    <div className="contact-info">
                        <a href="#"><i className="fa-regular fa-envelope"></i> info@tourweave.com</a>
                        <a href="#"><i className="fa-solid fa-phone"></i> +91 98765 43210</a>
                    </div>
                    <div className="social-icons">
                        <i className="fa-brands fa-facebook-f"></i>
                        <i className="fa-brands fa-instagram"></i>
                    </div>
                </div>

                <div className="footer-links">
                    <ul>
                        <li><a href="#">{t.link_things}</a></li>
                        <li><a href="#">{t.link_dest}</a></li>
                        <li><a href="#">{t.link_heritage}</a></li>
                        <li><a href="#">{t.link_planner}</a></li>
                        <li><a href="#">{t.link_contact}</a></li>
                    </ul>
                </div>

                <div className="footer-cta" id="contact-form">
                    <h3 style={{ marginBottom: '1rem' }}>{t.contact_us_title}</h3>
                    <form className="mini-contact-form" onSubmit={(e) => { e.preventDefault(); alert('Message Sent!'); }}>
                        <input type="text" placeholder="Name" className="mini-input" required />
                        <input type="email" placeholder="Email" className="mini-input" required />
                        <textarea placeholder="Message" className="mini-input" rows="3" required></textarea>
                        <div className="checkbox-group">
                            <input type="checkbox" id="policy-agree" required />
                            <label htmlFor="policy-agree">{t.agree_policy}</label>
                        </div>
                        <button type="submit" className="send-btn">{t.btn_send}</button>
                    </form>
                </div>
            </div>

            <hr className="footer-divider" />

            <div className="footer-meta">
                <div>&copy; TourWeave 2026 | <span>{t.privacy}</span></div>
                <div>{t.built_by}</div>
            </div>
        </div>
        <div className="big-footer-text">TOURWEAVE</div>
      </footer>
    </div>
  );
};

export default LandingPage;
