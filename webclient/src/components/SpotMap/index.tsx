import { useEffect, useMemo } from 'react';
import { divIcon } from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { useTranslation } from 'react-i18next';
import type { Coordinates, Spot } from 'shared';
import { getWalkingDirectionsUrl } from '../../utils/directions';
import 'leaflet/dist/leaflet.css';
import './index.css';

interface SpotMapProps {
  location: Coordinates | null;
  spots: Spot[];
}

interface MapPoint {
  lat: number;
  lon: number;
}

const isValidPoint = (point: MapPoint | null | undefined): point is MapPoint =>
  typeof point?.lat === 'number' &&
  Number.isFinite(point.lat) &&
  point.lat >= -90 &&
  point.lat <= 90 &&
  typeof point.lon === 'number' &&
  Number.isFinite(point.lon) &&
  point.lon >= -180 &&
  point.lon <= 180;

const createMarkerIcon = (kind: 'user' | 'featured' | 'alternative', label = '') =>
  divIcon({
    className: `spot-map-marker spot-map-marker--${kind}`,
    html: `<span aria-hidden="true">${label}</span>`,
    iconAnchor: [18, 18],
    iconSize: [36, 36],
    popupAnchor: [0, -18],
  });

const userIcon = createMarkerIcon('user', '●');
const featuredIcon = createMarkerIcon('featured', '★');

const FitViewport = ({ points }: { points: MapPoint[] }) => {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize({ pan: false });
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lon], 15, { animate: false });
      return;
    }
    if (points.length > 1) {
      map.fitBounds(
        points.map(point => [point.lat, point.lon]),
        { animate: false, maxZoom: 15, padding: [32, 32] },
      );
    }
  }, [map, points]);

  return null;
};

const SpotMap = ({ location, spots }: SpotMapProps) => {
  const { t } = useTranslation();
  const validSpots = useMemo(
    () => spots.map((spot, index) => ({ index, spot })).filter(({ spot }) => isValidPoint(spot)),
    [spots],
  );
  const validLocation = isValidPoint(location) ? location : null;
  const points = useMemo(
    () => [validLocation, ...validSpots.map(({ spot }) => spot)].filter(isValidPoint),
    [validLocation, validSpots],
  );
  const hiddenSpotCount = spots.length - validSpots.length;

  if (points.length === 0) {
    return (
      <div className='spot-map-fallback' role='status'>
        <strong>{t('web.map.unavailableTitle')}</strong>
        <span>{t('web.map.unavailableHint')}</span>
      </div>
    );
  }

  return (
    <div className='spot-map'>
      {hiddenSpotCount > 0 && (
        <p className='spot-map-status' role='status'>
          {hiddenSpotCount === 1
            ? t('web.map.hiddenOne')
            : t('web.map.hiddenMany', { count: hiddenSpotCount })}
        </p>
      )}
      <MapContainer
        aria-label={t('web.map.ariaLabel')}
        center={[points[0].lat, points[0].lon]}
        className='spot-map-canvas'
        keyboard
        scrollWheelZoom={false}
        zoom={15}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        />
        <FitViewport points={points} />
        {validLocation && (
          <Marker
            alt={t('web.map.searchLocation')}
            icon={userIcon}
            keyboard
            position={[validLocation.lat, validLocation.lon]}
            title={t('web.map.searchLocation')}
          >
            <Popup>
              <strong>{t('web.map.searchLocation')}</strong>
            </Popup>
          </Marker>
        )}
        {validSpots.map(({ index, spot }) => {
          const featured = index === 0;
          const markerLabel = featured
            ? t('web.map.topPickMarker', { name: spot.name })
            : t('web.map.alternativeMarker', { index: index + 1, name: spot.name });

          return (
            <Marker
              alt={markerLabel}
              icon={featured ? featuredIcon : createMarkerIcon('alternative', String(index + 1))}
              keyboard
              key={spot.spot_id}
              position={[spot.lat, spot.lon]}
              title={markerLabel}
            >
              <Popup>
                <div className='spot-map-callout'>
                  <span>
                    {featured
                      ? t('web.map.topPick')
                      : t('web.map.alternativeLabel', { index: index + 1 })}
                  </span>
                  <strong>{spot.name}</strong>
                  <a href={getWalkingDirectionsUrl(spot)} target='_blank' rel='noopener noreferrer'>
                    {t('web.map.walkingDirectionsTo', { name: spot.name })}
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      <div className='spot-map-legend' aria-label={t('web.map.legendAriaLabel')}>
        <span>
          <i className='is-user' />
          {t('web.map.searchLocation')}
        </span>
        <span>
          <i className='is-featured' />
          {t('web.map.topPick')}
        </span>
        <span>
          <i className='is-alternative' />
          {t('web.map.otherPlaces')}
        </span>
      </div>
    </div>
  );
};

export default SpotMap;
