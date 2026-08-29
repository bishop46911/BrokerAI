import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Broker AI Control Room",
  description: "Responsible AI for clearer claims and safer intermediary review",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hans">
      <body>{children}</body>
    </html>
  );
}
