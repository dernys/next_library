"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useLanguage } from "@/components/language-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import {
  BookOpen,
  Users,
  BookMarked,
  Clock,
  AlertTriangle,
  Library,
  BarChart3,
  Activity,
  Database,
  Download,
  RefreshCw,
  Upload,
  Loader2,
} from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type DashboardData = {
  totalMaterials: number
  totalUsers: number
  totalLoans: number
  activeLoans: number
  overdueLoans: number
  totalCollections: number
  materialsPerCategory: { name: string; value: number }[]
  popularMaterials: { title: string; loanCount: number }[]
  recentLoans: {
    id: string
    material: { title: string }
    user: { name: string; lastName: string }
    loanDate: string
    status: string
  }[]
}

type Backup = {
  id: string
  filename: string
  description: string | null
  size: number
  path: string
  createdAt: string
  createdBy: string | null
}

export default function DashboardPage() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [backups, setBackups] = useState<Backup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)
  const [isRestoringBackup, setIsRestoringBackup] = useState(false)
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D", "#A4DE6C", "#D0ED57"]

  useEffect(() => {
    fetchDashboardData()
    fetchBackups()
  }, [])

  async function fetchDashboardData() {
    try {
      setIsLoading(true)
      const response = await fetch("/api/dashboard")
      const data = await response.json()
      setDashboardData(data)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      toast({
        title: t("app.error"),
        description: "Error fetching dashboard data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchBackups() {
    try {
      setIsLoading(true)
      const response = await fetch("/api/backups")
      const data = await response.json()
      setBackups(data)
    } catch (error) {
      console.error("Error fetching backups:", error)
      toast({
        title: t("app.error"),
        description: t("app.errorFetchingBackups"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateBackup = async () => {
    try {
      setIsCreatingBackup(true)
      const response = await fetch("/api/backups", {
        method: "POST",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create backup")
      }

      toast({
        title: t("app.success"),
        description: t("app.backupCreated"),
      })

      fetchBackups()
    } catch (error) {
      console.error("Error creating backup:", error)
      toast({
        title: t("app.error"),
        description: error instanceof Error ? error.message : t("app.errorCreatingBackup"),
        variant: "destructive",
      })
    } finally {
      setIsCreatingBackup(false)
    }
  }

  const handleRestoreBackup = async () => {
    if (!selectedBackup) return

    try {
      setIsRestoringBackup(true)
      const response = await fetch(`/api/backups/${selectedBackup.id}/restore`, {
        method: "POST",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to restore backup")
      }

      toast({
        title: t("app.success"),
        description: t("app.backupRestored"),
      })

      setSelectedBackup(null)
    } catch (error) {
      console.error("Error restoring backup:", error)
      toast({
        title: t("app.error"),
        description: error instanceof Error ? error.message : t("app.errorRestoringBackup"),
        variant: "destructive",
      })
    } finally {
      setIsRestoringBackup(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImportFile(e.target.files[0])
    }
  }

  const handleImportMaterials = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!importFile) return

    try {
      const formData = new FormData()
      formData.append("file", importFile)

      const response = await fetch("/api/import/materials", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to import materials")
      }

      const data = await response.json()

      toast({
        title: t("app.success"),
        description: t("app.materialsImported", { count: data.count }),
      })

      setIsImportDialogOpen(false)
      setImportFile(null)
    } catch (error) {
      console.error("Error importing materials:", error)
      toast({
        title: t("app.error"),
        description: error instanceof Error ? error.message : t("app.errorImportingMaterials"),
        variant: "destructive",
      })
    }
  }

  const handleExportMaterials = async () => {
    try {
      setIsExporting(true)
      const response = await fetch("/api/export/materials")
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "materials.csv"
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: t("app.success"),
        description: t("app.materialsExported"),
      })
    } catch (error) {
      console.error("Error exporting materials:", error)
      toast({
        title: t("app.error"),
        description: t("app.errorExportingMaterials"),
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + " " + date.toLocaleTimeString()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  if (isLoading) {
    return (
      <div className="container py-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold">{t("app.loading")}</h2>
          <p className="text-muted-foreground">{t("app.loadingDashboard")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <motion.div
        className="flex items-center justify-between mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold">{t("app.dashboard")}</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsImportDialogOpen(true)}
            variant="outline"
            className="hover:bg-primary/10 transition-colors"
          >
            <Upload className="mr-2 h-4 w-4" />
            {t("app.importMaterials")}
          </Button>
          <Button
            onClick={handleExportMaterials}
            variant="outline"
            disabled={isExporting}
            className="hover:bg-primary/10 transition-colors"
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? t("app.exporting") : t("app.exportMaterials")}
          </Button>
          <Button
            onClick={handleCreateBackup}
            disabled={isCreatingBackup}
            className="hover:bg-primary/90 transition-colors"
          >
            {isCreatingBackup ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("app.creatingBackup")}
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                {t("app.createBackup")}
              </>
            )}
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
        >
          <Card className="hover:shadow-md transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t("app.totalMaterials")}</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData?.totalMaterials || 0}</div>
              <p className="text-xs text-muted-foreground">{t("app.materialsInLibrary")}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
        >
          <Card className="hover:shadow-md transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t("app.totalUsers")}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground">{t("app.registeredUsers")}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
        >
          <Card className="hover:shadow-md transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t("app.totalLoans")}</CardTitle>
              <BookMarked className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData?.totalLoans || 0}</div>
              <p className="text-xs text-muted-foreground">{t("app.totalLoansProcessed")}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
        >
          <Card className="hover:shadow-md transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t("app.activeLoans")}</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData?.activeLoans || 0}</div>
              <p className="text-xs text-muted-foreground">{t("app.currentlyActive")}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
        >
          <Card className="hover:shadow-md transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t("app.overdueLoans")}</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData?.overdueLoans || 0}</div>
              <p className="text-xs text-muted-foreground">{t("app.needAttention")}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
        >
          <Card className="hover:shadow-md transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t("app.totalCollections")}</CardTitle>
              <Library className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData?.totalCollections || 0}</div>
              <p className="text-xs text-muted-foreground">{t("app.availableCollections")}</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="mb-8"
      >
        <Card className="hover:shadow-md transition-all duration-300">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t("app.charts")}</CardTitle>
                <CardDescription>{t("app.visualizeLibraryData")}</CardDescription>
              </div>
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-medium mb-4">{t("app.materialsPerCategory")}</h3>
                <div className="h-[300px]">
                  {dashboardData?.materialsPerCategory && dashboardData.materialsPerCategory.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dashboardData.materialsPerCategory}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {dashboardData.materialsPerCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-muted-foreground">{t("app.noDataAvailable")}</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">{t("app.popularMaterials")}</h3>
                <div className="h-[300px]">
                  {dashboardData?.popularMaterials && dashboardData.popularMaterials.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={dashboardData.popularMaterials}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <XAxis type="number" />
                        <YAxis
                          type="category"
                          dataKey="title"
                          width={150}
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => (value.length > 20 ? value.substring(0, 20) + "..." : value)}
                        />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="loanCount" name={t("app.loanCount")} fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-muted-foreground">{t("app.noDataAvailable")}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <Card className="hover:shadow-md transition-all duration-300 h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t("app.recentActivity")}</CardTitle>
                  <CardDescription>{t("app.recentLoans")}</CardDescription>
                </div>
                <Activity className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              {dashboardData?.recentLoans && dashboardData.recentLoans.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.recentLoans.map((loan, index) => (
                    <motion.div
                      key={loan.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="flex items-center p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{loan.material.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {t("app.loanedTo")}: {loan.user.name} {loan.user.lastName}
                        </p>
                        <div className="flex items-center mt-1">
                          <span className="text-xs text-muted-foreground">{formatDate(loan.loanDate)}</span>
                          <span
                            className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                              loan.status === "active"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                : loan.status === "overdue"
                                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                                  : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                            }`}
                          >
                            {t(`app.${loan.status}`)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">{t("app.noRecentLoans")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          <Card className="hover:shadow-md transition-all duration-300 h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t("app.backups")}</CardTitle>
                  <CardDescription>{t("app.databaseBackups")}</CardDescription>
                </div>
                <Database className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : backups.length === 0 ? (
                <div className="text-center py-8">
                  <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">{t("app.noBackups")}</p>
                  <p className="text-sm text-muted-foreground">{t("app.createBackupDescription")}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {backups.map((backup) => (
                    <motion.div
                      key={backup.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div>
                        <p className="font-medium">{backup.filename}</p>
                        <p className="text-xs text-muted-foreground">{new Date(backup.createdAt).toLocaleString()}</p>
                        {backup.description && (
                          <p className="text-sm text-muted-foreground mt-1">{backup.description}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedBackup(backup)
                          setIsRestoringBackup(true)
                        }}
                        disabled={isRestoringBackup}
                        className="hover:bg-primary/20 transition-colors"
                      >
                        {isRestoringBackup && selectedBackup?.id === backup.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Import Materials Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("app.importMaterials")}</DialogTitle>
            <DialogDescription>{t("app.importMaterialsDescription")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleImportMaterials}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="import-file">{t("app.selectFile")}</Label>
                <Input id="import-file" type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} required />
                <p className="text-sm text-muted-foreground">{t("app.importFileFormat")}</p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                {t("app.cancel")}
              </Button>
              <Button type="submit" disabled={!importFile} className="hover:bg-primary/90 transition-colors">
                {t("app.import")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
