const PDFDocument = require('pdfkit');

// Color constants
const COLORS = {
  primary: '#1B1D22',
  accent: '#5FCB8D',
  success: '#4CAF50',
  danger: '#F16C6C',
  warning: '#F6B545',
  text: '#111827',
  lightGray: '#F5F6F8',
  gray: '#6B7280',
  border: '#ECECEC'
};

const drawProfessionalHeader = (doc, title) => {
  doc.rect(0, 0, doc.page.width, 100).fill('#EEF5EF');
  
  // Logo
  doc.fillColor(COLORS.accent).font('Helvetica-Bold').fontSize(26)
    .text('H', 40, 25, { width: 40, align: 'center' });
  doc.lineWidth(2).strokeColor(COLORS.primary)
    .circle(60, 38, 20).stroke();

  doc.fillColor(COLORS.primary).fontSize(22).font('Helvetica-Bold')
    .text('Hostel Hub', 100, 25);
  
  doc.fillColor(COLORS.gray).fontSize(12).font('Helvetica')
    .text(title.toUpperCase(), 100, 55);

  doc.fillColor(COLORS.gray).fontSize(9).font('Helvetica')
    .text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 0, 45, { align: 'right', width: doc.page.width - 40 })
    .text(`Time: ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })} IST`, 0, 60, { align: 'right', width: doc.page.width - 40 });
};

const addPageNumbersAndFooter = (doc) => {
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    // Footer line
    doc.moveTo(40, doc.page.height - 40).lineTo(doc.page.width - 40, doc.page.height - 40)
      .strokeColor(COLORS.border).lineWidth(1).stroke();
    
    // Page numbers
    doc.fillColor(COLORS.gray).fontSize(9).font('Helvetica')
      .text(`Page ${i + 1} of ${range.count}`, 0, doc.page.height - 30, { align: 'center', width: doc.page.width, lineBreak: false, height: 15 });
      
    // Branding
    doc.fillColor(COLORS.gray).fontSize(8).font('Helvetica')
      .text('Hostel Hub - Generated Report', 40, doc.page.height - 30, { align: 'left', lineBreak: false, height: 15 });
  }
};

const addSignatoryArea = (doc, y) => {
  if (y > doc.page.height - 120) {
    doc.addPage();
    y = 120;
  }
  y += 60;
  doc.moveTo(doc.page.width - 220, y).lineTo(doc.page.width - 40, y).strokeColor(COLORS.border).lineWidth(1).stroke();
  doc.fillColor(COLORS.primary).fontSize(10).font('Helvetica-Bold')
    .text('Authorized Signatory', doc.page.width - 220, y + 10, { width: 180, align: 'center' });
  doc.fillColor(COLORS.gray).fontSize(9).font('Helvetica')
    .text('Hostel Administration', doc.page.width - 220, y + 25, { width: 180, align: 'center' });
};

const drawTable = (doc, cols, rows, startY, drawHeaderCb) => {
  let y = startY;
  const totalWidth = doc.page.width - 80;
  
  // Header
  doc.fillColor(COLORS.primary).rect(40, y, totalWidth, 30).fill();
  doc.fillColor('white').fontSize(10).font('Helvetica-Bold');
  let x = 40;
  cols.forEach(col => {
    doc.text(col.label, x + 8, y + 10, { width: col.width - 16, lineBreak: false, ellipsis: true });
    x += col.width;
  });
  y += 30;

  // Rows
  rows.forEach((row, i) => {
    // Calculate required height for this row
    let maxTextHeight = 0;
    doc.fontSize(9).font('Helvetica');
    row.forEach((val, colIdx) => {
      const h = doc.heightOfString(String(val), { width: cols[colIdx].width - 16 });
      if (h > maxTextHeight) maxTextHeight = h;
    });
    const rowHeight = Math.max(26, maxTextHeight + 14);

    if (y + rowHeight > doc.page.height - 90) {
      doc.addPage();
      drawHeaderCb(doc);
      y = 120; // reset y after header
      // Re-draw table header
      doc.fillColor(COLORS.primary).rect(40, y, totalWidth, 30).fill();
      doc.fillColor('white').fontSize(10).font('Helvetica-Bold');
      let hX = 40;
      cols.forEach(col => {
        doc.text(col.label, hX + 8, y + 10, { width: col.width - 16, lineBreak: false, ellipsis: true });
        hX += col.width;
      });
      y += 30;
    }
    
    const bg = i % 2 === 0 ? '#FFFFFF' : COLORS.lightGray;
    doc.fillColor(bg).rect(40, y, totalWidth, rowHeight).fill();
    
    // Draw vertical lines
    let lineX = 40;
    doc.lineWidth(0.5).strokeColor(COLORS.border);
    cols.forEach(col => {
      doc.moveTo(lineX, y).lineTo(lineX, y + rowHeight).stroke();
      lineX += col.width;
    });
    doc.moveTo(lineX, y).lineTo(lineX, y + rowHeight).stroke();
    
    doc.fillColor(COLORS.text).fontSize(9).font('Helvetica');
    x = 40;
    row.forEach((val, colIdx) => {
      let tColor = COLORS.text;
      if (val === 'Paid' || val === 'Approved' || val === 'Resolved') tColor = COLORS.success;
      if (val === 'Pending' || val === 'Overdue' || val === 'Rejected') tColor = COLORS.danger;
      
      doc.fillColor(tColor).text(String(val), x + 8, y + 7, { width: cols[colIdx].width - 16 });
      x += cols[colIdx].width;
    });
    
    y += rowHeight;
    // Horizontal line at bottom of row
    doc.moveTo(40, y).lineTo(40 + totalWidth, y).strokeColor(COLORS.border).stroke();
  });
  
  return y;
};

