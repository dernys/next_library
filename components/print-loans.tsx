"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Printer } from "lucide-react"
import { motion } from "framer-motion"
import { useLanguage } from "./language-provider"
import { Loan } from "@/types/loan"

interface PrintLoansProps {
  filteredLoans: Loan[]
}

export function PrintLoans({ filteredLoans }: PrintLoansProps) {
  const { t } = useLanguage()
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    if (!printRef.current) {
      console.error('Print content ref is not available')
      return
    }
    
    const content = printRef.current
    const printWindow = window.open('', '_blank')
    printWindow?.document.write(`
      <html>
        <head>
          <title>Loans Report</title>
          <style>
            @page { 
              size: A4 landscape;
              margin: 10mm; 
            }
            body { 
              font-family: Arial; 
              font-size: 12px;
            }
            h1 { 
              text-align: center; 
              margin-bottom: 10px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 6px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
              font-weight: bold;
            }
            .print-header {
              margin-bottom: 20px;
              text-align: center;
            }
            .print-footer {
              margin-top: 20px;
              text-align: right;
              font-style: italic;
            }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `)
    
    printWindow?.document.close()
    printWindow?.focus()
    setTimeout(() => {
      printWindow?.print()
    }, 500)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  const getBorrowerName = (loan: Loan) => {
    if (loan.user) {
      return `${loan.user.name} ${loan.user.lastName}`
    }
    return loan.guestName || t("app.unknownBorrower")
  }

  const getBorrowerContact = (loan: Loan) => {
    if (loan.user) {
      return loan.user.email || ""
    }
    return loan.guestEmail || ""
  }

  const getStatusClass = (status: string) => {
    switch (status) {
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
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Button 
          onClick={handlePrint} 
          className="flex items-center gap-2"
          disabled={filteredLoans.length === 0}
        >
          <Printer className="h-4 w-4" />
          {t("app.printAll")} ({filteredLoans.length})
        </Button>
      </motion.div>

      <div style={{ display: 'none' }}>
        <div ref={printRef} className="p-4">
          <div className="print-header">
            <h1>{t("app.loanReport")}</h1>
            <p>{t("app.printedOn")}: {new Date().toLocaleDateString()}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>{t("app.material")}</th>
                <th>{t("app.borrower")}</th>
                <th>{t("app.email")}</th>
                <th>{t("app.loanDate")}</th>
                <th>{t("app.dueDate")}</th>
                <th>{t("app.status")}</th>
                <th>{t("app.copyNumber")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredLoans.map((loan) => (
                <tr key={loan.id}>
                  <td>{loan.material.title}</td>
                  <td>{getBorrowerName(loan)}</td>
                  <td>{loan.user?.email || loan.guestEmail || t("app.noEmail")}</td>
                  <td>{formatDate(loan.loanDate)}</td>
                  <td>{formatDate(loan.dueDate)}</td>
                  <td>{t(`app.${loan.status}`)}</td>
                  <td>{loan.copy?.registrationNumber || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="print-footer">
            <p>{t("app.totalLoans")}: {filteredLoans.length}</p>
          </div>
        </div>
      </div>
    </>
  )
}
