import "./globals.css";
import type { Metadata } from "next";
import { Navbar } from "@/app/components/navbar";
import { ThemeProvider } from "@/app/components/theme-provider";

export const metadata: Metadata = {
  title: "Duale-SDC",
  description: "Calculate beams & frames",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Navbar />
          <main className="pt-16">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
