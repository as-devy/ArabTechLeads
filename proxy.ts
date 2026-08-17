import NextAuth from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { authConfig } from "./auth.config";
import { routing } from "./i18n/routing";

const handleI18n = createMiddleware(routing);
const { auth } = NextAuth(authConfig);

function stripLocale(pathname: string) {
  for (const locale of routing.locales) {
    if (pathname === `/${locale}`) return "/";
    if (pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(locale.length + 1) || "/";
    }
  }
  return pathname;
}

function localePrefix(pathname: string) {
  for (const locale of routing.locales) {
    if (locale === routing.defaultLocale) continue;
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      return `/${locale}`;
    }
  }
  return "";
}

function localizedPath(requestPath: string, target: string) {
  return `${localePrefix(requestPath)}${target}` || target;
}

export default auth(async (request) => {
  const i18nResponse = handleI18n(request as NextRequest);
  const user = request.auth?.user;
  const rawPath = request.nextUrl.pathname;
  const pathname = stripLocale(rawPath);
  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password");
  const isProtected =
    pathname.startsWith("/app") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/admin");

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = localizedPath(rawPath, "/login");
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = localizedPath(rawPath, "/app");
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = localizedPath(rawPath, "/app");
    return NextResponse.redirect(url);
  }

  return i18nResponse;
});

export const config = {
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
};
