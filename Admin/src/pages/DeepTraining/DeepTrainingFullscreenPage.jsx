import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./deep-training.css";

const FILTERS = [
  "All",
  "Education",
  "Business",
  "Creative",
  "Pitch Deck",
  "Startups",
  "Sales",
];

/** Training module cards — same mental model as template gallery */
const MODULES = [
  {
    id: "m1",
    category: "Education",
    title: "Microlearning sprint",
    subtitle: "5-slide drill + quiz",
    image:
      "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?w=800&q=80",
  },
  {
    id: "m2",
    category: "Education",
    title: "Safety briefing deck",
    subtitle: "Photo + voice narration",
    image:
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80",
  },
  {
    id: "m3",
    category: "Business",
    title: "QBR storyline",
    subtitle: "Metrics + executive summary",
    image:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80",
  },
  {
    id: "m4",
    category: "Creative",
    title: "Brand narrative",
    subtitle: "Bold visuals + typography",
    image:
      "https://images.unsplash.com/photo-1557804506-669353633995?w=800&q=80",
  },
  {
    id: "m5",
    category: "Pitch Deck",
    title: "Seed pitch pack",
    subtitle: "Problem → traction → ask",
    image:
      "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&q=80",
  },
  {
    id: "m6",
    category: "Startups",
    title: "Product demo flow",
    subtitle: "Screens + voice-over cues",
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
  },
  {
    id: "m7",
    category: "Sales",
    title: "Enterprise ROI story",
    subtitle: "Proof points + comparison",
    image:
      "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=80",
  },
  {
    id: "m8",
    category: "Education",
    title: "Onboarding 101",
    subtitle: "Day-one essentials",
    image:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80",
  },
  {
    id: "m9",
    category: "Business",
    title: "Consulting engagement",
    subtitle: "Structured storyline",
    image:
      "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80",
  },
];

const DeepTrainingFullscreenPage = () => {
  document.title = "Deep Training | Infera";

  const [activeFilter, setActiveFilter] = useState("All");

  const visible = useMemo(() => {
    if (activeFilter === "All") return MODULES;
    return MODULES.filter((m) => m.category === activeFilter);
  }, [activeFilter]);

  return (
    <div className="dt-shell">
      <header className="dt-shell-header">
        <div className="dt-shell-header-inner">
          <div className="dt-shell-brand">
            <span className="dt-shell-brand-mark">DT</span>
            <span className="dt-shell-brand-text">Deep Training</span>
          </div>
          <div className="dt-shell-header-actions">
            <span className="dt-shell-trial">Trial workspace</span>
            <Link to="/root-cause-manual" className="dt-btn dt-btn-ghost">
              Open DeepWhy
            </Link>
            <Link to="/dashboard" className="dt-btn dt-btn-solid">
              Back to Admin
            </Link>
          </div>
        </div>
      </header>

      <main className="dt-main">
        <h1 className="dt-page-title">Training modules</h1>
        <p className="dt-page-lead">
          Pick a starting layout for AI-generated education decks — same flow as
          template galleries.
        </p>

        <div className="dt-filter-row" role="tablist" aria-label="Categories">
          {FILTERS.map((label) => (
            <button
              key={label}
              type="button"
              role="tab"
              aria-selected={activeFilter === label}
              className={
                activeFilter === label ? "dt-chip dt-chip-active" : "dt-chip"
              }
              onClick={() => setActiveFilter(label)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="dt-card-grid">
          {visible.map((item) => (
            <article key={item.id} className="dt-card">
              <div className="dt-card-media">
                <img src={item.image} alt="" loading="lazy" />
                <div className="dt-card-overlay">
                  <button type="button" className="dt-card-cta">
                    + Use this template
                  </button>
                </div>
              </div>
              <footer className="dt-card-footer">
                <span className="dt-card-logo" aria-hidden>
                  I
                </span>
                <div className="dt-card-text">
                  <h2 className="dt-card-title">{item.title}</h2>
                  <p className="dt-card-meta">
                    {item.subtitle} · Created by Infera
                  </p>
                </div>
              </footer>
            </article>
          ))}
        </div>

        {visible.length === 0 && (
          <p className="dt-empty">No modules in this category yet.</p>
        )}
      </main>
    </div>
  );
};

export default DeepTrainingFullscreenPage;
