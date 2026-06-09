import api from "@/lib/api";

function waitForActiveServiceWorker(registration: ServiceWorkerRegistration): Promise<void> {
  return new Promise((resolve) => {
    if (registration.active) {
      resolve();
      return;
    }

    const worker = registration.installing ?? registration.waiting;

    if (worker) {
      worker.addEventListener("statechange", function handler() {
        if (worker.state === "activated") {
          worker.removeEventListener("statechange", handler);
          resolve();
        }
      });
    } else {
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing!;
        newWorker.addEventListener("statechange", function handler() {
          if (newWorker.state === "activated") {
            newWorker.removeEventListener("statechange", handler);
            resolve();
          }
        });
      });
    }
  });
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export const subscribeNotification = async () => {
  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

  if (!vapidPublicKey) {
    console.warn("[Push] Public key missing, skipping subscription.");
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    await waitForActiveServiceWorker(registration);

    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.warn("[Push] Permission denied by user.");
      return;
    }

    const existing = await registration.pushManager.getSubscription();

    if (existing) {
      console.info("[Push] Already subscribed, skipping.");
      return;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    await api.post("/api/push/subscribe", subscription.toJSON());
    console.info("[Push] Subscribed successfully.");
  } catch (error) {
    console.error("[Push] Subscribe failed:", error);
  }
};

export const unsubscribeNotification = async () => {
  try {
    if (!("serviceWorker" in navigator)) {
      console.warn("[Push] Service workers not supported.");
      return;
    }

    const registration = await navigator.serviceWorker.getRegistration("/sw.js");

    if (!registration) {
      console.warn("[Push] No service worker registration found.");
      return;
    }

    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      console.info("[Push] No active subscription to unsubscribe.");
      return;
    }

    await subscription.unsubscribe();
    console.info("[Push] Unsubscribed successfully.");
  } catch (error) {
    console.error("[Push] Unsubscribe failed:", error);
  }
};
