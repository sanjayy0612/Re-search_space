// Shared root layout that loads global styles and document metadata for the app.
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ThinkMesh",
  description: "Unified vector-search workspace for videos, files, and multi-agent answers"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
