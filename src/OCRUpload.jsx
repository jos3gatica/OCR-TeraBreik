import React, { useEffect, useState } from "react";
import { recognizeText, PSM_MAP } from "../src/services/ocrService";
import ResultDisplay from "../src/components/ResultDisplay";

export default function OCRUpload() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState("light");
  const [ocrMode, setOcrMode] = useState("block");
  const [invert, setInvert] = useState(false);
  const [bestMode, setBestMode] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = saved || (prefersDark ? "dark" : "light");
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  };

  const handleFile = (e) => {
    setFile(e.target.files[0]);
    setResult("");
    setBestMode("");
  };

  const processOCR = async () => {
    if (!file) return;

    setLoading(true);
    setResult("");

    try {
      const text = await recognizeText(file, {
        lang: "eng+spa",
        psm: PSM_MAP[ocrMode],
        scale: 2,
        threshold: 165,
        invert,
        dpi: 300,
      });

      setResult(text);
      setBestMode(ocrMode);
    } catch (err) {
      console.error(err);
      setResult("Error en OCR");
      setBestMode("");
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setFile(null);
    setResult("");
    setBestMode("");
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = "";
  };

  return (
    <div className="container">
      <div className="card">
        <h2>OCR TeraBreik</h2>

        <button className="theme-toggle" onClick={toggleTheme}>
          Modo {theme === "light" ? "oscuro" : "claro"}
        </button>

        <div className="input-group">
          <input type="file" accept="image/*" onChange={handleFile} />

          <select value={ocrMode} onChange={(e) => setOcrMode(e.target.value)}>
            <option value="block">Bloque de texto</option>
            <option value="auto">Automático</option>
            <option value="line">Línea única</option>
            <option value="sparse">Texto disperso</option>
          </select>

          <label className="invert-toggle">
            <input
              type="checkbox"
              checked={invert}
              onChange={(e) => setInvert(e.target.checked)}
            />
            Invertir imagen
          </label>

          <button className="btn-primary" onClick={processOCR} disabled={!file || loading}>
            {loading ? "Procesando..." : "Extraer texto"}
          </button>

          <button className="btn-secondary" onClick={clear} disabled={!file && !result}>
            Limpiar
          </button>
        </div>

        {bestMode && (
          <div style={{ marginBottom: 12, color: "var(--muted)" }}>
            Modo usado: <strong>{bestMode}</strong>
          </div>
        )}

        <ResultDisplay result={result} />
      </div>
    </div>
  );
}