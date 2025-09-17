import { useEffect, useState, ReactNode } from "react";
import { useAuthStore } from "@/zustand";
import { SocketContext } from "@/lib/context";
import io, { Socket } from "socket.io-client";
import { toast } from "sonner";

const serverUrl = import.meta.env.VITE_SERVER_URL;
const secretKey = import.meta.env.VITE_SECRET_KEY;

const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { userInfo } = useAuthStore();
  /** States for manage socket connection and online users */
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState({});

  useEffect(() => {
    if (userInfo?.setup) {
      const socket = io(serverUrl, {
        withCredentials: true,
        query: { userId: userInfo._id },
        auth: { secretKey: secretKey },
      });

      setSocket(socket);

      socket.on("connect", () => {
        console.log("☑️ Connected to socket server!");
        setIsConnected(true);
      });

      socket.on("disconnect", () => {
        console.log("⚠️ Disconnected from socket server!");
        setIsConnected(false);
      });

      socket.on("users:online", (onlineUsers) => {
        setOnlineUsers(onlineUsers);
      });

      socket.on("connect_error", (error) => {
        toast.error(error.message);
      });

      return () => {
        socket?.off("connect");
        socket?.off("disconnect");
        socket?.off("users:online");
        socket?.off("connect_error");
        socket?.close();
      };
    } else {
      socket?.close();
      setSocket(null);
    }
  }, [userInfo?._id]);

  return <SocketContext.Provider value={{ socket, isConnected, onlineUsers }}>{children}</SocketContext.Provider>;
};

export default SocketProvider;
