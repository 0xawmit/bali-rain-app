import type { Metadata } from "next";
import "./globals.css";
import BottomNav from "../components/BottomNav";
import { ToastProvider } from "../components/ToastContainer";

export const metadata: Metadata = {
  title: "Bali Rain - Rewards App",
  description: "Earn points for engaging with Bali Rain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white">
        <ToastProvider>
          <div className="max-w-md mx-auto min-h-screen bg-white">
            <main className="pb-24 px-4">{children}</main>
            <BottomNav />
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}

