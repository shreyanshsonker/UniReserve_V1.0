import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

import { useAuthStore } from '../stores/authStore';
import type { ApiEnvelope, AuthTokenPayload } from '../types/api';

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshResponse = await axios.post<ApiEnvelope<AuthTokenPayload>>(
          `${apiClient.defaults.baseURL}/auth/token/refresh/`,
          {},
          { withCredentials: true }
        );

        const accessToken = refreshResponse.data.data.access;
        useAuthStore.getState().setAccessToken(accessToken);
        originalRequest.headers.set('Authorization', `Bearer ${accessToken}`);

        return apiClient(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
