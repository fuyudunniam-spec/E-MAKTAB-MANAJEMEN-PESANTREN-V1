import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Global error handler untuk menangkap error dari ekstensi browser
window.addEventListener('error', (event) => {
  // Filter out extension-related errors
  if (event.error?.message?.includes('chrome-extension://') || 
      event.error?.message?.includes('Could not establish connection') ||
      event.error?.message?.includes('Receiving end does not exist')) {
    console.warn('Extension error caught and ignored:', event.error.message);
    event.preventDefault();
    return false;
  }
});

window.addEventListener('unhandledrejection', (event) => {
  // Filter out extension-related promise rejections
  if (event.reason?.message?.includes('chrome-extension://') || 
      event.reason?.message?.includes('Could not establish connection') ||
      event.reason?.message?.includes('Receiving end does not exist')) {
    console.warn('Extension promise rejection caught and ignored:', event.reason.message);
    event.preventDefault();
    return false;
  }
});

createRoot(document.getElementById("root")!).render(<App />);
