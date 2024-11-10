import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { Toaster } from "@/components/ui/sonner";
import { SocketProvider } from "@/context/socket-context.tsx";
import store from "@/redux/store.ts";
import App from "@/App.tsx";
import "@/main.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.Fragment>
    <SocketProvider>
      <Provider store={store}>
        <BrowserRouter future={{
          v7_relativeSplatPath: true,
          v7_startTransition: true
        }}>
          <Toaster closeButton />
          <App />
        </BrowserRouter>
      </Provider>
    </SocketProvider>
  </React.Fragment>,
);