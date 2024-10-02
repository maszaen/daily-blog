import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const SFUIDisplay = localFont({
  src: "./fonts/SFUIDisplay.otf",
  variable: "--sfui",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Exqeon",
  description: "Let's dive into the exqeon blog and find educational information.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${SFUIDisplay.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
