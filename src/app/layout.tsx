import type { Metadata, Viewport } from "next";
import { Special_Elite, Courier_Prime, Oswald } from "next/font/google";
import "./globals.css";

// Typewriter face for the dossier body — the "typed report" look.
const specialElite = Special_Elite({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-typewriter",
  display: "swap",
});

// Cleaner monospace for longer readable body text.
const courierPrime = Courier_Prime({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-mono-body",
  display: "swap",
});

// Condensed grotesque for stamps and ALL-CAPS labels.
const oswald = Oswald({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-stamp",
  display: "swap",
});

const TITLE = "DOSSIER — find out what AI thinks of you";
const DESCRIPTION =
  "Every AI you talk to has quietly built a theory of who you are. Dossier interrogates them all and compiles one confidential case file on you.";

// Open Graph image URLs must be absolute. Without metadataBase, Next resolves
// them relatively and link previews break once deployed — bad for a product
// that grows by people sharing dossiers. Override with NEXT_PUBLIC_SITE_URL
// when a custom domain lands.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: "Dossier",
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    siteName: "Dossier",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#1A1712",
  width: "device-width",
  initialScale: 1,
  // Lets the paper texture reach the notch/edges on mobile.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        // Browser extensions (Grammarly, etc.) inject attributes onto <body>
        // before hydration; this tolerates that mismatch on this element only.
        suppressHydrationWarning
        className={`${specialElite.variable} ${courierPrime.variable} ${oswald.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
