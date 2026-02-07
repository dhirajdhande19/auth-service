export interface BaseRateLimit {
  limit: number;
  window: number;
}
export enum Routes {
  Api_Auth = "/api/auth",
  Api_Token = "/api/token",
}

type RouteConfig = {
  [K in Routes]: BaseRateLimit;
};

export interface RateLimit {
  default: BaseRateLimit;
  routes: RouteConfig;
}

const RATE_LIMIT_CONFIG: RateLimit = {
  default: {
    limit: 5,
    window: 60,
  },

  routes: {
    [Routes.Api_Auth]: {
      limit: 10,
      window: 60 * 2,
    },
    [Routes.Api_Token]: {
      limit: 15,
      window: 60 * 2,
    },
  },
};

export default RATE_LIMIT_CONFIG;
