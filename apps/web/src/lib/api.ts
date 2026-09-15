import axios, { type AxiosError, type AxiosRequestConfig } from "axios";
import env from "@/lib/env";
import { useAuthStore } from "@/lib/zustand";

interface RetryRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

let isRefreshing = false;

let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, refreshed = false) => {
  failedQueue.forEach((prom) => {
    if (refreshed) {
      prom.resolve(true);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

export const api = axios.create({
  baseURL: env.serverUrl,
  withCredentials: true,
});

export const auth = axios.create({
  baseURL: env.serverUrl,
  withCredentials: true,
});

export const bucket = axios.create({
  baseURL: env.bucketUrl,
  withCredentials: true,
});

api.interceptors.response.use(
  function (response) {
    return response;
  },
  async function (error: AxiosError) {
    const originalRequest = error.config as RetryRequestConfig;

    if (!originalRequest || originalRequest.url?.includes("/refresh")) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        const response = await auth.get("/api/auth/refresh");
        processQueue(null, true);
        console.log(`[Auth] ${response.data.message}`);
        return api(originalRequest);
      } catch (error: any) {
        processQueue(error, false);
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

bucket.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

bucket.interceptors.response.use(
  function (response) {
    return response;
  },
  async function (error: AxiosError) {
    const originalRequest = error.config as RetryRequestConfig;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const { setAccessToken } = useAuthStore.getState();

      try {
        const response = await api.get("/api/auth/retrieve");
        setAccessToken(response.data.data);
        console.log(`[Auth] ${response.data.message}`);
        return bucket(originalRequest);
      } catch (error) {
        setAccessToken(null);
        return Promise.reject(error);
      }
    }
  }
);

export default api;
