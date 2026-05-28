import { createWorker, PSM } from "tesseract.js";

const DEFAULT_OPTIONS = {
  lang: "eng+spa",
  scale: 2,
  threshold: 165,
  invert: false,
  dpi: 300,
  psm: PSM.SINGLE_BLOCK,
};

const PSM_MAP = {
  auto: PSM.AUTO,
  block: PSM.SINGLE_BLOCK,
  line: PSM.SINGLE_LINE,
  sparse: PSM.SPARSE_TEXT,
};

async function canvasToBlob(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

export async function preprocessImage(file, options = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const bitmap = await createImageBitmap(file);

  const width = Math.round(bitmap.width * config.scale);
  const height = Math.round(bitmap.height * config.scale);

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
    let value = gray > config.threshold ? 255 : 0;
    if (config.invert) value = 255 - value;
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
  }

  ctx.putImageData(imageData, 0, 0);
  return { blob: await canvasToBlob(canvas), width, height };
}

async function createOCRWorker(lang) {
  return createWorker(lang, 1, {
    logger: (m) => console.log(m),
  });
}

async function runOCR(worker, blob, options = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };

  await worker.setParameters({
    preserve_interword_spaces: "1",
    tessedit_pageseg_mode: config.psm,
    user_defined_dpi: String(config.dpi),
  });

  const {
    data: { text },
  } = await worker.recognize(blob);

  return text.trim();
}

export async function recognizeText(file, options = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const worker = await createOCRWorker(config.lang);

  try {
    const { blob } = await preprocessImage(file, config);
    return await runOCR(worker, blob, config);
  } finally {
    await worker.terminate();
  }
}

export async function recognizeRegions(file, regions = [], options = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const worker = await createOCRWorker(config.lang);

  try {
    const { blob } = await preprocessImage(file, config);

    const results = [];
    for (const region of regions) {
      const text = await runOCR(worker, blob, {
        ...config,
        psm: region.psm || config.psm,
      });
      results.push({
        region,
        text,
      });
    }

    return results;
  } finally {
    await worker.terminate();
  }
}

export { PSM_MAP };