/**
 * Generates a students report PDF.
 */
const generateStudentsReport = (students) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margins: { top: 40, left: 40, right: 40, bottom: 20 }, size: 'A4', layout: 'landscape', bufferPages: true, autoFirstPage: true });
    const buffers = [];
    doc.on('data', (d) => buffers.push(d));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    drawProfessionalHeader(doc, 'Detailed Student Report');

    // Summary Card
    let y = 120;
    doc.fillColor(COLORS.lightGray).rect(40, y, 200, 50).fill();
    doc.fillColor(COLORS.gray).font('Helvetica-Bold').fontSize(11).text('Total Students', 50, y + 10);
    doc.fillColor(COLORS.accent).fontSize(20).text(students.length.toString(), 50, y + 25);
    y += 70;

    // Table
    const cols = [
      { label: 'Student ID', width: 115 },
      { label: 'Name', width: 140 },
      { label: 'Course', width: 110 },
      { label: 'Dept', width: 100 },
      { label: 'Yr', width: 35 },
      { label: 'Room', width: 70 },
      { label: 'Phone', width: 95 },
      { label: 'Status', width: 75 },
    ];
    
    const rows = students.map(s => {
      let rm = String(s.room_number || 'N/A');
      if (s.room_number) rm = `${s.block || ''}-${s.room_number}`;
      return [
        s.student_id || 'N/A',
        s.name || 'N/A',
        s.course || 'N/A',
        s.department || 'N/A',
        s.year || 'N/A',
        rm,
        s.phone || 'N/A',
        s.status || 'N/A'
      ];
    });

    const drawHeaderCb = (d) => drawProfessionalHeader(d, 'Detailed Student Report (Contd.)');
    
    y = drawTable(doc, cols, rows, y, drawHeaderCb);

    addSignatoryArea(doc, y);
    addPageNumbersAndFooter(doc);
    doc.end();
  });
};

/**
 * Generates a fee collection report PDF.
 */
const generateFeesReport = (fees, summary) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margins: { top: 40, left: 40, right: 40, bottom: 20 }, size: 'A4', bufferPages: true, autoFirstPage: true });
    const buffers = [];
    doc.on('data', (d) => buffers.push(d));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    drawProfessionalHeader(doc, 'Fee Collection & Due Report');

    // Summary cards
    let y = 120;
    const summaryData = summary.reduce((acc, s) => { acc[s.status] = s; return acc; }, {});
    const totalCollected = parseFloat(summaryData['Paid']?.total_amount || 0);
    const totalPending = parseFloat(summaryData['Pending']?.total_amount || 0) + parseFloat(summaryData['Overdue']?.total_amount || 0);

    doc.fillColor('#E8F5E9').rect(40, y, 220, 60).fill();
    doc.fillColor('#2E7D32').font('Helvetica-Bold').fontSize(11).text('TOTAL COLLECTED', 55, y + 15);
    doc.fontSize(20).text(`Rs. ${totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 55, y + 35);

    doc.fillColor('#FFEBEE').rect(doc.page.width - 260, y, 220, 60).fill();
    doc.fillColor('#C62828').font('Helvetica-Bold').fontSize(11).text('TOTAL PENDING / OVERDUE', doc.page.width - 245, y + 15);
    doc.fontSize(20).text(`Rs. ${totalPending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, doc.page.width - 245, y + 35);

    y += 90;

    // Table
    const cols = [
      { label: 'Student', width: 140 },
      { label: 'Std ID', width: 80 },
      { label: 'Month', width: 70 },
      { label: 'Total Due', width: 80 },
      { label: 'Status', width: 70 },
      { label: 'Paid Date', width: 75 },
    ];
    
    const rows = fees.map(f => {
      const totalAmount = parseFloat(f.amount) + parseFloat(f.fine_amount || 0);
      return [
        f.student_name,
        f.student_code,
        f.month_year || 'N/A',
        `Rs. ${totalAmount.toLocaleString('en-IN')}`,
        f.status,
        f.paid_date ? new Date(f.paid_date).toLocaleDateString('en-IN') : '-'
      ];
    });

    const drawHeaderCb = (d) => drawProfessionalHeader(d, 'Fee Collection Report (Contd.)');
    
    y = drawTable(doc, cols, rows, y, drawHeaderCb);

    addSignatoryArea(doc, y);
    addPageNumbersAndFooter(doc);
    doc.end();
  });
};

