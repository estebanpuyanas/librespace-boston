import { useMemo, useState } from 'react';
import {
  Accessibility,
  ArrowUpRight,
  Check,
  ChevronDown,
  Heart,
  MapPin,
  Search,
  TreePine,
  Wifi,
} from 'lucide-react';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useNearbySpots } from '../../hooks/useNearbySpots';
import { useTranslation } from 'react-i18next';
import type { Spot } from 'shared';
import './index.css';

const filters = [
  { icon: Wifi, label: 'Wi-Fi', value: 'wifi' },
  { icon: Check, label: 'Seating', value: 'seating' },
  { icon: TreePine, label: 'Shade', value: 'shade' },
  { icon: Accessibility, label: 'Accessible', value: 'accessible' },
  { icon: Check, label: 'Playground', value: 'playground' },
] as const;

type Filter = (typeof filters)[number]['value'];

const isMatch = (spot: Spot, filter: Filter) => {
  switch (filter) {
    case 'wifi':
      return spot.has_wifi;
    case 'seating':
      return spot.features.includes('seating');
    case 'shade':
      return spot.features.includes('shade_structure') || spot.tree_density_nearby >= 30;
    case 'accessible':
      return spot.accessible.value;
    case 'playground':
      return spot.features.includes('playground');
  }
};

const formatDistance = (distance: number) => `${(distance / 1609.34).toFixed(1)} mi`;
const formatWalk = (distance: number) => `${Math.max(1, Math.round(distance / 80))} min walk`;

const spotTags = (spot: Spot) =>
  [
    spot.has_wifi && 'Public Wi-Fi nearby',
    spot.features.includes('seating') && 'Seating',
    spot.features.includes('playground') && 'Playground',
    spot.features.includes('restroom') && 'Restroom',
  ].filter(Boolean) as string[];

