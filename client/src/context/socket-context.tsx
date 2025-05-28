import { useEffect, useState, ReactNode } from "react";
import { useAuthStore } from "@/zustand";
import { SocketContext } from "@/lib/context";
import io, { Socket } from "socket.io-client";

const serverUrl = import.meta.env.VITE_SERVER_URL;

const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { userInfo } = useAuthStore();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState({});

  useEffect(() => {
    if (userInfo?.setup) {
      const socket = io(serverUrl, {
        withCredentials: true,
        query: { userId: userInfo._id },
      });

      setSocket(socket);

      socket.on("connect", () => {});

      socket.on("users:online", (onlineUsers) => {
        setOnlineUsers(onlineUsers);
      });

      return () => {
        socket?.close();
      };
    } else {
      socket?.close();
      setSocket(null);
    }
  }, [userInfo?._id]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;
