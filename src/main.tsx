import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { syncMotionPreference } from "./game/preferences";
import "./styles.css";
import "./styles-v2.css";
import "./styles-v3.css";
import "./styles-v4-sol.css";
import "./styles-v5-layout.css";
import "./styles-v5-art-direction.css";
import "./styles-v6-theater.css";
import "./styles-v6-world.css";
import "./styles-v7-system.css";
import "./styles-v8-pastel.css";

syncMotionPreference();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // PWA enhancement only; game remains fully playable without it.
    });
  });
}
