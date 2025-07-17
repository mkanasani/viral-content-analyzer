import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Results from './pages/Results';
import { startPollingService } from './lib/pollingService';
import { startRealtimeService } from './lib/realtimeService';

const App: React.FC = () => {
  useEffect(() => {
    startPollingService();
    startRealtimeService();
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