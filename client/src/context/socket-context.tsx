import { useEffect, useMemo, useReducer, type ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

import { SocketContext, type SocketState } from "@/lib/context";
import env from "@/lib/env";
import { useAuthStore } from "@/lib/zustand";

type SocketAction =
  | { type: "CONNECT"; socket: Socket }
  | { type: "DISCONNECT" }
  | { type: "SET_ONLINE_USERS"; users: Record<string, any> }
  | { type: "RESET" };

const initialState: SocketState = {
  socket: null,
  isConnected: false,
  onlineUsers: {},
};

function socketReducer(state: SocketState, action: SocketAction): SocketState {
  switch (action.type) {
    case "CONNECT":
      return { socket: action.socket, isConnected: true, onlineUsers: {} };

    case "DISCONNECT":
      return { ...state, isConnected: false };

    case "SET_ONLINE_USERS":
      return { ...state, onlineUsers: action.users };

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { userInfo } = useAuthStore();
  const [state, dispatch] = useReducer(socketReducer, initialState);

  useEffect(() => {
    if (!userInfo?.setup) {
      dispatch({ type: "RESET" });
      return;
    }

    const socket = io(env.serverUrl, {
      withCredentials: true,
      query: { userId: userInfo._id },
      auth: { publicKey: env.publicKey },
    });

    socket.on("connect", () => {
      dispatch({ type: "CONNECT", socket: socket });
      console.log("☑️ Connected to socket server!");
    });

    socket.on("disconnect", () => {
      dispatch({ type: "DISCONNECT" });
      console.log("⚠️ Disconnected from socket server!");
    });

    socket.on("users:online", (users) => {
      dispatch({ type: "SET_ONLINE_USERS", users: users });
    });

    socket.on("connect_error", (error) => {
      dispatch({ type: "DISCONNECT" });
      console.error(`❌ Socket error: ${error.message}`);
      toast.error("Network unavailable or request aborted!");
    });

    return () => {
      socket.removeAllListeners();
      socket.close();
    };
  }, [userInfo?._id, userInfo?.setup]);

  const contextValue = useMemo(() => {
    return {
      socket: state.socket,
      isConnected: state.isConnected,
      onlineUsers: state.onlineUsers,
    };
  }, [state.socket, state.isConnected, state.onlineUsers]);

  return <SocketContext.Provider value={contextValue}>{children}</SocketContext.Provider>;
};

export default SocketProvider;
