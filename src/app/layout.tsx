import type { Metadata } from "next";
import { ReduxProvider } from '@/components/providers/redux-provider';
import { AuthSessionProvider } from '@/components/auth/session-provider';
import "./globals.css";

export const metadata: Metadata = {
  title: "SamX - Federal Contract Discovery Platform",
  description: "Modern interface for discovering government contracting opportunities from SAM.gov",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthSessionProvider>
          <ReduxProvider>
            {children}
          </ReduxProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
