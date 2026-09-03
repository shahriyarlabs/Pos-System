import { ShopSettings, Transaction } from '../types';

export function generateReceiptHtml(
  trx: Transaction,
  settings: ShopSettings,
  format: 'standard' | 'thermal' = 'standard'
): string {
  const dateStr = new Date(trx.timestamp).toLocaleDateString('bn-BD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeStr = new Date(trx.timestamp).toLocaleTimeString('bn-BD', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const isDue = trx.paymentMethod === 'DUE';

  if (format === 'thermal') {
    // 58mm / 80mm Thermal Receipt Layout
    return `
      <div style="font-family: 'Courier New', Courier, monospace, system-ui; max-width: 280px; margin: 0 auto; padding: 6px; font-size: 11px; line-height: 1.3; color: #000; text-align: left;">
        <div style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px;">
          <div style="font-weight: 900; font-size: 14px; text-transform: uppercase;">${settings.shopName}</div>
          <div style="font-size: 10px; margin-top: 2px;">${settings.shopSubtitle}</div>
          <div style="font-size: 9px; margin-top: 2px;">${settings.address}</div>
          <div style="font-size: 9px; font-weight: bold; margin-top: 2px;">মোবাইল: ${settings.phone1}${settings.phone2 ? ', ' + settings.phone2 : ''}</div>
          <div style="margin-top: 4px; font-weight: bold; font-size: 11px; border: 1px solid #000; display: inline-block; padding: 1px 6px;">ক্যাশ মেমো / POS SLIP</div>
        </div>

        <div style="font-size: 10px; margin-bottom: 6px; border-bottom: 1px dashed #000; padding-bottom: 4px;">
          <div>চালান নং: <b>${trx.invoiceNo}</b></div>
          <div>তারিখ: ${dateStr} (${timeStr})</div>
          <div>গ্রাহক: <b>${trx.customerName || 'সরাসরি কাস্টমার'}</b></div>
          ${trx.customerPhone ? `<div>মোবাইল: ${trx.customerPhone}</div>` : ''}
        </div>

        <table style="width: 100%; font-size: 10px; border-collapse: collapse; margin-bottom: 6px;">
          <thead>
            <tr style="border-bottom: 1px dashed #000;">
              <th style="text-align: left; padding: 2px 0;">আইটেম / সেবা</th>
              <th style="text-align: right; padding: 2px 0;">পরিমাণ</th>
              <th style="text-align: right; padding: 2px 0;">টাকা</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 4px 0;">
                <b>${trx.categoryLabelBn}</b>
                ${trx.note ? `<div style="font-size: 9px; color: #333;">${trx.note}</div>` : ''}
              </td>
              <td style="text-align: right; padding: 4px 0;">১ টি</td>
              <td style="text-align: right; font-weight: bold; padding: 4px 0;">৳${trx.amount.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <div style="border-top: 1px dashed #000; padding-top: 4px; font-size: 11px; line-height: 1.4;">
          <div style="display: flex; justify-content: space-between;">
            <span>মোট বিল (Total):</span>
            <b>৳${trx.amount.toLocaleString()}</b>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>পরিশোধের মাধ্যম:</span>
            <span>${trx.paymentMethodLabelBn}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 12px; border-top: 1px solid #000; margin-top: 3px; padding-top: 2px;">
            <span>পরিশোধ (Paid):</span>
            <span>৳${isDue ? '0.00' : trx.amount.toLocaleString()}</span>
          </div>
          ${
            isDue
              ? `<div style="display: flex; justify-content: space-between; font-weight: bold; margin-top: 2px; color: #000;">
                  <span>অবশিষ্ট বকেয়া (Due):</span>
                  <span>৳${trx.amount.toLocaleString()}</span>
                </div>`
              : ''
          }
        </div>

        <div style="text-align: center; border-top: 1px dashed #000; margin-top: 8px; padding-top: 6px; font-size: 9px;">
          <div>${settings.receiptFooterNote}</div>
          <div style="font-family: monospace; font-size: 8px; margin-top: 2px;">সফটওয়্যার: BDC POS System</div>
        </div>
      </div>
    `;
  }

  // Standard A5 / Half page Cash Memo
  return `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 16px; border: 2px solid #1e293b; border-radius: 8px; color: #0f172a; background: #fff;">
      <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 12px;">
        <div style="display: inline-block; border: 1.5px solid #0f172a; padding: 2px 10px; font-weight: 800; font-size: 11px; text-transform: uppercase; margin-bottom: 4px; border-radius: 4px;">ক্যাশ মেমো / মানি রিসিট</div>
        <h2 style="font-size: 20px; font-weight: 900; margin: 0; line-height: 1.2;">${settings.shopName}</h2>
        <div style="font-size: 12px; font-weight: 600; color: #334155; margin-top: 2px;">${settings.shopSubtitle}</div>
        <div style="font-size: 11px; color: #475569; margin-top: 2px;">${settings.address}</div>
        <div style="font-size: 11px; font-weight: 700; color: #0f172a; margin-top: 2px;">
          মোবাইল: ${settings.phone1}${settings.phone2 ? ', ' + settings.phone2 : ''}
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 11px; border-bottom: 1px dashed #94a3b8; padding-bottom: 8px; margin-bottom: 10px;">
        <div>চালান নং: <b style="font-family: monospace;">${trx.invoiceNo}</b></div>
        <div style="text-align: right;">তারিখ: <b>${dateStr}</b></div>
        <div>গ্রাহক: <b>${trx.customerName || 'সম্মানিত কাস্টমার'}</b></div>
        <div style="text-align: right;">মোবাইল: <b>${trx.customerPhone || '—'}</b></div>
      </div>

      <table style="width: 100%; font-size: 11px; border-collapse: collapse; margin-bottom: 12px;">
        <thead>
          <tr style="border-bottom: 1.5px solid #0f172a; background: #f8fafc; font-weight: bold;">
            <th style="text-align: left; padding: 6px;">ক্রম</th>
            <th style="text-align: left; padding: 6px;">সেবা / পণ্যের বিবরণ</th>
            <th style="text-align: right; padding: 6px;">পরিমাণ</th>
            <th style="text-align: right; padding: 6px;">মূল্য</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 6px; font-weight: bold;">১</td>
            <td style="padding: 8px 6px;">
              <div style="font-weight: bold; font-size: 12px;">${trx.categoryLabelBn}</div>
              <div style="font-size: 10px; color: #64748b;">${trx.note || trx.categoryLabelEn}</div>
            </td>
            <td style="text-align: right; padding: 8px 6px;">১ টি</td>
            <td style="text-align: right; padding: 8px 6px; font-weight: bold; font-size: 13px;">৳${trx.amount.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      <div style="border-top: 1.5px solid #0f172a; padding-top: 8px; font-size: 11px; line-height: 1.5;">
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #475569;">মোট ধার্যকৃত বিল (Total):</span>
          <b style="font-size: 12px;">৳${trx.amount.toLocaleString()}</b>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #475569;">পরিশোধ মাধ্যম:</span>
          <b>${trx.paymentMethodLabelBn}</b>
        </div>
        ${
          isDue
            ? `<div style="display: flex; justify-content: space-between; color: #dc2626; font-weight: bold; border-top: 1px solid #fecaca; margin-top: 4px; padding-top: 2px;">
                <span>বকেয়ার পরিমাণ (Due Amount):</span>
                <span>৳${trx.amount.toLocaleString()}</span>
              </div>`
            : ''
        }
        <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 900; border-top: 2px solid #0f172a; margin-top: 4px; padding-top: 4px;">
          <span>পরিশোধিত অর্থ (Net Paid):</span>
          <span style="color: #166534;">৳${isDue ? '০.০০' : trx.amount.toLocaleString()}</span>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; margin-top: 24px; padding-top: 8px; font-size: 10px; color: #475569;">
        <div style="text-align: center;">
          <div style="width: 90px; border-bottom: 1px solid #94a3b8; margin-bottom: 4px;"></div>
          <span>গ্রাহকের স্বাক্ষর</span>
        </div>
        <div style="text-align: center;">
          <div style="width: 100px; border-bottom: 1px solid #94a3b8; margin-bottom: 4px;"></div>
          <span style="font-weight: bold; color: #0f172a;">স্বত্বাধিকারী / ক্যাশিয়ার</span>
        </div>
      </div>

      <div style="text-align: center; font-size: 10px; color: #64748b; border-top: 1px dashed #cbd5e1; margin-top: 12px; padding-top: 6px;">
        <p style="margin: 0;">${settings.receiptFooterNote}</p>
        <p style="margin: 2px 0 0 0; font-family: monospace; font-size: 9px;">Software by Brothers Digital POS System</p>
      </div>
    </div>
  `;
}

// 100% Reliable Print Trigger: Opens clean printable frame / window with exact print styling
export function printReceiptNow(
  trx: Transaction,
  settings: ShopSettings,
  format: 'standard' | 'thermal' = 'standard'
): boolean {
  const receiptHtml = generateReceiptHtml(trx, settings, format);

  const fullPrintPage = `
    <!DOCTYPE html>
    <html lang="bn">
    <head>
      <meta charset="utf-8">
      <title>ক্যাশ মেমো - ${trx.invoiceNo}</title>
      <style>
        @page {
          margin: ${format === 'thermal' ? '2mm' : '8mm'};
          size: ${format === 'thermal' ? '80mm auto' : 'auto'};
        }
        body {
          margin: 0;
          padding: 8px;
          background: #ffffff;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      ${receiptHtml}
      <script>
        window.onload = function() {
          window.focus();
          window.print();
          setTimeout(function() {
            try { window.close(); } catch(e) {}
          }, 1000);
        };
      </script>
    </body>
    </html>
  `;

  // Try window.open first (standard on Desktop & Android Chrome)
  try {
    const printWindow = window.open('', '_blank', 'width=520,height=720,toolbar=0,menubar=0,location=0');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(fullPrintPage);
      printWindow.document.close();
      return true;
    }
  } catch (err) {
    console.warn('Window open failed, falling back to hidden iframe print', err);
  }

  // Fallback: Hidden iframe printing
  try {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(fullPrintPage);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 2000);
      }, 300);
      return true;
    }
  } catch (err) {
    console.error('All print methods failed, invoking window.print directly', err);
    window.print();
    return false;
  }

  return false;
}

// Generate shareable text for WhatsApp / SMS on Android
export function generateReceiptShareText(trx: Transaction, settings: ShopSettings): string {
  const dateStr = new Date(trx.timestamp).toLocaleDateString('bn-BD');
  const isDue = trx.paymentMethod === 'DUE';

  return `*${settings.shopName}*\n` +
    `ক্যাশ মেমো নং: ${trx.invoiceNo}\n` +
    `তারিখ: ${dateStr}\n` +
    `গ্রাহক: ${trx.customerName || 'সম্মানিত কাস্টমার'}\n` +
    `--------------------------\n` +
    `সেবা: ${trx.categoryLabelBn}\n` +
    `মোট বিল: ৳${trx.amount.toLocaleString()}\n` +
    `মাধ্যম: ${trx.paymentMethodLabelBn}\n` +
    `পরিশোধ: ৳${isDue ? '০.০০' : trx.amount.toLocaleString()}\n` +
    (isDue ? `*অবশিষ্ট বকেয়া: ৳${trx.amount.toLocaleString()}*\n` : '') +
    `--------------------------\n` +
    `${settings.receiptFooterNote}\n` +
    `যোগাযোগ: ${settings.phone1}`;
}
