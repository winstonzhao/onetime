import { NavLink } from 'react-router-dom';
import { FaKey, FaFileImport, FaCog, FaShieldAlt } from 'react-icons/fa';
import { useEffect, useState } from 'react';

const Navigation = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  return (
    <nav className={`nav-menu ${scrolled ? 'scrolled' : ''}`}>
      <NavLink to="/" className="nav-brand">
        <FaShieldAlt className="brand-icon" aria-hidden="true" />
        <div className="brand-text">
          <span className="brand-one">One</span>
          <span className="brand-time">Time</span>
        </div>
      </NavLink>
      <div className="nav-items">
        <NavLink 
          to="/" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} 
          end
        >
          <FaKey className="nav-icon" aria-hidden="true" />
          <span>Passwords</span>
        </NavLink>
        <NavLink 
          to="/import" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <FaFileImport className="nav-icon" aria-hidden="true" />
          <span>Import</span>
        </NavLink>
        <NavLink 
          to="/settings" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <FaCog className="nav-icon" aria-hidden="true" />
          <span>Settings</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default Navigation;
