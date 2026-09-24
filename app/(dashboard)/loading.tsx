export default function Loading() {
  return (
    <div aria-label="Loading workspace" role="status">
      <div className="skeleton mb-7" style={{ height: 70, maxWidth: 420 }} />
      <div className="metric-grid">
        {[1, 2, 3, 4].map((key) => (
          <div key={key} className="skeleton" />
        ))}
      </div>
      <div className="skeleton mt-7" style={{ height: 320 }} />
      <span className="sr-only">Loading your workspace…</span>
    </div>
  )
}
