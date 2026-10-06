import type { Metadata } from "next";
import { Roboto_Flex } from "next/font/google";
import { DemoProvider } from "@/context/DemoProvider";
import "./globals.css";

const roboto = Roboto_Flex({
  subsets: ["latin"],
  display: "swap",
  weight: "variable",
});

export const metadata: Metadata = {
  title: "Pre-Send Check",
  description: "Check candidate profiles against a client's preference card before sending.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Material Symbols is an icon font, not a next/font text family. The root layout is the document. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,400,0..1,0&display=swap"
        />
      </head>
      <body className={roboto.className}>
        <DemoProvider>{children}</DemoProvider>
      </body>
    </html>
  );
}
