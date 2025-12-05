import type { Metadata } from "next";
import "./globals.css";
import "./horror.css";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import HorrorProvider from "@/components/horror/HorrorProvider";
import { RandomGhostPopup, EdgePeekingGhost } from "@/components/horror/Jumpscare";

export const metadata: Metadata = {
  title: "ResurrectionStockPicker - Haunted Edition",
  description: "A terrifying research workflow system for brave investors",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="horror-mode">
        <HorrorProvider>
          <DisclaimerBanner />
          {children}
          {/* Random horror elements */}
          <RandomGhostPopup />
          <EdgePeekingGhost />
        </HorrorProvider>
      </body>
    </html>
  );
}
