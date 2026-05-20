export const environment = {
  production: true,
  api: {
    baseUrl: '/api/v1',
    timeoutMs: 15000,
  },
  auth: {
    devFallback: {
      enabled: false,
      username: '',
      password: '',
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
