import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/react";
import { isMobile } from "react-device-detect";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "@/app.tsx";
import { Toaster } from "@/components/ui/sonner";
import { SocketProvider, PeerProvider, ThemeProvider } from "@/context";
import "@/main.css";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <NuqsAdapter>
          <SocketProvider>
            <PeerProvider>
              <Toaster closeButton duration={2000} position={isMobile ? "top-center" : "bottom-right"} />
              <App />
            </PeerProvider>
          </SocketProvider>
        </NuqsAdapter>
      </BrowserRouter>
    </QueryClientProvider>
  </ThemeProvider>
);
