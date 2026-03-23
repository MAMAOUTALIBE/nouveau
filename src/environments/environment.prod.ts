export const environment = {
  production: true,
  api: {
    baseUrl: '/api/v1',
    timeoutMs: 15000,
  },
  auth: {
    devFallback: {
      enabled: false,
      username: 'spruko@admin.com',
      password: 'sprukoadmin',
    },
  },
  firebase: {
    apiKey: '********************************',
    authDomain: '********************************',
    projectId: '********************************',
    storageBucket: '********************************',
    messagingSenderId: '********************************',
    appId: '********************************',
    measurementId: '********************************',
  },
};
