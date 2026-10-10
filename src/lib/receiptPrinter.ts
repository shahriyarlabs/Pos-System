import { ShopSettings, Transaction } from '../types';

export type QuarterA4Quadrant = 'left_top' | 'left_bottom' | 'right_top' | 'right_bottom';
export type QuarterA4Mode = 'left_single' | '4in1' | 'dual';

// Helper to generate full Landscape A4 (285mm x 198mm) 2x2 grid containing up to 4 vouchers with scissor cut guides
export function generateQuarterA4GridHtml(
  cards: {
    topLeft?: string;
    topRight?: string;
    bottomLeft?: string;
    bottomRight?: string;
  }
): string {
  return `
    <div style="box-sizing: border-box; width: 285mm; height: 198mm; display: grid; grid-template-columns: 140mm 140mm; grid-template-rows: 96mm 96mm; gap: 6mm 5mm; justify-content: flex-start; align-content: flex-start; margin: 0; padding: 0; page-break-inside: avoid; position: relative;">
      
      <!-- Center Vertical Cutting Guide (at 148.5mm halfway mark) -->
      <div style="position: absolute; left: 142.5mm; top: 0; bottom: 0; width: 1px; border-left: 1.2px dashed #94a3b8; pointer-events: none; display: flex; flex-direction: column; justify-content: space-around; align-items: center; z-index: 10;">
        <span style="background: #ffffff; color: #64748b; font-size: 8px; font-weight: bold; padding: 2px; transform: rotate(90deg); white-space: nowrap;">✂ কাটার দাগ</span>
        <span style="background: #ffffff; color: #64748b; font-size: 8px; font-weight: bold; padding: 2px; transform: rotate(90deg); white-space: nowrap;">✂ কাটার দাগ</span>
      </div>

      <!-- Center Horizontal Cutting Guide (at 105mm halfway mark) -->
      <div style="position: absolute; top: 99mm; left: 0; right: 0; height: 1px; border-top: 1.2px dashed #94a3b8; pointer-events: none; display: flex; justify-content: space-around; align-items: center; z-index: 10;">
        <span style="background: #ffffff; color: #64748b; font-size: 8px; font-weight: bold; padding: 0 4px; white-space: nowrap;">✂ কাটার দাগ</span>
        <span style="background: #ffffff; color: #64748b; font-size: 8px; font-weight: bold; padding: 0 4px; white-space: nowrap;">✂ কাটার দাগ</span>
      </div>

      <!-- Cell 1: Top-Left (LEFT SIDE TOP) -->
      <div style="width: 140mm; height: 96mm; position: relative;">
        ${cards.topLeft || `<div style="width: 100%; height: 100%; border: 1px dotted #e2e8f0; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #cbd5e1; font-size: 9px; font-family: monospace;">[খালি স্থান - পরবর্তী ব্যবহারের জন্য]</div>`}
      </div>

      <!-- Cell 2: Top-Right (RIGHT SIDE TOP) -->
      <div style="width: 140mm; height: 96mm; position: relative;">
        ${cards.topRight || `<div style="width: 100%; height: 100%; border: 1px dotted #e2e8f0; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #cbd5e1; font-size: 9px; font-family: monospace;">[খালি স্থান - পরবর্তী ব্যবহারের জন্য]</div>`}
      </div>

      <!-- Cell 3: Bottom-Left (LEFT SIDE BOTTOM) -->
      <div style="width: 140mm; height: 96mm; position: relative;">
        ${cards.bottomLeft || `<div style="width: 100%; height: 100%; border: 1px dotted #e2e8f0; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #cbd5e1; font-size: 9px; font-family: monospace;">[খালি স্থান - পরবর্তী ব্যবহারের জন্য]</div>`}
      </div>

      <!-- Cell 4: Bottom-Right (RIGHT SIDE BOTTOM) -->
      <div style="width: 140mm; height: 96mm; position: relative;">
        ${cards.bottomRight || `<div style="width: 100%; height: 100%; border: 1px dotted #e2e8f0; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #cbd5e1; font-size: 9px; font-family: monospace;">[খালি স্থান - পরবর্তী ব্যবহারের জন্য]</div>`}
      </div>

    </div>
  `;
}

