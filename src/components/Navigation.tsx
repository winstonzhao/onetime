import { NavLink } from 'react-router-dom';
import { FaKey, FaFileImport, FaCog } from 'react-icons/fa';

const Navigation = () => {
  return (
    <nav className="nav-menu">
      <div className="nav-brand">
        <h1>OTP Manager</h1>
      </div>
      <div className="nav-items">
        <NavLink 
          to="/" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} 
          end
        >
          <FaKey className="nav-icon" />
          <span>Passwords</span>
        </NavLink>
        <NavLink 
          to="/import" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <FaFileImport className="nav-icon" />
          <span>Import</span>
        </NavLink>
        <NavLink 
          to="/settings" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <FaCog className="nav-icon" />
          <span>Settings</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default Navigation;
