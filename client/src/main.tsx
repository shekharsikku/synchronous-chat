import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { Toaster } from "@/components/ui/sonner";
import { SocketProvider } from "@/context";
import store from "@/redux/store.ts";
import App from "@/App.tsx";
import "@/main.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.Fragment>
    <SocketProvider>
      <Provider store={store}>
        <BrowserRouter>
          <Toaster closeButton duration={1500} />
          <App />
        </BrowserRouter>
      </Provider>
    </SocketProvider>
  </React.Fragment>,
);