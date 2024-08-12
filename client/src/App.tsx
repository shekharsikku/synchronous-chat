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
  const { authenticationRefresh } = useAuthRefresh();
  const { userInfo, setUserInfo, isAuthenticated, setIsAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!userInfo || !isAuthenticated) getUserInfo();
  }, [userInfo, setUserInfo, isAuthenticated, setIsAuthenticated]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      console.clear();
    }, 60000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    authenticationRefresh();
  }, [])

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