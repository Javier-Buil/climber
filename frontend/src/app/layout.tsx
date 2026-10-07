import type { Metadata } from "next";
import { Chakra_Petch, JetBrains_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const display = Chakra_Petch({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const data = JetBrains_Mono({
  variable: "--font-data",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Climber // Recon",
  description: "Map climbing walls, study every hold and plan the flash.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${data.variable} h-full antialiased`}>
      <body className="h-full overflow-hidden">
        <TooltipProvider>
          <div className="app-root h-full">{children}</div>
        </TooltipProvider>
        <div className="scanlines" aria-hidden />
      </body>
    </html>
  );
}
