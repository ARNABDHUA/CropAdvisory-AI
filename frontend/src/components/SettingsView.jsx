import React, { useState, useEffect } from 'react';
import { Settings, Save, AlertTriangle, Key, Network, Info } from 'lucide-react';

export default function SettingsView({ backendUrl }) {
  const [provider, setProvider] = useState('openai_custom');
  const [model, setModel] = useState('Qwen3-30B-A3B');
  const [baseUrl, setBaseUrl] = useState('https://seven-bats-hang.loca.lt/v1');
  const [apiKey, setApiKey] = useState('abc-123');
  const [googleApiKey, setGoogleApiKey] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  // Load current settings on mount
  useEffect(() => {
    fetch(`${backendUrl}/api/settings`)
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Failed to load settings');
      })
      .then(data => {
        setProvider(data.provider || 'openai_custom');
        setModel(data.model || 'Qwen3-30B-A3B');
        setBaseUrl(data.base_url || 'https://seven-bats-hang.loca.lt/v1');
        setApiKey(data.api_key || 'abc-123');
        setGoogleApiKey(data.google_api_key || '');
      })
      .catch(err => {
        console.error(err);
        setStatusMsg({ type: 'error', text: 'Error loading settings from server.' });
      });
  }, [backendUrl]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg({ type: '', text: '' });
    
    const payload = {
      provider,
      model,
      base_url: baseUrl,
      api_key: apiKey,
      google_api_key: googleApiKey
    };

    try {
      const res = await fetch(`${backendUrl}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setStatusMsg({ type: 'success', text: 'Settings updated successfully!' });
      } else {
        setStatusMsg({ type: 'error', text: 'Server returned error while saving.' });
      }
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: 'error', text: 'Network connection failure.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '650px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Settings size={22} color="var(--primary)" /> LLM Engine Settings
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>Configure API credentials and LLM endpoints for multimodal disease scanning.</p>
      </div>

      {statusMsg.text && (
        <div style={{ 
          padding: '1rem', 
          borderRadius: '10px', 
          fontSize: '0.9rem',
          fontWeight: 500,
          background: statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          color: statusMsg.type === 'success' ? 'var(--primary)' : 'var(--accent-red)',
          border: `1px solid ${statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
        }}>
          {statusMsg.type === 'success' ? '✓ ' : '✗ '} {statusMsg.text}
        </div>
      )}

      <form className="glass-card" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        <div className="form-group">
          <label>Provider Type</label>
          <select value={provider} onChange={(e) => {
            const val = e.target.value;
            setProvider(val);
            if (val === 'gemini') {
              setModel('gemini-1.5-flash');
            } else {
              setModel('Qwen3-30B-A3B');
            }
          }}>
            <option value="openai_custom">Custom OpenAI (e.g. Qwen Local)</option>
            <option value="gemini">Google Gemini SDK</option>
          </select>
        </div>

        <div className="form-group">
          <label>Model Identifier</label>
          <input 
            type="text" 
            value={model} 
            onChange={(e) => setModel(e.target.value)} 
            placeholder={provider === 'gemini' ? 'e.g. gemini-1.5-flash' : 'e.g. Qwen3-30B-A3B'}
          />
        </div>

        {provider === 'openai_custom' && (
          <>
            <div className="form-group">
              <label>API Endpoint Base URL</label>
              <div style={{ position: 'relative' }}>
                <Network size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  value={baseUrl} 
                  onChange={(e) => setBaseUrl(e.target.value)} 
                  style={{ paddingLeft: '2.5rem', width: '100%' }}
                  placeholder="https://tunnels.loca.lt/v1"
                />
              </div>
            </div>

            <div className="form-group">
              <label>OpenAI/Custom API Key</label>
              <div style={{ position: 'relative' }}>
                <Key size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="password" 
                  value={apiKey} 
                  onChange={(e) => setApiKey(e.target.value)} 
                  style={{ paddingLeft: '2.5rem', width: '100%' }}
                  placeholder="Enter API Secret Key"
                />
              </div>
            </div>
          </>
        )}

        {provider === 'gemini' && (
          <div className="form-group">
            <label>Google Gemini API Key</label>
            <div style={{ position: 'relative' }}>
              <Key size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="password" 
                value={googleApiKey} 
                onChange={(e) => setGoogleApiKey(e.target.value)} 
                style={{ paddingLeft: '2.5rem', width: '100%' }}
                placeholder="AIzaSy..."
              />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Used by direct Google GenAI SDK (e.g. gemini-2.5-flash).
            </p>
          </div>
        )}

        <div style={{ 
          background: 'rgba(59, 130, 246, 0.03)', 
          border: '1px solid rgba(59, 130, 246, 0.1)', 
          padding: '1rem', 
          borderRadius: '10px',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'flex-start',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)'
        }}>
          <Info size={18} color="var(--accent-blue)" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
          <div>
            <strong>Automated Fallback Safety:</strong> If your API credentials are left blank, invalid, or exhaust their quota, the system will automatically serve rule-based diagnostic reports for seamless demonstration.
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={saving} style={{ alignSelf: 'flex-end', marginTop: '1rem' }}>
          <Save size={16} /> {saving ? 'Saving...' : 'Save Configuration'}
        </button>

      </form>

    </div>
  );
}
