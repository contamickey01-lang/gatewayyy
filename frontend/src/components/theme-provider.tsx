"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { usePathname } from "next/navigation";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  const pathname = usePathname();

  const isInternalRoute =
    pathname?.startsWith('/dashboard') ||
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/area-membros');

  const forcedTheme = isInternalRoute ? undefined : 'dark';

  return (
    <NextThemesProvider {...props} forcedTheme={forcedTheme}>
      {children}
    </NextThemesProvider>
  );
}
