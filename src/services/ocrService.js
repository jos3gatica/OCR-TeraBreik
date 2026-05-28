import { createWorker, PSM } from "tesseract.js";

const DEFAULT_OPTIONS = {
  lang: "eng+spa",
  psm: PSM.SINGLE_BLOCK,
  scale: 2,
  threshold: 160,
};

export async function preprocessImage(file, options = {}) {
  const { scale, threshold } = { ...DEFAULT_OPTIONS, ...options };

  const bitmap = await createImageBitmap(file);
  const width = bitmap.width * scale;
  const height = bitmap.height * scale;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const value = gray > threshold ? 255 : 0;
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
  }

  ctx.putImageData(imageData, 0, 0);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

export async function recognizeText(file, options = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };

  const worker = await createWorker(config.lang, 1, {
    logger: (m) => console.log(m),
  });

  try {
    await worker.setParameters({
      preserve_interword_spaces: "1",
      tessedit_pageseg_mode: config.psm,
      user_defined_dpi: "300",
    });

    const input = await preprocessImage(file, config);

    const {
      data: { text },
    } = await worker.recognize(input);

    return text;
  } finally {
    await worker.terminate();
  }
}