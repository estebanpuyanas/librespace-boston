interface BostonArea {
  label: string;
  lat: number;
  lon: number;
}

const areas: BostonArea[] = [
  { label: 'Fort Point', lat: 42.3471, lon: -71.052 },
  { label: 'Downtown Boston', lat: 42.3554, lon: -71.0657 },
  { label: 'North End', lat: 42.3656, lon: -71.0549 },
  { label: 'Back Bay', lat: 42.3493, lon: -71.081 },
  { label: 'Fenway', lat: 42.3456, lon: -71.0972 },
  { label: 'South Boston', lat: 42.3334, lon: -71.0476 },
  { label: 'East Boston', lat: 42.3751, lon: -71.0392 },
  { label: 'Allston', lat: 42.3537, lon: -71.1323 },
  { label: 'Dorchester', lat: 42.3016, lon: -71.0676 },
  { label: 'Jamaica Plain', lat: 42.3098, lon: -71.1151 },
];

const squaredDistance = (first: BostonArea, lat: number, lon: number) =>
  (first.lat - lat) ** 2 + (first.lon - lon) ** 2;

export const getBostonAreaLabel = (lat: number, lon: number): string => {
  const closest = areas.reduce((nearest, area) =>
    squaredDistance(area, lat, lon) < squaredDistance(nearest, lat, lon) ? area : nearest,
  );

  return squaredDistance(closest, lat, lon) < 0.001 ? closest.label : 'Boston area';
};
