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

const Home = () => {
  const { t, i18n } = useTranslation();
  const location = useGeolocation();
  const nearby = useNearbySpots(location.data);
  const search = useQuerySearch(location.data, i18n.resolvedLanguage);
  const [query, setQuery] = useState(
    'I need a free place near Downtown where I can sit and use Wi-Fi.',
  );
  const [saved, setSaved] = useState(false);
  const [resultView, setResultView] = useState<ResultView>('list');

  const formatDistance = (distance: number) =>
    t('web.home.spot.distanceValue', { value: (distance / 1609.34).toFixed(1) });
  const formatWalk = (distance: number) =>
    t('web.home.spot.walkValue', { value: Math.max(1, Math.round(distance / 80)) });

  const spotTags = (spot: Spot) =>
    [
      spot.has_wifi && t('web.home.tags.wifi'),
      spot.features.includes('seating') && t('web.home.tags.seating'),
      spot.features.includes('playground') && t('web.home.tags.playground'),
      spot.features.includes('restroom') && t('web.home.tags.restroom'),
    ].filter(Boolean) as string[];

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
          <span>
            {location.data ? t('web.home.location.near') : t('web.home.location.default')}
          </span>
          <span className='home-live-dot'>
            <span className='sr-only'>{t('web.home.location.liveStatus')}</span>
          </span>
        </div>
        <h1>
          {t('web.home.headline')}
          <br />
          {t('web.home.headlineSub')}
        </h1>
        <p>{t('web.home.description')}</p>
      </section>

      <section className='home-search' aria-label={t('web.home.search.ariaLabel')}>
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
          aria-label={t('web.home.search.textareaLabel')}
          rows={3}
        />
        <div className='home-search-footer'>
          {search.submitted ? (
            <button className='home-clear-button' onClick={search.clear} type='button'>
              {t('web.home.search.clear')}
            </button>
          ) : (
            <span>{t('web.home.search.freeNote')}</span>
          )}
          <button
            className='home-search-button'
            onClick={handleSearchSubmit}
            type='button'
            disabled={search.loading}
            aria-busy={search.loading}
            aria-label={t('web.home.search.submit')}
          >
            <Search size={18} aria-hidden='true' />
          </button>
        </div>
      </section>

      <section className='home-results' aria-live='polite'>
        <div className='home-results-heading'>
          <div>
            <span className='eyebrow'>{t('web.home.results.bestMatch')}</span>
            <h2>
              {location.loading || activeLoading
                ? t('web.home.results.finding')
                : t('web.home.results.countLabel', { count: matchedSpots.length })}
            </h2>
          </div>
          <span className='home-sort-label'>
            {search.submitted
              ? t('web.home.results.searchResults')
              : t('web.home.results.sortedByDistance')}
          </span>
        </div>

        {!location.loading && !location.data && (
          <div className='home-notice'>{t('web.home.notices.noLocation')}</div>
        )}
        {search.submitted && search.loading && (
          <div className='home-notice'>{t('web.home.notices.searching')}</div>
        )}
        {activeError && (
          <div className='home-notice is-error'>
            {search.submitted
              ? t('web.home.notices.searchError')
              : t('web.home.notices.nearbyError')}
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
                  aria-label={saved ? t('result.removeSaved') : t('result.save')}
                >
                  <Heart size={23} fill={saved ? 'currentColor' : 'none'} aria-hidden='true' />
                </button>
              </div>
              <h3>{topSpot.name}</h3>
              <p className='home-distance'>
                {t('web.home.spot.distanceSummary', {
                  distance: formatDistance(topSpot.distance_meters),
                  walk: formatWalk(topSpot.distance_meters),
                })}
              </p>
              <p className='home-card-description'>{t('web.home.spot.verifiedDescription')}</p>
              <div className='home-tag-list'>
                {spotTags(topSpot).map(tag => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              {topSpot.accessible.value && (
                <p className='home-evidence'>
                  <Check size={15} aria-hidden='true' /> {t('web.home.spot.accessibleVerified')}
                </p>
              )}
              <p className='home-shade-note'>
                <TreePine size={15} aria-hidden='true' />{' '}
                {t('web.home.spot.shadeNote', { count: topSpot.tree_density_nearby })}
              </p>
              <a
                className='home-directions-button'
                href={getWalkingDirectionsUrl(topSpot)}
                target='_blank'
                rel='noopener noreferrer'
              >
                {t('result.getDirections')} <ArrowUpRight size={17} aria-hidden='true' />
              </a>
            </article>
          )}

          {!activeLoading && !activeError && location.data && matchedSpots.length === 0 && (
            <div className='home-empty'>
              <strong>{t('web.home.empty.title')}</strong>
              <span>{t('web.home.empty.subtitle')}</span>
            </div>
          )}

          {matchedSpots.length > 1 && (
            <div className='home-alternatives'>
              <h3>{t('web.home.alternatives.title')}</h3>
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
                      {spotTags(spot).slice(0, 2).join(' · ') ||
                        t('web.home.alternatives.fallbackTag')}
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
