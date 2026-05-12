import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/components/theme-provider";
import { AlertProvider } from "@/lib/alert-context";
import { CustomAlert } from "@/components/ui/custom-alert";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "360 Feedback Review System",
  description: "Comprehensive employee feedback and review management system",
};

import { Navbar } from "@/components/navbar";

import ReactQueryProvider from '@/lib/react-query-provider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ReactQueryProvider>
            <AlertProvider>
              <AuthProvider>
                <Navbar />
                {children}
                <CustomAlert />
              </AuthProvider>
            </AlertProvider>
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
