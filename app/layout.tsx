import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Simple RAG Chatbot",
  description: "Ask questions about your documentation.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
