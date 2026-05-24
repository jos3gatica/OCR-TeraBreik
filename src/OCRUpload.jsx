import React, { useState, useEffect } from "react";
import { createWorker } from "tesseract.js";

export default function OCRUpload() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState("light");

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

  const preprocessFileToBlob = async (file) => {
    const imgBitmap = await createImageBitmap(file);
    const scale = 2;
    const w = imgBitmap.width * scale;
    const h = imgBitmap.height * scale;

    const off = new OffscreenCanvas(w, h);
    const ctx = off.getContext("2d");

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(imgBitmap, 0, 0, w, h);

    const blob = await off.convertToBlob({ type: "image/png", quality: 0.9 });
    return blob;
  };

  const processOCR = async () => {
    if (!file) return;

    setLoading(true);
    setResult("");

    const worker = await createWorker("eng");

    try {
      await worker.setParameters({
        preserve_interword_spaces: "1",
      });

      const preBlob = await preprocessFileToBlob(file);
      const {
        data: { text },
      } = await worker.recognize(preBlob);
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
          Modo {theme === "light" ? "oscuro" : "claro"}
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