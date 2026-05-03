import TabBar from "@/components/navigation/TabBar"

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/*
        The scroll happens INSIDE this fixed container, not on <body>.
        This way the viewport height never changes when the iOS Safari URL bar
        hides/shows → the tab bar stays perfectly still.
      */}
      <div
        id="app-scroll"
        style={{
          position: "fixed",
          inset: 0,
          overflowY: "auto",
          overflowX: "hidden",
          WebkitOverflowScrolling: "touch" as React.CSSProperties["WebkitOverflowScrolling"],
          background: "#050505",
        }}
      >
        <main className="page-content">{children}</main>
      </div>

      {/* Tab bar lives outside the scroll container → never moves */}
      <TabBar />
    </>
  )
}
