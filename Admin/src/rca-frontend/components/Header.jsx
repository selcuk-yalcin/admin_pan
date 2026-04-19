import React from 'react';
import { Moon, Settings, Sun } from 'lucide-react';
import LanguageSelector from './LanguageSelector';
import './Header.css';

const Header = ({
  selectedLanguage,
  onLanguageChange,
  showAdminReturn = false,
  onAdminReturn,
  isLightMode = false,
  onThemeToggle,
}) => {
  return (
    <header className="header">
      <div className="header-left">
        {/* Logo kaldırıldı - daha minimal header */}
      </div>

      <div className="header-right">
        <LanguageSelector 
          selectedLanguage={selectedLanguage}
          onLanguageChange={onLanguageChange}
        />

        <button
          type="button"
          className="theme-toggle-btn"
          onClick={onThemeToggle}
          title={isLightMode ? "Koyu tema" : "Aydınlık tema"}
        >
          {isLightMode ? <Moon size={16} /> : <Sun size={16} />}
          <span>{isLightMode ? "Koyu" : "Aydınlık"}</span>
        </button>

        {showAdminReturn && (
          <button
            type="button"
            className="admin-return-top-btn"
            onClick={onAdminReturn}
          >
            Admin Panel
          </button>
        )}
        
        <button className="icon-btn" title="Ayarlar">
          <Settings size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;
