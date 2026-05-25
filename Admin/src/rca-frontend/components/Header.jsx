import React from 'react';
import { Moon, PlusCircle, Settings, Sun } from 'lucide-react';
import { getTranslation } from '../utils/translations';
import LanguageSelector from './LanguageSelector';
import './Header.css';

const Header = ({
  selectedLanguage,
  onLanguageChange,
  showAdminReturn = false,
  onAdminReturn,
  onNewAnalysis,
  isLightMode = false,
  onThemeToggle,
}) => {
  const t = (key) => getTranslation(selectedLanguage, key);
  return (
    <header className="header">
      <div className="header-left">
        {typeof onNewAnalysis === 'function' ? (
          <button
            type="button"
            className="header-new-analysis-btn"
            onClick={onNewAnalysis}
            title={t('btn_new_analysis')}
          >
            <PlusCircle size={18} aria-hidden />
            <span>{t('btn_new_analysis')}</span>
          </button>
        ) : null}
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
