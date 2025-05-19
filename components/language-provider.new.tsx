"use client"

import type * as React from "react"
import { createContext, useContext, useState, useEffect } from "react"

type LanguageContextType = {
  language: string
  setLanguage: (language: string) => void
  t: (key: string, params?: Record<string, any>) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

type Translations = {
  [key: string]: {
    [key: string]: string
  }
}

const translations: Translations = {
  es: {
    // ... existing translations ...
    "app.loginError": "Error al iniciar sesión",
    "app.registerError": "Error al registrarse",
    "app.passwordMismatch": "Las contraseñas no coinciden",
    "app.passwordRequirements": "La contraseña debe tener al menos 8 caracteres",
    "app.emailRequired": "El correo electrónico es requerido",
    "app.passwordRequired": "La contraseña es requerida",
    "app.nameRequired": "El nombre es requerido",
    "app.lastNameRequired": "Los apellidos son requeridos",
    "app.phoneRequired": "El teléfono es requerido",
    "app.identityCardRequired": "El carnet de identidad es requerido",
    "app.addressRequired": "La dirección es requerida",
    "app.roleRequired": "El rol es requerido",
    "app.titleRequired": "El título es requerido",
    "app.authorRequired": "El autor es requerido",
    "app.isbnRequired": "El ISBN es requerido",
    "app.descriptionRequired": "La descripción es requerida",
    "app.quantityRequired": "La cantidad es requerida",
    "app.categoryRequired": "La categoría es requerida",
    "app.typeRequired": "El tipo es requerido",
    "app.statusRequired": "El estado es requerido",
    "app.loanDateRequired": "La fecha de préstamo es requerida",
    "app.dueDateRequired": "La fecha de devolución es requerida",
    "app.borrowerRequired": "El prestatario es requerido",
    "app.materialRequired": "El material es requerido",
    "app.userRequired": "El usuario es requerido",
    "app.guestNameRequired": "El nombre del invitado es requerido",
    "app.guestEmailRequired": "El correo del invitado es requerido",
    "app.notesRequired": "Las notas son requeridas",
    "app.languageRequired": "El idioma es requerido",
    "app.publisherRequired": "La editorial es requerida",
    "app.countryRequired": "El país es requerido",
    "app.publicationPlaceRequired": "El lugar de publicación es requerido",
    "app.priceRequired": "El precio es requerido",
    "app.dimensionsRequired": "Las dimensiones son requeridas",
    "app.pagesRequired": "El número de páginas es requerido",
    "app.registrationNumberRequired": "El número de registro es requerido",
    "app.coverImageRequired": "La imagen de portada es requerida",
    "app.copyNumberRequired": "El número de ejemplar es requerido",
    "app.fileRequired": "El archivo es requerido",
    "app.fileFormatError": "Formato de archivo no válido",
    "app.fileSizeError": "El archivo es demasiado grande",
    "app.fileUploadError": "Error al subir el archivo",
    "app.fileDownloadError": "Error al descargar el archivo",
    "app.fileDeleteError": "Error al eliminar el archivo",
    "app.fileNotFound": "Archivo no encontrado",
    "app.fileExists": "El archivo ya existe",
    "app.fileCreated": "Archivo creado correctamente",
    "app.fileUpdated": "Archivo actualizado correctamente",
    "app.fileDeleted": "Archivo eliminado correctamente",
    "app.fileImported": "Archivo importado correctamente",
    "app.fileExported": "Archivo exportado correctamente",
    "app.fileProcessing": "Procesando archivo...",
    "app.fileProcessingError": "Error al procesar el archivo",
    "app.fileProcessingSuccess": "Archivo procesado correctamente",
    "app.fileProcessingCancelled": "Procesamiento de archivo cancelado",
    "app.fileProcessingTimeout": "Tiempo de espera agotado al procesar el archivo",
    "app.fileProcessingInvalid": "Archivo inválido",
    "app.fileProcessingEmpty": "El archivo está vacío",
    "app.fileProcessingTooLarge": "El archivo es demasiado grande",
    "app.fileProcessingTooSmall": "El archivo es demasiado pequeño",
    "app.fileProcessingUnsupported": "Formato de archivo no soportado",
    "app.fileProcessingCorrupted": "El archivo está corrupto",
    "app.fileProcessingIncomplete": "El archivo está incompleto",
    "app.fileProcessingFailed": "Error al procesar el archivo",
    "app.loanAdded": "Préstamo añadido correctamente",
    "app.loanUpdated": "Préstamo actualizado correctamente",
    "app.loanDeleted": "Préstamo eliminado correctamente",
    "app.errorAddingLoan": "Error al añadir el préstamo",
    "app.errorUpdatingLoan": "Error al actualizar el préstamo",
    "app.errorDeletingLoan": "Error al eliminar el préstamo",
    "app.errorFetchingLoans": "Error al obtener los préstamos",
  },
  en: {
    // ... existing translations ...
    "app.loginError": "Login error",
    "app.registerError": "Registration error",
    "app.passwordMismatch": "Passwords do not match",
    "app.passwordRequirements": "Password must be at least 8 characters long",
    "app.emailRequired": "Email is required",
    "app.passwordRequired": "Password is required",
    "app.nameRequired": "Name is required",
    "app.lastNameRequired": "Last name is required",
    "app.phoneRequired": "Phone is required",
    "app.identityCardRequired": "Identity card is required",
    "app.addressRequired": "Address is required",
    "app.roleRequired": "Role is required",
    "app.titleRequired": "Title is required",
    "app.authorRequired": "Author is required",
    "app.isbnRequired": "ISBN is required",
    "app.descriptionRequired": "Description is required",
    "app.quantityRequired": "Quantity is required",
    "app.categoryRequired": "Category is required",
    "app.typeRequired": "Type is required",
    "app.statusRequired": "Status is required",
    "app.loanDateRequired": "Loan date is required",
    "app.dueDateRequired": "Due date is required",
    "app.borrowerRequired": "Borrower is required",
    "app.materialRequired": "Material is required",
    "app.userRequired": "User is required",
    "app.guestNameRequired": "Guest name is required",
    "app.guestEmailRequired": "Guest email is required",
    "app.notesRequired": "Notes are required",
    "app.languageRequired": "Language is required",
    "app.publisherRequired": "Publisher is required",
    "app.countryRequired": "Country is required",
    "app.publicationPlaceRequired": "Publication place is required",
    "app.priceRequired": "Price is required",
    "app.dimensionsRequired": "Dimensions are required",
    "app.pagesRequired": "Number of pages is required",
    "app.registrationNumberRequired": "Registration number is required",
    "app.coverImageRequired": "Cover image is required",
    "app.copyNumberRequired": "Copy number is required",
    "app.fileRequired": "File is required",
    "app.fileFormatError": "Invalid file format",
    "app.fileSizeError": "File is too large",
    "app.fileUploadError": "Error uploading file",
    "app.fileDownloadError": "Error downloading file",
    "app.fileDeleteError": "Error deleting file",
    "app.fileNotFound": "File not found",
    "app.fileExists": "File already exists",
    "app.fileCreated": "File created successfully",
    "app.fileUpdated": "File updated successfully",
    "app.fileDeleted": "File deleted successfully",
    "app.fileImported": "File imported successfully",
    "app.fileExported": "File exported successfully",
    "app.fileProcessing": "Processing file...",
    "app.fileProcessingError": "Error processing file",
    "app.fileProcessingSuccess": "File processed successfully",
    "app.fileProcessingCancelled": "File processing cancelled",
    "app.fileProcessingTimeout": "File processing timeout",
    "app.fileProcessingInvalid": "Invalid file",
    "app.fileProcessingEmpty": "File is empty",
    "app.fileProcessingTooLarge": "File is too large",
    "app.fileProcessingTooSmall": "File is too small",
    "app.fileProcessingUnsupported": "Unsupported file format",
    "app.fileProcessingCorrupted": "File is corrupted",
    "app.fileProcessingIncomplete": "File is incomplete",
    "app.fileProcessingFailed": "File processing failed",
    "app.loanAdded": "Loan added successfully",
    "app.loanUpdated": "Loan updated successfully",
    "app.loanDeleted": "Loan deleted successfully",
    "app.errorAddingLoan": "Error adding loan",
    "app.errorUpdatingLoan": "Error updating loan",
    "app.errorDeletingLoan": "Error deleting loan",
    "app.errorFetchingLoans": "Error fetching loans",
  },
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState("es")

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language")
    if (savedLanguage) {
      setLanguage(savedLanguage)
    }
  }, [])

  const t = (key: string, params?: Record<string, any>) => {
    const translation = translations[language][key] || key
    if (params) {
      return Object.entries(params).reduce((acc, [key, value]) => {
        return acc.replace(`{${key}}`, value)
      }, translation)
    }
    return translation
  }

  const changeLanguage = (newLanguage: string) => {
    setLanguage(newLanguage)
    localStorage.setItem("language", newLanguage)
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t }}>{children}</LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
