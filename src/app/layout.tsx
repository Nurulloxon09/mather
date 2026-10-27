import type { Metadata } from "next";
import { Noto_Sans, Noto_Serif } from "next/font/google";
import "katex/dist/katex.min.css";
import "./globals.css";

const ui = Noto_Sans({
  variable: "--font-ui",
  subsets: ["latin"],
});

const content = Noto_Serif({
  variable: "--font-content",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mather — SAT Math Practice",
  description: "Personal Digital SAT Math practice in a Bluebook-style interface",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${ui.variable} ${content.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
