import type { Metadata } from "next"
import { Press_Start_2P, JetBrains_Mono, Courier_Prime } from "next/font/google"
import Nav from "@/components/Nav"
import "./globals.css"

const pressStart2P = Press_Start_2P({
  weight: "400",
  variable: "--font-pixel-loaded",
  subsets: ["latin"],
  display: "swap",
})

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono-loaded",
  subsets: ["latin"],
  display: "swap",
})

const courierPrime = Courier_Prime({
  weight: ["400", "700"],
  variable: "--font-courier",
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "Arcade Vault · Portal Retro",
  description: "Juega y compite por las puntuaciones más altas",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      className={`${pressStart2P.variable} ${jetBrainsMono.variable} ${courierPrime.variable} h-full`}
    >
      <body className="antialiased">
        <div className="av-bg" />
        <div className="av-noise" />
        <div id="root">
          <Nav />
          <main className="av-main">{children}</main>
          <footer
            className="border-t px-8 py-5 text-center text-[11px] tracking-[0.16em]"
            style={{
              borderColor: "var(--line)",
              color: "var(--ink-faint)",
              fontFamily: "var(--mono)",
            }}
          >
            © 2026 ARCADE VAULT · HECHO CON PIXELES Y NEÓN · v2.6.0
          </footer>
        </div>
      </body>
    </html>
  )
}
