"use client";

import { Toaster } from "react-hot-toast";

export default function ToasterProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 5000,
        style: {
          background: "#fff",
          color: "#1e293b",
          borderRadius: "1rem",
          padding: "1rem 1.25rem",
          fontSize: "0.875rem",
          fontWeight: "600",
          boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
          border: "1px solid #f1f5f9",
        },
        success: {
          iconTheme: {
            primary: "#9333ea", // Purple 600
            secondary: "#fff",
          },
        },
        error: {
          iconTheme: {
            primary: "#ef4444", // Red 500
            secondary: "#fff",
          },
        },
      }}
    />
  );
}
