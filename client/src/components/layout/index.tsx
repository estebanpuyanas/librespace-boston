import { Outlet, NavLink } from 'react-router-dom';
import { Sun, Moon, LogOut } from 'lucide-react';
import useUserContext from '../../contexts/useUserContext';
import { toggleTheme } from '../../utils/theme';
import './index.css';

const Layout = () => {
  const { user } = useUserContext();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <div className='layout'>
      <header className='layout-header'>
        <div className='header-brand'>
          <span className='brand-name'>WebApp</span>
        </div>

        <nav className='header-nav'>
          <NavLink to='/posts' className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Posts
          </NavLink>
        </nav>

        <div className='header-actions'>
          <span className='header-username'>{user.username}</span>
          <button className='icon-btn' onClick={toggleTheme} title='Toggle theme' type='button'>
            <Sun size={18} className='theme-icon-light' />
            <Moon size={18} className='theme-icon-dark' />
          </button>
          <button className='icon-btn' onClick={handleLogout} title='Logout' type='button'>
            <LogOut size={18} />
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
