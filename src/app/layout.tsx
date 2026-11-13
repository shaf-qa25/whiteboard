import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CollabBoard — Real-Time Collaborative Whiteboard",
  description:
    "An editorial, high-performance collaborative digital whiteboard. Featuring real-time vector canvas, live cursors, password protection, and Stream Video calling.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#fffefb] text-[#171717]">
        {children}
      </body>
    </html>
  );
}
