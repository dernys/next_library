"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { useLanguage } from "@/components/language-provider"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Book, Database, LogIn, LogOut, Menu, Moon, Search, Settings, Sun, User, Users } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function MainNav() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const { language, setLanguage, t } = useLanguage()
  const { theme, setTheme } = useTheme()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/materials?query=${encodeURIComponent(searchQuery)}`)
    }
  }

  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Book className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">{t("app.mainTitle")}</span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-2 md:justify-between">
          <form onSubmit={handleSearch} className="hidden items-center md:flex md:flex-1 md:max-w-sm lg:max-w-lg">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t("app.searchPlaceholder")}
                className="w-full pl-8 hover:border-primary focus:border-primary transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>

          <nav className="hidden gap-2 md:flex">
            {session ? (
              <>
                {session.user.role === "librarian" && (
                  <>
                    <Button
                      asChild
                      variant={isActive("/dashboard") ? "default" : "ghost"}
                      className="hover:bg-primary/10 transition-colors"
                    >
                      <Link href="/dashboard">{t("app.dashboard")}</Link>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="hover:bg-primary/10 transition-colors">
                          <Settings className="mr-2 h-4 w-4" />
                          {t("app.manage")}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href="/materials/manage">{t("app.manageMaterials")}</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/subjects/manage">{t("app.manageSubjects")}</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/collections/manage">{t("app.manageCollections")}</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/material-types/manage">{t("app.manageMaterialTypes")}</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/users/manage">{t("app.manageUsers")}</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/dashboard">
                            <Database className="mr-2 h-4 w-4" />
                            {t("app.backups")}
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}

                <Button
                  asChild
                  variant={pathname.startsWith("/materials") ? "default" : "ghost"}
                  className="hover:bg-primary/10 transition-colors"
                >
                  <Link href="/materials">{t("app.materials")}</Link>
                </Button>
                <Button
                  asChild
                  variant={pathname.startsWith("/loans") ? "default" : "ghost"}
                  className="hover:bg-primary/10 transition-colors"
                >
                  <Link href="/loans">{t("app.loans")}</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" className="hover:bg-primary/10 transition-colors">
                  <Link href="/login">{t("app.login")}</Link>
                </Button>
                <Button asChild className="hover:bg-primary/90 transition-colors">
                  <Link href="/register">{t("app.register")}</Link>
                </Button>
              </>
            )}
          </nav>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 transition-colors">
                  {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  <Sun className="mr-2 h-4 w-4" />
                  <span>Light</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  <Moon className="mr-2 h-4 w-4" />
                  <span>Dark</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  <span>System</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 transition-colors">
                  {language === "es" ? "ES" : "EN"}
                  <span className="sr-only">Toggle language</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLanguage("es")}>
                  <span>Español</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage("en")}>
                  <span>English</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {session && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 transition-colors">
                    <User className="h-4 w-4" />
                    <span className="sr-only">User menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/profile">{t("app.profile")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t("app.logout")}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden hover:bg-primary/10 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="container pb-3 md:hidden">
          <form onSubmit={handleSearch} className="flex items-center space-x-2 pb-3 pt-2">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t("app.searchPlaceholder")}
                className="w-full pl-8 hover:border-primary focus:border-primary transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button type="submit" size="sm" className="hover:bg-primary/90 transition-colors">
              {t("app.search")}
            </Button>
          </form>

          <nav className="flex flex-col space-y-2">
            {session ? (
              <>
                {session.user.role === "librarian" && (
                  <>
                    <Button asChild variant={isActive("/dashboard") ? "default" : "ghost"} className="justify-start">
                      <Link href="/dashboard">{t("app.dashboard")}</Link>
                    </Button>
                    <Button asChild variant="ghost" className="justify-start">
                      <Link href="/materials/manage">{t("app.manageMaterials")}</Link>
                    </Button>
                    <Button asChild variant="ghost" className="justify-start">
                      <Link href="/subjects/manage">{t("app.manageSubjects")}</Link>
                    </Button>
                    <Button asChild variant="ghost" className="justify-start">
                      <Link href="/collections/manage">{t("app.manageCollections")}</Link>
                    </Button>
                    <Button asChild variant="ghost" className="justify-start">
                      <Link href="/material-types/manage">{t("app.manageMaterialTypes")}</Link>
                    </Button>
                    <Button asChild variant="ghost" className="justify-start">
                      <Link href="/users/manage">{t("app.manageUsers")}</Link>
                    </Button>
                  </>
                )}
                <Button asChild variant={isActive("/profile") ? "default" : "ghost"} className="justify-start">
                  <Link href="/profile">{t("app.profile")}</Link>
                </Button>
                <Button
                  asChild
                  variant={pathname.startsWith("/materials") ? "default" : "ghost"}
                  className="justify-start"
                >
                  <Link href="/materials">{t("app.materials")}</Link>
                </Button>
                <Button asChild variant={pathname.startsWith("/loans") ? "default" : "ghost"} className="justify-start">
                  <Link href="/loans">{t("app.loans")}</Link>
                </Button>
                <Button variant="ghost" className="justify-start" onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t("app.logout")}</span>
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" className="justify-start">
                  <Link href="/login">
                    <LogIn className="mr-2 h-4 w-4" />
                    {t("app.login")}
                  </Link>
                </Button>
                <Button asChild className="justify-start">
                  <Link href="/register">
                    <Users className="mr-2 h-4 w-4" />
                    {t("app.register")}
                  </Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
