import { useEffectEvent, useEffect, useState, type ReactNode } from "react";
import io, { Socket } from "socket.io-client";
import { toast } from "sonner";

import { SocketContext } from "@/lib/context";
import { useAuthStore } from "@/lib/zustand";

const serverUrl = import.meta.env.VITE_SERVER_URL;
const secretKey = import.meta.env.VITE_SECRET_KEY;

const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { userInfo } = useAuthStore();
  /** States for manage socket connection and online users */
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState({});

  const handleSocketClose = useEffectEvent(() => {
    socket?.close();
    setSocket(null);
  });

  useEffect(() => {
    if (userInfo?.setup) {
      const socket = io(serverUrl, {
        withCredentials: true,
        query: { userId: userInfo._id },
        auth: { secretKey: secretKey },
      });

      socket.on("connect", () => {
        setSocket(socket);
        setIsConnected(true);
        console.log("☑️ Connected to socket server!");
      });

      socket.on("disconnect", () => {
        setIsConnected(false);
        console.log("⚠️ Disconnected from socket server!");
      });

      socket.on("users:online", (onlineUsers) => {
        setOnlineUsers(onlineUsers);
      });

      socket.on("connect_error", (error) => {
        setIsConnected(false);
        console.error(`❌ Socket error: ${error.message}`);
        toast.error("Network unavailable or request aborted!");
      });

      return () => {
        socket?.off("connect");
        socket?.off("disconnect");
        socket?.off("users:online");
        socket?.off("connect_error");
        socket?.close();
      };
    } else {
      handleSocketClose();
    }
  }, [userInfo?._id, userInfo?.setup]);

  return <SocketContext.Provider value={{ socket, isConnected, onlineUsers }}>{children}</SocketContext.Provider>;
};

export default SocketProvider;
