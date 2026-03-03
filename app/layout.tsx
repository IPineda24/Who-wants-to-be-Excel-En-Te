import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "¿Quién quiere ser Millonario? – Excel Edition",
  description: "Quiz de vocabulario de Excel",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
