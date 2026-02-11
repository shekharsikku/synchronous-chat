const env = {
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  serverUrl: import.meta.env.VITE_SERVER_URL,
  publicKey: import.meta.env.VITE_PUBLIC_KEY,
};

export default env;
