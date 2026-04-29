import { Link } from 'react-router-dom'
import './Footer.css'

const Footer = () => {
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-brand">
            <div className="footer-logo">
              <div className="footer-logo-mark">S</div>
              <span className="footer-logo-text">SAFORA</span>
            </div>
            <p className="footer-tagline">
              AI-powered hotel management platform built for the future of
              hospitality.
            </p>
            <div className="footer-social">
              <a href="#" aria-label="Twitter"><i className="fa-brands fa-twitter"></i></a>
              <a href="#" aria-label="LinkedIn"><i className="fa-brands fa-linkedin-in"></i></a>
              <a href="#" aria-label="Telegram"><i className="fa-brands fa-telegram"></i></a>
              <a href="#" aria-label="Instagram"><i className="fa-brands fa-instagram"></i></a>
            </div>
          </div>

          {/* Product */}
          <div className="footer-col">
            <h4>Product</h4>
            <ul>
              <li><a href="#">Features</a></li>
              <li><a href="#">Pricing</a></li>
              <li><a href="#">Roadmap</a></li>
              <li><a href="#">Changelog</a></li>
            </ul>
          </div>

          {/* Company */}
          <div className="footer-col">
            <h4>Company</h4>
            <ul>
              <li><a href="#">About</a></li>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </div>

          {/* Get Started */}
          <div className="footer-col">
            <h4>Get Started</h4>
            <ul>
              <li><Link to="/register">Register</Link></li>
              <li><Link to="/login">Hotel Portal</Link></li>
              <li><a href="#">Documentation</a></li>
              <li><a href="#">Support</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div>© {year} Safora. All rights reserved.</div>
          <div className="footer-legal">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer