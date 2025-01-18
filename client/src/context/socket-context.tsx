import { useEffect, useState } from "react";
import { useAuthStore } from "@/zustand";
import { SocketContext } from "@/hooks/context";
import io, { Socket } from "socket.io-client";

const serverApiUrl = import.meta.env.DEV ? "http://localhost:4000" : "/";

const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { userInfo } = useAuthStore();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState({});

  useEffect(() => {
    if (userInfo?.setup) {
      const socket = io(serverApiUrl, {
        withCredentials: true,
        query: { userId: userInfo._id }
      });

      setSocket(socket);

      socket.on("connect", () => { });

      socket.on("users:online", (onlineUsers) => {
        setOnlineUsers(onlineUsers);
      });

      return () => {
        socket?.close();
      }
    } else {
      socket?.close();
      setSocket(null);
    }
  }, [userInfo]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  )
}

export default SocketProvider;