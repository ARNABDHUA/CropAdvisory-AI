import React, { useState } from 'react';
import { Search, Calendar, Trash2, Sprout, ChevronRight } from 'lucide-react';
import AdvisoryReport from './AdvisoryReport';

export default function HistoryView({ history, backendUrl, refreshHistory }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [cropFilter, setCropFilter] = useState('All');
  const [selectedReport, setSelectedReport] = useState(null);

  // Filter history
  const filteredHistory = history.filter(item => {
    const matchesSearch = 
      item.crop_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.diagnosed_diseases && item.diagnosed_diseases.some(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()))) ||
      item.query.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesCrop = cropFilter === 'All' || item.crop_name.toLowerCase() === cropFilter.toLowerCase();
    
    return matchesSearch && matchesCrop;
  });

  // Extract unique crop names for filtering dropdown
  const crops = ['All', ...new Set(history.map(item => item.crop_name))];

  if (selectedReport) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <button className="btn btn-secondary" onClick={() => setSelectedReport(null)} style={{ alignSelf: 'flex-start' }}>
          ← Back to History List
        </button>
        <AdvisoryReport report={selectedReport} onReset={() => setSelectedReport(null)} backendUrl={backendUrl} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Historical Diagnostic Logs</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Review all previously analyzed crop conditions, soil compositions and weather-calibrated advisories.</p>
      </div>

      {/* Filter bar */}
      <div className="glass-card" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Search scans by crop, disease, or query..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.5rem', width: '100%' }}
          />
        </div>
        
        <div style={{ width: '180px' }}>
          <select value={cropFilter} onChange={(e) => setCropFilter(e.target.value)} style={{ width: '100%' }}>
            {crops.map(c => (
              <option key={c} value={c}>{c === 'All' ? 'All Crops' : c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredHistory.length > 0 ? (
          filteredHistory.map(item => (
            <div key={item.id} className="glass-card" style={{ 
              padding: '1.25rem', 
              background: 'rgba(255, 255, 255, 0.01)', 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              cursor: 'pointer'
            }} onClick={() => setSelectedReport(item)}>
              
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {item.image_base64 ? (
                  <img src={item.image_base64} alt={item.crop_name} style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--card-border)' }} />
                ) : (
                  <div style={{ width: '56px', height: '56px', borderRadius: '8px', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyCenter: 'center', color: 'var(--primary)' }}>
                    <Sprout size={28} style={{ margin: 'auto' }} />
                  </div>
                )}
                
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{item.crop_name}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      in {item.language}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    Diagnosis: <strong style={{ color: 'var(--primary)' }}>
                      {item.diagnosed_diseases && item.diagnosed_diseases.length > 0 ? item.diagnosed_diseases[0].name : 'Healthy'}
                    </strong>
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                    <Calendar size={12} /> {new Date(item.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 'bold', 
                    padding: '0.2rem 0.5rem', 
                    borderRadius: '4px',
                    background: item.is_fallback ? 'rgba(234, 179, 8, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                    color: item.is_fallback ? 'var(--secondary)' : 'var(--primary)',
                    border: `1px solid ${item.is_fallback ? 'rgba(234, 179, 8, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
                    display: 'inline-block'
                  }}>
                    {item.is_fallback ? 'Fallback' : 'AI Verified'}
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    Confidence: <strong>{item.diagnosed_diseases && item.diagnosed_diseases.length > 0 ? `${item.diagnosed_diseases[0].confidence}%` : '0%'}</strong>
                  </p>
                </div>
                <ChevronRight size={20} color="var(--text-secondary)" />
              </div>

            </div>
          ))
        ) : (
          <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-secondary)' }}>
            <Sprout size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <p>No historical scans found matching your search parameters.</p>
          </div>
        )}
      </div>

    </div>
  );
}
