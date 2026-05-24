import React, { useState } from "react";
import axios from "axios";

export default function UploadImage() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    try {
        const res = await doOCR(file);
        setResult(res.text || "Sin texto detectado");
    } catch (err) {
        setResult("Error al procesar OCR");
    } finally {
        setLoading(false);
    }
    };

  return (
    <div>
      <h2>OCR desde imagen</h2>
      <form onSubmit={handleSubmit}>
        <input type="file" accept="image/*" onChange={handleChange} />
        <button type="submit" disabled={!file || loading}>
          {loading ? "Procesando..." : "Ejecutar OCR"}
        </button>
      </form>
      {result && <div><strong>Resultado OCR:</strong><pre>{result}</pre></div>}
    </div>
  );
}