import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { AuthActions } from "@/components/auth-actions";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = {
  title: "ScalpVision AI",
  description: "AI-powered scalp signal platform for stock and crypto chart screenshots."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
            <Sidebar />
            <main className="min-h-screen">
              <div className="grid-shell flex justify-end py-4">
                <AuthActions />
              </div>
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
