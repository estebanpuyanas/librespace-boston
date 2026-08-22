import { getLibreSpaceBostonAPI } from 'shared';
import type { QueryRequest, QueryResponse } from 'shared';

export const postQuery = (request: QueryRequest): Promise<QueryResponse> =>
  getLibreSpaceBostonAPI().postQuery(request);
