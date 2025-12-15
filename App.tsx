import React, { useState } from 'react';
import Layout from './components/Layout';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';

type ViewState = 'LANDING' | 'DASHBOARD';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('LANDING');

  const handleStart = () => {
    setCurrentView('DASHBOARD');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogoClick = () => {
    setCurrentView('LANDING');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRegisterClick = () => {
    // If on landing, go to dashboard then open modal (Dashboard handles its own modal state, 
    // but for simplicity, just navigation here. A more complex global state would be needed to open modal immediately)
    setCurrentView('DASHBOARD');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Layout 
      onLogoClick={handleLogoClick} 
      onRegisterClick={handleRegisterClick}
      isLanding={currentView === 'LANDING'}
    >
      {currentView === 'LANDING' ? (
        <LandingPage onStartClick={handleStart} />
      ) : (
        <Dashboard />
      )}
    </Layout>
  );
};

export default App;