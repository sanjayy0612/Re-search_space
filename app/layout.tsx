// Shared root layout that loads global styles and document metadata for the app.
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ThinkMesh",
  description: "ThinkMesh is a unified research workspace for videos, files, and grounded multi-source answers"
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
