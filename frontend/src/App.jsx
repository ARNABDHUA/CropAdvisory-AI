import React, { useState, useEffect } from 'react';
import { Sprout, LayoutDashboard, SearchCode, History, Settings } from 'lucide-react';

import Dashboard from './components/Dashboard';
import ScanForm from './components/ScanForm';
import AdvisoryReport from './components/AdvisoryReport';
import HistoryView from './components/HistoryView';
import SettingsView from './components/SettingsView';

const BACKEND_URL = 'http://localhost:8000';

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [history, setHistory] = useState([]);
  const [activeScan, setActiveScan] = useState(null);

  // Fetch history on startup
  const fetchHistory = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/history`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (e) {
      console.error('Failed to fetch history logs', e);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleScanResult = (result) => {
    setActiveScan(result);
    // Reload history list
    fetchHistory();
  };

  return (
    <div className="app-container">
      {/* Brand SVG Definitions for Gradient Stroke */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="brand-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      </svg>

      {/* Header */}
      <header className="header">
        <div className="brand" onClick={() => setTab('dashboard')} style={{ cursor: 'pointer' }}>
          <Sprout size={28} />
          <span>CropAdvisory AI</span>
        </div>
        
        <nav className="nav-tabs">
          <button className={`tab-btn ${tab === 'dashboard' ? 'active' : ''}`} onClick={() => { setTab('dashboard'); setActiveScan(null); }}>
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button className={`tab-btn ${tab === 'scan' ? 'active' : ''}`} onClick={() => setTab('scan')}>
            <SearchCode size={18} /> Scan & Diagnose
          </button>
          <button className={`tab-btn ${tab === 'history' ? 'active' : ''}`} onClick={() => { setTab('history'); setActiveScan(null); }}>
            <History size={18} /> Logs History
          </button>
          <button className={`tab-btn ${tab === 'settings' ? 'active' : ''}`} onClick={() => { setTab('settings'); setActiveScan(null); }}>
            <Settings size={18} /> Engine Settings
          </button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {tab === 'dashboard' && (
          <Dashboard 
            history={history} 
            setTab={setTab} 
          />
        )}
        
        {tab === 'scan' && (
          activeScan ? (
            <AdvisoryReport 
              report={activeScan} 
              onReset={() => setActiveScan(null)} 
              backendUrl={BACKEND_URL}
            />
          ) : (
            <ScanForm 
              onResult={handleScanResult} 
              backendUrl={BACKEND_URL}
            />
          )
        )}
        
        {tab === 'history' && (
          <HistoryView 
            history={history} 
            backendUrl={BACKEND_URL}
            refreshHistory={fetchHistory}
          />
        )}
        
        {tab === 'settings' && (
          <SettingsView 
            backendUrl={BACKEND_URL} 
          />
        )}
      </main>
    </div>
  );
}
