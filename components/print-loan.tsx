"use client"

import { useRef } from "react"
import { useReactToPrint } from "react-to-print"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/components/language-provider"
import { Printer } from "lucide-react"
import { motion } from "framer-motion"

type PrintLoanProps = {
  loan: {
    id: string
    loanDate: string
    dueDate: string
    returnDate?: string
    status: string
    notes?: string
    user?: {
      name: string
      lastName: string
      email: string
      phone?: string
      identityCard?: string
      address?: string
    }
    guestName?: string
    guestEmail?: string
    material: {
      title: string
      author: string
      isbn?: string
    }
    copy?: {
      registrationNumber: string
    }
  }
}

export function PrintLoan({ loan }: PrintLoanProps) {
  const { t } = useLanguage()
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Loan-${loan.id}`,
    onBeforeGetContent: () => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve()
        }, 500)
      })
    },
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  const getBorrowerName = () => {
    if (loan.user) {
      return `${loan.user.name} ${loan.user.lastName}`
    }
    return loan.guestName || t("app.unknownBorrower")
  }

  const getBorrowerContact = () => {
    if (loan.user) {
      return loan.user.email || loan.user.phone || ""
    }
    return loan.guestEmail || ""
  }

  const getStatusClass = () => {
    switch (loan.status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
      case "returned":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
      case "requested":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
    }
  }

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-4 flex justify-end"
      >
        <Button onClick={handlePrint} className="flex items-center gap-2">
          <Printer className="h-4 w-4" />
          {t("app.print")}
        </Button>
      </motion.div>

      <div ref={printRef} className="p-6 bg-white dark:bg-gray-950 min-h-[600px]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">{t("app.loanDetails")}</h1>
            <p className="text-muted-foreground">{t("app.printPreview")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>{t("app.loanInformation")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">{t("app.loanId")}:</span>
                  <span>{loan.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">{t("app.loanDate")}:</span>
                  <span>{formatDate(loan.loanDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">{t("app.dueDate")}:</span>
                  <span>{formatDate(loan.dueDate)}</span>
                </div>
                {loan.returnDate && (
                  <div className="flex justify-between">
                    <span className="font-medium">{t("app.returnDate")}:</span>
                    <span>{formatDate(loan.returnDate)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-medium">{t("app.status")}:</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusClass()}`}>
                    {t(`app.${loan.status}`)}
                  </span>
                </div>
                {loan.notes && (
                  <div className="pt-2">
                    <span className="font-medium">{t("app.notes")}:</span>
                    <p className="mt-1 text-sm">{loan.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("app.borrowerInformation")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">{t("app.name")}:</span>
                  <span>{getBorrowerName()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">{t("app.contact")}:</span>
                  <span>{getBorrowerContact()}</span>
                </div>
                {loan.user?.identityCard && (
                  <div className="flex justify-between">
                    <span className="font-medium">{t("app.identityCard")}:</span>
                    <span>{loan.user.identityCard}</span>
                  </div>
                )}
                {loan.user?.address && (
                  <div className="flex justify-between">
                    <span className="font-medium">{t("app.address")}:</span>
                    <span>{loan.user.address}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{t("app.materialInformation")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">{t("app.title")}:</span>
                <span>{loan.material.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">{t("app.author")}:</span>
                <span>{loan.material.author}</span>
              </div>
              {loan.material.isbn && (
                <div className="flex justify-between">
                  <span className="font-medium">{t("app.isbn")}:</span>
                  <span>{loan.material.isbn}</span>
                </div>
              )}
              {loan.copy && (
                <div className="flex justify-between">
                  <span className="font-medium">{t("app.registrationNumber")}:</span>
                  <span>{loan.copy.registrationNumber}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="border-t pt-4">
              <p className="font-medium mb-2">{t("app.borrowerSignature")}:</p>
              <div className="h-16 border-b border-dashed"></div>
              <p className="text-sm text-center mt-2">{getBorrowerName()}</p>
            </div>
            <div className="border-t pt-4">
              <p className="font-medium mb-2">{t("app.librarianSignature")}:</p>
              <div className="h-16 border-b border-dashed"></div>
              <p className="text-sm text-center mt-2">{t("app.librarian")}</p>
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              {t("app.printDate")}: {new Date().toLocaleDateString()}
            </p>
            <p className="mt-1">
              © {new Date().getFullYear()} - {t("app.librarySystem")}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
