import { Navigate, Route, Routes, useNavigate, useLocation } from "react-router-dom";
import { Auth, Chat, Profile } from "@/pages";
import { useAuthStore } from "@/zustand";
import { useGetUserInfo, useAuthRefresh } from "@/hooks";
import { useEffect } from "react";

const ProtectedRoute = ({ children }: Readonly<{
  children: React.ReactNode;
}>) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/auth" />;
}

const AuthRoute = ({ children }: Readonly<{
  children: React.ReactNode;
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
    if (!userInfo && !isAuthenticated) getUserInfo();
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

    initialRefresh();

    const intervalRefresh = setInterval(async () => {
      const success = await authRefresh();
      if (!success && import.meta.env.DEV) {
        console.warn("Auth refresh failed during interval!");
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
        getUserInfo();
        if (location.pathname === "/auth") {
          navigate("/chat");
        }
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