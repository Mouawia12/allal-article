const MAX_ORIGINAL_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_STORED_IMAGE_CHARS = 2.2 * 1024 * 1024;
const MAX_AUDIO_BYTES = 2 * 1024 * 1024;
const IMAGE_MAX_DIMENSION = 1600;
const IMAGE_QUALITIES = [0.82, 0.7, 0.58];

export function formatAttachmentBytes(bytes = 0) {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatAudioDuration(seconds = 0) {
  const safeSeconds = Math.max(1, Math.round(seconds || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const rest = String(safeSeconds % 60).padStart(2, "0");
  return `${minutes}:${rest}`;
}

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("تعذر قراءة الملف"));
    reader.readAsDataURL(file);
  });
}

function timestampName() {
  return new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
}

function audioExtension(mimeType = "") {
  if (mimeType.includes("mp4")) return "m4a";
  if (mimeType.includes("mpeg")) return "mp3";
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("wav")) return "wav";
  return "webm";
}

function compressImageDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const largestSide = Math.max(image.width, image.height);
      const scale = largestSide > IMAGE_MAX_DIMENSION ? IMAGE_MAX_DIMENSION / largestSide : 1;
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("تعذر ضغط الصورة"));
        return;
      }

      context.fillStyle = "#fff";
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);

      const compressed = IMAGE_QUALITIES.map((quality) => canvas.toDataURL("image/jpeg", quality));
      const accepted = compressed.find((value) => value.length <= MAX_STORED_IMAGE_CHARS);
      if (!accepted) {
        reject(new Error("حجم الصورة كبير حتى بعد الضغط. اختر صورة أصغر"));
        return;
      }

      resolve({ dataUrl: accepted, mimeType: "image/jpeg", compressed: true });
    };
    image.onerror = () => reject(new Error("تعذر قراءة الصورة"));
    image.src = dataUrl;
  });
}

async function optimizeImageFile(file) {
  const dataUrl = await fileToDataUrl(file);
  if (dataUrl.length <= MAX_STORED_IMAGE_CHARS) {
    return { dataUrl, mimeType: file.type || "image/png", compressed: false };
  }
  if (typeof document === "undefined") {
    throw new Error("حجم الصورة كبير. اختر صورة أصغر");
  }
  return compressImageDataUrl(dataUrl);
}

export async function imageFileToSupportAttachment(file, senderPrefix = "support") {
  if (!file || !file.type?.startsWith("image/")) {
    throw new Error("اختر ملف صورة صالح");
  }
  if (file.size > MAX_ORIGINAL_IMAGE_BYTES) {
    throw new Error("حجم الصورة كبير. الحد الأقصى 10MB");
  }

  const optimized = await optimizeImageFile(file);

  return {
    id: `att-${senderPrefix}-image-${Date.now()}`,
    type: "image",
    name: file.name || `${senderPrefix}-image-${timestampName()}.png`,
    size: formatAttachmentBytes(file.size),
    byteSize: file.size,
    mimeType: optimized.mimeType,
    dataUrl: optimized.dataUrl,
    compressed: optimized.compressed,
  };
}

export async function audioBlobToSupportAttachment(blob, senderPrefix = "support", durationSeconds = 0) {
  if (!blob || blob.size === 0) {
    throw new Error("لم يتم تسجيل أي صوت");
  }
  if (blob.size > MAX_AUDIO_BYTES) {
    throw new Error("حجم التسجيل كبير. الحد الأقصى 2MB");
  }

  const mimeType = blob.type || "audio/webm";
  return {
    id: `att-${senderPrefix}-audio-${Date.now()}`,
    type: "audio",
    name: `${senderPrefix}-voice-${timestampName()}.${audioExtension(mimeType)}`,
    size: formatAudioDuration(durationSeconds),
    byteSize: blob.size,
    durationSeconds: Math.round(durationSeconds || 0),
    mimeType,
    dataUrl: await fileToDataUrl(blob),
  };
}
