import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Navigation from './components/Navigation';
import Passwords from './components/pages/Passwords';
import Import from './components/pages/Import';
import Settings from './components/pages/Settings';
import './App.css';

function AppContent() {
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for focus-search event from main process
    window.electronAPI.onFocusSearch(() => {
      navigate('/');
    });
  }, [navigate]);

  return (
    <div className="app-container">
      <Navigation />
      <main className="main-content">
        <div className="content-wrapper">
          <Routes>
            <Route path="/" element={<Passwords />} />
            <Route path="/import" element={<Import />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
