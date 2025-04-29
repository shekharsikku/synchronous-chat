import { useNotification } from "@/hooks/use-notification";
import { Navigate, Route, Routes } from "react-router-dom";
import { Auth, Chat, Profile } from "@/pages";
import { useEffect, ReactNode } from "react";
import { useAuthUser } from "@/lib/auth";

const RedirectRoute = () => {
  const { isAuthenticated, userInfo } = useAuthUser();
  return isAuthenticated && userInfo ? <Navigate to="/chat" /> : <Navigate to="/auth" />;
};

const ProtectedRoute = ({ children }: Readonly<{
  children: ReactNode;
}>) => {
  const { isAuthenticated, userInfo } = useAuthUser();
  return isAuthenticated && userInfo ? children : <Navigate to="/auth" />;
}

const AuthRoute = ({ children }: Readonly<{
  children: ReactNode;
}>) => {
  const { isAuthenticated, userInfo } = useAuthUser();
  return isAuthenticated && userInfo?.setup ? <Navigate to="/chat" /> : children;
}

const App = () => {
  useNotification();

  useEffect(() => {
    if (Notification.permission === "default") {
      void Notification.requestPermission();
    }

    const disableRightClick = (event: MouseEvent) => {
      if (import.meta.env.PROD) {
        event.preventDefault();
      }
    }
    document.addEventListener("contextmenu", disableRightClick);
    return () => {
      document.removeEventListener("contextmenu", disableRightClick);
    }
  }, []);

  return (
    <Routes>
      <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />
      <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="*" element={<RedirectRoute />} />
    </Routes>
  )
}

export default App;