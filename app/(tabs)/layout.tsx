import TabBar from "@/components/navigation/TabBar"

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen" style={{ background: "#0A0A0A" }}>
      <main className="page-content">{children}</main>
      <TabBar />
    </div>
  )
}
