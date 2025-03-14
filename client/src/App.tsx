import { Navigate, Route, Routes } from "react-router-dom";
import { Auth, Chat, Profile } from "@/pages";
import { useAuthStore } from "@/zustand";
import { useGetUserInfo } from "@/lib/hooks";
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
  const { getUserInfo } = useGetUserInfo();
  const { userInfo, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!userInfo && !isAuthenticated) {
      void getUserInfo();
    }
  }, [userInfo, isAuthenticated]);

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