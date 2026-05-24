import React, { useState, useEffect } from "react";
import { createWorker } from "tesseract.js";

export default function OCRUpload() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState("light");

  // Por defecto claro; respeta lo guardado
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
  };

  const processOCR = async () => {
    if (!file) return;

    setLoading(true);
    setResult("");

    const worker = await createWorker("eng");

    try {
      const {
        data: { text },
      } = await worker.recognize(file);
      setResult(text);
    } catch (err) {
      console.error(err);
      setResult("Error en OCR");
    } finally {
      await worker.terminate();
      setLoading(false);
    }
  };

  const clear = () => {
    setFile(null);
    setResult("");
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = "";
  };

  return (
    <div className="container">
      <div className="card">
        <h2>OCR TeraBreik</h2>

        <button className="theme-toggle" onClick={toggleTheme}>
          Cambiar a modo {theme === "light" ? "oscuro" : "claro"}
        </button>

        <div className="input-group">
          <input type="file" accept="image/*" onChange={handleFile} />
          <button onClick={processOCR} disabled={!file || loading}>
            {loading ? "Procesando..." : "Extraer texto"}
          </button>
          <button onClick={clear} disabled={!file && !result}>
            Limpiar
          </button>
        </div>

        {result && (
          <div className="result">
            <strong>Texto detectado:</strong>
            <pre>{result}</pre>
          </div>
        )}
      </div>
    </div>
  );
}