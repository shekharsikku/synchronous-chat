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
    /** refresh token on app load */
    const initialRefresh = async () => await authRefresh();
    initialRefresh();

    /** regular refresh every 50 minutes */
    const intervalRefresh = setInterval(async () => {
      await authRefresh();
    }, 50 * 60 * 1000);

    /** cleanup function for next app mount/unmount */
    return () => clearInterval(intervalRefresh);
  }, []);

  useEffect(() => {
    /** refresh token when the user comes online */
    const onlineRefresh = async () => await authRefresh();
    window.addEventListener("online", onlineRefresh);

    /** cleanup function for next app mount/unmount */
    return () => window.removeEventListener("online", onlineRefresh);
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