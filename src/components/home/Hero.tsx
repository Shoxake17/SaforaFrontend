import { Link } from "react-router-dom"
import "./Hero.css"

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-bg" aria-hidden="true">
        <div className="hero-shape hero-shape-1"></div>
        <div className="hero-shape hero-shape-2"></div>
        <div className="hero-shape hero-shape-3"></div>
        <div className="hero-grid"></div>
      </div>

      <div className="hero-container">
        <div className="hero-badge">
          <span className="hero-badge-dot"></span>
          <span>AI-Powered Hotel Management — Live in 100+ hotels</span>
        </div>

        <h1 className="hero-title">
          Run your hotel with{" "}
          <span className="hero-title-grad">intelligence</span>
          <br />
          and elegance.
        </h1>

        <p className="hero-subtitle">
          Reservations, staff, housekeeping, and AI receptionists — one elegant
          platform for modern hotels of any size.
        </p>

        <div className="hero-cta">
          <Link to="/register" className="hero-btn hero-btn-primary">
            <i className="fa-solid fa-rocket"></i>
            Get Started Free
            <span className="hero-btn-arrow">→</span>
          </Link>
          <Link to="/login" className="hero-btn hero-btn-secondary">
            <i className="fa-solid fa-arrow-right-to-bracket"></i>
            Hotel Portal
          </Link>
        </div>

        <div className="hero-trust">
          <div className="hero-trust-avatars">
            <span className="hero-avatar" style={{ background: "#f97316" }}>A</span>
            <span className="hero-avatar" style={{ background: "#ef4444" }}>N</span>
            <span className="hero-avatar" style={{ background: "#fb923c" }}>J</span>
            <span className="hero-avatar" style={{ background: "#dc2626" }}>+</span>
          </div>
          <div>
            <strong>100+ hotels</strong> across Central Asia trust Safora
          </div>
        </div>
      </div>

      <div className="hero-scroll" aria-hidden="true">
        <div className="hero-scroll-mouse">
          <div className="hero-scroll-dot"></div>
        </div>
      </div>
    </section>
  )
}

export default Hero
