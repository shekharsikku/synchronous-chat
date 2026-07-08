import { createContext, useContext } from "react";
import type { SocketState, PeerInterface, ThemeState } from "@/types";

export const SocketContext = createContext<SocketState | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }

  return context;
};

export const PeerContext = createContext<PeerInterface | undefined>(undefined);

export const usePeer = () => {
  const context = useContext(PeerContext);

  if (!context) {
    throw new Error("usePeer must be used within a PeerProvider");
  }

  return context;
};

export const ThemeContext = createContext<ThemeState | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
};
