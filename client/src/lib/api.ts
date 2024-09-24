import axios from "axios";

const serverApiUrl = import.meta.env.DEV ? "http://localhost:4000" : "/";

const api = axios.create({
  baseURL: serverApiUrl,
});

export default api;
