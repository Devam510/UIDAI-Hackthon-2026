import { Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Layout from './components/Layout/Layout';
import Home from './pages/Home';
import Overview from './pages/Overview';
import Forecast from './pages/Forecast';
import DistrictHotspots from './pages/DistrictHotspots';
import BiometricHotspots from './pages/BiometricHotspots';
import DemographicRisks from './pages/DemographicRisks';
import ExecutiveSummary from './pages/ExecutiveSummary';
import AuditLog from './pages/AuditLog';
import Methodology from './pages/Methodology';
import QuickStartGuide from './components/Common/QuickStartGuide';
import { ChatProvider } from './context/ChatContext';

function App() {
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    // Check if user has seen the guide before
    const hideGuide = localStorage.getItem('hideQuickStartGuide');
    if (!hideGuide) {
      // Show guide after a short delay for better UX
      setTimeout(() => setShowGuide(true), 1000);
    }
  }, []);

  return (
    <>
      {showGuide && <QuickStartGuide onClose={() => setShowGuide(false)} />}
      <ChatProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/overview" element={<Overview />} />
            <Route path="/executive-summary" element={<ExecutiveSummary />} />
            <Route path="/audit-log" element={<AuditLog />} />
            <Route path="/methodology" element={<Methodology />} />
            <Route path="/forecast" element={<Forecast />} />
            <Route path="/district-hotspots" element={<DistrictHotspots />} />
            <Route path="/biometric-hotspots" element={<BiometricHotspots />} />
            <Route path="/demographic-risks" element={<DemographicRisks />} />
          </Routes>
        </Layout>
      </ChatProvider>
    </>
  );
}

export default App;

