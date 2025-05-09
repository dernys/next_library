"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"
import { useFetchCollections } from "@/hooks/use-fetch-collections"

export function SearchMaterials() {
  const { t } = useLanguage()
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [collection, setCollection] = useState("")
  const { collections, isLoading } = useFetchCollections()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()

    const params = new URLSearchParams()
    if (query) params.append("query", query)
    if (collection) params.append("collection", collection)

    router.push(`/materials?${params.toString()}`)
  }

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm hover:shadow-md transition-all duration-300">
      <h2 className="mb-4 text-xl font-semibold">{t("app.search")}</h2>
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex-1">
            <Input
              placeholder={t("app.searchPlaceholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full hover:border-primary focus:border-primary transition-colors"
            />
          </div>
          <div className="w-full md:w-64">
            <Select value={collection} onValueChange={setCollection}>
              <SelectTrigger className="hover:border-primary transition-colors">
                <SelectValue placeholder={t("app.collection")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("app.all")}</SelectItem>
                {!isLoading &&
                  collections.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full md:w-auto hover:bg-primary/90 transition-colors">
            <Search className="mr-2 h-4 w-4" />
            {t("app.search")}
          </Button>
        </div>
      </form>
    </div>
  )
}
