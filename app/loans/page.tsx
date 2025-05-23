"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { BookPlus, Calendar, Check, Eye, Filter, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { DatePicker } from "@/components/ui/date-picker"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { PrintLoans } from "@/components/print-loans"
import type { Loan } from "@/types/loan"
import { format } from "date-fns"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

// Types
type PaginationData = {
  total: number
  pages: number
  page: number
  limit: number
}

type FilterState = {
  status: string
  startDate: Date | undefined
  endDate: Date | undefined
  query: string
}

export default function LoansPage() {
  const { t } = useLanguage()
  const { data: session } = useSession()
  const router = useRouter()

  const [loans, setLoans] = useState<Loan[]>([])
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    pages: 0,
    page: 1,
    limit: 10,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<FilterState>({
    status: "",
    startDate: undefined,
    endDate: undefined,
    query: "",
  })
  const [page, setPage] = useState(1)
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  useEffect(() => {
    fetchLoans()
  }, [filters, page])

  async function fetchLoans() {
    try {
      setIsLoading(true)

      const params = new URLSearchParams()
      if (filters.status && filters.status !== "all") params.append("status", filters.status)
      if (filters.startDate) params.append("startDate", filters.startDate.toISOString())
      if (filters.endDate) params.append("endDate", filters.endDate.toISOString())
      if (filters.query) params.append("query", filters.query)
      params.append("page", page.toString())
      params.append("limit", "10")

      const response = await fetch(`/api/loans?${params.toString()}`)
      const data = await response.json()

      setLoans(data.loans)
      setPagination(data.pagination)
    } catch (error) {
      console.error("Error fetching loans:", error)
      toast({
        title: t("app.error"),
        description: t("app.errorFetchingLoans"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy")
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "requested":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
      case "active":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
      case "returned":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
      case "rejected":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
    }
  }

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1) // Reset to first page when filters change
  }

  const clearFilters = () => {
    setFilters({
      status: "",
      startDate: undefined,
      endDate: undefined,
      query: "",
    })
    setPage(1)
  }

  const getBorrowerName = (loan: Loan) => {
    if (loan.user) {
      return `${loan.user.name} ${loan.user.lastName || ""}`.trim()
    } else if (loan.guestName) {
      return `${loan.guestName} (${t("app.guest")})`
    }
    return t("app.unknownBorrower")
  }

  const filteredLoans = loans.filter((loan) => {
    // Create comparable dates (ignoring time portion)
    const loanDate = new Date(loan.loanDate)
    loanDate.setHours(0, 0, 0, 0)

    // Filter by status
    if (filters.status && loan.status !== filters.status) return false

    // Filter by search query
    if (
      filters.query &&
      !loan.material.title.toLowerCase().includes(filters.query.toLowerCase()) &&
      !getBorrowerName(loan).toLowerCase().includes(filters.query.toLowerCase())
    ) {
      return false
    }

    // Filter by date range (timezone-safe comparison)
    if (filters.startDate) {
      const startDate = new Date(filters.startDate)
      startDate.setHours(0, 0, 0, 0)
      if (loanDate < startDate) return false
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate)
      endDate.setHours(23, 59, 59, 999)
      if (loanDate > endDate) return false
    }

    return true
  })

  const handleReturnLoan = async (loanId: string) => {
    try {
      const response = await fetch(`/api/loans/${loanId}/return`, {
        method: "PATCH",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to return loan")
      }

      toast({
        title: t("app.success"),
        description: t("app.loanReturned"),
      })

      fetchLoans()
    } catch (error) {
      console.error("Error returning loan:", error)
      toast({
        title: t("app.error"),
        description: error instanceof Error ? error.message : t("app.errorReturningLoan"),
        variant: "destructive",
      })
    }
  }

  const handleRejectLoan = async (loanId: string) => {
    try {
      const response = await fetch(`/api/loans/${loanId}/reject`, {
        method: "PATCH",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to reject loan")
      }

      toast({
        title: t("app.success"),
        description: t("app.loanRejected"),
      })

      fetchLoans()
    } catch (error) {
      console.error("Error rejecting loan:", error)
      toast({
        title: t("app.error"),
        description: error instanceof Error ? error.message : t("app.errorRejectingLoan"),
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">{t("app.loans")}</h1>
        {session?.user.role === "librarian" && (
          <Button asChild>
            <Link href="/loans/manage">
              <BookPlus className="mr-2 h-4 w-4" />
              {t("app.addLoan")}
            </Link>
          </Button>
        )}
        {session?.user.role === "member" && (
          <Button asChild>
            <Link href="/loans/request">
              <BookPlus className="mr-2 h-4 w-4" />
              {t("app.requestLoan")}
            </Link>
          </Button>
        )}
      </div>

      <div className="mb-6 flex items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder={t("app.searchLoans")}
            value={filters.query}
            onChange={(e) => handleFilterChange("query", e.target.value)}
            className="max-w-md"
          />
        </div>
        <PrintLoans
          filteredLoans={filteredLoans.filter((loan) => loan.status !== "CANCELLED" && loan.status !== "RETURNED")}
        />
        <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              {t("app.filters")}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>{t("app.filters")}</SheetTitle>
              <SheetDescription>{t("app.filtersDescription")}</SheetDescription>
            </SheetHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status-filter">{t("app.status")}</Label>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder={t("app.allStatuses")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("app.all")}</SelectItem>
                    <SelectItem value="requested">{t("app.requested")}</SelectItem>
                    <SelectItem value="active">{t("app.active")}</SelectItem>
                    <SelectItem value="returned">{t("app.returned")}</SelectItem>
                    <SelectItem value="overdue">{t("app.overdue")}</SelectItem>
                    <SelectItem value="rejected">{t("app.rejected")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="start-date">{t("app.startDate")}</Label>
                <DatePicker
                  id="start-date"
                  date={filters.startDate}
                  onSelect={(date) => handleFilterChange("startDate", date)}
                  placeholder={t("app.selectDate")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-date">{t("app.endDate")}</Label>
                <DatePicker
                  id="end-date"
                  date={filters.endDate}
                  onSelect={(date) => handleFilterChange("endDate", date)}
                  placeholder={t("app.selectDate")}
                />
              </div>

              <div className="pt-4 flex justify-between">
                <Button variant="outline" onClick={clearFilters}>
                  <X className="mr-2 h-4 w-4" />
                  {t("app.clearFilters")}
                </Button>
                <Button onClick={() => setIsFilterOpen(false)}>{t("app.applyFilters")}</Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("app.material")}</TableHead>
                  <TableHead>{t("app.borrower")}</TableHead>
                  <TableHead>{t("app.loanDate")}</TableHead>
                  <TableHead>{t("app.dueDate")}</TableHead>
                  <TableHead>{t("app.status")}</TableHead>
                  <TableHead className="text-right">{t("app.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-5 w-full max-w-[200px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-full max-w-[150px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-20" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-9 w-20 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : loans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center">
                        <Calendar className="h-12 w-12 text-muted-foreground mb-2" />
                        <p className="text-lg font-medium">{t("app.noLoans")}</p>
                        <p className="text-sm text-muted-foreground">{t("app.noLoansDescription")}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  loans.map((loan) => (
                    <TableRow key={loan.id} className="group">
                      <TableCell className="font-medium">
                        {loan.material.title}
                        {loan.copy && (
                          <div className="text-xs text-muted-foreground">
                            {t("app.copyNumber")}: {loan.copy.registrationNumber}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{getBorrowerName(loan)}</TableCell>
                      <TableCell>{formatDate(loan.loanDate)}</TableCell>
                      <TableCell>{formatDate(loan.dueDate)}</TableCell>
                      <TableCell>
                        <span className={`rounded-full px-2 py-1 text-xs ${getStatusBadgeClass(loan.status)}`}>
                          {t(`app.${loan.status}`)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Link href={`/loans/${loan.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              {t("app.view")}
                            </Link>
                          </Button>
                          {session?.user.role === "librarian" && (
                            <>
                              {loan.status === "requested" && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleRejectLoan(loan.id)}
                                  >
                                    <X className="mr-2 h-4 w-4" />
                                    {t("app.reject")}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleReturnLoan(loan.id)}
                                  >
                                    <Check className="mr-2 h-4 w-4" />
                                    {t("app.approve")}
                                  </Button>
                                </>
                              )}
                              {loan.status === "active" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => handleReturnLoan(loan.id)}
                                >
                                  <Check className="mr-2 h-4 w-4" />
                                  {t("app.return")}
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {!isLoading && pagination.pages > 1 && (
        <div className="mt-6 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (page > 1) setPage(page - 1)
                  }}
                />
              </PaginationItem>

              {Array.from({ length: pagination.pages }).map((_, i) => {
                const pageNumber = i + 1
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      href="#"
                      isActive={pageNumber === page}
                      onClick={(e) => {
                        e.preventDefault()
                        setPage(pageNumber)
                      }}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                )
              })}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (page < pagination.pages) setPage(page + 1)
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}
