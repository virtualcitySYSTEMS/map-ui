import { isSameOrigin } from '@vcmap/core';

/**
 * Download a file from a URI. If the URI is not same origin, it will be opened in a new tab.
 */
export function downloadURI(uri: string, fileName: string): void {
  const link = document.createElement('a');
  link.download = fileName;
  link.href = uri;
  if (!isSameOrigin(uri)) {
    link.target = '_blank';
  }
  link.click();
  link.remove();
}

/**
 * Download a blob
 */
export function downloadBlob(blob: Blob, fileName: string): void {
  downloadURI(URL.createObjectURL(blob), fileName);
}

/**
 * Download a text as UTF-8
 */
export function downloadText(text: string, fileName: string): void {
  downloadURI(
    `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`,
    fileName,
  );
}

/**
 * Download a canvas as an image
 */
export function downloadCanvas(
  canvas: HTMLCanvasElement,
  fileName: string,
  mimeType?: string,
): void {
  canvas.toBlob((blob) => {
    if (blob) {
      downloadBlob(blob, fileName);
    }
  }, mimeType);
}
