import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "YT RAG Dashboard",
  description: "Multi-video YouTube transcript RAG workspace"
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
