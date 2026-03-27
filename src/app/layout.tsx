import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./globals.css";
import BootstrapClient from "@/components/BootstrapClient";

const roboto = Roboto({ 
  subsets: ["latin"],
  weight: ['300', '400', '500', '700'],
  display: 'swap'
});

export const metadata: Metadata = {
  title: "Globus Engineering CRM",
  description: "Next-gen Engineering CRM",
};

import { ReduxProvider } from "@/redux/provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={roboto.className}>
        <ReduxProvider>
          <BootstrapClient />
          {children}
        </ReduxProvider>
      </body>
    </html>
  );
}
