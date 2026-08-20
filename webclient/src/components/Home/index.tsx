import { useGeolocation } from '../../hooks/useGeolocation';
import { useNearbySpots } from '../../hooks/useNearbySpots';

const Home = () => {
  const location = useGeolocation();
  const nearby = useNearbySpots(location.data);

  return (
    <div className='home'>
      <h1>LibreSpace Boston</h1>
      <p className='text-muted'>Ask where you can go in Boston without spending money.</p>

      {location.loading && <p className='text-muted'>Finding what's nearby…</p>}

      {!location.loading && !location.data && (
        <p className='text-muted'>
          Couldn't determine your location — ask a question below to get started.
        </p>
      )}

      {nearby.loading && <p className='text-muted'>Loading nearby spots…</p>}

      {nearby.data && (
        <div className='bento-grid'>
          {nearby.data.spots.map(spot => (
            <div key={spot.spot_id} className='bento-tile'>
              <strong>{spot.name}</strong>
              <span className='text-muted'>{Math.round(spot.distance_meters)}m away</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
