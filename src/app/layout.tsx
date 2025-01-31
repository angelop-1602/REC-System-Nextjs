import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ReviewerProvider } from "./context/ReviewerContext";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Recommendation System",
  description: "A platform for users, reviewers, and admins",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ReviewerProvider>
          <div className="min-h-screen">
            {children}
          </div>
        </ReviewerProvider>
      </body>
    </html>
  )
}
