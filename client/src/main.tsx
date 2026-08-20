import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { isMobile } from "react-device-detect";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { SocketProvider, PeerProvider, ThemeProvider, ErrorBoundary } from "@/contexts";
import { Toaster } from "@/components/ui/sonner";
import App from "@/app.tsx";
import "@/main.css";

const queryClient = new QueryClient();

const rootElement = document.documentElement;

if (!rootElement.classList.contains("dark") && !rootElement.classList.contains("light")) {
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  rootElement.classList.add(systemTheme);
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <SocketProvider>
            <PeerProvider>
              <Toaster closeButton duration={2000} position={isMobile ? "top-center" : "bottom-right"} />
              <App />
            </PeerProvider>
          </SocketProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);
