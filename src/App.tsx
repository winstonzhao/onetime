import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Navigation from './components/Navigation';
import Passwords from './components/pages/Passwords';
import Import from './components/pages/Import';
import Settings from './components/pages/Settings';
import './App.css';

function App() {
  // Set dark mode class on mount
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <Router>
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
    </Router>
  );
}

export default App;
