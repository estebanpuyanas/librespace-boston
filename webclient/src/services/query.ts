import { getLibreSpaceBostonAPI, QueryRequest } from 'shared';

export const postQuery = (request: QueryRequest) => getLibreSpaceBostonAPI().postQuery(request);
