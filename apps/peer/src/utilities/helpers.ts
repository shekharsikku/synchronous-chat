export function formatBytes(bytes: number) {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;

  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }

  return `${bytes.toFixed(2)} ${units[i]}`;
}

export function formatUptime(uptime = process.uptime()) {
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = uptime % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds.toFixed(2)}s`;
  }

  return `${minutes}m ${seconds.toFixed(2)}s`;
}
