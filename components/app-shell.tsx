"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Building2, Menu } from "lucide-react"
import { Sidebar, SidebarNav } from "@/components/sidebar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const isLogin = pathname === "/login"

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  if (isLogin) {
    return <>{children}</>
  }

  return (
    <>
      <Sidebar />
      <div className="flex flex-1 min-w-0 flex-col">
        <header className="md:hidden flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger
                render={
                  <Button variant="ghost" size="icon" aria-label="Menú">
                    <Menu className="h-5 w-5" />
                  </Button>
                }
              />
              <SheetContent side="left" className="w-64 p-0 flex flex-col">
                <SidebarNav onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>
            <Building2 className="h-5 w-5 text-zinc-800" />
            <span className="text-sm font-semibold text-zinc-900">IntegraSistemas</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-6 sm:py-6">{children}</div>
        </main>
      </div>
    </>
  )
}
