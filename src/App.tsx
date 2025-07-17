import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Results from './pages/Results';
import { startPollingService } from './lib/pollingService';
import { startRealtimeService } from './lib/realtimeService';
import { forceFixStuckStatuses } from './lib/migration';

const App: React.FC = () => {
  useEffect(() => {
    console.log('🚀 App starting up...');
    
    // Fix any stuck statuses on app startup
    forceFixStuckStatuses();
    
    // Start both polling and realtime services
    startPollingService();
    startRealtimeService();
    
    console.log('✅ App initialization complete');
  }, []);

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/history" element={<History />} />
          <Route path="/results/:runId" element={<Results />} />
        </Routes>
      </Layout>
      <Toaster position="top-right" />
    </BrowserRouter>
  );
};

export default App;