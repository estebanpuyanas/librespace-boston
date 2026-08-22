import type { AmenityLabel, AppLanguage, QuickPrompt } from './types/app';

export interface MobileCopy {
  alternativesTitle: string;
  approximateLocation: string;
  amenityLabels: Record<AmenityLabel, string>;
  bestMatch: string;
  chooseAreaForWeather: string;
  chooseAreaForWifi: string;
  demoNotice: string;
  describePlace: string;
  directions: string;
  directionsUnavailable: string;
  emptyText: string;
  emptyTitle: string;
  freeNote: string;
  headline: string;
  languageLabel: string;
  liveLocation: string;
  loading: string;
  loadingShort: string;
  location: string;
  nearestCount: (count: number) => string;
  nearestWifi: string;
  noSponsoredListings: string;
  publicDataDescription: string;
  publicWifi: string;
  playground: string;
  restroom: string;
  savePlace: string;
  savedPlace: string;
  search: string;
  seating: string;
  shadeNotice: (trees: number) => string;
  sortedByFit: string;
  subhead: string;
  tryAsking: string;
  verifiedAccessible: string;
  weather: string;
  weatherUnavailable: string;
  wifiUnavailable: string;
}

const english: MobileCopy = {
  alternativesTitle: 'Also worth considering',
  approximateLocation:
    'Approximate area from your network. Tap the location label to choose a neighborhood.',
  amenityLabels: {
    Accessible: 'Accessible',
    Playground: 'Playground',
    Seating: 'Seating',
    Shade: 'Shade',
    'Wi-Fi': 'Wi-Fi',
  },
  bestMatch: 'BEST MATCH',
  chooseAreaForWeather: 'Tap to choose an area',
  chooseAreaForWifi: 'Tap to choose an area',
  demoNotice: 'Showing saved demo results while the local search service reconnects.',
  describePlace: 'Describe the free place you need',
  directions: 'Get directions',
  directionsUnavailable: 'Directions could not be opened on this device.',
  emptyText: 'Try removing one filter or widening your search.',
  emptyTitle: 'No exact matches nearby yet.',
  freeNote: 'Always free to use',
  headline: 'A place to be.\nNo purchase needed.',
  languageLabel: 'Switch to Spanish',
  liveLocation: 'Location is active',
  loading: 'Finding your best free options…',
  loadingShort: 'Loading…',
  location: 'Choose your area',
  nearestCount: count => `${count} free ${count === 1 ? 'place' : 'places'} nearby`,
  nearestWifi: 'NEAREST WI-FI',
  noSponsoredListings: 'Built from Boston’s public data — not sponsored listings.',
  publicDataDescription: 'A free public place with details verified from Boston’s open data.',
  publicWifi: 'Public Wi-Fi nearby',
  playground: 'Playground',
  restroom: 'Restroom',
  savePlace: 'Save place',
  savedPlace: 'Remove saved place',
  search: 'Search places',
  seating: 'Seating',
  shadeNotice: trees =>
    `${trees} nearby public trees — an approximate shade signal, not canopy data.`,
  sortedByFit: 'Sorted by fit',
  subhead: 'Find public places to sit, recharge, cool off, and spend time — for free.',
  tryAsking: 'TRY ASKING',
  verifiedAccessible: 'Accessible park details verified',
  weather: 'RIGHT NOW',
  weatherUnavailable: 'Weather is temporarily unavailable',
  wifiUnavailable: 'No verified Wi-Fi nearby',
};

const spanish: MobileCopy = {
  alternativesTitle: 'Otras opciones para considerar',
  approximateLocation: 'Área aproximada de tu red. Toca la ubicación para elegir un vecindario.',
  amenityLabels: {
    Accessible: 'Accesible',
    Playground: 'Juegos',
    Seating: 'Asientos',
    Shade: 'Sombra',
    'Wi-Fi': 'Wi-Fi',
  },
  bestMatch: 'MEJOR OPCIÓN',
  chooseAreaForWeather: 'Toca para elegir un área',
  chooseAreaForWifi: 'Toca para elegir un área',
  demoNotice: 'Mostrando resultados de demostración mientras se reconecta el servicio de búsqueda.',
  describePlace: 'Describe el lugar gratis que necesitas',
  directions: 'Cómo llegar',
  directionsUnavailable: 'No se pudieron abrir las indicaciones en este dispositivo.',
  emptyText: 'Prueba quitar un filtro o ampliar tu búsqueda.',
  emptyTitle: 'Aún no hay coincidencias exactas cerca.',
  freeNote: 'Siempre gratis',
  headline: 'Un lugar para estar.\nSin comprar nada.',
  languageLabel: 'Cambiar a inglés',
  liveLocation: 'Ubicación activa',
  loading: 'Buscando las mejores opciones gratis…',
  loadingShort: 'Cargando…',
  location: 'Elige tu área',
  nearestCount: count => `${count} lugar${count === 1 ? '' : 'es'} gratis cerca`,
  nearestWifi: 'WI-FI MÁS CERCANO',
  noSponsoredListings: 'Basado en datos públicos de Boston, no en anuncios patrocinados.',
  publicDataDescription:
    'Un lugar público y gratuito con detalles verificados en los datos abiertos de Boston.',
  publicWifi: 'Wi-Fi público cerca',
  playground: 'Juegos',
  restroom: 'Baño',
  savePlace: 'Guardar lugar',
  savedPlace: 'Quitar lugar guardado',
  search: 'Buscar lugares',
  seating: 'Asientos',
  shadeNotice: trees =>
    `${trees} árboles públicos cercanos: una señal aproximada de sombra, no datos de cobertura arbórea.`,
  sortedByFit: 'Ordenado por afinidad',
  subhead:
    'Encuentra lugares públicos para sentarte, recargar, refrescarte y pasar el rato — gratis.',
  tryAsking: 'PRUEBA PREGUNTAR',
  verifiedAccessible: 'Detalles de accesibilidad verificados',
  weather: 'AHORA MISMO',
  weatherUnavailable: 'El clima no está disponible ahora',
  wifiUnavailable: 'No hay Wi-Fi verificado cerca',
};

export const getMobileCopy = (language: AppLanguage): MobileCopy =>
  language === 'es' ? spanish : english;

export const getQuickPrompts = (language: AppLanguage): QuickPrompt[] =>
  language === 'es'
    ? [
        {
          label: 'Necesito Wi-Fi y un lugar para sentarme',
          query: 'Necesito un lugar gratis cerca donde pueda sentarme y usar Wi-Fi.',
          amenities: ['Wi-Fi', 'Seating'],
        },
        {
          label: '¿Dónde puedo estudiar afuera y con sombra?',
          query: '¿Dónde puedo estudiar afuera y con sombra sin pagar?',
          amenities: ['Seating', 'Shade'],
        },
        {
          label: 'Un lugar gratis para ir con mi hijo',
          query:
            'Encuentra un lugar gratis con juegos donde pueda trabajar mientras mi hijo juega.',
          amenities: ['Playground', 'Seating'],
        },
      ]
    : [
        {
          label: 'I need Wi-Fi and a place to sit',
          query: 'I need a free place nearby where I can sit and use Wi-Fi.',
          amenities: ['Wi-Fi', 'Seating'],
        },
        {
          label: 'Where can I study outside in the shade?',
          query: 'Where can I study outside in the shade for free?',
          amenities: ['Seating', 'Shade'],
        },
        {
          label: 'A free place to go with my child',
          query: 'Find somewhere free with a playground where I can work while my child plays.',
          amenities: ['Playground', 'Seating'],
        },
      ];
