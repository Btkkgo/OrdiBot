import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CompanionApp } from "./companion/CompanionApp";
import "./companion/companion.css";
createRoot(document.getElementById("root")!).render(<StrictMode><CompanionApp /></StrictMode>);
