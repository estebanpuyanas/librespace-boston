import { Outlet, NavLink } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { toggleTheme } from '../../utils/theme';
import './index.css';

const Layout = () => (
  <div className='layout'>
    <header className='layout-header'>
      <div className='header-brand'>
        <span className='brand-name'>FreeSpace Boston</span>
      </div>

      <nav className='header-nav'>
        <NavLink to='/' end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          Home
        </NavLink>
      </nav>

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
