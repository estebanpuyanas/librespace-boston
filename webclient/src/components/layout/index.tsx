import { Outlet } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
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

    <main className='layout-main'>
      <div className='container'>
        <Outlet />
      </div>
    </main>
  </div>
);

export default Layout;