// Generate a single 1/4 landscape A4 voucher card (148.5mm x 105mm)
export function generateQuarterA4SingleCardHtml(
  trx: Transaction,
  settings: ShopSettings,
  copyTag: string = 'গ্রাহক কপি (Customer Copy)'
): string {
  const dateStr = new Date(trx.timestamp).toLocaleDateString('bn-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const timeStr = new Date(trx.timestamp).toLocaleTimeString('bn-BD', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const isDue = trx.paymentMethod === 'DUE';

  return `
    <div style="box-sizing: border-box; width: 140mm; height: 96mm; max-width: 100%; border: 1.5px solid #0f172a; border-radius: 4px; padding: 7px 9px; font-family: system-ui, -apple-system, sans-serif; font-size: 10px; line-height: 1.25; color: #0f172a; background: #ffffff; display: flex; flex-direction: column; justify-content: space-between; page-break-inside: avoid; overflow: hidden; position: relative;">
      
      <!-- Top Header Row -->
      <div style="border-bottom: 1.5px solid #0f172a; padding-bottom: 4px; margin-bottom: 4px; display: flex; justify-content: space-between; align-items: flex-start;">
        <div style="max-width: 68%;">
          <div style="font-size: 14px; font-weight: 900; line-height: 1.1; color: #0f172a; letter-spacing: -0.2px;">
            ${settings.shopName}
          </div>
          <div style="font-size: 8.5px; font-weight: 600; color: #334155; margin-top: 1px;">
            ${settings.shopSubtitle}
          </div>
          <div style="font-size: 8px; color: #475569; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${settings.address} • মোবা: <b>${settings.phone1}</b>${settings.phone2 ? ', ' + settings.phone2 : ''}
          </div>
        </div>

        <div style="text-align: right; shrink: 0;">
          <div style="border: 1px solid #0f172a; padding: 1.5px 6px; font-size: 8.5px; font-weight: 800; border-radius: 3px; display: inline-block; background: #f8fafc; text-transform: uppercase;">
            ক্যাশ ভাউচার / মেমো
          </div>
          <div style="font-size: 8px; font-weight: bold; color: #059669; margin-top: 2px;">
            ${copyTag}
          </div>
        </div>
      </div>

      <!-- Invoice & Customer Meta Grid -->
      <div style="display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 2px 8px; font-size: 9px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 3px; padding: 3px 6px; margin-bottom: 4px;">
        <div>ভাউচার নং: <b style="font-family: monospace; font-size: 9.5px; color: #0f172a;">${trx.invoiceNo}</b></div>
        <div style="text-align: right;">তারিখ: <b>${dateStr}</b> <span style="font-size: 8px; color: #64748b;">${timeStr}</span></div>
        <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">গ্রাহক: <b>${trx.customerName || 'সরাসরি কাস্টমার'}</b></div>
        <div style="text-align: right;">মোবাইল: <b>${trx.customerPhone || '—'}</b></div>
      </div>

      <!-- Services & Items Table -->
      <div style="flex: 1; min-height: 24mm; margin-bottom: 2px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 9px;">
          <thead>
            <tr style="border-bottom: 1px solid #0f172a; background: #f1f5f9; font-weight: bold;">
              <th style="text-align: left; padding: 2px 4px; width: 14px;">নং</th>
              <th style="text-align: left; padding: 2px 4px;">সেবা / পণ্যের বিবরণ</th>
              <th style="text-align: center; padding: 2px 4px; width: 32px;">পরিমাণ</th>
              <th style="text-align: right; padding: 2px 4px; width: 48px;">মূল্য</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 0.8px dotted #cbd5e1;">
              <td style="padding: 3px 4px; vertical-align: top; font-weight: bold;">১.</td>
              <td style="padding: 3px 4px; vertical-align: top;">
                <b style="font-size: 9.5px; color: #0f172a;">${trx.categoryLabelBn}</b>
                ${trx.note ? `<div style="font-size: 8px; color: #475569; margin-top: 1px;">${trx.note}</div>` : ''}
              </td>
              <td style="text-align: center; padding: 3px 4px; vertical-align: top;">১ টি</td>
              <td style="text-align: right; padding: 3px 4px; font-weight: 900; font-size: 10px; vertical-align: top; color: #0f172a;">
                ৳${trx.amount.toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Financial Total & Signature Section -->
      <div>
        <div style="display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #0f172a; padding-top: 3px; font-size: 9px;">
          <div style="line-height: 1.25; max-width: 58%;">
            <div>মাধ্যম: <b style="color: #0f172a;">${trx.paymentMethodLabelBn}</b></div>
            <div style="font-size: 7.5px; color: #475569; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${settings.receiptFooterNote}
            </div>
          </div>
          <div style="text-align: right; line-height: 1.25;">
            <div>মোট বিল: <b style="font-size: 9.5px;">৳${trx.amount.toLocaleString()}</b></div>
            ${
              isDue
                ? `<div style="color: #dc2626; font-weight: bold; font-size: 8.5px;">বকেয়া: ৳${trx.amount.toLocaleString()}</div>`
                : ''
            }
            <div style="font-weight: 900; font-size: 11px; color: #0f172a; border-top: 1px solid #0f172a; margin-top: 1px; padding-top: 1px;">
              পরিশোধ: <span style="color: ${isDue ? '#dc2626' : '#15803d'};">৳${isDue ? '০.০০' : trx.amount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <!-- Signatures & Device Footer -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 6px; font-size: 7.5px; color: #475569;">
          <div style="text-align: center;">
            <div style="width: 48px; border-bottom: 0.8px dotted #64748b; margin-bottom: 2px;"></div>
            <span>গ্রাহক স্বাক্ষর</span>
          </div>
          <div style="font-size: 7px; color: #94a3b8; font-family: monospace;">
            Epson L3210 • 1/4 A4 Landscape
          </div>
          <div style="text-align: center;">
            <div style="width: 54px; border-bottom: 0.8px dotted #64748b; margin-bottom: 2px;"></div>
            <span style="font-weight: bold; color: #0f172a;">স্বত্বাধিকারী / ক্যাশিয়ার</span>
          </div>
        </div>
      </div>

    </div>
  `;
}

export function generateReceiptHtml(
  trx: Transaction,
  settings: ShopSettings,
  format: 'standard' | 'thermal' | 'quarter_a4' = 'quarter_a4',
  quarterA4Mode: QuarterA4Mode | 'single' = 'left_single',
  quadrant: QuarterA4Quadrant = 'left_top'
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

  // Format 1: 1/4 Landscape A4 for Epson L3210
  if (format === 'quarter_a4') {
    const isSingle = quarterA4Mode === 'left_single' || quarterA4Mode === 'single';

    if (quarterA4Mode === '4in1') {
      // 4 Vouchers on a single Landscape A4 page in 2x2 grid (Printed 4 at a time)
      return generateQuarterA4GridHtml({
        topLeft: generateQuarterA4SingleCardHtml(trx, settings, 'গ্রাহক কপি (Customer Copy)'),
        topRight: generateQuarterA4SingleCardHtml(trx, settings, 'দোকান/অফিস কপি (Office Copy)'),
        bottomLeft: generateQuarterA4SingleCardHtml(trx, settings, 'কাউন্টার কপি (Counter Copy)'),
        bottomRight: generateQuarterA4SingleCardHtml(trx, settings, 'অতিরিক্ত কপি (Extra Copy)'),
      });
    }

    if (quarterA4Mode === 'dual') {
      // 2 Vouchers side-by-side (Customer Copy + Office Copy) on Landscape A4 top half
      return generateQuarterA4GridHtml({
        topLeft: generateQuarterA4SingleCardHtml(trx, settings, 'গ্রাহক কপি (Customer Copy)'),
        topRight: generateQuarterA4SingleCardHtml(trx, settings, 'দোকান/অফিস কপি (Office Copy)'),
      });
    }

    // Default: Single 1/4 A4 Landscape Voucher firmly positioned at the LEFT SIDE OF THE PAPER
    const voucherCard = generateQuarterA4SingleCardHtml(trx, settings, 'গ্রাহক কপি (ক্যাশ ভাউচার)');

    if (quadrant === 'left_bottom') {
      return generateQuarterA4GridHtml({ bottomLeft: voucherCard });
    } else if (quadrant === 'right_top') {
      return generateQuarterA4GridHtml({ topRight: voucherCard });
    } else if (quadrant === 'right_bottom') {
      return generateQuarterA4GridHtml({ bottomRight: voucherCard });
    } else {
      // Default: Top-Left (strictly left side of the paper)
      return generateQuarterA4GridHtml({ topLeft: voucherCard });
    }
  }

  // Format 2: 58mm / 80mm Thermal Receipt Layout
  if (format === 'thermal') {
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

  // Format 3: Standard A5 / Half page Cash Memo
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

// 100% Reliable Print Trigger: Opens clean printable frame / window with exact print styling for Epson L3210
export function printReceiptNow(
  trx: Transaction,
  settings: ShopSettings,
  format: 'standard' | 'thermal' | 'quarter_a4' = 'quarter_a4',
  quarterA4Mode: QuarterA4Mode | 'single' = 'left_single',
  quadrant: QuarterA4Quadrant = 'left_top'
): boolean {
  const receiptHtml = generateReceiptHtml(trx, settings, format, quarterA4Mode, quadrant);

  // Compute print page CSS based on Epson L3210 requirements
  let pageSizeCss = 'auto';
  let pageMarginCss = '8mm';

  if (format === 'thermal') {
    pageSizeCss = '80mm auto';
    pageMarginCss = '2mm';
  } else if (format === 'quarter_a4') {
    pageSizeCss = 'A4 landscape';
    pageMarginCss = '4mm';
  }

  const fullPrintPage = `
    <!DOCTYPE html>
    <html lang="bn">
    <head>
      <meta charset="utf-8">
      <title>ক্যাশ ভাউচার - ${trx.invoiceNo} (Epson L3210)</title>
      <style>
        @page {
          size: ${pageSizeCss};
          margin: ${pageMarginCss};
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          margin: 0;
          padding: 0;
          background: #ffffff;
          font-family: system-ui, -apple-system, sans-serif;
          display: flex;
          justify-content: flex-start;
          align-items: flex-start;
        }
        @media print {
          body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: flex-start;
            align-items: flex-start;
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
          }, 1200);
        };
      </script>
    </body>
    </html>
  `;

  // Try window.open first (standard on Desktop & Android Chrome)
  try {
    const printWindow = window.open(
      '',
      '_blank',
      'width=640,height=520,toolbar=0,menubar=0,location=0'
    );
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
        setTimeout(() => document.body.removeChild(iframe), 2500);
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

// Print up to 4 different transactions at once on a single Landscape A4 paper (2x2 grid)
export function printBatch4QuarterA4Now(
  transactions: Transaction[],
  settings: ShopSettings
): boolean {
  const t1 = transactions[0];
  const t2 = transactions[1];
  const t3 = transactions[2];
  const t4 = transactions[3];

  const receiptHtml = generateQuarterA4GridHtml({
    topLeft: t1 ? generateQuarterA4SingleCardHtml(t1, settings, `ভাউচার ১ (${t1.invoiceNo})`) : undefined,
    topRight: t2 ? generateQuarterA4SingleCardHtml(t2, settings, `ভাউচার ২ (${t2.invoiceNo})`) : undefined,
    bottomLeft: t3 ? generateQuarterA4SingleCardHtml(t3, settings, `ভাউচার ৩ (${t3.invoiceNo})`) : undefined,
    bottomRight: t4 ? generateQuarterA4SingleCardHtml(t4, settings, `ভাউচার ৪ (${t4.invoiceNo})`) : undefined,
  });

  const fullPrintPage = `
    <!DOCTYPE html>
    <html lang="bn">
    <head>
      <meta charset="utf-8">
      <title>এক পাতায় ৪টি ভাউচার (Epson L3210)</title>
      <style>
        @page {
          size: A4 landscape;
          margin: 4mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          margin: 0;
          padding: 0;
          background: #ffffff;
          font-family: system-ui, -apple-system, sans-serif;
          display: flex;
          justify-content: flex-start;
          align-items: flex-start;
        }
        @media print {
          body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: flex-start;
            align-items: flex-start;
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
          }, 1200);
        };
      </script>
    </body>
    </html>
  `;

  try {
    const printWindow = window.open(
      '',
      '_blank',
      'width=680,height=540,toolbar=0,menubar=0,location=0'
    );
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(fullPrintPage);
      printWindow.document.close();
      return true;
    }
  } catch (err) {
    console.warn('Window open failed, falling back to hidden iframe print', err);
  }

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
        setTimeout(() => document.body.removeChild(iframe), 2500);
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
