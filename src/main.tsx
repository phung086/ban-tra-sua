import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "@fontsource/be-vietnam-pro/400.css";
import "@fontsource/be-vietnam-pro/600.css";
import "./styles-street.css";
import './styles-city.css';
import './styles-mobile-play.css';
import './styles-world-foundation.css';
import './styles-responsive-play.css';
import "./styles-serve-feedback.css";
import "./styles-chibi-reaction.css";
import "./styles-chibi-fallback.css";
import "./styles-tea-cup.css";
import { syncMotionPreference } from "./game/preferences";

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
