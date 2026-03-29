import React, { useState, useRef } from "react";
import { predictDisease } from "./api";

export default function DiseaseDetection() {
  const [file,       setFile]       = useState(null);
  const [preview,    setPreview]    = useState(null);
  const [result,     setResult]     = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const inputRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  const analyse = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const res = await predictDisease(file);
      setResult(res.data);
    } catch {
      setError("Analysis failed. Check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  const confidencePct = result ? Math.round(result.confidence * 100) : 0;
  const isHealthy     = result?.disease?.toLowerCase().includes("healthy");

  return (
    <section className="card disease-card">
      <h2 className="section-title">🔬 Disease Detection</h2>

      <div
        className={`drop-zone ${preview ? "has-preview" : ""}`}
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current.click()}
      >
        {preview
          ? <img src={preview} alt="crop" className="preview-img" />
          : <div className="drop-placeholder">
              <span className="drop-icon">📷</span>
              <p>Drag & drop a crop leaf image or <u>click to browse</u></p>
            </div>
        }
        <input
          ref={inputRef} type="file" accept="image/*" hidden
          onChange={e => handleFile(e.target.files[0])}
        />
      </div>

      {preview && (
        <button className="btn btn-primary" onClick={analyse} disabled={loading}>
          {loading ? "Analysing…" : "Analyse Disease"}
        </button>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      {result && (
        <div className={`result-box ${isHealthy ? "healthy" : "diseased"}`}>
          <div className="result-label">
            {isHealthy ? "✅ Healthy Plant" : "⚠️ Disease Detected"}
          </div>
          <div className="result-disease">{result.disease.replace(/___/g, " › ").replace(/_/g, " ")}</div>
          <div className="confidence-bar-wrap">
            <div className="confidence-bar" style={{ width: `${confidencePct}%` }} />
          </div>
          <div className="confidence-pct">{confidencePct}% confidence</div>
          <div className="result-timestamp">Analysed at {new Date(result.timestamp).toLocaleTimeString()}</div>
        </div>
      )}
    </section>
  );
}
