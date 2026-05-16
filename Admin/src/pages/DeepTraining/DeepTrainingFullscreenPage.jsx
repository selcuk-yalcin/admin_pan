import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./deep-training.css";

const FILTERS = ["All", "İş Güvenliği", "Fire Protection"];

/** Starter decks for Deep Training — occupational safety and fire protection */
const MODULES = [
  {
    id: "occ-safety",
    category: "İş Güvenliği",
    title: "İş Güvenliği",
    subtitle:
      "KKD, makine ve elektrik güvenliği, ergonomi, risk değerlendirme özeti ve olay bildirimi modüllerinden oluşan İSG eğitim iskeleti.",
    image:
      "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&q=80",
  },
  {
    id: "fire-protection",
    category: "Fire Protection",
    title: "Fire Protection",
    subtitle:
      "Yangın önleme, algılama ve alarm, söndürücü seçimi / kullanımı, tahliye planı ve tatbikat vurguları ile yangın güvenliği eğitim akışı.",
    image:
      "https://images.unsplash.com/photo-1587825140708-dfaf72ae436b?w=800&q=80",
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
    <div className="dt-layout">
      <aside className="dt-side">
        <div className="dt-side-title">Deep Training</div>
        <nav className="dt-side-nav">
          <Link to="/dashboard" className="dt-side-item">
            Home
          </Link>
          <div className="dt-side-item">Projects</div>
          <Link to="/create-project" className="dt-side-item">
            Create project <span className="dt-pro-badge">PRO</span>
          </Link>
          <div className="dt-side-item">Hire an expert</div>
          <div className="dt-side-item dt-side-item-active">Deep Training</div>
        </nav>
      </aside>

      <div className="dt-shell">
        <header className="dt-shell-header">
          <div className="dt-shell-header-inner">
            <div className="dt-shell-brand">
              <span className="dt-shell-brand-mark">DT</span>
              <span className="dt-shell-brand-text">Deep Training</span>
            </div>
            <div className="dt-shell-header-actions">
              <span className="dt-shell-trial">Trial workspace</span>
              <button type="button" className="dt-btn dt-btn-ghost">
                Turkish
              </button>
              <button type="button" className="dt-btn dt-btn-ghost">
                Light
              </button>
              <Link to="/root-cause-manual" className="dt-btn dt-btn-ghost">
                Open DeepWhy
              </Link>
              <Link to="/dashboard" className="dt-btn dt-btn-solid">
                Admin Panel
              </Link>
            </div>
          </div>
        </header>

        <main className="dt-main">
          <h1 className="dt-page-title">Deep Training</h1>
          <p className="dt-page-lead">
            İş Güvenliği ve Fire Protection için yapay zekâ destekli eğitim
            sunumlarına başlangıç şablonları seçin.
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
                    <Link
                      to={`/create-project?template=${encodeURIComponent(item.id)}`}
                      className="dt-card-cta"
                    >
                      + Use this template
                    </Link>
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
    </div>
  );
};

export default DeepTrainingFullscreenPage;
