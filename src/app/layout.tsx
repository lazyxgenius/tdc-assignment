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
      <body className={roboto.className}>
        <DemoProvider>{children}</DemoProvider>
      </body>
    </html>
  );
}
