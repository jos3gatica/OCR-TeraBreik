import axios from "axios";

export async function doOCR(file) {
  const reader = new FileReader();
  const data = await new Promise((resolve) => {
    reader.onload = () => resolve(reader.result.split(",")[1]); // base64 sin prefijo
    reader.readAsDataURL(file);
  });

  const response = await axios.post(
    "https://YOUR_API_GATEWAY_URL/prod/ocr",
    { imageBase64: data },
    { headers: { "Content-Type": "application/json" } }
  );

  return response.data;
}