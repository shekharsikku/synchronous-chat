import axios, { type AxiosError, type AxiosRequestConfig } from "axios";

import { getDeviceId } from "@/lib/utils";

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
    refreshed ? prom.resolve(true) : prom.reject(error);
  });
  failedQueue = [];
};

const serverUrl = import.meta.env.VITE_SERVER_URL;

const api = axios.create({
  baseURL: serverUrl,
  withCredentials: true,
});

const auth = axios.create({
  baseURL: serverUrl,
  withCredentials: true,
});

auth.interceptors.request.use(
  (config) => {
    const deviceId = getDeviceId();

    if (deviceId) {
      config.headers["X-Device-Id"] = deviceId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.request.use(
  (config) => {
    const deviceId = getDeviceId();

    if (deviceId) {
      config.headers["X-Device-Id"] = deviceId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  function (response) {
    return response;
  },
  async function (error: AxiosError) {
    const originalRequest = error.config as RetryRequestConfig;

    if (!originalRequest || originalRequest.url?.includes("/auth-refresh")) {
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
        const response = await auth.get("/api/auth/auth-refresh");

        if (response.data.success) {
          processQueue(null, true);
          return api(originalRequest);
        }

        throw new Error("Refresh failed!");
      } catch (error: any) {
        processQueue(error, false);

        if (error.response?.status === 403) {
          window.location.href = "/auth";
        }

        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
