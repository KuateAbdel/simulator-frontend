import { AppSidebar } from '@/components/app-sidebar'
import { AppTopbar } from '@/components/app-topbar'
import { LoaderProvider } from '@/components/loader-store'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <LoaderProvider>
      <div className="flex min-h-svh bg-background">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppTopbar />
          <main className="flex-1 overflow-x-hidden px-6 py-6 lg:px-8">{children}</main>
        </div>
      </div>
    </LoaderProvider>
  )
}
