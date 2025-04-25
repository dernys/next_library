"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Calendar, Check } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

type Loan = {
  id: string
  loanDate: string
  dueDate: string
  returnDate: string | null
  status: string
  user: {
    id: string
    name: string
    lastName: string | null
    email: string
  } | null
  guestName: string | null
  guestEmail: string | null
  guestPhone: string | null
  guestId: string | null
  guestAddress: string | null
  material: {
    id: string
    title: string
    author: string
    isbn: string | null
  }
  copy: {
    id: string
    registrationNumber: string
  } | null
}

export default function ApproveLoanPage() {
  const { t } = useLanguage()
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()

  const [loan, setLoan] = useState<Loan | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isApproving, setIsApproving] = useState(false)

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

      // Check if loan is already approved or not in requested state
      if (data.status !== "requested") {
        toast({
          title: t("app.error"),
          description: t("app.loanNotInRequestedState"),
          variant: "destructive",
        })
        router.push(`/loans/${id}`)
        return
      }

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

  const handleApproveLoan = async () => {
    if (!loan) return

    try {
      setIsApproving(true)

      const response = await fetch(`/api/loans/${loan.id}/approve`, {
        method: "POST",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to approve loan")
      }

      toast({
        title: t("app.success"),
        description: t("app.loanApproved"),
      })

      router.push(`/loans/${loan.id}`)
    } catch (error) {
      console.error("Error approving loan:", error)
      toast({
        title: t("app.error"),
        description: error instanceof Error ? error.message : t("app.errorApprovingLoan"),
        variant: "destructive",
      })
      setIsApproving(false)
    }
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "PPP")
  }

  const getBorrowerInfo = () => {
    if (loan?.user) {
      return (
        <>
          <p className="font-medium">{`${loan.user.name} ${loan.user.lastName || ""}`.trim()}</p>
          <p className="text-sm text-muted-foreground">{loan.user.email}</p>
        </>
      )
    } else if (loan?.guestName) {
      return (
        <>
          <p className="font-medium">
            {loan.guestName} <span className="text-muted-foreground">({t("app.guest")})</span>
          </p>
          <p className="text-sm text-muted-foreground">{loan.guestEmail}</p>
          {loan.guestPhone && (
            <p className="text-sm text-muted-foreground">
              {t("app.phone")}: {loan.guestPhone}
            </p>
          )}
          {loan.guestId && (
            <p className="text-sm text-muted-foreground">
              {t("app.identityCard")}: {loan.guestId}
            </p>
          )}
          {loan.guestAddress && (
            <p className="text-sm text-muted-foreground">
              {t("app.address")}: {loan.guestAddress}
            </p>
          )}
        </>
      )
    }
    return <p className="text-muted-foreground">{t("app.unknownBorrower")}</p>
  }

  return (
    <div className="container py-8">
      <Button variant="ghost" className="mb-6" asChild>
        <Link href={`/loans/${params.id}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("app.backToLoan")}
        </Link>
      </Button>

      <h1 className="mb-6 text-3xl font-bold">{t("app.approveLoan")}</h1>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : loan ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("app.confirmApproval")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Calendar className="h-12 w-12" />
                </div>
              </div>

              <div className="space-y-2 text-center">
                <h2 className="text-xl font-bold">{loan.material.title}</h2>
                <p className="text-muted-foreground">{loan.material.author}</p>
                {loan.copy && (
                  <p className="text-sm">
                    {t("app.copyNumber")}: <span className="font-medium">{loan.copy.registrationNumber}</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <h3 className="text-sm font-medium text-muted-foreground">{t("app.borrower")}</h3>
                  {getBorrowerInfo()}
                </div>
                <div className="rounded-lg border p-4">
                  <h3 className="text-sm font-medium text-muted-foreground">{t("app.loanDetails")}</h3>
                  <p>
                    <span className="font-medium">{t("app.loanDate")}:</span> {formatDate(loan.loanDate)}
                  </p>
                  <p>
                    <span className="font-medium">{t("app.dueDate")}:</span> {formatDate(loan.dueDate)}
                  </p>
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <Button onClick={handleApproveLoan} disabled={isApproving} className="w-full sm:w-auto">
                  <Check className="mr-2 h-4 w-4" />
                  {isApproving ? t("app.approving") : t("app.approveLoan")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
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
