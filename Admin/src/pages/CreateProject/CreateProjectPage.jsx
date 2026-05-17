import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./create-project.css";

const TEMPLATES = [
  { id: "occ-safety", label: "İş Güvenliği" },
  { id: "fire-protection", label: "Fire Protection" },
];

const SLIDE_LENGTHS = [
  { value: "auto", label: "Yapay zekâ karar versin" },
  { value: "summary", label: "Tek özet slaytı" },
  { value: "short", label: "Kısa (2–5 slayt)" },
  { value: "medium", label: "Orta (6–15 slayt)" },
  { value: "long", label: "Uzun (15+ slayt) PRO" },
];

const TIERS = [
  { value: "standard", label: "Standard — hızlı" },
  { value: "pro", label: "Pro — daha iyi kalite" },
  { value: "ultra", label: "Ultra — maksimum kalite" },
];

const ROLES = [
  { value: "", label: "Rol seçin (isteğe bağlı)" },
  { value: "leadership", label: "Leadership" },
  { value: "sales", label: "Sales" },
  { value: "marketing", label: "Marketing" },
  { value: "product", label: "Product" },
  { value: "design", label: "Design" },
  { value: "engineering", label: "Engineering" },
];

const LANGS = [
  { value: "tr", label: "Türkçe" },
  { value: "en", label: "English" },
  { value: "auto", label: "Otomatik" },
];

const SLIDE_TYPE_LABEL = {
  title: "Giriş",
  section: "Bölüm",
  bullets: "İçerik",
  content: "İçerik",
  two_column: "İki sütun",
};

const THEME_PRESETS = [
  {
    id: "corporate",
    label: "Kurumsal mavi",
    colors: {
      primary: "#1e3a5f",
      accent: "#c2410c",
      background: "#f8fafc",
      text: "#0f172a",
    },
  },
  {
    id: "dark",
    label: "Koyu stüdyo",
    colors: {
      primary: "#0f172a",
      accent: "#f97316",
      background: "#1e293b",
      text: "#f1f5f9",
    },
  },
  {
    id: "safety",
    label: "İSG yeşil",
    colors: {
      primary: "#14532d",
      accent: "#ca8a04",
      background: "#ecfdf5",
      text: "#14532d",
    },
  },
  {
    id: "fire",
    label: "Yangın kırmızı",
    colors: {
      primary: "#7f1d1d",
      accent: "#ea580c",
      background: "#fef2f2",
      text: "#450a0a",
    },
  },
];

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = String(r.result || "");
      const i = s.indexOf("base64,");
      resolve(i >= 0 ? s.slice(i + 7) : s);
    };
    r.onerror = () => reject(new Error("read failed"));
    r.readAsDataURL(file);
  });
}

function slideLabel(slide) {
  if (!slide || typeof slide !== "object") return "Slayt";
  return (
    String(slide.title || slide.heading || slide.subtitle || "Slayt").trim() ||
    "Slayt"
  );
}

function slideIntentTag(slide) {
  const t = slide?.type || "content";
  return SLIDE_TYPE_LABEL[t] || "İçerik";
}

