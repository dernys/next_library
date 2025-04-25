"use client"

import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Book } from "lucide-react"

export function HeroSection() {
  const { t } = useLanguage()

  return (
    <div className="relative overflow-hidden rounded-lg bg-muted py-16 sm:py-24">
      <div className="relative">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("app.welcome")}</h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">{t("app.welcomeMessage")}</p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button asChild>
              <Link href="/materials">
                <Book className="mr-2 h-4 w-4" />
                {t("app.materials")}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/register">{t("app.register")}</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
