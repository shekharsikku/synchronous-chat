import { create } from "zustand";

export interface UserInfo {
  _id?: string;
  email?: string;
  fullName?: string;
  username?: string;
  imageUrl?: string;
  profileColor?: string;
  profileSetup?: boolean;
  authToken?: object;
}

const useAuthStore = create<{
  userInfo: UserInfo | null;
  setUserInfo: (userInfo: UserInfo) => void;

  isAuthenticated: boolean;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
}>((set) => ({
  userInfo: null,
  setUserInfo: (userInfo: UserInfo) => set({ userInfo }),

  isAuthenticated: false,
  setIsAuthenticated: (isAuthenticated: boolean) => set({ isAuthenticated }),
}));

export default useAuthStore;
