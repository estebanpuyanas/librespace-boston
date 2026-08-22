export type AmenityLabel = 'Wi-Fi' | 'Seating' | 'Shade' | 'Accessible' | 'Playground';

export interface QuickPrompt {
  label: string;
  query: string;
  amenities: AmenityLabel[];
}

export interface SearchLocation {
  lat: number;
  lon: number;
  label: string;
}
