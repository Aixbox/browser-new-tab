import type { AppProps } from 'next/app'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from 'sonner'
import '@/app/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      suppressHydrationWarning
    >
      <Component {...pageProps} />
      <Toaster />
    </ThemeProvider>
  )
}
