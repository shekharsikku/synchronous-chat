import { setAuthUser, delAuthUser } from "@/lib/auth";
import axios from "axios";

const serverUrl = import.meta.env.VITE_SERVER_URL;

const api = axios.create({
  baseURL: serverUrl,
  withCredentials: true,
});

const auth = axios.create({
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
        const response = await auth.get("/api/auth/auth-refresh");
        const result = await response.data.data;
        setAuthUser(result);
        return api(originalRequest);
      } catch (error: any) {
        if (error.response?.status === 403) {
          delAuthUser();
          window.location.href = "/auth";
        }
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
