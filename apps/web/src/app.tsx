import { useEffect } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import env from "@/lib/env";
import { Spinner } from "@/components/ui/spinner";
import { useListeners, useAuthUser, useEvents } from "@/hooks";
import { useTheme } from "@/lib/context";
import { Auth, Chat, Profile } from "@/pages";

const RouteLayout = ({ route }: { route: "auth" | "chat" }) => {
  const { isAuthenticated, userInfo, isAuthResolved } = useAuthUser();

  if (!isAuthResolved) {
    return (
      <div className="h-screen w-screen grid place-content-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (route === "chat") {
    if (!isAuthenticated || !userInfo) {
      return <Navigate to="/auth" replace />;
    }
  }

  if (route === "auth") {
    if (isAuthenticated && userInfo?.setup) {
      return <Navigate to="/chat" replace />;
    }
  }

  return <Outlet />;
};

const RedirectRoute = () => {
  const { isAuthenticated, userInfo } = useAuthUser();

  return <Navigate to={isAuthenticated && userInfo ? "/chat" : "/auth"} replace />;
};

const App = () => {
  const { theme, setTheme } = useTheme();

  useHotkeys("ctrl+alt+t", () => setTheme(theme === "light" ? "dark" : "light"), {
    enabled: theme !== "system",
    enableOnFormTags: ["input", "textarea", "select"],
  });

  useEffect(() => {
    /** Request notification permission. */
    if (Notification.permission === "default") {
      void Notification.requestPermission();
    }

    /** Disable right click for better context ux. */
    const disableRightClick = (event: MouseEvent) => {
      if (env.isProd) event.preventDefault();
    };

    document.addEventListener("contextmenu", disableRightClick);
    return () => document.removeEventListener("contextmenu", disableRightClick);
  }, []);

  /** Hook for handling socket.io events. */
  useListeners();

  /** Hook for handling server side events. */
  useEvents();

  return (
    <Routes>
      <Route element={<RouteLayout route="auth" />}>
        <Route path="/auth" element={<Auth />} />
      </Route>

      <Route element={<RouteLayout route="chat" />}>
        <Route path="/chat" element={<Chat />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<RedirectRoute />} />
    </Routes>
  );
};

export default App;