const CreateProjectPage = () => {
  document.title = "Create project | Infera";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTemplate = searchParams.get("template") || "occ-safety";

  /** @type {'resource' | 'configure' | 'processing' | 'outline' | 'editor'} */
  const [step, setStep] = useState("resource");
  const [templateId, setTemplateId] = useState(
    TEMPLATES.some((t) => t.id === initialTemplate) ? initialTemplate : "occ-safety"
  );
  const [slideLength, setSlideLength] = useState("auto");
  const [tier, setTier] = useState("standard");
  const [language, setLanguage] = useState("tr");
  const [role, setRole] = useState("");
  const [prompt, setPrompt] = useState("");
  const [publicUrl, setPublicUrl] = useState("");
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [jobId, setJobId] = useState("");
  const [jobStage, setJobStage] = useState("");
  const [events, setEvents] = useState([]);
  const [deck, setDeck] = useState(null);
  const [expandedOutline, setExpandedOutline] = useState({});
  const [selectedSlide, setSelectedSlide] = useState(0);
  const [useTts, setUseTts] = useState(false);
  const [useSlideImages, setUseSlideImages] = useState(false);
  const [useVideo, setUseVideo] = useState(false);
  const [hasMp4, setHasMp4] = useState(false);
  const [workingDeck, setWorkingDeck] = useState(null);
  const [undoPast, setUndoPast] = useState([]);
  const [undoFuture, setUndoFuture] = useState([]);
  const [rightPanel, setRightPanel] = useState(null);
  const [presenterOpen, setPresenterOpen] = useState(false);
  const [presenterIdx, setPresenterIdx] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [hasAudioManifest, setHasAudioManifest] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);
  const pollRef = useRef(null);
  const eventSourceRef = useRef(null);

  const apiBase = useMemo(
    () =>
      (import.meta.env.VITE_TRAINING_API_URL || "http://127.0.0.1:8000").replace(
        /\/$/,
        ""
      ),
    []
  );

  const onPickFiles = useCallback((e) => {
    const list = e.target.files;
    if (!list?.length) return;
    const next = [];
    for (let i = 0; i < list.length; i += 1) {
      const f = list[i];
      if (!f.name.toLowerCase().endsWith(".pdf")) {
        setError("Yalnızca PDF dosyaları yüklenebilir.");
        continue;
      }
      next.push({
        id: `${f.name}-${f.size}-${Date.now()}-${i}`,
        name: f.name,
        file: f,
      });
    }
    if (next.length) setError("");
    setFiles((prev) => [...prev, ...next]);
    e.target.value = "";
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const dt = e.dataTransfer;
    if (!dt?.files?.length) return;
    const fake = { target: { files: dt.files, value: "" } };
    onPickFiles(fake);
  }, [onPickFiles]);

  const removeFile = useCallback((id) => {
    setFiles((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const toggleOutline = useCallback((idx) => {
    setExpandedOutline((prev) => ({ ...prev, [idx]: !prev[idx] }));
  }, []);

  const withHistory = useCallback((nextDeck) => {
    setWorkingDeck((prev) => {
      if (prev) {
        setUndoPast((p) => [...p.slice(-49), deepClone(prev)]);
      }
      return nextDeck;
    });
    setUndoFuture([]);
  }, []);

  const undo = useCallback(() => {
    setUndoPast((p) => {
      if (!p.length) return p;
      const snap = p[p.length - 1];
      setWorkingDeck((cur) => {
        if (cur) {
          setUndoFuture((f) => [deepClone(cur), ...f.slice(0, 49)]);
        }
        return deepClone(snap);
      });
      return p.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setUndoFuture((f) => {
      if (!f.length) return f;
      const snap = f[0];
      setWorkingDeck((cur) => {
        if (cur) {
          setUndoPast((p) => [...p.slice(-49), deepClone(cur)]);
        }
        return deepClone(snap);
      });
      return f.slice(1);
    });
  }, []);

  const saveDeckToServer = useCallback(async () => {
    if (!workingDeck || !jobId) return;
    setSaveStatus("saving");
    try {
      const r = await fetch(`${apiBase}/presentations/${jobId}/deck`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(workingDeck),
      });
      if (!r.ok) {
        const t = await r.text();
        throw new Error(t || r.statusText);
      }
      setDeck(deepClone(workingDeck));
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (e) {
      console.error(e);
      setSaveStatus("error");
    }
  }, [workingDeck, jobId, apiBase]);

  const updateCurSlide = useCallback(
    (patch) => {
      if (!workingDeck) return;
      const next = deepClone(workingDeck);
      const sl = next.slides[selectedSlide];
      if (!sl || typeof sl !== "object") return;
      Object.assign(sl, patch);
      withHistory(next);
    },
    [workingDeck, selectedSlide, withHistory]
  );

  const applyThemePreset = useCallback(
    (preset) => {
      if (!workingDeck) return;
      const next = deepClone(workingDeck);
      next.meta = next.meta || {};
      const prevTheme = next.meta.theme || {};
      next.meta.theme = {
        ...prevTheme,
        name: preset.id,
        colors: { ...(prevTheme.colors || {}), ...preset.colors },
        fonts: prevTheme.fonts || { heading: "Calibri", body: "Calibri" },
      };
      withHistory(next);
    },
    [workingDeck, withHistory]
  );

  const addSlide = useCallback(() => {
    if (!workingDeck) return;
    const next = deepClone(workingDeck);
    next.slides = [...(next.slides || []), { type: "bullets", title: "Yeni slayt", bullets: [] }];
    withHistory(next);
    setSelectedSlide(next.slides.length - 1);
  }, [workingDeck, withHistory]);

  const duplicateSlide = useCallback(() => {
    if (!workingDeck) return;
    const slides0 = workingDeck.slides || [];
    if (!slides0[selectedSlide]) return;
    const next = deepClone(workingDeck);
    const copy = deepClone(slides0[selectedSlide]);
    next.slides = [...next.slides];
    next.slides.splice(selectedSlide + 1, 0, copy);
    withHistory(next);
    setSelectedSlide(selectedSlide + 1);
  }, [workingDeck, selectedSlide, withHistory]);

  const removeSlide = useCallback(() => {
    if (!workingDeck) return;
    const slides0 = workingDeck.slides || [];
    if (slides0.length < 2) return;
    const next = deepClone(workingDeck);
    next.slides = next.slides.filter((_, i) => i !== selectedSlide);
    withHistory(next);
    setSelectedSlide((i) => Math.max(0, i - 1));
  }, [workingDeck, selectedSlide, withHistory]);

  const copyEmbedSnippet = useCallback(async () => {
    const iframe = `<iframe title="Sunum" src="${apiBase}/presentations/${jobId}/embed/html" width="960" height="540" style="border:0;border-radius:8px;max-width:100%" loading="lazy" allowfullscreen></iframe>`;
    try {
      await navigator.clipboard.writeText(iframe);
      setEmbedCopied(true);
      setTimeout(() => setEmbedCopied(false), 2500);
    } catch {
      setEmbedCopied(false);
    }
  }, [apiBase, jobId]);

  const buildSources = useCallback(async () => {
    const pdfSources = [];
    for (const item of files) {
      if (!item.file) continue;
      const b64 = await readFileAsBase64(item.file);
      pdfSources.push({
        type: "pdf_base64",
        data: b64,
        filename: item.name,
      });
    }
    const url = publicUrl.trim();
    if (url) {
      pdfSources.push({ type: "url", url });
    }
    return pdfSources;
  }, [files, publicUrl]);

  const startGeneration = async () => {
    setError("");
    const hasInput =
      prompt.trim() ||
      files.length > 0 ||
      publicUrl.trim().length > 0;
    if (!hasInput) {
      setError("En az bir kaynak girin: PDF, genel URL veya açıklama metni.");
      return;
    }
    setSubmitting(true);
    try {
      const sources = await buildSources();
      const body = {
        template_id: templateId,
        prompt: prompt.trim(),
        sources,
        tier,
        language: language === "auto" ? null : language,
        slide_length: slideLength,
        role: role || null,
        use_llm: false,
        theme: "default",
        use_tts: useTts,
        use_slide_images: useSlideImages,
        use_video: useVideo && useTts,
      };
      const res = await fetch(`${apiBase}/presentations/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      let data = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }
      if (!res.ok) {
        const msg =
          typeof data.detail === "string"
            ? data.detail
            : Array.isArray(data.detail)
            ? data.detail.map((d) => d.msg || d).join(", ")
            : res.statusText || "İstek başarısız";
        throw new Error(msg);
      }
      const jid = data.job_id;
      if (!jid) throw new Error("job_id yok");
      setJobId(jid);
      setStep("processing");
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (step !== "processing" || !jobId) return undefined;

    let cancelled = false;

    const finishJob = async (stage) => {
      if (cancelled) return;
      setJobStage(stage);
      if (stage === "done") {
        const [dRes, jRes] = await Promise.all([
          fetch(`${apiBase}/presentations/${jobId}/deck`),
          fetch(`${apiBase}/presentations/${jobId}`),
        ]);
        if (dRes.ok && !cancelled) {
          setDeck(await dRes.json());
          if (jRes.ok) {
            const j = await jRes.json();
            setHasMp4(!!j.has_mp4);
          }
          setStep("outline");
        }
      } else if (stage === "failed") {
        const jRes = await fetch(`${apiBase}/presentations/${jobId}`);
        if (jRes.ok) {
          const j = await jRes.json();
          setError(j.error || "İş başarısız");
        } else {
          setError("İş başarısız");
        }
      }
    };

    const startPollFallback = () => {
      const tick = async () => {
        try {
          const [evRes, jobRes] = await Promise.all([
            fetch(`${apiBase}/presentations/${jobId}/events`),
            fetch(`${apiBase}/presentations/${jobId}`),
          ]);
          if (!evRes.ok || !jobRes.ok || cancelled) return;
          const evJson = await evRes.json();
          const jobJson = await jobRes.json();
          if (cancelled) return;
          setEvents(evJson.events || []);
          if (jobJson.stage === "done" || jobJson.stage === "failed") {
            if (pollRef.current) {
              window.clearInterval(pollRef.current);
              pollRef.current = null;
            }
            await finishJob(jobJson.stage);
          } else {
            setJobStage(jobJson.stage || "");
          }
        } catch {
          /* ignore */
        }
      };
      tick();
      pollRef.current = window.setInterval(tick, 600);
    };

    if (typeof EventSource !== "undefined") {
      const es = new EventSource(
        `${apiBase}/presentations/${jobId}/events/stream`
      );
      eventSourceRef.current = es;
      es.onmessage = (ev) => {
        if (cancelled) return;
        try {
          const data = JSON.parse(ev.data);
          if (data.error) return;
          setEvents((prev) => [...prev, data]);
          if (data.stage) setJobStage(data.stage);
          if (data.stage === "done" || data.stage === "failed") {
            es.close();
            eventSourceRef.current = null;
            finishJob(data.stage);
          }
        } catch {
          /* ignore malformed */
        }
      };
      es.onerror = () => {
        es.close();
        eventSourceRef.current = null;
        if (!cancelled) startPollFallback();
      };
    } else {
      startPollFallback();
    }

    return () => {
      cancelled = true;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [step, jobId, apiBase]);

  useEffect(() => {
    if (step !== "editor" || !jobId) return;
    fetch(`${apiBase}/presentations/${jobId}/audio-manifest`)
      .then((r) => setHasAudioManifest(r.ok))
      .catch(() => setHasAudioManifest(false));
  }, [step, jobId, apiBase]);

  useEffect(() => {
    const a = audioRef.current;
    if (a) a.playbackRate = playbackRate;
  }, [playbackRate, selectedSlide]);

  useEffect(() => {
    if (!presenterOpen) return undefined;
    const slidesLen = (workingDeck?.slides || []).length;
    const onKey = (e) => {
      if (e.key === "Escape") {
        setPresenterOpen(false);
        return;
      }
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        setPresenterIdx((i) => Math.min(slidesLen - 1, i + 1));
      }
      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        setPresenterIdx((i) => Math.max(0, i - 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [presenterOpen, workingDeck]);

  useEffect(() => {
    if (step === "editor" && deck && workingDeck === null) {
      setWorkingDeck(deepClone(deck));
      setUndoPast([]);
      setUndoFuture([]);
    }
  }, [step, deck, workingDeck]);

  const lastEvent = events.length ? events[events.length - 1] : null;
  const lastDetail = lastEvent?.detail || "";
  const planningDone = ["research", "generating", "layout", "tts", "done"].includes(
    jobStage
  );
  const researchLineDone = ["generating", "layout", "tts", "done"].includes(jobStage);
  const generatingActive =
    jobStage === "generating" ||
    jobStage === "layout" ||
    jobStage === "tts";

  const header = (
    <header className="cp-wizard-header">
      <button
        type="button"
        className="cp-icon-btn"
        aria-label="Geri"
        onClick={() => {
          if (step === "resource") navigate("/deep-training");
          else if (step === "configure") setStep("resource");
          else if (step === "outline") setStep("configure");
          else if (step === "editor") {
            setStep("outline");
            setRightPanel(null);
            setPresenterOpen(false);
          } else if (step === "processing") {
            /* no cancel API */
          }
        }}
      >
        ←
      </button>
      <button
        type="button"
        className="cp-icon-btn cp-icon-btn--right"
        aria-label="Kapat"
        onClick={() => navigate("/deep-training")}
      >
        ×
      </button>
    </header>
  );

  const resourceStep = (
    <div className="cp-wizard-inner">
      {header}
      <h1 className="cp-wizard-title">Kaynağı dosya veya genel bağlantı ile paylaşın</h1>
      <p className="cp-wizard-lead">
        PDF yükleyin veya herkese açık bir sayfa URL’si girin. Sonraki adımda talimat ve
        şablon seçeceksiniz.
      </p>

      <div
        className="cp-resource-drop"
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        role="presentation"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          style={{ display: "none" }}
          onChange={onPickFiles}
        />
        <div className="cp-resource-icons">PDF</div>
        <p className="cp-resource-cta">Yüklemek için tıklayın veya sürükleyip bırakın</p>
        <p className="cp-resource-hint">Şimdilik yalnızca .pdf — diğer formatlar motor tarafında genişletilecek.</p>
      </div>

      <div className="cp-or">veya</div>

      <label className="cp-url-label">
        <span>Genel URL</span>
        <input
          type="url"
          className="cp-url-input"
          placeholder="https://…"
          value={publicUrl}
          onChange={(e) => setPublicUrl(e.target.value)}
        />
      </label>

      {files.length > 0 && (
        <div className="cp-files cp-files--center">
          {files.map((f) => (
            <div key={f.id} className="cp-file-chip cp-file-chip.ok">
              <span>✓ {f.name}</span>
              <button type="button" onClick={() => removeFile(f.id)}>×</button>
            </div>
          ))}
        </div>
      )}

      {error && step === "resource" && <div className="cp-error">{error}</div>}

      <div className="cp-actions">
        <button type="button" className="cp-submit" onClick={() => setStep("configure")}>
          İleri
        </button>
      </div>
    </div>
  );

  const configureStep = (
    <div className="cp-wizard-inner cp-wizard-inner--wide">
      {header}
      <h1 className="cp-wizard-title">Sunumu yapılandırın</h1>
      <p className="cp-wizard-lead">
        Şablon, dil, slayt uzunluğu ve model katmanı. Ardından motor işini başlatır.
      </p>

      <div className="cp-toolbar">
        <select
          className="cp-select"
          value={slideLength}
          onChange={(e) => setSlideLength(e.target.value)}
          aria-label="Slayt sayısı"
        >
          {SLIDE_LENGTHS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select className="cp-select" value={tier} onChange={(e) => setTier(e.target.value)}>
          {TIERS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select className="cp-select" value={language} onChange={(e) => setLanguage(e.target.value)}>
          {LANGS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select className="cp-select" value={role} onChange={(e) => setRole(e.target.value)}>
          {ROLES.map((o) => (
            <option key={o.value || "none"} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select className="cp-select" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
          {TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>Şablon: {t.label}</option>
          ))}
        </select>
      </div>

      <div className="cp-options">
        <label className="cp-check">
          <input type="checkbox" checked={useSlideImages} onChange={(e) => setUseSlideImages(e.target.checked)} />
          <span>Slayt görselleri (AI)</span>
        </label>
        <label className="cp-check">
          <input
            type="checkbox"
            checked={useTts}
            onChange={(e) => {
              setUseTts(e.target.checked);
              if (!e.target.checked) setUseVideo(false);
            }}
          />
          <span>Seslendirme (TTS)</span>
        </label>
        <label className="cp-check">
          <input
            type="checkbox"
            checked={useVideo}
            disabled={!useTts}
            onChange={(e) => setUseVideo(e.target.checked)}
          />
          <span>MP4 video (TTS + FFmpeg)</span>
        </label>
      </div>

      <div className="cp-dropzone">
        <div className="cp-files">
          {files.map((f) => (
            <div key={f.id} className="cp-file-chip">
              <span>📎 {f.name}</span>
              <button type="button" onClick={() => removeFile(f.id)}>×</button>
            </div>
          ))}
        </div>
        <textarea
          className="cp-textarea"
          placeholder="Ekli dosya veya URL ile sunum oluştur… Hedef kitle, ton, vurgular."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </div>

      {error && <div className="cp-error">{error}</div>}

      <div className="cp-actions cp-actions--split">
        <button type="button" className="cp-btn-ghost" onClick={() => setStep("resource")}>
          Geri
        </button>
        <button
          type="button"
          className="cp-submit"
          disabled={submitting}
          onClick={startGeneration}
        >
          {submitting ? "Başlatılıyor…" : "Sunumu oluştur"}
        </button>
      </div>
    </div>
  );

  const contextBubble = (
    <div className="cp-context-bubble">
      {files[0] && (
        <div className="cp-context-file">
          <span className="cp-context-check">✓</span>
          <span className="cp-context-name">{files[0].name}</span>
        </div>
      )}
      {publicUrl && !files[0] && (
        <div className="cp-context-file">
          <span className="cp-context-check">✓</span>
          <span className="cp-context-name">
            {publicUrl.length > 52 ? `${publicUrl.slice(0, 52)}…` : publicUrl}
          </span>
        </div>
      )}
      <p className="cp-context-text">
        {prompt.trim() || "Ekteki kaynaklarla eğitim sunumu oluşturuluyor."}
      </p>
    </div>
  );

  const processingStep = (
    <div className="cp-wizard-inner">
      {header}
      {contextBubble}

      <div className="cp-stepper">
        <div
          className={`cp-step ${
            planningDone ? "cp-step--done" : jobStage === "planning" || jobStage === "queued"
              ? "cp-step--active"
              : ""
          }`}
        >
          <span className="cp-step-icon">{planningDone ? "✓" : "📋"}</span>
          <div>
            <div className="cp-step-title">Planlama</div>
            <div className="cp-step-sub">Motor şablonu ve katalogla hizalanıyor</div>
          </div>
        </div>
        <div
          className={`cp-step ${
            researchLineDone
              ? "cp-step--done"
              : jobStage === "research"
                ? "cp-step--active"
                : ""
          }`}
        >
          <span className="cp-step-icon">{researchLineDone ? "✓" : "◎"}</span>
          <div>
            <div className="cp-step-title">İçerik analizi</div>
            <div className="cp-step-sub">Kaynaklar birleştirildi</div>
          </div>
        </div>
        <div
          className={`cp-step ${
            jobStage === "done"
              ? "cp-step--done"
              : generatingActive
                ? "cp-step--active"
                : ""
          }`}
        >
          <span className="cp-step-icon">✦</span>
          <div>
            <div className="cp-step-title">Üretim</div>
            <div className="cp-step-sublines">
              {lastDetail && <p className="cp-thinking-text">{lastDetail}</p>}
              <ul className="cp-subtasks">
                <li>Slayt gövdesi</li>
                <li>Tema uygulaması</li>
                <li>Ses manifesti (planlama)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="cp-footer-status">
        {jobStage !== "failed" && <span className="cp-spinner" aria-hidden />}
        {jobStage === "failed" ? (error || "Hata") : "Oluşturuluyor…"}
      </div>
      {jobStage === "failed" && error && (
        <div className="cp-error cp-error--center">{error}</div>
      )}
    </div>
  );

  const outlineSlides =
    deck?.slides && Array.isArray(deck.slides) ? deck.slides : [];

  const outlineStep = (
    <div className="cp-wizard-inner cp-wizard-inner--wide">
      {header}
      <h1 className="cp-wizard-title">Slayt özeti</h1>
      <p className="cp-wizard-lead">Kartları genişleterek içeriği gözden geçirin.</p>

      <div className="cp-outline-list">
        {outlineSlides.length === 0 && (
          <p className="cp-outline-empty">Slayt listesi boş veya deck yüklenemedi.</p>
        )}
        {outlineSlides.map((slide, idx) => {
          const open = !!expandedOutline[idx];
          return (
            <div key={idx} className={`cp-outline-card ${open ? "cp-outline-card--open" : ""}`}>
              <button
                type="button"
                className="cp-outline-row"
                onClick={() => toggleOutline(idx)}
              >
                <span className="cp-outline-num">{idx + 1}.</span>
                <span className="cp-outline-title">{slideLabel(slide)}</span>
                <span className="cp-outline-tag">{slideIntentTag(slide)}</span>
                <span className="cp-outline-chev">{open ? "⌃" : "⌄"}</span>
              </button>
              {open && (
                <div className="cp-outline-body">
                  {slide.subtitle && <p className="cp-outline-sub"><em>{slide.subtitle}</em></p>}
                  {Array.isArray(slide.bullets) && (
                    <ul>
                      {slide.bullets.map((b, i) => (
                        <li key={i}>{String(b)}</li>
                      ))}
                    </ul>
                  )}
                  {slide.left && <p>{String(slide.left)}</p>}
                  {slide.right && <p>{String(slide.right)}</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="cp-actions">
        <button
          type="button"
          className="cp-submit"
          onClick={() => {
            setUndoPast([]);
            setUndoFuture([]);
            setWorkingDeck(deepClone(deck));
            setSelectedSlide(0);
            setRightPanel(null);
            setStep("editor");
          }}
        >
          Düzenleyiciye geç
        </button>
      </div>
    </div>
  );

  const edSlides =
    workingDeck?.slides && Array.isArray(workingDeck.slides)
      ? workingDeck.slides
      : [];
  const curSlide = edSlides[selectedSlide] || {};
  const themeTokens = workingDeck?.meta?.theme || {};
  const th = themeTokens.colors || {};

  const editorStep = (
    <div className="cp-editor cp-editor-v2">
      {header}
      <div className="cp-editor-top">
        <span className="cp-editor-brand">
          {workingDeck?.meta?.title || "Deep Training"}
        </span>
        <div className="cp-editor-top-actions">
          <button
            type="button"
            className="cp-btn-toolbar"
            disabled={!undoPast.length}
            onClick={undo}
            title="Geri al"
          >
            ↶
          </button>
          <button
            type="button"
            className="cp-btn-toolbar"
            disabled={!undoFuture.length}
            onClick={redo}
            title="Yinele"
          >
            ↷
          </button>
          <button
            type="button"
            className={`cp-btn-toolbar ${rightPanel === "theme" ? "cp-btn-toolbar--on" : ""}`}
            onClick={() => setRightPanel((p) => (p === "theme" ? null : "theme"))}
          >
            Tema
          </button>
          <button
            type="button"
            className={`cp-btn-toolbar ${rightPanel === "voice" ? "cp-btn-toolbar--on" : ""}`}
            onClick={() => setRightPanel((p) => (p === "voice" ? null : "voice"))}
          >
            Ses
          </button>
          <button
            type="button"
            className={`cp-btn-toolbar ${rightPanel === "share" ? "cp-btn-toolbar--on" : ""}`}
            onClick={() => setRightPanel((p) => (p === "share" ? null : "share"))}
          >
            Paylaş
          </button>
          <button
            type="button"
            className="cp-btn-toolbar cp-btn-toolbar--accent"
            onClick={() => {
              setPresenterIdx(selectedSlide);
              setPresenterOpen(true);
            }}
          >
            Sunum
          </button>
          <button
            type="button"
            className="cp-btn-toolbar cp-btn-save"
            onClick={saveDeckToServer}
            disabled={saveStatus === "saving"}
          >
            {saveStatus === "saving"
              ? "Kaydediliyor…"
              : saveStatus === "saved"
                ? "Kaydedildi"
                : saveStatus === "error"
                  ? "Hata — tekrar"
                  : "Kaydet"}
          </button>
          <a
            className="cp-editor-export"
            href={`${apiBase}/presentations/${jobId}/export/pptx`}
            target="_blank"
            rel="noreferrer"
          >
            PPTX
          </a>
          <a
            className="cp-btn-ghost cp-export-link"
            href={`${apiBase}/presentations/${jobId}/export/html`}
            target="_blank"
            rel="noreferrer"
          >
            HTML
          </a>
          {hasMp4 && (
            <a
              className="cp-editor-export cp-editor-export--secondary"
              href={`${apiBase}/presentations/${jobId}/export/mp4`}
              target="_blank"
              rel="noreferrer"
            >
              MP4
            </a>
          )}
        </div>
      </div>

      <div
        className={`cp-editor-body cp-editor-body--panels${
          rightPanel ? " cp-editor-body--with-panel" : ""
        }`}
      >
        <aside className="cp-editor-rail">
          <div className="cp-editor-rail-head">
            <div className="cp-editor-rail-title">Slaytlar</div>
            <button type="button" className="cp-rail-add" onClick={addSlide} title="Slayt ekle">
              +
            </button>
          </div>
          {edSlides.map((s, i) => (
            <button
              key={i}
              type="button"
              className={`cp-editor-thumb ${i === selectedSlide ? "cp-editor-thumb--on" : ""}`}
              onClick={() => setSelectedSlide(i)}
            >
              <span className="cp-editor-thumb-num">{i + 1}</span>
              <span className="cp-editor-thumb-t">{slideLabel(s)}</span>
            </button>
          ))}
        </aside>

        <div className="cp-editor-center">
          <div
            className="cp-slide-frame"
            style={{
              "--cp-slide-bg": th.background || "#f8fafc",
              "--cp-slide-text": th.text || "#0f172a",
              "--cp-slide-primary": th.primary || "#1e3a5f",
              "--cp-slide-accent": th.accent || "#c2410c",
            }}
          >
            {curSlide.image_path && (
              <img
                className="cp-slide-hero"
                src={`${apiBase}/presentations/${jobId}/slides/${selectedSlide}/image`}
                alt=""
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            )}
            <div className="cp-slide-inner">
              <span className="cp-slide-type-pill">{slideIntentTag(curSlide)}</span>
              <h2 className="cp-slide-title-display">{slideLabel(curSlide)}</h2>
              {curSlide.subtitle && (
                <p className="cp-slide-sub-display">{curSlide.subtitle}</p>
              )}
              {curSlide.type === "two_column" && (curSlide.left || curSlide.right) && (
                <div className="cp-slide-two-col">
                  <div>{curSlide.left}</div>
                  <div>{curSlide.right}</div>
                </div>
              )}
              {curSlide.type !== "two_column" && Array.isArray(curSlide.bullets) && curSlide.bullets.length > 0 && (
                <ul className="cp-slide-bullets-display">
                  {curSlide.bullets.map((b, i) => (
                    <li key={i}>{String(b)}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="cp-editor-inspector">
            <div className="cp-inspector-row">
              <label className="cp-inspector-label">Başlık</label>
              <input
                type="text"
                className="cp-inspector-input"
                value={curSlide.title || ""}
                onChange={(e) => updateCurSlide({ title: e.target.value })}
              />
            </div>
            <div className="cp-inspector-row">
              <label className="cp-inspector-label">Alt başlık</label>
              <input
                type="text"
                className="cp-inspector-input"
                value={curSlide.subtitle || ""}
                onChange={(e) => updateCurSlide({ subtitle: e.target.value })}
              />
            </div>
            {(curSlide.type === "bullets" ||
              curSlide.type === "content" ||
              !curSlide.type) && (
              <div className="cp-inspector-row cp-inspector-row--stack">
                <label className="cp-inspector-label">Madde işaretleri (satır başına bir)</label>
                <textarea
                  className="cp-inspector-textarea"
                  rows={5}
                  value={Array.isArray(curSlide.bullets) ? curSlide.bullets.join("\n") : ""}
                  onChange={(e) => {
                    const lines = e.target.value.split("\n").map((l) => l.trimEnd());
                    updateCurSlide({
                      bullets: lines.map((l) => l.trim()).filter(Boolean),
                    });
                  }}
                />
              </div>
            )}
            {curSlide.type === "two_column" && (
              <>
                <div className="cp-inspector-row cp-inspector-row--stack">
                  <label className="cp-inspector-label">Sol sütun</label>
                  <textarea
                    className="cp-inspector-textarea"
                    rows={4}
                    value={curSlide.left || ""}
                    onChange={(e) => updateCurSlide({ left: e.target.value })}
                  />
                </div>
                <div className="cp-inspector-row cp-inspector-row--stack">
                  <label className="cp-inspector-label">Sağ sütun</label>
                  <textarea
                    className="cp-inspector-textarea"
                    rows={4}
                    value={curSlide.right || ""}
                    onChange={(e) => updateCurSlide({ right: e.target.value })}
                  />
                </div>
              </>
            )}
            <div className="cp-inspector-row cp-inspector-row--stack">
              <label className="cp-inspector-label">Konuşmacı notları</label>
              <textarea
                className="cp-inspector-textarea"
                rows={3}
                value={curSlide.notes || ""}
                onChange={(e) => updateCurSlide({ notes: e.target.value })}
              />
            </div>
            <div className="cp-inspector-actions">
              <button type="button" className="cp-btn-ghost" onClick={duplicateSlide}>
                Çoğalt
              </button>
              <button
                type="button"
                className="cp-btn-ghost cp-btn-danger"
                disabled={edSlides.length < 2}
                onClick={removeSlide}
              >
                Sil
              </button>
            </div>
          </div>
        </div>

        {rightPanel && (
          <aside className="cp-editor-panel">
            <div className="cp-panel-head">
              <span>
                {rightPanel === "theme" && "Tema"}
                {rightPanel === "voice" && "Ses"}
                {rightPanel === "share" && "Paylaş"}
              </span>
              <button
                type="button"
                className="cp-panel-close"
                aria-label="Kapat"
                onClick={() => setRightPanel(null)}
              >
                ×
              </button>
            </div>
            {rightPanel === "theme" && (
              <div className="cp-panel-body">
                <p className="cp-panel-hint">Renk seti canvas önizlemeye uygulanır; Kaydet ile sunucuya yazılır.</p>
                <ul className="cp-theme-presets">
                  {THEME_PRESETS.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        className="cp-theme-card"
                        onClick={() => applyThemePreset(p)}
                      >
                        <span className="cp-theme-card-name">{p.label}</span>
                        <span className="cp-theme-swatches">
                          <i style={{ background: p.colors.primary }} />
                          <i style={{ background: p.colors.accent }} />
                          <i style={{ background: p.colors.background }} />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {rightPanel === "voice" && (
              <div className="cp-panel-body">
                {!hasAudioManifest && (
                  <p className="cp-panel-hint">
                    Bu iş için TTS kapalıydı veya ses dosyası yok. Oluştururken “Seslendirme”yi açın.
                  </p>
                )}
                {hasAudioManifest && (
                  <>
                    <label className="cp-voice-label">
                      Oynatma hızı: {playbackRate.toFixed(2)}×
                    </label>
                    <input
                      type="range"
                      min="0.75"
                      max="1.5"
                      step="0.05"
                      value={playbackRate}
                      onChange={(e) => setPlaybackRate(Number(e.target.value))}
                      className="cp-voice-slider"
                    />
                    <audio
                      ref={audioRef}
                      key={selectedSlide}
                      className="cp-voice-audio"
                      controls
                      src={`${apiBase}/presentations/${jobId}/audio/slide/${selectedSlide}`}
                    >
                      <track kind="captions" />
                    </audio>
                    <p className="cp-panel-hint cp-panel-hint--small">
                      Pitch motor tarafında yok; hız tarayıcı oynatıcıyla uygulanır.
                    </p>
                  </>
                )}
              </div>
            )}
            {rightPanel === "share" && (
              <div className="cp-panel-body">
                <p className="cp-panel-hint">
                  HTML’i iframe ile sitenize gömün. Önce <strong>Kaydet</strong>; paylaşılan sürüm sunucudaki deck’i kullanır.
                </p>
                <button type="button" className="cp-submit cp-submit--block" onClick={copyEmbedSnippet}>
                  {embedCopied ? "Panoya kopyalandı" : "Embed kodunu kopyala"}
                </button>
                <pre className="cp-embed-sample">{`<iframe src="${apiBase}/presentations/${jobId}/embed/html" … />`}</pre>
              </div>
            )}
          </aside>
        )}
      </div>

      {presenterOpen && (
        <div className="cp-presenter" role="dialog" aria-modal="true">
          <button
            type="button"
            className="cp-presenter-exit"
            onClick={() => setPresenterOpen(false)}
          >
            Kapat (Esc)
          </button>
          <button
            type="button"
            className="cp-presenter-nav cp-presenter-prev"
            disabled={presenterIdx <= 0}
            onClick={() => setPresenterIdx((i) => Math.max(0, i - 1))}
          >
            ‹
          </button>
          <button
            type="button"
            className="cp-presenter-nav cp-presenter-next"
            disabled={presenterIdx >= edSlides.length - 1}
            onClick={() => setPresenterIdx((i) => Math.min(edSlides.length - 1, i + 1))}
          >
            ›
          </button>
          <div className="cp-presenter-counter">
            {presenterIdx + 1} / {edSlides.length || 1}
          </div>
          {(() => {
            const ps = edSlides[presenterIdx] || {};
            const pc = th || {};
            return (
              <div
                className="cp-presenter-slide"
                style={{
                  "--cp-slide-bg": pc.background || "#f8fafc",
                  "--cp-slide-text": pc.text || "#0f172a",
                  "--cp-slide-primary": pc.primary || "#1e3a5f",
                  "--cp-slide-accent": pc.accent || "#c2410c",
                }}
              >
                <div className="cp-slide-inner">
                  <h2 className="cp-slide-title-display">{slideLabel(ps)}</h2>
                  {ps.subtitle && <p className="cp-slide-sub-display">{ps.subtitle}</p>}
                  {Array.isArray(ps.bullets) && ps.bullets.length > 0 && (
                    <ul className="cp-slide-bullets-display">
                      {ps.bullets.map((b, i) => (
                        <li key={i}>{String(b)}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );

  const skySteps =
    step === "resource" || step === "configure" || step === "processing" || step === "outline";
  return (
    <div className={`cp-page ${skySteps ? "cp-page--sky" : ""}`}>
      {step === "resource" && resourceStep}
      {step === "configure" && configureStep}
      {step === "processing" && processingStep}
      {step === "outline" && outlineStep}
      {step === "editor" && editorStep}
    </div>
  );
};

export default CreateProjectPage;
