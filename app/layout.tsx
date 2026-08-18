import type { Metadata } from "next";
import type { ReactNode } from "react";

import { bricolageGrotesque, instrumentSans, geistMono, instrumentSerif } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hybride",
  description: "L'app Hybride et ses points club.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="fr"
      className={`${bricolageGrotesque.variable} ${instrumentSans.variable} ${geistMono.variable} ${instrumentSerif.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
