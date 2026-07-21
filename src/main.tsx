import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { initTheme } from "./application/theme";
import "./styles/tokens.css";
import "./styles/app.css";

// Apply the persisted theme before first paint (avoids a flash of the default).
initTheme();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
