import { useEffect, useMemo } from 'react';
import { divIcon } from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
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
        <strong>Map unavailable for these results</strong>
        <span>
          The places don’t have valid map coordinates. Switch to List to view their details.
        </span>
      </div>
    );
  }

  return (
    <div className='spot-map'>
      {hiddenSpotCount > 0 && (
        <p className='spot-map-status' role='status'>
          {hiddenSpotCount === 1
            ? 'One place could not be placed on the map. Its details remain available in List.'
            : `${hiddenSpotCount} places could not be placed on the map. Their details remain available in List.`}
        </p>
      )}
      <MapContainer
        aria-label='Map of the search location and free places'
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
            alt='Search location'
            icon={userIcon}
            keyboard
            position={[validLocation.lat, validLocation.lon]}
            title='Search location'
          >
            <Popup>
              <strong>Search location</strong>
            </Popup>
          </Marker>
        )}
        {validSpots.map(({ index, spot }) => {
          const featured = index === 0;
          const markerLabel = featured
            ? `Top pick: ${spot.name}`
            : `Alternative ${index + 1}: ${spot.name}`;

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
                  <span>{featured ? 'Top pick' : `Alternative ${index + 1}`}</span>
                  <strong>{spot.name}</strong>
                  <a href={getWalkingDirectionsUrl(spot)} target='_blank' rel='noopener noreferrer'>
                    Walking directions to {spot.name}
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      <div className='spot-map-legend' aria-label='Map legend'>
        <span>
          <i className='is-user' />
          Search location
        </span>
        <span>
          <i className='is-featured' />
          Top pick
        </span>
        <span>
          <i className='is-alternative' />
          Other places
        </span>
      </div>
    </div>
  );
};

export default SpotMap;
