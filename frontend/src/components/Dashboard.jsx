import React from 'react';
import { ShieldCheck, AlertTriangle, Sprout, TrendingUp, ArrowRight } from 'lucide-react';

export default function Dashboard({ history, setTab }) {
  // Calculate average health score from history
  // If no history, assume 92% default
  let healthScore = 92;
  if (history && history.length > 0) {
    // Health score = 100 - avg(highest disease confidence)
    const confidences = history.map(h => {
      if (h.diagnosed_diseases && h.diagnosed_diseases.length > 0) {
        return h.diagnosed_diseases[0].confidence;
      }
      return 0;
    });
    const avgConfidence = confidences.reduce((sum, val) => sum + val, 0) / confidences.length;
    healthScore = Math.round(100 - avgConfidence);
  }

  // Dial SVG calculation
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (healthScore / 100) * circumference;

  // Total scans
  const totalScans = history.length;
  // Fallbacks vs LLM scans
  const fallbackCount = history.filter(h => h.is_fallback).length;
  const llmScans = totalScans - fallbackCount;

  // Alerts based on history or standard warnings
  const alerts = [
    {
      id: 1,
      type: 'warning',
      message: 'High humidity (88%) detected. Fungal spore production is accelerated. Monitor tomato and corn leaves closely.',
      crop: 'Tomato & Corn'
    },
    {
      id: 2,
      type: 'info',
      message: 'Dry spell forecasted. Maintain soil moisture above 45% for optimal wheat seedling development.',
      crop: 'Wheat'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Welcome banner */}
      <div className="glass-card" style={{ 
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.2)'
      }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Welcome to CropAdvisory AI</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '800px' }}>
          Your digital farm companion. Identify crop leaf infections instantly, resolve soil & nutrient issues, and access real-time weather-adjusted advisories.
        </p>
      </div>

      <div className="grid-3">
        {/* Metric Card 1: Health Dial */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', justifyContent: 'center' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-secondary)' }}>FARM HEALTH INDEX</h3>
          <div className="health-dial-container">
            <svg className="health-svg" width="140" height="140">
              <circle className="dial-bg" cx="70" cy="70" r={radius} fill="none" />
              <circle 
                className="dial-progress" 
                cx="70" 
                cy="70" 
                r={radius} 
                fill="none"
                stroke={healthScore > 80 ? 'var(--primary)' : healthScore > 50 ? 'var(--secondary)' : 'var(--accent-red)'}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
              />
            </svg>
            <div className="dial-text">
              <span>{healthScore}%</span>
              <span className="dial-label">{healthScore > 80 ? 'Excellent' : healthScore > 50 ? 'Moderate' : 'Poor'}</span>
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            Based on your last {totalScans} diagnostic scan evaluations.
          </p>
        </div>

        {/* Metric Card 2: Analytics */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} color="var(--primary)" /> ACTIVITY METRICS
          </h3>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.75rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Total Diagnostics Run:</span>
            <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--primary)' }}>{totalScans}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.75rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>AI Vision Diagnoses:</span>
            <span style={{ fontWeight: 'bold', color: 'var(--accent-blue)' }}>{llmScans}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.75rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Fallback Diagnostics:</span>
            <span style={{ fontWeight: 'bold', color: 'var(--secondary)' }}>{fallbackCount}</span>
          </div>

          <button className="btn btn-primary" onClick={() => setTab('scan')} style={{ marginTop: 'auto', width: '100%' }}>
            Start New Scan <ArrowRight size={16} />
          </button>
        </div>

        {/* Metric Card 3: Quick Action / Alerts */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} color="var(--secondary)" /> REGIONAL ALERTS
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', maxHeight: '200px', paddingRight: '4px' }}>
            {alerts.map(a => (
              <div key={a.id} style={{ 
                background: 'rgba(255, 255, 255, 0.02)', 
                borderLeft: `3px solid ${a.type === 'warning' ? 'var(--secondary)' : 'var(--accent-blue)'}`,
                padding: '0.75rem',
                borderRadius: '0 8px 8px 0',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem'
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  {a.crop}
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                  {a.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent scans list */}
      <div className="glass-card">
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sprout size={20} color="var(--primary)" /> RECENT ADVISORIES
        </h2>

        {history && history.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {history.slice(0, 3).map(item => (
              <div key={item.id} className="glass-card" style={{ 
                padding: '1rem', 
                background: 'rgba(255, 255, 255, 0.01)', 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  {item.image_base64 ? (
                    <img src={item.image_base64} alt={item.crop_name} style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--card-border)' }} />
                  ) : (
                    <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifycenter: 'center', color: 'var(--primary)' }}>
                      <Sprout size={24} style={{ margin: 'auto' }} />
                    </div>
                  )}
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>{item.crop_name}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Diagnosis: {item.diagnosed_diseases && item.diagnosed_diseases.length > 0 ? item.diagnosed_diseases[0].name : 'Healthy'}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>
                      Confidence: {item.diagnosed_diseases && item.diagnosed_diseases.length > 0 ? `${item.diagnosed_diseases[0].confidence}%` : 'N/A'}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <button className="btn btn-secondary" onClick={() => {
                    // Show report view
                    setTab('history');
                  }} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                    View Report
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
            <Sprout size={48} style={{ opacity: 0.25, marginBottom: '1rem' }} />
            <p>No diagnostics run yet. Click "Start New Scan" to diagnose your crop.</p>
          </div>
        )}
      </div>

    </div>
  );
}