/**
 * Generates a professional fee receipt PDF.
 */
const generateFeeReceipt = (fee) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margins: { top: 50, left: 50, right: 50, bottom: 20 }, size: 'A4', bufferPages: true, autoFirstPage: true });
    const buffers = [];
    doc.on('data', (d) => buffers.push(d));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    drawProfessionalHeader(doc, 'Fee Payment Receipt');
    let y = 120;

    // ── Receipt Info Box ──────────────────────────────────────────────────────
    doc.fillColor(COLORS.lightGray).rect(50, y, doc.page.width - 100, 60).fill();
    doc.fillColor(COLORS.text).fontSize(11).font('Helvetica-Bold')
      .text(`Receipt No: HH-${String(fee.id).padStart(5, '0')}`, 60, y + 15)
      .text(`Date: ${fee.paid_date ? new Date(fee.paid_date).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}`, 60, y + 35);
    doc.text(`Status: ${fee.status}`, 350, y + 15)
      .text(`Month: ${fee.month_year || 'N/A'}`, 350, y + 35);

    y += 80;
    // ── Student Details ───────────────────────────────────────────────────────
    doc.fillColor(COLORS.primary).fontSize(12).font('Helvetica-Bold')
      .text('STUDENT DETAILS', 50, y);
    doc.moveTo(50, y + 17).lineTo(doc.page.width - 50, y + 17).strokeColor(COLORS.border).lineWidth(2).stroke();
    
    y += 25;
    doc.fillColor(COLORS.text).fontSize(11).font('Helvetica');
    const studentDetails = [
      ['Student Name', fee.student_name || 'N/A'],
      ['Student ID', fee.student_code || 'N/A'],
      ['Course / Dept', `${fee.course || 'N/A'} / ${fee.department || 'N/A'}`],
      ['Room Number', fee.room_number ? `${fee.block || ''}-${fee.room_number}` : 'Not Allocated'],
    ];

    studentDetails.forEach(([label, value]) => {
      doc.font('Helvetica-Bold').text(label + ':', 60, y).font('Helvetica').text(value, 200, y);
      y += 22;
    });

    // ── Payment Details ───────────────────────────────────────────────────────
    y += 10;
    doc.fillColor(COLORS.primary).fontSize(12).font('Helvetica-Bold')
      .text('PAYMENT DETAILS', 50, y);
    y += 17;
    doc.moveTo(50, y).lineTo(doc.page.width - 50, y).strokeColor(COLORS.border).lineWidth(2).stroke();

    // Table header
    y += 8;
    doc.fillColor(COLORS.primary).rect(50, y, doc.page.width - 100, 25).fill();
    doc.fillColor('white').fontSize(11).font('Helvetica-Bold')
      .text('Description', 60, y + 7)
      .text('Amount (Rs.)', 400, y + 7, { width: 100, align: 'right' });
    y += 25;

    // Table rows
    const paymentRows = [
      ['Hostel Fee', `Rs. ${parseFloat(fee.amount).toFixed(2)}`],
      ['Fine Amount', `Rs. ${parseFloat(fee.fine_amount || 0).toFixed(2)}`],
    ];

    paymentRows.forEach((row, i) => {
      const bg = i % 2 === 0 ? '#FFFFFF' : COLORS.lightGray;
      doc.fillColor(bg).rect(50, y, doc.page.width - 100, 22).fill();
      doc.fillColor(COLORS.text).font('Helvetica').fontSize(11)
        .text(row[0], 60, y + 6).text(row[1], 400, y + 6, { width: 100, align: 'right', lineBreak: false });
      y += 22;
    });

    // Total
    const total = parseFloat(fee.amount) + parseFloat(fee.fine_amount || 0);
    doc.fillColor('#EEF5EF').rect(50, y, doc.page.width - 100, 30).fill();
    doc.fillColor(COLORS.primary).font('Helvetica-Bold').fontSize(12)
      .text('TOTAL AMOUNT PAID', 60, y + 9)
      .text(`Rs. ${total.toFixed(2)}`, 400, y + 9, { width: 100, align: 'right', lineBreak: false });
    y += 40;

    addSignatoryArea(doc, y);
    addPageNumbersAndFooter(doc);
    
    // Outer border
    const range = doc.bufferedPageRange();
    for(let i=0; i<range.count; i++) {
        doc.switchToPage(i);
        doc.rect(15, 15, doc.page.width - 30, doc.page.height - 30).strokeColor(COLORS.border).lineWidth(1).stroke();
    }

    doc.end();
  });
};

module.exports = { generateFeeReceipt, generateStudentsReport, generateFeesReport };
