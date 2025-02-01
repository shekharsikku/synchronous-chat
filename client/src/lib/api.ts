import axios from "axios";

const serverUrl = import.meta.env.DEV ? import.meta.env.VITE_SERVER_URL : "/";

const api = axios.create({
  baseURL: serverUrl,
  withCredentials: true,
});

export const auth = axios.create({
  baseURL: serverUrl,
  withCredentials: true,
});

api.interceptors.response.use(
  function (response) {
    return response;
  },
  async function (error) {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await auth.get("/api/auth/auth-refresh");
        return api(originalRequest);
      } catch (error: any) {
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
