import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { AuthActions } from "@/components/auth-actions";
import { AuthProvider } from "@/lib/auth";
import { Inter, Outfit } from "next/font/google";
import { NeuralBackground } from "@/components/neural-background";
import { AIAdvisorDrawer } from "@/components/ai-advisor-drawer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ScalpVision AI | Premium Trading Intelligence",
  description: "AI-powered scalp signal platform for professional traders."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="font-sans">
        <NeuralBackground />
        <AuthProvider>
          <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
            <Sidebar />
            <main className="min-h-screen relative z-0">
              <div className="grid-shell flex justify-end py-4">
                <AuthActions />
              </div>
              {children}
              <AIAdvisorDrawer />
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
