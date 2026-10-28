import { imageapi } from "../screens/Api";

export const generateReceiptHTML = ({ student, item, school }) => {
  const logoUrl = school?.favicon ? `${imageapi}${school.favicon}` : '';

  const transactions = item.transactions && item.transactions.length > 0
    ? item.transactions
    : [];

  const transactionTotal = transactions.length > 0
    ? transactions.reduce((sum, t) => sum + parseInt(t.paid_amount || 0), 0)
    : parseInt(item.paid_amount || 0);

  const showRow = value => {
    if (value === null || value === undefined) return false;
    if (value === '0' || value === 0) return false;
    if (value === '') return false;
    return true;
  };

  const feeType = item?.fee_type || 'monthly';

  let feeRows = '';
  let posItemsTable = '';
  let posPaymentBox = '';

  if (feeType === 'monthly') {
    feeRows = `
      ${showRow(item.tution_fee) ? `
        <div class="amount-row">
          <div class="amount-label">Tuition Fee</div>
          <div class="amount-value">${item.tution_fee}</div>
        </div>
      ` : ''}

      ${showRow(item.transport_fee) ? `
        <div class="amount-row">
          <div class="amount-label">Transportation Fee</div>
          <div class="amount-value">${item.transport_fee}</div>
        </div>
      ` : ''}

      ${showRow(item.hostel_fee) ? `
        <div class="amount-row">
          <div class="amount-label">Hostel Fee</div>
          <div class="amount-value">${item.hostel_fee}</div>
        </div>
      ` : ''}

      ${showRow(item.last_month_dues) ? `
        <div class="amount-row">
          <div class="amount-label">Arrear</div>
          <div class="amount-value">${item.last_month_dues}</div>
        </div>
      ` : ''}
    `;
  }

  if (feeType === 'admission') {
    const breakdown = item.breakdown || {};

    const admissionHeads = [
      ['Registration Fee', breakdown.registration],
      ['Admission Fee', breakdown.admission],
      ['Dress Fee', breakdown.dress],
      ['Annual Fee', breakdown.annual],
      ['Examination Fee', breakdown.examination],
      ['Robotics Fee', breakdown.robotics],
      ['Security Fee', breakdown.security],
      ['Sport Fee', breakdown.sport],
    ];

    feeRows = `
      ${admissionHeads.map(([label, value]) => showRow(value) ? `
        <div class="amount-row">
          <div class="amount-label">${label}</div>
          <div class="amount-value">${value}</div>
        </div>
      ` : '').join('')}

      ${showRow(item.std_discount) ? `
        <div class="amount-row">
          <div class="amount-label">Discount</div>
          <div class="amount-value">${item.std_discount}</div>
        </div>
      ` : ''}

      ${showRow(item.net_payable) ? `
        <div class="amount-row">
          <div class="amount-label">Net Payable</div>
          <div class="amount-value">${item.net_payable}</div>
        </div>
      ` : ''}
    `;
  }

  if (feeType === 'pos') {
    feeRows = '';

    if (item?.breakdown_items?.length > 0) {
      posItemsTable = `
        <div class="history-title">POS ITEMS</div>

        <table class="txn-table">
          <tr>
            <th>Item</th>
            <th>Category</th>
            <th>Qty</th>
            <th>Rate</th>
            <th>Amount</th>
          </tr>

          ${item.breakdown_items.map(pos => `
            <tr>
              <td>${pos.head || ''}</td>
              <td class="center">${pos.category || ''}</td>
              <td class="center">${pos.qty || 0}</td>
              <td class="center">${pos.rate || 0}</td>
              <td class="center">${pos.amount || 0}</td>
            </tr>
          `).join('')}

          <tr>
            <td colspan="4" class="bold">Total</td>
            <td class="center bold">${item.total_amount}</td>
          </tr>
        </table>
      `;
    }

    posPaymentBox = `
      <div class="amount-box">
        

        <div class="amount-row">
          <div class="amount-label">Grand Total</div>
          <div>${item.total_amount || item.paid_amount}</div>
        </div>

        ${showRow(item.paid_amount) ? `
          <div class="amount-row">
            <div class="amount-label">Paid Amount</div>
            <div class="amount-value">${item.paid_amount}</div>
          </div>
        ` : ''}

        ${showRow(item.due_amount) ? `
          <div class="amount-row red">
            <div>Dues Amount</div>
            <div>${item.due_amount}</div>
          </div>
        ` : ''}
      </div>
    `;
  }

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
<style>
  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    padding: 12px;
    background: #f5f6fa;
    font-family: Arial, Helvetica, sans-serif;
    color: #111;
  }

  .receipt-card {
    background: #fff;
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid #e3e3e3;
    box-shadow: 0 5px 15px rgba(0,0,0,0.06);
  }

  .school-section {
    display: flex;
    align-items: center;
    padding: 18px 28px 16px;
  }

  .logo-box {
    width: 160px;
    text-align: center;
  }

  .logo {
    width: 115px;
    height: 115px;
    object-fit: contain;
  }

  .school-info {
    flex: 1;
    padding-left: 18px;
  }

  .school-name {
    font-size: 21px;
    font-weight: 800;
    margin-bottom: 5px;
  }

  .aff {
    font-size: 15px;
    font-weight: 700;
    margin-bottom: 5px;
  }

  .school-line {
    font-size: 13.5px;
    line-height: 1.35;
  }

  .dash-line {
    border-top: 1px dashed #d9d9d9;
  }

  .receipt-title {
    text-align: center;
    color: #e51f25;
    font-size: 18px;
    font-weight: 900;
    margin: 20px 0 16px;
    letter-spacing: 0.3px;
  }

  .receipt-title:before,
  .receipt-title:after {
    content: "-------------";
    color: #e51f25;
    font-size: 10px;
    margin: 0 16px;
    vertical-align: middle;
  }

  .content {
    padding: 0 20px 18px;
  }

  .student-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border: 1px solid #dddddd;
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 16px;
  }

  .info-cell {
    padding: 10px 16px;
    min-height: 58px;
    border-right: 1px solid #e5e5e5;
    border-bottom: 1px solid #e5e5e5;
  }

  .info-cell:nth-child(even) {
    border-right: none;
  }

  .info-cell:nth-last-child(1),
  .info-cell:nth-last-child(2) {
    border-bottom: none;
  }

  .label {
    font-size: 12.5px;
    margin-bottom: 5px;
  }

  .value {
    font-size: 13px;
    font-weight: 800;
  }

  .amount-box {
    border: 1px solid #dddddd;
    border-radius: 12px;
    padding: 6px 18px;
    margin-bottom: 18px;
  }

  .amount-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 7px 0;
    border-bottom: 1px solid #eeeeee;
    font-size: 13px;
  }

  .amount-row:last-child {
    border-bottom: none;
  }

  .amount-label {
    font-weight: 800;
  }

  .amount-value {
    font-size: 13px;
  }

  .red {
    color: #e51f25;
    font-weight: 900;
  }

  .history-title {
    font-size: 16px;
    font-weight: 900;
    margin: 0 0 9px 2px;
  }

  .txn-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    border: 1px solid #dddddd;
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 18px;
  }

  .txn-table th {
    background: #fff0f0;
    font-size: 13px;
    padding: 9px;
    text-align: center;
    border-right: 1px solid #dddddd;
    border-bottom: 1px solid #dddddd;
  }

  .txn-table th:last-child {
    border-right: none;
  }

  .txn-table td {
    font-size: 13px;
    padding: 9px 12px;
    border-right: 1px solid #dddddd;
    border-bottom: 1px solid #dddddd;
  }

  .txn-table td:last-child {
    border-right: none;
  }

  .txn-table tr:last-child td {
    border-bottom: none;
  }

  .center {
    text-align: center;
  }

  .bold {
    font-weight: 900;
  }

  .note-box {
    background: #fffafa;
    border: 1px solid #ffd6d6;
    border-radius: 12px;
    padding: 12px 18px;
    font-size: 13.5px;
    line-height: 1.35;
  }

  .note-title {
    color: #e51f25;
    font-weight: 900;
    margin-right: 8px;
  }

  @media print {
    body {
      background: #fff;
      padding: 0;
    }

    .receipt-card {
      box-shadow: none;
      border-radius: 0;
      border: none;
    }
  }
