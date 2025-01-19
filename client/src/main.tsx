import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { SocketProvider, PeerProvider } from "@/context";
import App from "@/App.tsx";
import "@/main.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.Fragment>
    <BrowserRouter>
      <SocketProvider>
        <PeerProvider>
          <Toaster closeButton duration={2000} theme="light" />
          <App />
        </PeerProvider>
      </SocketProvider>
    </BrowserRouter>
  </React.Fragment>
);