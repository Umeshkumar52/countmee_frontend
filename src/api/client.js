import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3008/api';

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to inject JWT token and handle FormData
client.interceptors.request.use(
  (config) => {
    const sessionStr = localStorage.getItem('countme_session');
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        if (session && session.token) {
          config.headers.Authorization = `Bearer ${session.token}`;
        }
      } catch (e) {
        console.error('Failed to parse session token', e);
      }
    }

    // Handle multipart/form-data for file uploads (FormData detection)
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor to handle authorization expiration (401) and auto-refresh
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== '/auth/refresh'
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(client(originalRequest));
            },
            reject: (err) => {
              reject(err);
            }
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const sessionStr = localStorage.getItem('countme_session');
      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr);
          if (session && session.refreshToken) {
            // Call refresh endpoint directly using global axios to avoid recursive interception
            const refreshResponse = await axios.post(`${API_URL}/auth/refresh`, {
              refreshToken: session.refreshToken
            });

            const responseData = refreshResponse.data;
            if (responseData && responseData.data) {
              const { token, refreshToken } = responseData.data;

              session.token = token;
              session.refreshToken = refreshToken;
              localStorage.setItem('countme_session', JSON.stringify(session));

              try {
                // Dynamically import store and action to prevent circular dependency
                const { default: store } = await import('../app/store');
                const { updateTokenState } = await import('../features/auth/authSlice');
                store.dispatch(updateTokenState({ token, refreshToken }));
              } catch (reduxError) {
                console.error('Failed to sync Redux store with refreshed token', reduxError);
              }

              processQueue(null, token);
              isRefreshing = false;

              originalRequest.headers.Authorization = `Bearer ${token}`;
              return client(originalRequest);
            }
          }
        } catch (refreshError) {
          processQueue(refreshError, null);
          isRefreshing = false;

          localStorage.removeItem('countme_session');
          if (window.location.pathname !== '/') {
            window.location.href = '/';
          }
          return Promise.reject(refreshError);
        }
      }

      localStorage.removeItem('countme_session');
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default client;
