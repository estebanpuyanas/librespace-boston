import { useGeolocation } from '../../hooks/useGeolocation';
import { useNearbySpots } from '../../hooks/useNearbySpots';
import { useTranslation } from 'react-i18next';

const Home = () => {
  const { t } = useTranslation();
  const location = useGeolocation();
  const nearby = useNearbySpots(location.data);

  return (
    <div className='home'>
      <h1>{t('web.home.title')}</h1>
      <p className='text-muted'>{t('web.home.description')}</p>

      {location.loading && <p className='text-muted'>{t('web.home.findingNearby')}</p>}

      {!location.loading && !location.data && (
        <p className='text-muted'>{t('web.home.locationUnavailable')}</p>
      )}

      {nearby.loading && <p className='text-muted'>{t('web.home.loadingSpots')}</p>}

      {nearby.data && (
        <div className='bento-grid'>
          {nearby.data.spots.map(spot => (
            <div key={spot.spot_id} className='bento-tile'>
              <strong>{spot.name}</strong>
              <span className='text-muted'>
                {t('web.home.distanceAway', { distance: Math.round(spot.distance_meters) })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
