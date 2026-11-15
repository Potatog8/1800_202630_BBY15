const MAX_DIMENSION = 800;
const MAX_LENGTH = 350000; // max data URL length (about 260 KB), well under Firestore's 1 MiB doc limit

// Shrinks a photo and returns it as a JPEG data URL string
export async function resizeImage(file) {
  if (!file.type.startsWith("image/")) throw new Error("NOT_AN_IMAGE");

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const ctx = canvas.getContext("2d");
  // White background so transparent PNGs don't turn black as JPEGs
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();

  let quality = 0.8;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);
  while (dataUrl.length > MAX_LENGTH && quality > 0.4) {
    quality -= 0.1;
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }

  if (dataUrl.length > MAX_LENGTH) throw new Error("IMAGE_TOO_LARGE");
  return dataUrl;
}

// The image, or a grey square when the recipe has none
export function createRecipeImage(imageData, altText, extraClass = "") {
  if (imageData) {
    const img = document.createElement("img");
    img.src = imageData;
    img.alt = altText ?? "";
    img.className = `recipe-image ${extraClass}`.trim();
    return img;
  }

  const placeholder = document.createElement("div");
  placeholder.className =
    `recipe-image recipe-image-placeholder ${extraClass}`.trim();
  placeholder.textContent = "No image added";
  return placeholder;
}