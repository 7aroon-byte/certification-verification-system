function login(req, res) {
  res.status(410).json({ success: false, message: 'Verifier login endpoint removed' });
}

function verifyCertificate(req, res) {
  res.status(410).json({ success: false, message: 'Verifier verify endpoint removed' });
}

function resolveQualification(examType) {
  const normalized = String(examType || '').trim().toUpperCase();
  if (normalized === 'SSCE') return 'Secondary School Certificate Examination (SSCE)';
  if (normalized === 'JSCE') return 'Junior Secondary School Certificate Examination (JSCE)';
  if (normalized === 'FSLCE') return 'First School Leaving Certificate Examination (FSLCE)';
  if (normalized) return String(examType).trim();
  return 'Secondary School Leaving Certificate';
}

async function trackVerification(req, payload) {
  try {
    const { trackVerificationEvent } = require('../services/verificationAnalyticsService');
    await trackVerificationEvent({ req, ...payload });
  } catch (error) {
    console.warn('[Verify] Analytics tracking skipped:', error.message);
  }
}

function normalizeStatus(value) {
  return String(value || '').trim().toLowerCase();
}

function isIssuedStatus(status) {
  const normalized = normalizeStatus(status);
  return normalized === 'issued' || normalized === 'valid' || normalized === 'verified';
}

