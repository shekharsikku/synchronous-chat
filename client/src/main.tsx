import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { SocketProvider, PeerProvider } from "@/context";
import App from "@/App.tsx";
import "@/main.css";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <SocketProvider>
        <PeerProvider>
          <Toaster closeButton duration={2000} theme="light" />
          <App />
        </PeerProvider>
      </SocketProvider>
    </BrowserRouter>
  </QueryClientProvider>
);