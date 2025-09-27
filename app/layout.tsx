import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Vibe Studio",
  description: "AI Image & Video Studio",
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><rect width='16' height='16' fill='%231f2937'/><circle cx='8' cy='8' r='6' fill='%233b82f6'/><circle cx='8' cy='8' r='3' fill='%23ffffff'/><circle cx='6' cy='6' r='1' fill='%231f2937'/><circle cx='10' cy='6' r='1' fill='%231f2937'/><path d='M6 10 Q8 12 10 10' stroke='%231f2937' stroke-width='1' fill='none'/></svg>" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
