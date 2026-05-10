import React from "react";
import { Link } from "react-router-dom";
import "./deep-training.css";

const coreCards = [
  {
    title: "Content Generation",
    lines: ["Claude / GPT-4o", "Slide text and narrative"],
  },
  {
    title: "Visual Generation",
    lines: ["DALL·E 3 / Imagen", "Unsplash API"],
  },
  {
    title: "Slide Structure",
    lines: ["Layout engine", "Theme / template"],
  },
];

const ttsCards = [
  {
    title: "ElevenLabs",
    lines: ["Rich voices", "Multilingual support"],
  },
  {
    title: "OpenAI TTS",
    lines: ["Fast and low cost", "Multiple voice styles"],
  },
  {
    title: "Azure / Google TTS",
    lines: ["Enterprise option", "SSML support"],
  },
];

const DeepTrainingFullscreenPage = () => {
  document.title = "Deep Training | Infera";

  return (
    <div className="dt-page">
      <div className="dt-topbar">
        <div>
          <h1>Deep Training Architecture</h1>
          <p>DeepWhy-style flow for training presentation generation.</p>
        </div>
        <div className="dt-topbar-actions">
          <Link to="/root-cause-manual" className="dt-btn dt-btn-secondary">
            Open DeepWhy
          </Link>
          <Link to="/dashboard" className="dt-btn dt-btn-primary">
            Back to Admin
          </Link>
        </div>
      </div>

      <div className="dt-canvas">
        <section className="dt-layer dt-input">
          <h3>INPUT</h3>
          <div className="dt-box dt-wide">
            <strong>User Intake</strong>
            <span>Text prompt / PDF upload / URL / topic heading</span>
          </div>
        </section>

        <section className="dt-layer dt-core">
          <h3>AI CORE</h3>
          <div className="dt-grid-3">
            {coreCards.map((card) => (
              <div key={card.title} className="dt-box dt-purple">
                <strong>{card.title}</strong>
                {card.lines.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </div>
            ))}
          </div>
          <div className="dt-box dt-engine">
            <strong>Presentation Creation Engine</strong>
            <span>python-pptx / reveal.js</span>
            <span>Export: PPTX / PDF / HTML</span>
          </div>
        </section>

        <section className="dt-layer dt-output">
          <h3>OUTPUT</h3>
          <div className="dt-grid-3">
            {ttsCards.map((card) => (
              <div key={card.title} className="dt-box dt-brown">
                <strong>{card.title}</strong>
                {card.lines.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </div>
            ))}
          </div>
        </section>

        <section className="dt-layer dt-voice">
          <h3>VOICE</h3>
          <div className="dt-box dt-gold">
            <strong>Voice + Slide Synchronization</strong>
            <span>FFmpeg / MoviePy</span>
            <span>Slide timing to audio sync</span>
          </div>
        </section>

        <section className="dt-layer dt-delivery">
          <h3>DELIVERY</h3>
          <div className="dt-grid-2">
            <div className="dt-box dt-blue">
              <strong>Editing Interface</strong>
              <span>React slide editor</span>
              <span>Voice speed / tone controls</span>
            </div>
            <div className="dt-box dt-blue">
              <strong>Export & Share</strong>
              <span>MP4 video / PPTX + audio</span>
              <span>Embed links / S3 upload</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DeepTrainingFullscreenPage;
