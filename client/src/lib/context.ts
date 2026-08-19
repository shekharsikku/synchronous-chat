import { createContext, useContext } from "react";
import type { SocketState, PeerInterface, ThemeState } from "@/types";

export const SocketContext = createContext<SocketState | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error("SocketProvider not available. Wrap your component with SocketProvider.");
  }

  return context;
};

export const PeerContext = createContext<PeerInterface | undefined>(undefined);

export const usePeer = () => {
  const context = useContext(PeerContext);

  if (!context) {
    throw new Error("PeerProvider not available. Wrap your component with PeerProvider.");
  }

  return context;
};

export const ThemeContext = createContext<ThemeState | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("ThemeProvider not available. Wrap your component with ThemeProvider.");
  }

  return context;
};
