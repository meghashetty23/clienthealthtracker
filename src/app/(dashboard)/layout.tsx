import NavBar from './nav-bar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <NavBar />
      <main className="flex-1">{children}</main>
    </div>
  )
}
