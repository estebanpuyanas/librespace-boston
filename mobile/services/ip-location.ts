import { getLibreSpaceBostonAPI } from 'shared';
import type { ResolvedLocation } from 'shared';

export const getIpLocation = (): Promise<ResolvedLocation> =>
  getLibreSpaceBostonAPI().getIpLocation();
