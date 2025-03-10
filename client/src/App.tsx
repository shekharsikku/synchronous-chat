import { Navigate, Route, Routes, useNavigate, useLocation } from "react-router-dom";
import { Auth, Chat, Profile } from "@/pages";
import { useAuthStore } from "@/zustand";
import { useGetUserInfo, useAuthRefresh } from "@/lib/hooks";
import { useEffect, ReactNode } from "react";

const ProtectedRoute = ({ children }: Readonly<{
  children: ReactNode;
}>) => {
  const { isAuthenticated, userInfo } = useAuthStore();
  return isAuthenticated && userInfo ? children : <Navigate to="/auth" />;
}

const AuthRoute = ({ children }: Readonly<{
  children: ReactNode;
}>) => {
  const { isAuthenticated, userInfo } = useAuthStore();
  return isAuthenticated && userInfo?.setup ? <Navigate to="/chat" /> : children;
}

const App = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { getUserInfo } = useGetUserInfo();
  const { authRefresh } = useAuthRefresh();
  const { userInfo, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!userInfo && !isAuthenticated && location.pathname !== "/auth") {
      void getUserInfo();
    }
  }, [userInfo, isAuthenticated]);

  useEffect(() => {
    const initialRefresh = async () => {
      const success = await authRefresh();
      if (success) {
        navigate("/chat");
      } else {
        navigate("/auth");
      }
    };

    void initialRefresh();

    const intervalRefresh = setInterval(async () => {
      const success = await authRefresh();
      if (!success && import.meta.env.DEV) {
        console.log("Auth refresh failed during interval!");
      }
    }, 50 * 60 * 1000);

    return () => {
      clearInterval(intervalRefresh);
    }
  }, []);

  useEffect(() => {
    const onlineRefresh = async () => {
      const success = await authRefresh();
      if (success) {
        navigate("/chat");
      } else {
        navigate("/auth");
      }
    };
    window.addEventListener("online", onlineRefresh);
    return () => {
      window.removeEventListener("online", onlineRefresh);
    }
  }, []);

  useEffect(() => {
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
      <Route path="*" element={<Navigate to="/auth" />} />
    </Routes>
  )
}

export default App;