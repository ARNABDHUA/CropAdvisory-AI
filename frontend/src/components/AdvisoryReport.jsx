import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, ShieldAlert, Award, Calendar, Droplets, Leaf, Pill, RefreshCw } from 'lucide-react';

export default function AdvisoryReport({ report, onReset, backendUrl }) {
  const [activeTab, setActiveTab] = useState('organic');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsLoading, setTtsLoading] = useState(false);
  const audioRef = useRef(null);

  // Stop audio on component unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleTTS = async () => {
    // Stop current playback
    if (isSpeaking && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsSpeaking(false);
      return;
    }

    const lang = report.language.toLowerCase();
    const cleanText = (text) => {
      if (!text) return '';
      return text.replace(/\n+/g, '. ').replace(/\s+/g, ' ').trim();
    };

    const diseaseName = report.diagnosed_diseases && report.diagnosed_diseases.length > 0
      ? report.diagnosed_diseases[0].name
      : (lang === 'hindi' ? 'स्वस्थ फसल' : lang === 'bengali' ? 'সুস্থ ফসল' : 'Healthy Crop');

    const finalReport = report.final_report;
    let speakText = "";

    if (lang === 'hindi') {
      speakText = `${report.crop_name} के लिए फसल सलाहकार रिपोर्ट। मुख्य निदान: ${diseaseName}, ${report.diagnosed_diseases[0]?.confidence || 0} प्रतिशत आत्मविश्वास के साथ। दिखने वाले लक्षण: ${cleanText(finalReport.symptoms)}। जैविक उपचार: ${cleanText(finalReport.organic_remedies)}। रासायनिक नियंत्रण: ${cleanText(finalReport.chemical_remedies)}। मिट्टी और पानी प्रबंधन: ${cleanText(finalReport.soil_water_guidance)}।`;
    } else if (lang === 'bengali') {
      speakText = `${report.crop_name} এর জন্য ফসল উপদেষ্টা রিপোর্ট। প্রধান রোগ নির্ণয়: ${diseaseName}, ${report.diagnosed_diseases[0]?.confidence || 0} শতাংশ নিশ্চিততার সাথে। দৃশ্যমান লক্ষণসমূহ: ${cleanText(finalReport.symptoms)}। জৈবিক প্রতিকার: ${cleanText(finalReport.organic_remedies)}। রাসায়নিক নিয়ন্ত্রণ: ${cleanText(finalReport.chemical_remedies)}। মাটি ও জল ব্যবস্থাপনা: ${cleanText(finalReport.soil_water_guidance)}।`;
    } else if (lang === 'spanish') {
      speakText = `Informe de asesoramiento de cultivos para ${report.crop_name}. Diagnóstico principal: ${diseaseName} con un ${report.diagnosed_diseases[0]?.confidence || 0} por ciento de confianza. Síntomas visibles: ${cleanText(finalReport.symptoms)}. Remedios orgánicos: ${cleanText(finalReport.organic_remedies)}. Remedios químicos: ${cleanText(finalReport.chemical_remedies)}. Recomendaciones de suelo y agua: ${cleanText(finalReport.soil_water_guidance)}.`;
    } else if (lang === 'vietnamese') {
      speakText = `Báo cáo tư vấn cây trồng cho ${report.crop_name}. Chẩn đoán chính: ${diseaseName} với độ tin cậy ${report.diagnosed_diseases[0]?.confidence || 0} phần trăm. Triệu chứng rõ ràng: ${cleanText(finalReport.symptoms)}. Biện pháp hữu cơ: ${cleanText(finalReport.organic_remedies)}. Biện pháp hóa học: ${cleanText(finalReport.chemical_remedies)}. Khuyến nghị về đất và nước: ${cleanText(finalReport.soil_water_guidance)}.`;
    } else if (lang === 'french') {
      speakText = `Rapport de conseil sur les cultures pour ${report.crop_name}. Diagnostic principal: ${diseaseName} avec une confiance de ${report.diagnosed_diseases[0]?.confidence || 0} pour cent. Symptômes visibles: ${cleanText(finalReport.symptoms)}. Remèdes biologiques: ${cleanText(finalReport.organic_remedies)}. Remèdes chimiques: ${cleanText(finalReport.chemical_remedies)}. Recomandations sur le sol et l'eau: ${cleanText(finalReport.soil_water_guidance)}.`;
    } else {
      speakText = `Crop Advisory Report for ${report.crop_name}. Primary Diagnosis: ${diseaseName} with ${report.diagnosed_diseases[0]?.confidence || 0} percent confidence. Visible symptoms: ${cleanText(finalReport.symptoms)}. Organic remedies: ${cleanText(finalReport.organic_remedies)}. Chemical remedies: ${cleanText(finalReport.chemical_remedies)}. Soil and water recommendations: ${cleanText(finalReport.soil_water_guidance)}.`;
    }

    try {
      setTtsLoading(true);
      const res = await fetch(`${backendUrl}/api/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: speakText, language: report.language })
      });

      console.log('TTS response status:', res.status);

      if (!res.ok) {
        const errText = await res.text();
        console.error('TTS error response:', errText);
        throw new Error(`TTS request failed: ${res.status}`);
      }

      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };

      setIsSpeaking(true);
      await audio.play();
    } catch (err) {
      console.error('TTS error:', err);
      alert('Audio playback failed. Please try again.');
      setIsSpeaking(false);
    } finally {
      setTtsLoading(false);
    }
  };

  const finalReport = report.final_report;
  const diseases = report.diagnosed_diseases || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Top action header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            SCAN RESOLUTION REPORT
          </span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Diagnosis for {report.crop_name}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={handleTTS} disabled={ttsLoading} style={{ borderColor: isSpeaking ? 'var(--primary)' : 'var(--card-border)' }}>
            {ttsLoading ? (
              <>
                <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                Loading audio...
              </>
            ) : isSpeaking ? (
              <>
                <VolumeX size={18} color="var(--primary)" />
                Stop Audio
              </>
            ) : (
              <>
                <Volume2 size={18} />
                Listen Report
              </>
            )}
          </button>
          <button className="btn btn-primary" onClick={onReset}>
            <RefreshCw size={16} /> Scan Again
          </button>
        </div>
      </div>

      {/* Grid: Image & Symptom analysis + Disease list */}
      <div className="grid-2">
        {/* Leaf Image preview and Symptoms */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Leaf size={18} color="var(--primary)" /> Visual Observation & Symptoms
          </h3>
          {report.image_base64 && (
            <div style={{ width: '100%', maxHeight: '250px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--card-border)' }}>
              <img src={report.image_base64} alt={report.crop_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
          <div className="advisory-text" style={{ padding: '0.5rem 0' }}>
            {finalReport.symptoms}
          </div>
          {report.is_fallback && (
            <div style={{ 
              fontSize: '0.8rem', 
              color: 'var(--secondary)', 
              background: 'var(--secondary-glow)', 
              padding: '0.6rem 0.8rem', 
              borderRadius: '8px',
              border: '1px solid rgba(234, 179, 8, 0.2)'
            }}>
              ⚠️ {report.fallback_reason || 'Vision API key not configured or failed validation. Displaying rule-based diagnostic fallback findings.'}
            </div>
          )}
        </div>

        {/* Diagnosed Disease List */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={18} color="var(--accent-red)" /> Diagnosed Crop Pathogens
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {diseases.map((d, index) => (
              <div key={index} className="glass-card" style={{ 
                padding: '1rem', 
                background: index === 0 ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255, 255, 255, 0.01)', 
                borderColor: index === 0 ? 'rgba(239, 68, 68, 0.2)' : 'var(--card-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h4 style={{ fontWeight: 700, color: index === 0 ? '#f87171' : 'var(--text-primary)' }}>
                    {d.name}
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {index === 0 ? 'Primary Infection Strain' : 'Alternative Diagnostic Match'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Award size={18} color={index === 0 ? 'var(--secondary)' : 'var(--text-muted)'} />
                  <span style={{ fontWeight: 800, fontSize: '1.1rem', color: index === 0 ? 'var(--secondary)' : 'var(--text-secondary)' }}>
                    {d.confidence}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ 
            marginTop: 'auto', 
            background: 'rgba(59, 130, 246, 0.05)', 
            border: '1px solid rgba(59, 130, 246, 0.1)', 
            padding: '1rem', 
            borderRadius: '12px',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)'
          }}>
            ℹ️ Advisories are weather-calibrated for <strong>{report.weather?.temp}°C</strong> with <strong>{report.weather?.rain}</strong> and soil pH <strong>{report.soil_metrics?.pH}</strong>.
          </div>
        </div>
      </div>

      {/* Advisory remedies tabs & calendar actions */}
      <div className="grid-2">
        {/* Remedies Tab Card */}
        <div className="glass-card">
          <div className="report-tabs">
            <button 
              className={`report-tab-btn ${activeTab === 'organic' ? 'active' : ''}`}
              onClick={() => setActiveTab('organic')}
            >
              Organic Remedies
            </button>
            <button 
              className={`report-tab-btn ${activeTab === 'chemical' ? 'active' : ''}`}
              onClick={() => setActiveTab('chemical')}
            >
              Chemical Controls
            </button>
            <button 
              className={`report-tab-btn ${activeTab === 'soil' ? 'active' : ''}`}
              onClick={() => setActiveTab('soil')}
            >
              Soil & Water Management
            </button>
          </div>

          <div className="advisory-text" style={{ minHeight: '200px' }}>
            {activeTab === 'organic' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ color: 'var(--primary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Leaf size={16} /> Biological Control & Cultural Practices
                </div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{finalReport.organic_remedies}</div>
              </div>
            )}
            
            {activeTab === 'chemical' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ color: 'var(--accent-red)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Pill size={16} /> Synthetic Chemical Interventions
                </div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{finalReport.chemical_remedies}</div>
              </div>
            )}
            
            {activeTab === 'soil' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ color: 'var(--accent-blue)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Droplets size={16} /> Irrigation & N-P-K Nutrition Adjustments
                </div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{finalReport.soil_water_guidance}</div>
              </div>
            )}
          </div>
        </div>

        {/* Preventative Calendar actions */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={18} color="var(--primary)" /> 14-Day Preventative Calendar Actions
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {finalReport.preventative_calendar && finalReport.preventative_calendar.length > 0 ? (
              finalReport.preventative_calendar.map((item, idx) => (
                <div key={idx} style={{ 
                  display: 'flex', 
                  gap: '1rem', 
                  alignItems: 'flex-start',
                  borderBottom: idx < finalReport.preventative_calendar.length - 1 ? '1px solid rgba(255, 255, 255, 0.03)' : 'none',
                  paddingBottom: '0.5rem'
                }}>
                  <div style={{ 
                    background: 'var(--primary-glow)', 
                    color: 'var(--primary)', 
                    fontSize: '0.75rem', 
                    fontWeight: 'bold', 
                    padding: '0.2rem 0.5rem', 
                    borderRadius: '4px',
                    whiteSpace: 'nowrap',
                    marginTop: '0.1rem'
                  }}>
                    {item.split(':')[0] || `Step ${idx+1}`}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    {item.includes(':') ? item.split(':').slice(1).join(':').trim() || item : item}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>
                No calendar events generated.
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

