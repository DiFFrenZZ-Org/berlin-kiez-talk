import { ThemeProvider as NextThemeProvider } from "next-themes"
import { PropsWithChildren } from "react"

export const ThemeProvider = ({ children }: PropsWithChildren) => (
  <NextThemeProvider attribute="class" defaultTheme="system" enableSystem>
    {children}
  </NextThemeProvider>
)
