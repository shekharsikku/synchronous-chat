self.addEventListener("install", (_event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener("push", (event) => {
  const data = event.data?.json();
  if (!data) return;

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      data: data.data,
      icon: "/logo.png",
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/chat";
  const sid = event.notification.data?.sid;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clientList) => {
      const anyClient = clientList[0];

      if (anyClient && "focus" in anyClient) {
        await anyClient.focus();
        anyClient.postMessage({ type: "NAVIGATE", url, sid });
        return;
      }

      return clients.openWindow(url);
    })
  );
});
