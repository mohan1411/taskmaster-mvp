import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-container">
          <div className="logo">📋 FizzTask</div>
          <div>
            <button onClick={() => navigate('/login')} className="cta-button">
              Login
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <h1>Your Emails Have Hidden Tasks.<br/>AI Finds Them in Seconds.</h1>
        <p className="subtitle">
          Stop spending 3 hours daily converting emails to tasks manually.<br/>
          Let FizzTask's AI do it automatically.
        </p>
        
        <div>
          <button onClick={() => navigate('/register')} className="cta-button">
            Get Started Free
          </button>
          <a href="#demo" className="cta-button secondary-button">
            Watch Demo
          </a>
        </div>
      </section>

      {/* Rest of your landing page content */}
      {/* Copy relevant sections from public/index.html */}
    </div>
  );
};

export default LandingPage;
