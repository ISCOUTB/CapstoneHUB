import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppShell from "./components/app-shell";
import AuthProvider from "./components/auth-provider";
import { PageHeaderProvider } from "./components/page-header-context";
import { cn } from "@/lib/utils";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CapstoneHUB",
  description:
    "Plataforma de gestión de proyectos Capstone de la Universidad Tecnológica de Bolívar",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans"
      )}
    >
      <body className="min-h-svh bg-muted/40">
        <AuthProvider>
          <PageHeaderProvider>
            <AppShell>{children}</AppShell>
          </PageHeaderProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
