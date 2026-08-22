import type { AmenityLabel, AppLanguage, QuickPrompt } from './types/app';

export interface MobileCopy {
  answerFromData: string;
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
  answerFromData: 'ANSWER FROM BOSTON PUBLIC DATA',
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
  nearestWifi: 'NEAREST PUBLIC WI-FI',
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
  answerFromData: 'RESPUESTA BASADA EN DATOS PÚBLICOS DE BOSTON',
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
  nearestWifi: 'WI-FI PÚBLICO MÁS CERCANO',
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

const vietnamese: MobileCopy = {
  ...english,
  answerFromData: 'TRẢ LỜI TỪ DỮ LIỆU CÔNG KHAI CỦA BOSTON',
  alternativesTitle: 'Những lựa chọn khác đáng cân nhắc',
  approximateLocation: 'Khu vực gần đúng từ mạng của bạn. Chạm vào vị trí để chọn khu phố.',
  amenityLabels: {
    Accessible: 'Có thể tiếp cận',
    Playground: 'Sân chơi',
    Seating: 'Chỗ ngồi',
    Shade: 'Bóng mát',
    'Wi-Fi': 'Wi-Fi',
  },
  bestMatch: 'LỰA CHỌN PHÙ HỢP NHẤT',
  chooseAreaForWeather: 'Chạm để chọn khu vực',
  chooseAreaForWifi: 'Chạm để chọn khu vực',
  demoNotice: 'Đang hiển thị kết quả minh họa trong khi dịch vụ tìm kiếm kết nối lại.',
  describePlace: 'Mô tả không gian miễn phí bạn cần',
  directions: 'Chỉ đường',
  directionsUnavailable: 'Không thể mở chỉ đường trên thiết bị này.',
  emptyText: 'Hãy thử bỏ bớt một bộ lọc hoặc mở rộng khu vực tìm kiếm.',
  emptyTitle: 'Chưa có kết quả phù hợp chính xác ở gần đây.',
  freeNote: 'Luôn miễn phí',
  headline: 'Một nơi để ở.\nKhông cần mua gì cả.',
  languageLabel: 'Chọn ngôn ngữ',
  liveLocation: 'Vị trí đang hoạt động',
  loading: 'Đang tìm những lựa chọn miễn phí phù hợp nhất…',
  loadingShort: 'Đang tải…',
  location: 'Chọn khu vực của bạn',
  nearestCount: count => `${count} địa điểm miễn phí ở gần`,
  nearestWifi: 'WI-FI CÔNG CỘNG GẦN NHẤT',
  noSponsoredListings: 'Dựa trên dữ liệu công khai của Boston — không có danh sách được tài trợ.',
  publicDataDescription:
    'Một không gian công cộng miễn phí với thông tin từ dữ liệu mở của Boston.',
  publicWifi: 'Wi-Fi công cộng ở gần',
  playground: 'Sân chơi',
  restroom: 'Nhà vệ sinh',
  savePlace: 'Lưu địa điểm',
  savedPlace: 'Bỏ lưu địa điểm',
  search: 'Tìm địa điểm',
  seating: 'Chỗ ngồi',
  shadeNotice: trees => `${trees} cây công cộng ở gần — đây là chỉ dấu gần đúng về bóng mát.`,
  sortedByFit: 'Sắp xếp theo độ phù hợp',
  subhead:
    'Tìm không gian công cộng để ngồi, sạc thiết bị, tránh nóng và nghỉ ngơi — hoàn toàn miễn phí.',
  tryAsking: 'GỢI Ý CÂU HỎI',
  verifiedAccessible: 'Thông tin tiếp cận đã được xác minh',
  weather: 'NGAY BÂY GIỜ',
  weatherUnavailable: 'Thời tiết hiện không khả dụng',
  wifiUnavailable: 'Không có Wi-Fi đã xác minh ở gần',
};

const simplifiedChinese: MobileCopy = {
  ...english,
  answerFromData: '来自波士顿公共数据的回答',
  alternativesTitle: '其他值得考虑的地点',
  approximateLocation: '根据您的网络推测的大致区域。轻触位置标签以选择社区。',
  amenityLabels: {
    Accessible: '无障碍',
    Playground: '游乐场',
    Seating: '座位',
    Shade: '阴凉处',
    'Wi-Fi': 'Wi-Fi',
  },
  bestMatch: '最佳匹配',
  chooseAreaForWeather: '轻触以选择区域',
  chooseAreaForWifi: '轻触以选择区域',
  demoNotice: '本地搜索服务重新连接时，正在显示已保存的演示结果。',
  describePlace: '描述您需要的免费空间',
  directions: '获取路线',
  directionsUnavailable: '无法在此设备上打开路线。',
  emptyText: '请尝试减少一个筛选条件或扩大搜索范围。',
  emptyTitle: '附近暂时没有完全匹配的地点。',
  freeNote: '始终免费使用',
  headline: '一个可以停留的地方。\n无需消费。',
  languageLabel: '选择语言',
  liveLocation: '位置已启用',
  loading: '正在为您寻找最合适的免费地点…',
  loadingShort: '加载中…',
  location: '选择您的区域',
  nearestCount: count => `附近有 ${count} 个免费地点`,
  nearestWifi: '最近的公共 WI-FI',
  noSponsoredListings: '基于波士顿公共数据构建——没有赞助列表。',
  publicDataDescription: '一个免费公共地点，详情由波士顿开放数据验证。',
  publicWifi: '附近有公共 Wi-Fi',
  playground: '游乐场',
  restroom: '洗手间',
  savePlace: '收藏地点',
  savedPlace: '取消收藏地点',
  search: '搜索地点',
  seating: '座位',
  shadeNotice: trees => `附近有 ${trees} 棵公共树木——这是阴凉程度的近似参考。`,
  sortedByFit: '按匹配度排序',
  subhead: '寻找可以坐下、充电、避暑和停留的公共空间——完全免费。',
  tryAsking: '试着这样问',
  verifiedAccessible: '无障碍信息已验证',
  weather: '现在',
  weatherUnavailable: '天气暂时不可用',
  wifiUnavailable: '附近没有已验证的 Wi-Fi',
};

export const getMobileCopy = (language: AppLanguage): MobileCopy =>
  ({ en: english, es: spanish, vi: vietnamese, 'zh-Hans': simplifiedChinese })[language];

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
    : language === 'vi'
      ? [
          {
            label: 'Tôi cần Wi-Fi và chỗ ngồi',
            query: 'Tôi cần một nơi miễn phí ở gần để ngồi và dùng Wi-Fi.',
            amenities: ['Wi-Fi', 'Seating'],
          },
          {
            label: 'Tôi có thể học ngoài trời ở đâu có bóng mát?',
            query: 'Tôi có thể học ngoài trời, có bóng mát và miễn phí ở đâu?',
            amenities: ['Seating', 'Shade'],
          },
          {
            label: 'Một nơi miễn phí để đi cùng con tôi',
            query: 'Tìm một nơi miễn phí có sân chơi để tôi có thể làm việc khi con tôi chơi.',
            amenities: ['Playground', 'Seating'],
          },
        ]
      : language === 'zh-Hans'
        ? [
            {
              label: '我需要 Wi-Fi 和一个座位',
              query: '我需要附近一个可以坐下并使用 Wi-Fi 的免费地点。',
              amenities: ['Wi-Fi', 'Seating'],
            },
            {
              label: '我可以在哪里的阴凉处户外学习？',
              query: '哪里有可以免费在阴凉处户外学习的地方？',
              amenities: ['Seating', 'Shade'],
            },
            {
              label: '带孩子去的免费地点',
              query: '找一个有游乐场的免费地点，我可以在孩子玩耍时工作。',
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
