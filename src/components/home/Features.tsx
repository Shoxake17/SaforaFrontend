import './Features.css'

const features = [
  {
    icon: 'fa-robot',
    title: 'AI Receptionist 24/7',
    desc: 'Answers calls, books rooms, never misses a guest. Multilingual support in 10+ languages.',
    color: 'orange',
  },
  {
    icon: 'fa-chart-line',
    title: 'Live Revenue & Reports',
    desc: 'Real-time occupancy, revenue, and staff dashboards. Make data-driven decisions instantly.',
    color: 'red',
  },
  {
    icon: 'fa-users-gear',
    title: 'Full Staff Management',
    desc: 'Shifts, salaries, departments, and workflows in one elegant place. No more spreadsheets.',
    color: 'warm',
  },
  {
    icon: 'fa-qrcode',
    title: 'Smart QR Services',
    desc: 'Guests scan to order services, chat with reception, or call staff — instantly.',
    color: 'orange',
  },
  {
    icon: 'fa-calendar-check',
    title: 'Smart Reservations',
    desc: 'Channel manager, calendar sync, and direct booking engine integrated in one system.',
    color: 'red',
  },
  {
    icon: 'fa-shield-halved',
    title: 'Enterprise Security',
    desc: 'Bank-grade encryption, role-based access, and audit logs for full peace of mind.',
    color: 'warm',
  },
]

const Features = () => {
  return (
    <section className="features">
      <div className="features-container">
        <div className="features-header">
          <div className="features-tag">FEATURES</div>
          <h2 className="features-title">
            Everything you need to run a{' '}
            <span className="features-title-grad">modern hotel</span>
          </h2>
          <p className="features-subtitle">
            From front desk to housekeeping, from revenue analytics to AI
            automation — all in one elegant platform.
          </p>
        </div>

        <div className="features-grid">
          {features.map((f, idx) => (
            <div key={idx} className={`feature-card feature-${f.color}`}>
              <div className="feature-icon">
                <i className={`fa-solid ${f.icon}`}></i>
              </div>
              <h3 className="feature-name">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
              <div className="feature-arrow">
                <i className="fa-solid fa-arrow-right"></i>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features