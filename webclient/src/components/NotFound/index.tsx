import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './index.css';

const NotFound = () => {
  const { t } = useTranslation();

  return (
    <div className='not-found'>
      <span className='not-found-code'>404</span>
      <h1 className='not-found-title'>{t('web.notFound.title')}</h1>
      <p className='not-found-message text-muted'>{t('web.notFound.message')}</p>
      <Link to='/' className='btn btn-primary'>
        {t('web.notFound.goHome')}
      </Link>
    </div>
  );
};

export default NotFound;
