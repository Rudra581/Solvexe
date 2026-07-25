// This is the root layout component for your Next.js app.
// Learn more: https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts#root-layout-required

import { Chivo } from "next/font/google";
import { Rubik } from "next/font/google";
import "./globals.css";
import { Appbar } from "../components/Appbar";
import { Providers } from "../providers";

const chivo = Chivo({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-chivo",
});
const rubik = Rubik({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-rubik",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactNode {
  return (
    <html lang="en">
      <body className={chivo.variable + " " + rubik.variable + " h-screen flex flex-col overflow-hidden"}>
        <Providers>
          <Appbar />
          <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
