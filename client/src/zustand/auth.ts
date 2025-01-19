import { create } from "zustand";

export interface UserInfo {
  _id?: string;
  name?: string;
  email?: string;
  username?: string;
  gender?: string;
  image?: string;
  bio?: string;
  setup?: boolean;
  createdAt?: any;
  updatedAt?: any;
  __v?: number;
  interaction?: any;
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
