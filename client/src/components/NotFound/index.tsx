import { Link } from 'react-router-dom';
import './index.css';

const NotFound = () => (
  <div className='not-found'>
    <span className='not-found-code'>404</span>
    <h1 className='not-found-title'>Page not found</h1>
    <p className='not-found-message text-muted'>
      The page you're looking for doesn't exist or has been moved.
    </p>
    <Link to='/' className='btn btn-primary'>
      Go home
    </Link>
  </div>
);

export default NotFound;
