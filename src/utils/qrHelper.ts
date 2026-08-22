import QRCode from 'qrcode';

export async function generateQRCodeDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: 480,
      margin: 2,
      color: {
        dark: '#1e293b',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    });
  } catch (err) {
    console.error('Error generating QR code data URL:', err);
    return '';
  }
}

export function downloadQRCodeImage(dataUrl: string, filename: string = 'review-qr-code.png') {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function printQRCodeTentCard(
  businessName: string,
  locationName: string,
  qrDataUrl: string
) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to print your QR card.');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print QR Standee - ${businessName}</title>
        <style>
          @page { size: portrait; margin: 10mm; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: #fff;
            color: #0f172a;
          }
          .card {
            width: 380px;
            border: 2px solid #e2e8f0;
            border-radius: 20px;
            padding: 32px;
            text-align: center;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .badge {
            display: inline-block;
            background: #f1f5f9;
            color: #475569;
            padding: 6px 14px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
          }
          .title {
            font-size: 24px;
            font-weight: 800;
            color: #0f172a;
            margin: 0 0 6px 0;
          }
          .location {
            font-size: 14px;
            color: #64748b;
            margin-bottom: 24px;
          }
          .qr-wrapper {
            background: #ffffff;
            padding: 16px;
            border-radius: 16px;
            display: inline-block;
            border: 1px solid #cbd5e1;
            margin-bottom: 20px;
          }
          .qr-img {
            width: 220px;
            height: 220px;
            display: block;
          }
          .cta-title {
            font-size: 18px;
            font-weight: 700;
            color: #0284c7;
            margin: 0 0 6px 0;
          }
          .cta-subtitle {
            font-size: 13px;
            color: #475569;
            line-height: 1.4;
            margin: 0;
          }
          .footer-note {
            font-size: 10px;
            color: #94a3b8;
            margin-top: 24px;
          }
          @media print {
            body { padding: 0; }
            .card { box-shadow: none; border-color: #cbd5e1; }
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">Customer Feedback & Reviews</div>
          <h1 class="title">${businessName}</h1>
          <div class="location">${locationName}</div>
          
          <div class="qr-wrapper">
            <img class="qr-img" src="${qrDataUrl}" alt="QR Code" />
          </div>

          <div class="cta-title">Scan to Share Your Experience</div>
          <p class="cta-subtitle">Takes less than 60 seconds. Share genuine feedback and get instant AI assistance for your review!</p>
          <div class="footer-note">Powered by Authentic Reviews</div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 300);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
