import { useMemo, useState } from 'react';
import { ArrowUpRight, Check, Heart, MapPin, Search, TreePine } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useNearbySpots } from '../../hooks/useNearbySpots';
import { useQuerySearch } from '../../hooks/useQuerySearch';
import { getWalkingDirectionsUrl } from '../../utils/directions';
import ResultViewToggle, { type ResultView } from '../ResultViewToggle';
import SpotMap from '../SpotMap';
import type { Spot } from 'shared';
import './index.css';

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
  const { i18n } = useTranslation();
  const location = useGeolocation();
  const nearby = useNearbySpots(location.data);
  const search = useQuerySearch(location.data, i18n.resolvedLanguage);
  const [query, setQuery] = useState(
    'I need a free place near Downtown where I can sit and use Wi-Fi.',
  );
  const [saved, setSaved] = useState(false);
  const [resultView, setResultView] = useState<ResultView>('list');

  const activeData = search.submitted ? search.data : nearby.data;
  const activeLoading = search.submitted ? search.loading : nearby.loading;
  const activeError = search.submitted ? search.error : nearby.error;

  const matchedSpots = useMemo(() => activeData?.spots ?? [], [activeData]);

  const handleSearchSubmit = () => search.submit(query);

  const topSpot = matchedSpots[0];
  const mapLocation = activeData?.resolved_location ?? location.data;

  return (
    <div className='home'>
      <section className='home-hero'>
        <div className='home-location'>
          <MapPin size={15} aria-hidden='true' />
          <span>{location.data ? 'Near your current location' : 'Downtown Boston'}</span>
          <span className='home-live-dot'>
            <span className='sr-only'>Live location status</span>
          </span>
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
          onKeyDown={event => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              if (!search.loading) {
                handleSearchSubmit();
              }
            }
          }}
          aria-label='Describe the free place you need'
          rows={3}
        />
        <div className='home-search-footer'>
          {search.submitted ? (
            <button className='home-clear-button' onClick={search.clear} type='button'>
              Clear search
            </button>
          ) : (
            <span>Always free to use</span>
          )}
          <button
            className='home-search-button'
            onClick={handleSearchSubmit}
            type='button'
            disabled={search.loading}
            aria-busy={search.loading}
            aria-label='Search spaces'
          >
            <Search size={18} aria-hidden='true' />
          </button>
        </div>
      </section>

      <section className='home-results' aria-live='polite'>
        <div className='home-results-heading'>
          <div>
            <span className='eyebrow'>BEST MATCH</span>
            <h2>
              {location.loading || activeLoading
                ? 'Finding free spaces…'
                : `${matchedSpots.length} free places nearby`}
            </h2>
          </div>
          <span className='home-sort-label'>
            {search.submitted ? 'Search results' : 'Sorted by distance'}
          </span>
        </div>

        {!location.loading && !location.data && (
          <div className='home-notice'>
            We couldn’t use your location. Showing live data when a location is available.
          </div>
        )}
        {search.submitted && search.loading && (
          <div className='home-notice'>Finding a synthesized answer for your search…</div>
        )}
        {activeError && (
          <div className='home-notice is-error'>
            {search.submitted
              ? 'Couldn’t get a search result right now. Try again in a moment.'
              : 'Couldn’t load nearby places yet. Try again in a moment.'}
          </div>
        )}

        {!activeLoading && !activeError && activeData && (
          <div className='home-search-result'>
            {activeData.answer && <p className='home-answer'>{activeData.answer}</p>}
            {(activeData.disclaimers ?? []).length > 0 && (
              <ul className='home-disclaimers'>
                {(activeData.disclaimers ?? []).map(note => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {!activeLoading && !activeError && activeData && (
          <div className='home-view-toggle'>
            <ResultViewToggle onChange={setResultView} view={resultView} />
          </div>
        )}

        <div
          aria-labelledby='result-view-list'
          className='home-view-panel home-list-panel'
          hidden={resultView !== 'list'}
          id='list-results-panel'
          role='tabpanel'
        >
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
                {formatDistance(topSpot.distance_meters)} away ·{' '}
                {formatWalk(topSpot.distance_meters)}
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
                <TreePine size={15} aria-hidden='true' /> {topSpot.tree_density_nearby} nearby
                public trees — an approximate shade signal, not canopy data.
              </p>
              <a
                className='home-directions-button'
                href={getWalkingDirectionsUrl(topSpot)}
                target='_blank'
                rel='noopener noreferrer'
              >
                Get directions <ArrowUpRight size={17} aria-hidden='true' />
              </a>
            </article>
          )}

          {!activeLoading && !activeError && location.data && matchedSpots.length === 0 && (
            <div className='home-empty'>
              <strong>No exact matches nearby yet.</strong>
              <span>Try removing a filter or widening your search.</span>
            </div>
          )}

          {matchedSpots.length > 1 && (
            <div className='home-alternatives'>
              <h3>Also worth considering</h3>
              {matchedSpots.slice(1, 4).map((spot, index) => (
                <a
                  className='home-alternative'
                  href={getWalkingDirectionsUrl(spot)}
                  key={spot.spot_id}
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <span className='home-alt-number'>{String(index + 2).padStart(2, '0')}</span>
                  <span className='home-alt-copy'>
                    <strong>{spot.name}</strong>
                    <small>
                      {formatDistance(spot.distance_meters)} ·{' '}
                      {spotTags(spot).slice(0, 2).join(' · ') || 'Public open space'}
                    </small>
                  </span>
                  <ArrowUpRight size={19} aria-hidden='true' />
                </a>
              ))}
            </div>
          )}
        </div>

        <div
          aria-labelledby='result-view-map'
          className='home-view-panel home-map-panel'
          hidden={resultView !== 'map'}
          id='map-results-panel'
          role='tabpanel'
        >
          {resultView === 'map' && <SpotMap location={mapLocation} spots={matchedSpots} />}
        </div>
      </section>
    </div>
  );
};

export default Home;
