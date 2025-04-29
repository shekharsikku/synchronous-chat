import { create } from "zustand";
import api from "@/lib/api";

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
  setUserInfo: (userInfo: UserInfo | null) => void;

  isAuthenticated: boolean;
  setIsAuthenticated: (isAuthenticated: boolean) => void;

  getUserInfo: () => Promise<UserInfo | null>;
}>((set) => ({
  userInfo: null,
  setUserInfo: (userInfo: UserInfo | null) => set({ userInfo }),

  isAuthenticated: false,
  setIsAuthenticated: (isAuthenticated: boolean) => set({ isAuthenticated }),

  getUserInfo: async () => {
    try {
      const response = await api.get("/api/user/user-information");
      const result = await response.data.data;
      set({
        userInfo: result,
        isAuthenticated: true,
      });
      return result;
    } catch (error: any) {
      set({
        userInfo: null,
        isAuthenticated: false,
      });
      return null;
    }
  },
}));

export default useAuthStore;
