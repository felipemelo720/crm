import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import { AppShell } from "@/components/app-shell"
import { Toaster } from "@/components/ui/sonner"

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CRM — IntegraSistemas",
  description: "CRM interno para IntegraSistemas.cl y FelipeMelo.cl",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geist.variable} h-full antialiased`}>
      <body className="flex h-full bg-zinc-50" suppressHydrationWarning>
        <AppShell>{children}</AppShell>
        <Toaster richColors />
      </body>
    </html>
  )
}
