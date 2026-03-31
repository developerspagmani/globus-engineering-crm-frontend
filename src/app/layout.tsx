import type { Metadata } from "next";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./globals.css";
import BootstrapClient from "@/components/BootstrapClient";

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
      <body>
        <ReduxProvider>
          <BootstrapClient />
          {children}
        </ReduxProvider>
      </body>
    </html>
  );
}
