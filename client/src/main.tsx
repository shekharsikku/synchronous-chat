import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { Toaster } from "@/components/ui/sonner";
import { SocketProvider, PeerProvider } from "@/context";
import store from "@/redux/store.ts";
import App from "@/App.tsx";
import "@/main.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.Fragment>
    <BrowserRouter>
      <SocketProvider>
        <PeerProvider>
          <Provider store={store}>
            <Toaster closeButton duration={2000} />
            <App />
          </Provider>
        </PeerProvider>
      </SocketProvider>
    </BrowserRouter>
  </React.Fragment>,
);