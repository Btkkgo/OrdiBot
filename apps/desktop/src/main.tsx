import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CompanionApp } from "./companion/CompanionApp";
import "./companion/companion.css";
import { EdgeSurface } from "./companion/EdgeSurface";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {new URLSearchParams(location.search).get("surface") === "edge" ? (
      <EdgeSurface />
    ) : (
      <CompanionApp />
    )}
  </StrictMode>,
);
