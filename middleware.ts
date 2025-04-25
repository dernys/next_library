import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const isAuthenticated = !!token
  const isLibrarian = token?.role === "librarian"
  const isMember = token?.role === "member"

  const { pathname } = request.nextUrl

  // Rutas públicas accesibles para todos
  const publicRoutes = ["/", "/login", "/register", "/api/register", "/materials", "/about"]

  // Verificar si la ruta actual es /materials o coincide con el patrón /materials/[id]
  if (publicRoutes.includes(pathname) || pathname.match(/^\/materials\/[^/]+$/)) {
    return NextResponse.next()
  }

  // Rutas de API que necesitan autenticación
  if (pathname.startsWith("/api/")) {
    // La autenticación se maneja en las rutas de API
    return NextResponse.next()
  }

  // Rutas de autenticación - redirigir al dashboard si ya está autenticado
  if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
    if (isAuthenticated) {
      if (isLibrarian) {
        return NextResponse.redirect(new URL("/dashboard", request.url))
      } else {
        return NextResponse.redirect(new URL("/profile", request.url))
      }
    }
    return NextResponse.next()
  }

  // Rutas protegidas - redirigir a login si no está autenticado
  if (!isAuthenticated) {
    const url = new URL("/login", request.url)
    url.searchParams.set("callbackUrl", encodeURI(request.url))
    return NextResponse.redirect(url)
  }

  // Rutas solo para bibliotecarios
  const librarianRoutes = [
    "/dashboard",
    "/materials/manage",
    "/users/manage",
    "/categories/manage",
    "/collections/manage",
    "/material-types/manage",
    "/subjects/manage",
    "/library-info/manage",
    "/import-export",
  ]

  if (librarianRoutes.some((route) => pathname.startsWith(route))) {
    if (!isLibrarian) {
      return NextResponse.redirect(new URL("/profile", request.url))
    }
  }

  // Rutas para miembros
  const memberRoutes = ["/profile", "/loans/request"]
  if (memberRoutes.some((route) => pathname.startsWith(route))) {
    // Tanto bibliotecarios como miembros pueden acceder a estas rutas
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
