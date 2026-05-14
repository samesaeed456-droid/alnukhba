/// <reference types="vite/client" />
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from "virtual:pwa-register";

// Register service worker for PWA
registerSW({ immediate: true });

// Polyfill for canvas.getBoundingClientRect to prevent crash in some environments
if (typeof window !== "undefined" && typeof HTMLCanvasElement !== "undefined" && !HTMLCanvasElement.prototype.getBoundingClientRect) {
  (HTMLCanvasElement.prototype as any).getBoundingClientRect = function() {
    return {
      top: 0,
      left: 0,
      width: this.width || 0,
      height: this.height || 0,
      right: this.width || 0,
      bottom: this.height || 0,
      x: 0,
      y: 0,
      toJSON: () => ({})
    };
  };
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
