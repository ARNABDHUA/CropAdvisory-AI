import React, { useState } from 'react';
import { Sprout, Upload, Thermometer, CloudRain, Droplets, MapPin, Search, ChevronRight, ChevronLeft, ArrowRight } from 'lucide-react';

export default function ScanForm({ onResult, backendUrl }) {
  const [step, setStep] = useState(1);
  const [crop, setCrop] = useState('Tomato');
  const [customCrop, setCustomCrop] = useState('');
  const [query, setQuery] = useState('My crop leaves have strange spots. Please diagnose the issue and suggest organic and chemical treatments.');
  const [language, setLanguage] = useState('English');
  
  // Image state
  const [imageSrc, setImageSrc] = useState(null);
  const [imageName, setImageName] = useState('');
  const [dragging, setDragging] = useState(false);

  // Soil states
  const [soilPH, setSoilPH] = useState(6.5);
  const [soilMoisture, setSoilMoisture] = useState(50);
  const [soilN, setSoilN] = useState(45);
  const [soilP, setSoilP] = useState(40);
  const [soilK, setSoilK] = useState(42);

  // Weather state
  const [location, setLocation] = useState('Central Farm');
  const [weatherData, setWeatherData] = useState({
    temp: 26,
    humidity: 62,
    rain: 'Moderate Rain',
    location: 'Central Farm'
  });
  const [resolvingWeather, setResolvingWeather] = useState(false);

  // Loading state
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');

  // Handle Drag & Drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const processFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WEBP).');
      return;
    }
    setImageName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageSrc(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Weather resolver
  const handleResolveWeather = async () => {
    if (!location.trim()) return;
    setResolvingWeather(true);
    try {
      const res = await fetch(`${backendUrl}/api/weather?location=${encodeURIComponent(location)}`);
      if (res.ok) {
        const data = await res.json();
        setWeatherData(data);
      }
    } catch (e) {
      console.error('Failed to resolve weather', e);
    } finally {
      setResolvingWeather(false);
    }
  };

  // Form submit
  const handleSubmit = async () => {
    setLoading(true);
    const finalCrop = crop === 'Other' ? customCrop : crop;
    
    // Simulate multi-stage loading messages
    const messages = [
      'Validating farming inputs...',
      'Running leaf symptom computer vision...',
      'Correlating weather and soil parameters...',
      'Diagnosing infection strains...',
      'Compiling treatment advisory...',
      'Translating report text...'
    ];

    let msgIndex = 0;
    setLoadingMsg(messages[0]);
    const timer = setInterval(() => {
      msgIndex++;
      if (msgIndex < messages.length) {
        setLoadingMsg(messages[msgIndex]);
      }
    }, 1200);

    const payload = {
      crop_name: finalCrop,
      query: query,
      image_base64: imageSrc,
      soil_metrics: {
        pH: parseFloat(soilPH),
        moisture: parseInt(soilMoisture),
        N: parseInt(soilN),
        P: parseInt(soilP),
        K: parseInt(soilK)
      },
      weather: weatherData,
      language: language
    };

    try {
      const res = await fetch(`${backendUrl}/api/advise`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      clearInterval(timer);
      
      if (res.ok) {
        const resultData = await res.json();
        onResult(resultData);
      } else {
        const err = await res.json();
        alert(`Error running diagnostic workflow: ${err.detail || 'Unknown error'}`);
      }
    } catch (e) {
      clearInterval(timer);
      console.error(e);
      alert('Network error communicating with the crop advisory API.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
      
      {/* Loading Overlay */}
      {loading && (
        <div className="loader-overlay">
          <div className="spinner"></div>
          <div className="loader-text">{loadingMsg}</div>
        </div>
      )}

      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', textAlign: 'center' }}>
        New Crop Health Scan Wizard
      </h2>

      {/* Stepper Header */}
      <div className="stepper">
        <div className={`step-item ${step === 1 ? 'active' : step > 1 ? 'completed' : ''}`}>
          <div className="step-node">1</div>
          <span className="step-label">Crop & Info</span>
        </div>
        <div className={`step-item ${step === 2 ? 'active' : step > 2 ? 'completed' : ''}`}>
          <div className="step-node">2</div>
          <span className="step-label">Upload Photo</span>
        </div>
        <div className={`step-item ${step === 3 ? 'active' : step > 3 ? 'completed' : ''}`}>
          <div className="step-node">3</div>
          <span className="step-label">Soil & Weather</span>
        </div>
      </div>

      {/* STEP 1: Crop Select & Query */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label>Select Crop Category</label>
            <select value={crop} onChange={(e) => setCrop(e.target.value)}>
              <option value="Tomato">Tomato</option>
              <option value="Corn">Corn / Maize</option>
              <option value="Wheat">Wheat</option>
              <option value="Rice">Rice</option>
              <option value="Other">Other Crop</option>
            </select>
          </div>

          {crop === 'Other' && (
            <div className="form-group">
              <label>Enter Crop Name</label>
              <input 
                type="text" 
                placeholder="e.g. Potato, Apple, Grape" 
                value={customCrop} 
                onChange={(e) => setCustomCrop(e.target.value)} 
              />
            </div>
          )}

          <div className="form-group">
            <label>Preferred Language for Advisory</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="English">English</option>
              <option value="Spanish">Español (Spanish)</option>
              <option value="Hindi">हिन्दी (Hindi)</option>
              <option value="Bengali">বাংলা (Bengali)</option>
              <option value="Vietnamese">Tiếng Việt (Vietnamese)</option>
              <option value="French">Français (French)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Observations / Diagnostic Query</label>
            <textarea 
              rows="4" 
              placeholder="Describe symptoms like leaf yellowing, brown spots, insect bites, or nutrient shortages..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button className="btn btn-primary" onClick={() => setStep(2)}>
              Next Step <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Drag and drop upload */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <label>Upload Crop Leaf Photo</label>
          
          {!imageSrc ? (
            <div 
              className={`upload-zone ${dragging ? 'dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input').click()}
            >
              <Upload size={48} color="var(--primary)" style={{ animation: 'pulse 2s infinite' }} />
              <div>
                <p style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.25rem' }}>Drag & drop crop image here</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>or click to browse from device files</p>
              </div>
              <input 
                id="file-input"
                type="file" 
                accept="image/*"
                style={{ display: 'none' }} 
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div className="preview-container">
                <img src={imageSrc} alt="Preview" className="preview-img" />
                <button className="btn-remove-img" onClick={() => { setImageSrc(null); setImageName(''); }}>×</button>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{imageName}</p>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
            <button className="btn btn-secondary" onClick={() => setStep(1)}>
              <ChevronLeft size={18} /> Back
            </button>
            <button className="btn btn-primary" onClick={() => setStep(3)}>
              Next Step <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Soil & Weather metrics */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '1rem' }}>Soil Composition Metrics</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label>Soil pH level</label>
                  <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{soilPH}</span>
                </div>
                <input 
                  type="range" 
                  min="4.0" 
                  max="9.0" 
                  step="0.1" 
                  value={soilPH} 
                  onChange={(e) => setSoilPH(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label>Soil Moisture (%)</label>
                  <span style={{ fontWeight: 'bold', color: 'var(--accent-blue)' }}>{soilMoisture}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={soilMoisture} 
                  onChange={(e) => setSoilMoisture(e.target.value)} 
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flex: 1, minWidth: '100px' }}>
                  <label>Nitrogen (N)</label>
                  <input type="number" min="0" max="100" value={soilN} onChange={(e) => setSoilN(e.target.value)} />
                </div>
                <div className="form-group" style={{ flex: 1, minWidth: '100px' }}>
                  <label>Phosphorus (P)</label>
                  <input type="number" min="0" max="100" value={soilP} onChange={(e) => setSoilP(e.target.value)} />
                </div>
                <div className="form-group" style={{ flex: 1, minWidth: '100px' }}>
                  <label>Potassium (K)</label>
                  <input type="number" min="0" max="100" value={soilK} onChange={(e) => setSoilK(e.target.value)} />
                </div>
              </div>

            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--accent-blue)', marginBottom: '1rem' }}>Local Weather Settings</h3>
            
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <MapPin size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  placeholder="Enter location (e.g. Dry Region, Jungle)" 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  style={{ paddingLeft: '2.5rem', width: '100%' }}
                />
              </div>
              <button className="btn btn-secondary" onClick={handleResolveWeather} disabled={resolvingWeather}>
                <Search size={16} /> {resolvingWeather ? 'Resolving...' : 'Resolve'}
              </button>
            </div>

            <div className="grid-3" style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Thermometer size={20} color="var(--secondary)" />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Temperature</div>
                  <div style={{ fontWeight: 'bold' }}>{weatherData.temp}°C</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Droplets size={20} color="var(--accent-blue)" />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Humidity</div>
                  <div style={{ fontWeight: 'bold' }}>{weatherData.humidity}%</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CloudRain size={20} color="var(--text-secondary)" />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Precipitation</div>
                  <div style={{ fontWeight: 'bold' }}>{weatherData.rain}</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
            <button className="btn btn-secondary" onClick={() => setStep(2)}>
              <ChevronLeft size={18} /> Back
            </button>
            <button className="btn btn-primary" onClick={handleSubmit}>
              Diagnose & Advise <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