</style>
  </head>

  <body>
    <div class="receipt-card">

      <div class="school-section">
        <div class="logo-box">
          ${logoUrl ? `<img src="${logoUrl}" class="logo" />` : ''}
        </div>

        <div class="school-info">
          <div class="school-name">${school?.company || 'TRINITY CONVENT SCHOOL'}</div>
          <div class="aff">CBSE Aff.No-${school?.affliliation_no || ''}</div>
          <div class="school-line">
            ${school?.address || ''}, ${school?.city || ''}, ${school?.state || ''} - ${school?.pin || ''}
          </div>
          <div class="school-line">
            PH: ${school?.phonea || ''} ${school?.phoneb ? `| ${school.phoneb}` : ''}
          </div>
          <div class="school-line">
            Email: ${school?.emaila || ''}
          </div>
        </div>
      </div>

      <div class="dash-line"></div>

      <div class="receipt-title">
        FEE RECEIPT UPTO (${item.month_year || ''})
      </div>

      <div class="content">

        <div class="student-grid">
          <div class="info-cell">
            <div class="label">Student Name</div>
            <div class="value">${student?.trainees_name || ''}</div>
          </div>

          <div class="info-cell">
            <div class="label">Receipt No.</div>
            <div class="value">${item.bill_no || item.reference_no || ''}</div>
          </div>

          <div class="info-cell">
            <div class="label">Class/Section</div>
            <div class="value">${student?.class_name || ''}${student?.section_name ? ` / ${student.section_name}` : ''}</div>
          </div>

          <div class="info-cell">
            <div class="label">Generated Date</div>
            <div class="value">${item.date || ''}</div>
          </div>

          <div class="info-cell">
            <div class="label">Father's Name</div>
            <div class="value">${student?.faname || ''}</div>
          </div>

          <div class="info-cell">
            <div class="label">Phone</div>
            <div class="value">${student?.guardian_mob || student?.phone || ''}</div>
          </div>

          <div class="info-cell">
            <div class="label">Mother's Name</div>
            <div class="value">${student?.mname || ''}</div>
          </div>

          <div class="info-cell">
            <div class="label">Email</div>
            <div class="value">${student?.email || '—'}</div>
          </div>
        </div>

        ${feeType !== 'pos' ? `
          <div class="amount-box">
            ${feeRows}

            <div class="amount-row">
              <div class="amount-label">Grand Total</div>
              <div>${item.total_amount}</div>
            </div>

            ${showRow(item.paid_amount) ? `
              <div class="amount-row">
                <div class="amount-label">Paid Amount</div>
                <div class="amount-value">${item.paid_amount}</div>
              </div>
            ` : ''}

            ${showRow(item.due_amount) ? `
              <div class="amount-row red">
                <div>Dues Amount</div>
                <div>${item.due_amount}</div>
              </div>
            ` : ''}
          </div>
        ` : ''}

        ${posItemsTable}

        ${posPaymentBox}

        <div class="history-title">TRANSACTION HISTORY</div>

        <table class="txn-table">
          <tr>
            <th>Date</th>
            <th>Mode</th>
            <th>Amount</th>
          </tr>

          ${
            transactions.length > 0
              ? transactions.map(txn => `
                <tr>
                  <td>${txn.payment_date || txn.date || '-'}</td>
                  <td class="center">
                    ${txn.mode || txn.payment_mode || '-'}
                    ${
  (txn.mode || txn.payment_mode || '').toLowerCase() !== 'cash'
    ? `
      ${txn.payment_id ? `<br/>${txn.payment_id}` : ''}
      ${txn.reference_no ? `<br/>${txn.reference_no}` : ''}
    `
    : ''
}
                  </td>
                  <td class="center">${txn.paid_amount || txn.amount || 0}</td>
                </tr>
              `).join('')
              : `
                <tr>
                  <td>${item.date || '-'}</td>
                  <td class="center">
                    ${item.payment_mode || '-'}
                   ${
  (item.payment_mode || '').toLowerCase() !== 'cash'
    ? (item.reference_no ? `<br/>${item.reference_no}` : '')
    : ''
}
                  </td>
                  <td class="center">${item.paid_amount || 0}</td>
                </tr>
              `
          }

          <tr>
            <td colspan="2" class="bold">Total</td>
            <td class="center bold">${transactionTotal}</td>
          </tr>
        </table>

        <div class="note-box">
          <span class="note-title">Note:</span>
          This is a computer generated receipt and does not require any signature.
        </div>

      </div>
    </div>
  </body>
  </html>
  `;
};