"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Edit, Trash, UserPlus } from "lucide-react"
import { motion } from "framer-motion"
import { Pagination } from "@/components/pagination"

type User = {
  id: string
  name: string
  lastName: string | null
  email: string
  phone: string | null
  identityCard: string | null
  address: string | null
  role: {
    id: string
    name: string
  }
}

type Role = {
  id: string
  name: string
  description: string | null
}

export default function ManageUsersPage() {
  const { t } = useLanguage()
  const { toast } = useToast()

  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [usersPerPage] = useState(10) // Número de usuarios por página

  const [formData, setFormData] = useState({
    name: "",
    lastName: "",
    email: "",
    password: "",
    roleId: "",
    phone: "",
    identityCard: "",
    address: "",
  })

  useEffect(() => {
    fetchUsers()
    fetchRoles()
  }, [])

  useEffect(() => {
    if (selectedUser && isEditDialogOpen) {
      setFormData({
        name: selectedUser.name,
        lastName: selectedUser.lastName || "",
        email: selectedUser.email,
        password: "",
        roleId: selectedUser.role.id,
        phone: selectedUser.phone || "",
        identityCard: selectedUser.identityCard || "",
        address: selectedUser.address || "",
      })
    }
  }, [selectedUser, isEditDialogOpen])

  async function fetchUsers(page = 1) {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/users?page=${page}&limit=${usersPerPage}`)
      const data = await response.json()

      setUsers(data.users)
      setTotalPages(data.pagination.totalPages) // Actualizar el total de páginas desde la respuesta del backend
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: t("app.error"),
        description: t("app.errorFetchingUsers"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchUsers(page) // Llamar a `fetchUsers` con la nueva página
  }

  async function fetchRoles() {
    try {
      const response = await fetch("/api/roles")
      const data = await response.json()
      setRoles(data)
    } catch (error) {
      console.error("Error fetching roles:", error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setFormData({
      name: "",
      lastName: "",
      email: "",
      password: "",
      roleId: "",
      phone: "",
      identityCard: "",
      address: "",
    })
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to add user")
      }

      toast({
        title: t("app.success"),
        description: t("app.userAdded"),
      })

      setIsAddDialogOpen(false)
      resetForm()
      fetchUsers()
    } catch (error) {
      console.error("Error adding user:", error)
      toast({
        title: t("app.error"),
        description: error instanceof Error ? error.message : t("app.errorAddingUser"),
        variant: "destructive",
      })
    }
  }

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedUser) return

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update user")
      }

      toast({
        title: t("app.success"),
        description: t("app.userUpdated"),
      })

      setIsEditDialogOpen(false)
      setSelectedUser(null)
      fetchUsers()
    } catch (error) {
      console.error("Error updating user:", error)
      toast({
        title: t("app.error"),
        description: error instanceof Error ? error.message : t("app.errorUpdatingUser"),
        variant: "destructive",
      })
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete user")
      }

      toast({
        title: t("app.success"),
        description: t("app.userDeleted"),
      })

      setIsDeleteDialogOpen(false)
      setSelectedUser(null)
      fetchUsers()
    } catch (error) {
      console.error("Error deleting user:", error)
      toast({
        title: t("app.error"),
        description: error instanceof Error ? error.message : t("app.errorDeletingUser"),
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container py-8">
      <motion.div
        className="flex items-center justify-between mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold">{t("app.manageUsers")}</h1>
        <Button onClick={() => setIsAddDialogOpen(true)} >
          <UserPlus className="mr-2 h-4 w-4" />
          {t("app.addUser")}
        </Button>
      </motion.div>

      <motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, delay: 0.2 }}
>
  <Card className="hover:shadow-md transition-all duration-300">
    <CardContent className="p-0">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("app.name")}</TableHead>
              <TableHead>{t("app.lastName")}</TableHead>
              <TableHead>{t("app.email")}</TableHead>
              <TableHead>{t("app.phone")}</TableHead>
              <TableHead>{t("app.identityCard")}</TableHead>
              <TableHead>{t("app.role")}</TableHead>
              <TableHead className="text-right">{t("app.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  {t("app.loading")}
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  {t("app.noUsers")}
                </TableCell>
              </TableRow>
            ) : (
              users.map((user, index) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.lastName || "-"}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phone || "-"}</TableCell>
                  <TableCell>{user.identityCard || "-"}</TableCell>
                  <TableCell>
                    <span className="rounded-full bg-secondary px-2 py-1 text-xs">
                      {t(`app.${user.role.name}`)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedUser(user)
                          setIsEditDialogOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">{t("app.edit")}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedUser(user)
                          setIsDeleteDialogOpen(true)
                        }}
                      >
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">{t("app.delete")}</span>
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </CardContent>
  </Card>

  {/* Agregar el componente de paginación */}
  <Pagination
    currentPage={currentPage}
    totalPages={totalPages}
    onPageChange={handlePageChange}
  />
</motion.div>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("app.addUser")}</DialogTitle>
            <DialogDescription>{t("app.addUserDescription")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddUser}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  {t("app.name")}
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="col-span-3 transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lastName" className="text-right">
                  {t("app.lastName")}
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="col-span-3 transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  {t("app.email")}
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="col-span-3 transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  {t("app.password")}
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="col-span-3 transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  {t("app.phone")}
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="col-span-3 transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="identityCard" className="text-right">
                  {t("app.identityCard")}
                </Label>
                <Input
                  id="identityCard"
                  name="identityCard"
                  value={formData.identityCard}
                  onChange={handleChange}
                  className="col-span-3 transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-right">
                  {t("app.address")}
                </Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="col-span-3 transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  {t("app.role")}
                </Label>
                <Select value={formData.roleId} onValueChange={(value) => handleSelectChange("roleId", value)} required>
                  <SelectTrigger className="col-span-3 transition-all duration-200 focus:ring-2 focus:ring-primary/50">
                    <SelectValue placeholder={t("app.selectRole")} />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {t(`app.${role.name}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="hover:bg-primary/90 transition-colors">
                {t("app.save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("app.editUser")}</DialogTitle>
            <DialogDescription>{t("app.editUserDescription")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditUser}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  {t("app.name")}
                </Label>
                <Input
                  id="edit-name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="col-span-3 transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-lastName" className="text-right">
                  {t("app.lastName")}
                </Label>
                <Input
                  id="edit-lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="col-span-3 transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-email" className="text-right">
                  {t("app.email")}
                </Label>
                <Input
                  id="edit-email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="col-span-3 transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-password" className="text-right">
                  {t("app.password")}
                </Label>
                <Input
                  id="edit-password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="col-span-3 transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                  placeholder={t("app.leaveBlankToKeep")}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-phone" className="text-right">
                  {t("app.phone")}
                </Label>
                <Input
                  id="edit-phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="col-span-3 transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-identityCard" className="text-right">
                  {t("app.identityCard")}
                </Label>
                <Input
                  id="edit-identityCard"
                  name="identityCard"
                  value={formData.identityCard}
                  onChange={handleChange}
                  className="col-span-3 transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-address" className="text-right">
                  {t("app.address")}
                </Label>
                <Input
                  id="edit-address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="col-span-3 transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-role" className="text-right">
                  {t("app.role")}
                </Label>
                <Select value={formData.roleId} onValueChange={(value) => handleSelectChange("roleId", value)} required>
                  <SelectTrigger className="col-span-3 transition-all duration-200 focus:ring-2 focus:ring-primary/50">
                    <SelectValue placeholder={t("app.selectRole")} />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {t(`app.${role.name}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="hover:bg-primary/90 transition-colors">
                {t("app.save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("app.deleteUser")}</DialogTitle>
            <DialogDescription>{t("app.deleteUserConfirmation")}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p>
              <strong>{t("app.name")}:</strong> {selectedUser?.name}
            </p>
            <p>
              <strong>{t("app.email")}:</strong> {selectedUser?.email}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              {t("app.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              {t("app.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