const Home = () => {
  const { t } = useTranslation();
  const location = useGeolocation();
  const nearby = useNearbySpots(location.data);
  const [query, setQuery] = useState(
    'I need a free place near Downtown where I can sit and use Wi-Fi.',
  );
  const [selectedFilters, setSelectedFilters] = useState<Filter[]>([]);
  const [saved, setSaved] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const matchedSpots = useMemo(() => {
    const spots = nearby.data?.spots ?? [];
    return selectedFilters.length === 0
      ? spots
      : spots.filter(spot => selectedFilters.every(filter => isMatch(spot, filter)));
  }, [nearby.data, selectedFilters]);

  const topSpot = matchedSpots[0];
  const toggleFilter = (filter: Filter) => {
    setSelectedFilters(current =>
      current.includes(filter) ? current.filter(item => item !== filter) : [...current, filter],
    );
  };

  return (
    <div className='home'>
      <section className='home-hero'>
        <div className='home-location'>
          <MapPin size={15} aria-hidden='true' />
          <span>{location.data ? 'Near your current location' : 'Downtown Boston'}</span>
          <span className='home-live-dot' aria-label='Live location status' />
        </div>
        <h1>
          A place to be.
          <br />
          No purchase needed.
        </h1>
        <p>Find public places to sit, recharge, cool off, and spend time — for free.</p>
      </section>

      <section className='home-search' aria-label='Find a free space'>
        <textarea
          value={query}
          onChange={event => setQuery(event.target.value)}
          aria-label='Describe the free place you need'
          rows={3}
        />
        <div className='home-search-footer'>
          <span>Always free to use</span>
          <button
            className='home-search-button'
            onClick={() => setSubmitted(true)}
            type='button'
            aria-label='Search spaces'
          >
            <Search size={18} aria-hidden='true' />
          </button>
        </div>
      </section>

      <div className='home-filter-row' aria-label='Amenities'>
        {filters.map(({ icon: Icon, label, value }) => {
          const selected = selectedFilters.includes(value);
          return (
            <button
              className={`home-filter ${selected ? 'is-selected' : ''}`}
              key={value}
              onClick={() => toggleFilter(value)}
              type='button'
              aria-pressed={selected}
            >
              {selected ? (
                <Check size={14} aria-hidden='true' />
              ) : (
                <Icon size={14} aria-hidden='true' />
              )}
              {label}
            </button>
          );
        })}
      </div>

      <section className='home-results' aria-live='polite'>
        <div className='home-results-heading'>
          <div>
            <span className='eyebrow'>BEST MATCH</span>
            <h2>
              {nearby.loading || location.loading
                ? 'Finding free spaces…'
                : `${matchedSpots.length} free places nearby`}
            </h2>
          </div>
          <span className='home-sort-label'>
            {submitted ? 'Live nearby data' : 'Sorted by distance'}
          </span>
        </div>

        {!location.loading && !location.data && (
          <div className='home-notice'>
            We couldn’t use your location. Showing live data when a location is available.
          </div>
        )}
        {nearby.error && (
          <div className='home-notice is-error'>
            Couldn’t load nearby places yet. The live-data panel below will show the connection
            state.
          </div>
        )}

        {topSpot && (
          <article className='home-featured-spot'>
            <div className='home-card-top'>
              <span className='home-card-number'>01</span>
              <button
                className='home-save-button'
                onClick={() => setSaved(current => !current)}
                type='button'
                aria-label={saved ? 'Remove saved place' : 'Save place'}
              >
                <Heart size={23} fill={saved ? 'currentColor' : 'none'} aria-hidden='true' />
              </button>
            </div>
            <h3>{topSpot.name}</h3>
            <p className='home-distance'>
              {formatDistance(topSpot.distance_meters)} away · {formatWalk(topSpot.distance_meters)}
            </p>
            <p className='home-card-description'>
              A free public place with details verified from Boston’s open data.
            </p>
            <div className='home-tag-list'>
              {spotTags(topSpot).map(tag => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
            {topSpot.accessible.value && (
              <p className='home-evidence'>
                <Check size={15} aria-hidden='true' /> Accessible park details verified
              </p>
            )}
            <p className='home-shade-note'>
              <TreePine size={15} aria-hidden='true' /> {topSpot.tree_density_nearby} nearby public
              trees — an approximate shade signal, not canopy data.
            </p>
            <button className='home-directions-button' type='button'>
              Get directions <ArrowUpRight size={17} aria-hidden='true' />
            </button>
          </article>
        )}

        {!nearby.loading && location.data && matchedSpots.length === 0 && (
          <div className='home-empty'>
            <strong>No exact matches nearby yet.</strong>
            <span>Try removing a filter or widening your search.</span>
          </div>
        )}

        {matchedSpots.length > 1 && (
          <div className='home-alternatives'>
            <h3>Also worth considering</h3>
            {matchedSpots.slice(1, 4).map((spot, index) => (
              <button className='home-alternative' key={spot.spot_id} type='button'>
                <span className='home-alt-number'>{String(index + 2).padStart(2, '0')}</span>
                <span className='home-alt-copy'>
                  <strong>{spot.name}</strong>
                  <small>
                    {formatDistance(spot.distance_meters)} ·{' '}
                    {spotTags(spot).slice(0, 2).join(' · ') || 'Public open space'}
                  </small>
                </span>
                <ArrowUpRight size={19} aria-hidden='true' />
              </button>
            ))}
          </div>
        )}
      </section>

      <details className='home-live-data'>
        <summary>
          <span>
            <span className='home-test-dot' /> Live data &amp; testing
          </span>
          <ChevronDown size={18} aria-hidden='true' />
        </summary>
        <div className='home-live-data-content'>
          <p>
            This panel preserves the original live query output while the polished experience above
            evolves.
          </p>
          <div className='home-data-status'>
            <span>
              Location:{' '}
              {location.loading
                ? 'resolving…'
                : location.data
                  ? `${location.data.lat.toFixed(4)}, ${location.data.lon.toFixed(4)}`
                  : 'unavailable'}
            </span>
            <span>Results: {nearby.loading ? 'loading…' : (nearby.data?.spots.length ?? 0)}</span>
          </div>
          {nearby.data?.spots.length ? (
            <div className='home-data-grid'>
              {nearby.data.spots.map(spot => (
                <div key={spot.spot_id} className='home-data-item'>
                  <strong>{spot.name}</strong>
                  <span>{Math.round(spot.distance_meters)}m away</span>
                  <small>
                    {Object.values(spot.source_dataset)
                      .filter((value, index, values) => values.indexOf(value) === index)
                      .slice(0, 2)
                      .join(' · ')}
                  </small>
                </div>
              ))}
            </div>
          ) : (
            <pre>{JSON.stringify({ location: location.error, nearby: nearby.error }, null, 2)}</pre>
          )}
        </div>
      </details>
    </div>
  );
};

export default Home;
