const env = {
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  serverUrl: import.meta.env.VITE_SERVER_URL,
  publicKey: import.meta.env.VITE_PUBLIC_KEY,
  peerHost: import.meta.env.VITE_PEER_HOST,
  peerPort: parseInt(import.meta.env.VITE_PEER_PORT),
  peerPath: import.meta.env.VITE_PEER_PATH,
};

export default env;
