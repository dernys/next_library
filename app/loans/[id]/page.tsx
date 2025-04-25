"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Calendar, Check, Clock } from "lucide-react"
import Link from "next/link"

type Loan = {
  id: string
  loanDate: string
  dueDate: string
  returnDate: string | null
  status: string
  user: {
    id: string
    name: string
    email: string
  }
  material: {
    id: string
    title: string
    author: string
    isbn: string | null
  }
}

export default function LoanDetailPage() {
  const { t } = useLanguage()
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()

  const [loan, setLoan] = useState<Loan | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isReturning, setIsReturning] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchLoan(params.id as string)
    }
  }, [params.id])

  async function fetchLoan(id: string) {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/loans/${id}`)

      if (!response.ok) {
        throw new Error("Loan not found")
      }

      const data = await response.json()
      setLoan(data)
    } catch (error) {
      console.error("Error fetching loan:", error)
      toast({
        title: t("app.error"),
        description: t("app.loanNotFound"),
        variant: "destructive",
      })
      router.push("/loans")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReturnLoan = async () => {
    if (!loan) return

    try {
      setIsReturning(true)

      const response = await fetch(`/api/loans/${loan.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "returned",
          returnDate: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to return loan")
      }

      toast({
        title: t("app.success"),
        description: t("app.loanReturned"),
      })

      fetchLoan(loan.id)
    } catch (error) {
      console.error("Error returning loan:", error)
      toast({
        title: t("app.error"),
        description: error instanceof Error ? error.message : t("app.errorReturningLoan"),
        variant: "destructive",
      })
    } finally {
      setIsReturning(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "active":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
      case "returned":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
    }
  }

  return (
    <div className="container py-8">
      <Button variant="ghost" className="mb-6" asChild>
        <Link href="/loans">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("app.backToLoans")}
        </Link>
      </Button>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : loan ? (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>{t("app.loanDetails")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Calendar className="h-12 w-12" />
                  </div>
                  <div className="mt-4">
                    <span className={`rounded-full px-3 py-1 text-xs ${getStatusBadgeClass(loan.status)}`}>
                      {t(`app.${loan.status}`)}
                    </span>
                  </div>
                  <h2 className="mt-4 text-xl font-bold">{loan.material.title}</h2>
                  <p className="text-sm text-muted-foreground">{loan.material.author}</p>

                  {session?.user.role === "librarian" && loan.status === "active" && (
                    <Button className="mt-4 w-full" onClick={handleReturnLoan} disabled={isReturning}>
                      <Check className="mr-2 h-4 w-4" />
                      {isReturning ? t("app.returning") : t("app.returnLoan")}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("app.details")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {session?.user.role === "librarian" && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">{t("app.user")}</h3>
                    <p>{loan.user.name}</p>
                    <p className="text-sm text-muted-foreground">{loan.user.email}</p>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">{t("app.material")}</h3>
                  <p>{loan.material.title}</p>
                  <p className="text-sm text-muted-foreground">{loan.material.author}</p>
                  {loan.material.isbn && <p className="text-sm text-muted-foreground">ISBN: {loan.material.isbn}</p>}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">{t("app.loanDate")}</h3>
                    <p>{formatDate(loan.loanDate)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">{t("app.dueDate")}</h3>
                    <p>{formatDate(loan.dueDate)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">{t("app.returnDate")}</h3>
                    <p>{loan.returnDate ? formatDate(loan.returnDate) : "-"}</p>
                  </div>
                </div>

                {loan.status === "overdue" && (
                  <div className="rounded-md border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <Clock className="h-5 w-5 text-red-400" aria-hidden="true" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                          {t("app.overdueWarning")}
                        </h3>
                        <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                          <p>{t("app.overdueWarningDescription")}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold">{t("app.loanNotFound")}</h2>
          <p className="text-muted-foreground">{t("app.loanNotFoundDescription")}</p>
        </div>
      )}
    </div>
  )
}
