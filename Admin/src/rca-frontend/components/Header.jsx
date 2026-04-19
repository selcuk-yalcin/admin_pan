import React from 'react';
import { Settings } from 'lucide-react';
import LanguageSelector from './LanguageSelector';
import './Header.css';

const Header = ({ selectedLanguage, onLanguageChange, showAdminReturn = false, onAdminReturn }) => {
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
