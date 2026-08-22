import { Outlet } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { setAppLanguage } from '../../localization/i18n';
import { languageOptions, type AppLanguage } from '../../localization/types';
import { toggleTheme } from '../../utils/theme';
import './index.css';

const Layout = () => (
  <div className='layout'>
    <header className='layout-header'>
      <div className='header-brand'>
        <span className='brand-mark' aria-hidden='true'>
          ●
        </span>
        <span className='brand-name'>FreeSpace</span>
        <span className='brand-city'>BOSTON</span>
      </div>

      <div className='header-actions'>
        <button className='icon-btn' onClick={toggleTheme} title='Toggle theme' type='button'>
          <Sun size={18} className='theme-icon-light' />
          <Moon size={18} className='theme-icon-dark' />
        </button>
      </div>
    </header>

        <div className='header-actions'>
          <label className='sr-only' htmlFor='language-picker'>
            {t('settings.language')}
          </label>
          <select
            id='language-picker'
            className='language-picker'
            aria-label={t('settings.language')}
            value={i18n.resolvedLanguage ?? 'en'}
            onChange={event => setAppLanguage(event.target.value as AppLanguage)}
          >
            {languageOptions.map(language => (
              <option key={language.code} value={language.code}>
                {language.nativeLabel}
              </option>
            ))}
          </select>
          <button
            className='icon-btn'
            onClick={toggleTheme}
            title={t('web.theme.toggle')}
            type='button'
          >
            <Sun size={18} className='theme-icon-light' />
            <Moon size={18} className='theme-icon-dark' />
          </button>
        </div>
      </header>

      <main className='layout-main'>
        <div className='container'>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
