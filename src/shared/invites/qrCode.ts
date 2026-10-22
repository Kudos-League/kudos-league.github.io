/**
 * QR code rendering via a free third-party image API (goqr.me's
 * api.qrserver.com — no key, no account, CORS-enabled PNG output).
 *
 * Note: the invite URL (including its one-time token) is sent to that
 * service as a query parameter in order to render the image.
 */

const QR_API_BASE = 'https://api.qrserver.com/v1/create-qr-code/';

export const DEFAULT_QR_SIZE = 320;
/** Print-quality size for business cards (~2.5 cm at 300 dpi). */
export const PRINT_QR_SIZE = 1000;

export function buildQrImageUrl(data: string, size = DEFAULT_QR_SIZE): string {
    const params = new URLSearchParams({
        size: `${size}x${size}`,
        data,
        // 'H' error correction survives smudges/partial cover on printed cards
        ecc: 'H',
        // quiet zone (in modules) so scanners lock on when printed
        qzone: '2',
        format: 'png'
    });
    return `${QR_API_BASE}?${params.toString()}`;
}

async function fetchQrBlob(data: string): Promise<Blob> {
    const response = await fetch(buildQrImageUrl(data, PRINT_QR_SIZE));
    if (!response.ok) {
        throw new Error('Could not fetch the QR code image.');
    }
    return response.blob();
}

const blobToDataUrl = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Could not read the QR image.'));
        reader.readAsDataURL(blob);
    });

/** Downloads the QR PNG for `data` using the browser's save dialog. */
export async function downloadQrPng(data: string, filename: string): Promise<void> {
    const blob = await fetchQrBlob(data);
    const objectUrl = URL.createObjectURL(blob);
    try {
        const anchor = document.createElement('a');
        anchor.href = objectUrl;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
    }
    finally {
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    }
}

const escapeHtml = (value: string) =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

/**
 * Opens a minimal print-ready page (QR + caption + link) and triggers the
 * print dialog. The QR is embedded as a data URL so the popup needs no
 * network access of its own. Returns false if the popup was blocked.
 */
export async function printQr(data: string, caption: string): Promise<boolean> {
    // Must open synchronously inside the click handler to dodge popup blockers.
    const popup = window.open('', '_blank', 'width=520,height=640');
    if (!popup) return false;

    let imageSrc: string;
    try {
        imageSrc = await blobToDataUrl(await fetchQrBlob(data));
    }
    catch (err) {
        popup.close();
        throw err;
    }

    popup.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(caption)}</title>
<style>
  body { margin: 0; font-family: system-ui, sans-serif; color: #111; background: #fff; }
  main { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 24px; }
  img { width: 64mm; height: 64mm; }
  h1 { font-size: 18px; margin: 0; }
  p { font-size: 11px; margin: 0; word-break: break-all; text-align: center; max-width: 80mm; }
  @media print { @page { margin: 10mm; } }
</style>
</head>
<body>
<main>
  <h1>${escapeHtml(caption)}</h1>
  <img id="qr" src="${imageSrc}" alt="Invite QR code" />
  <p>${escapeHtml(data)}</p>
</main>
<script>
  var img = document.getElementById('qr');
  function go() { setTimeout(function () { window.focus(); window.print(); }, 150); }
  if (img.complete) go(); else img.onload = go;
</script>
</body>
</html>`);
    popup.document.close();
    return true;
}