async function publicVerify(req, res) {
  try {
    const identifier = req.query.code;
    if (!identifier) {
      await trackVerification(req, {
        mode: 'search',
        queryInput: '',
        certificate: null,
        verified: false,
        verdict: 'missing_input',
        statusCode: 400,
      });
      return res.status(400).json({ success: false, message: 'Missing verification input' });
    }

    const userService = require('../services/useService');
    const certificate = await userService.findCertificateForPublicVerify(identifier);
    if (!certificate) {
      await trackVerification(req, {
        mode: 'search',
        queryInput: identifier,
        certificate: null,
        verified: false,
        verdict: 'not_found',
        statusCode: 404,
      });
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    // If no pdf hash yet, cannot verify on-chain
    const pdfHash = certificate.pdf_hash;
    let onChain = { registered: false, record: null };
    if (pdfHash) {
      try {
        const { verifyOnChain } = require('../services/blockchainService');
        onChain = await verifyOnChain({ pdfHashHex: pdfHash });
      } catch (err) {
        // On-chain check optional; include error state
        onChain = { registered: false, record: null, error: err?.message || String(err) };
      }
    }

    const result = {
      id: certificate.id,
      studentName: certificate.student_name || certificate.current_student_name || null,
      enrollmentNumber: certificate.enrollment_number || certificate.current_enrollment_number || null,
      startDate: certificate.start_date || certificate.current_enrollment_year || null,
      finishedDate: certificate.finished_date || certificate.current_graduation_year || null,
      dateIssued: certificate.date_issued,
      examType: certificate.exam_type || null,
      qualification: resolveQualification(certificate.exam_type),
      status: certificate.status,
      verificationCode: certificate.verification_code,
      pdfHash: certificate.pdf_hash || null,
      blockchainStatus: certificate.blockchain_status || null,
      blockchainTxHash: certificate.blockchain_tx_hash || null,
      onChain
    };

    const dbSaysOnChain = ['onchain', 'issued'].includes(normalizeStatus(certificate.blockchain_status));
    const certStatus = normalizeStatus(certificate.status);
    const revoked = certStatus === 'revoked' || !!onChain?.record?.revoked;
    const inactive = certStatus === 'deleted';
    const onChainConfirmed = !!(onChain.registered && onChain.record && onChain.record.revoked === false);
    const issuedInDb = isIssuedStatus(certStatus);

    // Public search verification should trust issued DB records when not revoked/deleted.
    // Blockchain status remains a stronger signal when available.
    const verified = !!(!inactive && !revoked && (onChainConfirmed || dbSaysOnChain || issuedInDb));

    await trackVerification(req, {
      mode: 'search',
      queryInput: identifier,
      certificate,
      verified,
      verdict: verified ? 'valid' : 'invalid',
      statusCode: 200,
    });

    return res.json({ success: true, verified, data: result });
  } catch (error) {
    console.error('Public verify error:', error);
    await trackVerification(req, {
      mode: 'search',
      queryInput: req.query?.code || '',
      certificate: null,
      verified: false,
      verdict: 'error',
      statusCode: 500,
    });
    res.status(500).json({ success: false, message: error.message || 'Verification failed' });
  }
}

async function publicVerifyByHash(req, res) {
  try {
    const { code, pdfHash } = req.body || {};
    if (!pdfHash) {
      await trackVerification(req, {
        mode: 'hash',
        queryInput: code || '',
        certificate: null,
        verified: false,
        verdict: 'missing_hash',
        statusCode: 400,
      });
      return res.status(400).json({ success: false, message: 'Missing PDF hash' });
    }

    const normalizedHash = String(pdfHash).trim().toLowerCase().replace(/^0x/, '');
    if (!/^[a-f0-9]{64}$/.test(normalizedHash)) {
      await trackVerification(req, {
        mode: 'hash',
        queryInput: code || '',
        certificate: null,
        verified: false,
        verdict: 'invalid_hash_format',
        statusCode: 400,
      });
      return res.status(400).json({ success: false, message: 'Invalid PDF hash format. Expected SHA-256 hex.' });
    }

    const userService = require('../services/useService');
    const normalizedCode = String(code || '').trim();
    let certificate = null;

    if (normalizedCode) {
      certificate = await userService.findCertificateByVerificationCode(normalizedCode);
    } else {
      certificate = await userService.findCertificateByHashOrTx({ certHash: normalizedHash });
    }

    if (!certificate) {
      await trackVerification(req, {
        mode: 'hash',
        queryInput: code || '',
        certificate: null,
        verified: false,
        verdict: 'not_found',
        statusCode: 404,
      });
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    const storedHash = (certificate.pdf_hash || '').toLowerCase().replace(/^0x/, '');
    const hashMatches = !!storedHash && storedHash === normalizedHash;

    let onChain = { registered: false, record: null };
    if (hashMatches) {
      try {
        const { verifyOnChain } = require('../services/blockchainService');
        onChain = await verifyOnChain({ pdfHashHex: normalizedHash });
      } catch (err) {
        onChain = { registered: false, record: null, error: err?.message || String(err) };
      }
    }

    const dbSaysOnChain = ['onchain', 'issued'].includes(normalizeStatus(certificate.blockchain_status));
    const certStatus = normalizeStatus(certificate.status);
    const revoked = certStatus === 'revoked' || !!onChain?.record?.revoked;
    const inactive = certStatus === 'deleted';
    const onChainConfirmed = !!onChain.registered;
    const issuedInDb = isIssuedStatus(certStatus);
    const verified = !!(hashMatches && !inactive && !revoked && (onChainConfirmed || dbSaysOnChain || issuedInDb));

    let verdict = 'not_verified';
    if (!hashMatches) verdict = 'hash_mismatch';
    else if (revoked) verdict = 'revoked';
    else if (verified) verdict = 'valid';
    else verdict = 'not_onchain';

    await trackVerification(req, {
      mode: 'hash',
      queryInput: code || '',
      certificate,
      verified,
      verdict,
      statusCode: 200,
    });

    return res.json({
      success: true,
      verified,
      verdict,
      data: {
        id: certificate.id,
        studentName: certificate.student_name || certificate.current_student_name || null,
        enrollmentNumber: certificate.enrollment_number || certificate.current_enrollment_number || null,
        startDate: certificate.start_date || certificate.current_enrollment_year || null,
        finishedDate: certificate.finished_date || certificate.current_graduation_year || null,
        dateIssued: certificate.date_issued,
        examType: certificate.exam_type || null,
        qualification: resolveQualification(certificate.exam_type),
        status: certificate.status,
        blockchainStatus: certificate.blockchain_status || null,
        blockchainTxHash: certificate.blockchain_tx_hash || null,
        verificationCode: certificate.verification_code,
        storedPdfHash: certificate.pdf_hash || null,
        providedPdfHash: normalizedHash,
        hashMatches,
        onChain
      }
    });
  } catch (error) {
    console.error('Public verify by hash error:', error);
    await trackVerification(req, {
      mode: 'hash',
      queryInput: req.body?.code || '',
      certificate: null,
      verified: false,
      verdict: 'error',
      statusCode: 500,
    });
    res.status(500).json({ success: false, message: error.message || 'Hash verification failed' });
  }
}

module.exports = { login, verifyCertificate, publicVerify, publicVerifyByHash };
