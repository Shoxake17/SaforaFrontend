import './Stats.css'

const stats = [
  { num: '100+', label: 'Hotels', sub: 'Across Central Asia' },
  { num: '24/7', label: 'AI Support', sub: 'Always available' },
  { num: '15+', label: 'Countries', sub: 'And growing' },
  { num: '99.9%', label: 'Uptime', sub: 'Enterprise-grade' },
]

const Stats = () => {
  return (
    <section className="stats">
      <div className="stats-bg" aria-hidden="true">
        <div className="stats-orb stats-orb-1"></div>
        <div className="stats-orb stats-orb-2"></div>
      </div>

      <div className="stats-container">
        <div className="stats-header">
          <h2 className="stats-title">Trusted by hoteliers worldwide</h2>
          <p className="stats-subtitle">
            Join the growing family of hotels running smarter operations.
          </p>
        </div>

        <div className="stats-grid">
          {stats.map((s, idx) => (
            <div key={idx} className="stat-card">
              <div className="stat-num">{s.num}</div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-sub">{s.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Stats