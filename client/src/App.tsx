import { Navigate, Route, Routes } from "react-router-dom";
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
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <Navigate to="/chat" /> : children;
}

const App = () => {
  const { getUserInfo } = useGetUserInfo();
  const { authRefresh } = useAuthRefresh();
  const { userInfo, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!userInfo || !isAuthenticated) getUserInfo();
  }, [userInfo, isAuthenticated]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (isAuthenticated) { authRefresh(); }
    }, 18 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      console.clear();
    }, 60 * 60 * 1000);

    return () => clearInterval(intervalId);
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