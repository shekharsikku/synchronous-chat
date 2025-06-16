import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { isMobile } from "react-device-detect";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { SocketProvider, PeerProvider, ThemeProvider } from "@/context";
import App from "@/App.tsx";
import "@/main.css";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SocketProvider>
          <PeerProvider>
            <Toaster
              closeButton
              duration={2000}
              position={isMobile ? "top-center" : "bottom-right"}
            />
            <App />
          </PeerProvider>
        </SocketProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </ThemeProvider>
);
