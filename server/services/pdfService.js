const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

function toYear(value) {
  const normalized = String(value || '').trim();
  if (!normalized) return '';

  const directYear = normalized.match(/^\d{4}$/);
  if (directYear) return directYear[0];

  const isoYear = normalized.match(/^(\d{4})-\d{2}-\d{2}$/);
  if (isoYear) return isoYear[1];

  const genericYear = normalized.match(/(\d{4})/);
  return genericYear ? genericYear[1] : normalized;
}

/**
 * Generate a certificate PDF with embedded student data and a QR code pointing to public verification.
 * Returns { filePath, hashHex }
 * @param {Object} params
 * @param {number|string} params.certificateId
 * @param {string} params.studentName
 * @param {string} params.enrollmentNumber
 * @param {string} params.startDate
 * @param {string} params.finishedDate
 * @param {string} params.examType
 * @param {string} params.positionHeld
 * @param {string} params.conduct
 * @param {string} params.verificationCode
 * @param {string} [params.baseUrl] - base URL for QR verification page (e.g., https://example.com)
 */
async function generateCertificatePDF(params) {
  const {
    certificateId,
    studentName,
    enrollmentNumber,
    startDate,
    finishedDate,
    examType,
    positionHeld,
    conduct,
    verificationCode,
    baseUrl
  } = params;

  const publicDir = path.join(__dirname, '..', 'public');
  const certDir = path.join(publicDir, 'certificates');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  if (!fs.existsSync(certDir)) fs.mkdirSync(certDir, { recursive: true });

  const filePath = path.join(certDir, `${certificateId}.pdf`);

  // Build verification URL encoded in QR.
  const origin = baseUrl || process.env.PUBLIC_BASE_URL || 'https://certification-verification-system.onrender.com';
  const verifyUrl = `${origin}/api/verify?code=${encodeURIComponent(verificationCode)}`;

  // Create QR code image buffer
  const qrPngBuffer = await QRCode.toBuffer(verifyUrl, { 
    type: 'png', 
    margin: 1, 
    width: 200,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  });

  // Canonical testimonial layout (always used for issued certificates)
  const doc = new PDFDocument({ 
    size: 'A4',
    layout: 'landscape',
    margin: 0,
    bufferPages: false,
    autoFirstPage: true
  });
  const writeStream = fs.createWriteStream(filePath);
  doc.pipe(writeStream);

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const centerX = pageWidth / 2;

  // Main border
  doc
    .strokeColor('#1a1a1a')
    .lineWidth(2)
    .rect(12, 12, pageWidth - 24, pageHeight - 24)
    .stroke();

  // Corner decorations
  const drawCorner = (mirror = false) => {
    doc.save();
    if (mirror) {
      doc.translate(pageWidth, pageHeight);
      doc.scale(-1, -1);
    }

    doc
      .fillColor('#ffffff')
      .moveTo(0, 0)
      .lineTo(250, 0)
      .lineTo(0, 145)
      .closePath()
      .fill();

    doc
      .fillColor('#b61d26')
      .moveTo(92, 0)
      .lineTo(124, 0)
      .lineTo(0, 124)
      .lineTo(0, 93)
      .closePath()
      .fill();

    doc.restore();
  };

  drawCorner(false);
  drawCorner(true);

  // RC mark
  doc.save();
  doc.rotate(-44, { origin: [88, 58] });
  doc
    .font('Times-Bold')
    .fontSize(24)
    .fillColor('#8e1118')
    .text('RC: 1320997', 52, 72, { lineBreak: false });
  doc.restore();

  // Header (logo removed)

  doc
    .fontSize(38)
    .fillColor('#1f5dbf')
    .font('Helvetica-Bold')
    .text('IMAMU HAFSIN', 180, 44, {
      align: 'center',
      width: pageWidth - 260,
      lineBreak: false
    });

  doc
    .fontSize(30)
    .fillColor('#c81f28')
    .font('Helvetica-Bold')
    .text('MODEL INTERNATIONAL SCHOOL', 180, 84, {
      align: 'center',
      width: pageWidth - 260,
      lineBreak: false
    });

  doc
    .fontSize(12)
    .fillColor('#111111')
    .font('Helvetica-Bold')
    .text("NO 60 DR. SANI YAKASAI STREET TAL'UDU G/KAYA KANO STATE", 180, 124, {
      align: 'center',
      width: pageWidth - 260,
      lineBreak: false
    });

  doc
    .fontSize(56)
    .fillColor('#9f1822')
    .font('Times-Bold')
    .text('CERTIFICATE', 40, 164, {
      align: 'center',
      width: pageWidth - 80,
      lineBreak: false
    });

  doc
    .fontSize(24)
    .fillColor('#111111')
    .font('Times-Italic')
    .text('This is to Certify that:', 40, 224, {
      align: 'center',
      width: pageWidth - 80,
      lineBreak: false
    });

  const examTypeValue = String(examType || 'SSCE');
  const issuedName = String(studentName || '');
  const issuedStartYear = toYear(startDate);
  const issuedFinishYear = toYear(finishedDate);
  const issuedConduct = String(conduct || 'Satisfactory');
  const issuedPosition = String(positionHeld || 'NIL');
  const issuedEnrollment = String(enrollmentNumber || '');

  const statement = `${issuedName} has completed his/her (${examTypeValue}) course from ${issuedStartYear} to ${issuedFinishYear} while at school his/her conduct was ${issuedConduct}. Position held at school: ${issuedPosition}.`;

  doc
    .fontSize(21)
    .fillColor('#111111')
    .font('Times-Roman')
    .text(statement, 72, 270, {
      align: 'center',
      width: pageWidth - 144,
      lineGap: 8
    });

  // Signature row and QR
  const sigY = pageHeight - 102;
  const leftSigX = 80;
  const rightSigX = pageWidth - 280;

  const qrSize = 124;
  const qrX = centerX - (qrSize / 2);
  const qrY = sigY - 58;
  const leftLabelX = leftSigX + 10;
  const rightLabelX = rightSigX + 10;

  doc.rect(qrX - 8, qrY - 8, qrSize + 16, qrSize + 16).lineWidth(2).stroke('#1c1c1c');
  doc.image(qrPngBuffer, qrX, qrY, { fit: [qrSize, qrSize] });

  doc
    .fontSize(14)
    .font('Helvetica-Bold')
    .fillColor('#111111')
    .text('SIGN:', leftLabelX, sigY - 16, {
      width: 52,
      align: 'left',
      lineBreak: false
    });

  doc
    .fontSize(26)
    .font('Times-Italic')
    .fillColor('#111111')
    .text('Usman', leftLabelX + 50, sigY - 24, {
      width: 140,
      align: 'center',
      lineBreak: false
    });

  doc
    .strokeColor('#222222')
    .lineWidth(1)
    .moveTo(leftLabelX + 46, sigY)
    .lineTo(leftLabelX + 190, sigY)
    .stroke();

  doc
    .fontSize(14)
    .fillColor('#8f3f2c')
    .font('Helvetica-Bold')
    .text('(PRINCIPAL)', leftSigX + 10, sigY + 8, {
      width: 190,
      align: 'center',
      lineBreak: false
    });

  doc
    .fontSize(14)
    .fillColor('#111111')
    .font('Helvetica-Bold')
    .text('NAME:', leftLabelX, sigY + 30, {
      width: 58,
      align: 'left',
      lineBreak: false
    });

  doc
    .fontSize(14)
    .fillColor('#111111')
    .font('Helvetica-Bold')
    .text('Usman Said Isa', leftLabelX + 58, sigY + 30, {
      width: 140,
      align: 'left',
      lineBreak: false
    });

  doc
    .fontSize(14)
    .font('Helvetica-Bold')
    .fillColor('#111111')
    .text('SIGN:', rightLabelX, sigY - 16, {
      width: 52,
      align: 'left',
      lineBreak: false
    });

  doc
    .fontSize(24)
    .font('Times-Italic')
    .fillColor('#111111')
    .text('Auwal', rightLabelX + 50, sigY - 24, {
      width: 140,
      align: 'center',
      lineBreak: false
    });

  doc
    .strokeColor('#222222')
    .lineWidth(1)
    .moveTo(rightLabelX + 46, sigY)
    .lineTo(rightLabelX + 190, sigY)
    .stroke();

  doc
    .fontSize(14)
    .fillColor('#8f3f2c')
    .font('Helvetica-Bold')
    .text('(DIRECTOR)', rightLabelX + 10, sigY + 12, {
      width: 190,
      align: 'center',
      lineBreak: false
    });

  doc
    .fontSize(14)
    .fillColor('#111111')
    .font('Helvetica-Bold')
    .text('NAME:', rightLabelX, sigY + 30, {
      width: 58,
      align: 'left',
      lineBreak: false
    });

  doc
    .fontSize(14)
    .fillColor('#111111')
    .font('Helvetica-Bold')
    .text('Auwal Muhammad', rightLabelX + 58, sigY + 30, {
      width: 140,
      align: 'left',
      lineBreak: false
    });

  // Finalize the PDF and end the stream
  doc.flushPages();
  doc.end();

  // Wait for stream finish
  await new Promise((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });

  // Compute SHA-256 hash of the PDF
  const buffer = fs.readFileSync(filePath);
  const hashHex = crypto.createHash('sha256').update(buffer).digest('hex');

  return { filePath, hashHex };
}

module.exports = { generateCertificatePDF };
