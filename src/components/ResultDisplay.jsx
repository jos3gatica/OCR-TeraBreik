import React from "react";

export default function ResultDisplay({ result }) {
  if (!result) return null;

  return (
    <div className="result">
      <strong>Texto detectado:</strong>
      <textarea readOnly value={result} />
    </div>
  );
}