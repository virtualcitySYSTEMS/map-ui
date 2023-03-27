import { hasSameOrigin } from '@vcmap/core';

/**
 * Download a blob
 * @param {string} uri
 * @param {string} fileName
 * @api
 * @export
 */
export function downloadURI(uri, fileName) {
  const link = document.createElement('a');
  link.download = fileName;
  link.href = uri;
  if (!hasSameOrigin(uri)) {
    link.target = '_blank';
  }
  link.click();
  link.remove();
}

/**
 * Download a blob
 * @param {Blob} blob
 * @param {string} fileName
 */
export function downloadBlob(blob, fileName) {
  downloadURI(URL.createObjectURL(blob), fileName);
}

/**
 * Download a text as UTF-8
 * @param {string} text
 * @param {string} fileName
 */
export function downloadText(text, fileName) {
  downloadURI(`data:text/plain;charset=utf-8,${encodeURIComponent(text)}`, fileName);
}

/**
 * Download a canvas as an image
 * @param {HTMLCanvasElement} canvas
 * @param {string} fileName
 * @param {string=} mimeType
 */
export function downloadCanvas(canvas, fileName, mimeType) {
  canvas.toBlob((blob) => {
    downloadBlob(blob, fileName);
  }, mimeType);
}
