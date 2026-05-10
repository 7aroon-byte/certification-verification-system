const { ethers } = require('ethers');

// Minimal ABI for CertificateRegistry
const REGISTRY_ABI = [
  {
    type: 'function',
    name: 'registerCertificate',
    inputs: [
      { name: 'pdfHash', type: 'bytes32' },
      { name: 'enrollmentNumber', type: 'string' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'isRegistered',
    inputs: [{ name: 'pdfHash', type: 'bytes32' }],
    outputs: [{ type: 'bool' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getRecord',
    inputs: [{ name: 'pdfHash', type: 'bytes32' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'issuer', type: 'address' },
          { name: 'timestamp', type: 'uint256' },
          { name: 'revoked', type: 'bool' },
          { name: 'enrollmentNumber', type: 'string' }
        ]
      }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'revokeCertificate',
    inputs: [{ name: 'pdfHash', type: 'bytes32' }],
    outputs: [],
    stateMutability: 'nonpayable'
  }
];

function getProvider() {
  const rpc = process.env.ETH_RPC_URL;
  if (!rpc) throw new Error('ETH_RPC_URL missing in environment');
  return new ethers.JsonRpcProvider(rpc, undefined, { staticNetwork: true });
}

async function checkBlockchainConnection() {
  const rpc = process.env.ETH_RPC_URL;
  if (!rpc) {
    return { ok: false, error: 'ETH_RPC_URL missing in environment' };
  }

  if (!/^https?:\/\//i.test(rpc)) {
    return { ok: true };
  }

  try {
    const response = await fetch(rpc, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] }),
      signal: AbortSignal.timeout(1500)
    });

    if (!response.ok) {
      return { ok: false, error: `RPC responded with HTTP ${response.status}` };
    }

    const payload = await response.json().catch(() => null);
    if (!payload || payload.error || !payload.result) {
      return { ok: false, error: payload?.error?.message || 'Invalid RPC response from ETH node' };
    }

    return { ok: true, chainId: payload.result };
  } catch (error) {
    const causeMessage = String(error?.cause?.message || '');
    const causeCode = String(error?.cause?.code || '');
    const endpoint = String(rpc || '').trim() || 'ETH_RPC_URL';

    if (causeCode === 'ECONNREFUSED' || causeMessage.includes('ECONNREFUSED')) {
      return { ok: false, error: `Unable to connect to Ethereum RPC at ${endpoint} (connection refused). Ensure your blockchain node is running.` };
    }

    if (String(error?.message || '').includes('fetch failed')) {
      return { ok: false, error: `Unable to reach Ethereum RPC at ${endpoint}. Ensure ETH_RPC_URL is correct and the node is online.` };
    }

    return { ok: false, error: error?.message || 'Unable to connect to ETH RPC node' };
  }
}

async function assertBlockchainConnection() {
  const check = await checkBlockchainConnection();
  if (!check.ok) {
    throw new Error(check.error || 'Ethereum RPC is unreachable');
  }
}

function getWallet(provider) {
  const pk = process.env.ADMIN_PRIVATE_KEY;
  if (!pk) throw new Error('ADMIN_PRIVATE_KEY missing in environment');
  
  console.log('[Blockchain] Creating wallet...');
  console.log('[Blockchain] Private key length:', pk.length);
  console.log('[Blockchain] Key starts with 0x:', pk.startsWith('0x'));
  
  try {
    // ethers v6 Wallet constructor should work with 0x prefixed hex string
    // Try creating with the key as-is
    const wallet = new ethers.Wallet(pk, provider);
    console.log('[Blockchain] ✓ Wallet created successfully');
    console.log('[Blockchain] Wallet address:', wallet.address);
    return wallet;
  } catch (error) {
    console.error('[Blockchain] ERROR creating wallet:', error.message);
    console.error('[Blockchain] Error code:', error.code);
    
    // Try without 0x prefix
    if (pk.startsWith('0x')) {
      console.log('[Blockchain] Retrying with key without 0x prefix...');
      try {
        const wallet = new ethers.Wallet(pk.slice(2), provider);
        console.log('[Blockchain] ✓ Wallet created with key (no 0x)');
        return wallet;
      } catch (error2) {
        console.error('[Blockchain] Also failed without 0x:', error2.message);
      }
    }
    
    throw new Error(`Wallet creation failed: ${error.message}. Please verify ADMIN_PRIVATE_KEY in .env is a valid 32-byte hex string (with 0x prefix, should be 66 characters total).`);
  }
}

function getContract(signerOrProvider) {
  const address = process.env.CONTRACT_ADDRESS;
  if (!address) throw new Error('CONTRACT_ADDRESS missing in environment');
  return new ethers.Contract(address, REGISTRY_ABI, signerOrProvider);
}

function toBytes32FromHexString(hexStr) {
  // hexStr is a hex string (sha256) without 0x
  const normalized = hexStr.startsWith('0x') ? hexStr.slice(2) : hexStr;
  if (normalized.length !== 64) throw new Error('Expected 32-byte SHA-256 hex');
  return '0x' + normalized;
}

function serializeBlockchainRecord(record) {
  if (!record) return null;

  return {
    issuer: record.issuer ? String(record.issuer) : null,
    timestamp: record.timestamp !== undefined && record.timestamp !== null ? String(record.timestamp) : null,
    revoked: Boolean(record.revoked),
    enrollmentNumber: record.enrollmentNumber ? String(record.enrollmentNumber) : ''
  };
}

async function registerOnChain({ pdfHashHex, enrollmentNumber }) {
  try {
    console.log('[Blockchain] Starting registerOnChain...');
    console.log('[Blockchain] ethers version:', ethers.version);
    console.log('[Blockchain] RPC URL:', process.env.ETH_RPC_URL);
    console.log('[Blockchain] Contract Address:', process.env.CONTRACT_ADDRESS);
    console.log('[Blockchain] Private Key (first 10):', process.env.ADMIN_PRIVATE_KEY?.substring(0, 10));

    await assertBlockchainConnection();

    const provider = getProvider();
    console.log('[Blockchain] Provider created');
    
    const wallet = getWallet(provider);
    console.log('[Blockchain] Wallet ready, address:', wallet.address);
    
    const contract = getContract(wallet);
    console.log('[Blockchain] Contract instance created');
    
    const pdfHashBytes32 = toBytes32FromHexString(pdfHashHex);
    console.log('[Blockchain] PDF Hash bytes32:', pdfHashBytes32);
    
    console.log('[Blockchain] Calling registerCertificate with:', {
      pdfHash: pdfHashBytes32,
      enrollmentNumber: enrollmentNumber
    });
    
    const tx = await contract.registerCertificate(pdfHashBytes32, enrollmentNumber);
    console.log('[Blockchain] Transaction sent:', tx.hash);
    
    const receipt = await tx.wait();
    const confirmedTxHash = receipt?.hash || receipt?.transactionHash || tx?.hash || null;
    console.log('[Blockchain] Transaction confirmed. Hash:', confirmedTxHash, 'Status:', receipt.status);
    
    return { txHash: confirmedTxHash, status: receipt.status };
  } catch (error) {
    console.error('[Blockchain] Error in registerOnChain:', error.message);
    const message = String(error?.message || '');
    const isConnectionIssue =
      message.includes('ECONNREFUSED') ||
      message.includes('fetch failed') ||
      message.includes('network');
    if (!isConnectionIssue) {
      console.error('[Blockchain] Full error:', error.toString());
      console.error('[Blockchain] Stack:', error.stack);
    }
    throw error;
  }
}

async function verifyOnChain({ pdfHashHex }) {
  await assertBlockchainConnection();
  const provider = getProvider();
  const contract = getContract(provider);
  const pdfHashBytes32 = toBytes32FromHexString(pdfHashHex);
  const registered = await contract.isRegistered(pdfHashBytes32);
  const record = registered ? await contract.getRecord(pdfHashBytes32) : null;
  return { registered, record: serializeBlockchainRecord(record) };
}

async function revokeOnChain({ pdfHashHex }) {
  try {
    console.log('[Blockchain] Starting revokeOnChain...');
    await assertBlockchainConnection();
    const provider = getProvider();
    const wallet = getWallet(provider);
    const contract = getContract(wallet);
    const pdfHashBytes32 = toBytes32FromHexString(pdfHashHex);
    
    console.log('[Blockchain] Calling revokeCertificate...');
    const tx = await contract.revokeCertificate(pdfHashBytes32);
    console.log('[Blockchain] Revoke transaction sent:', tx.hash);
    
    const receipt = await tx.wait();
    const confirmedTxHash = receipt?.hash || receipt?.transactionHash || tx?.hash || null;
    console.log('[Blockchain] Revoke confirmed. Hash:', confirmedTxHash, 'Status:', receipt.status);
    
    return { txHash: confirmedTxHash, status: receipt.status };
  } catch (error) {
    console.error('[Blockchain] Error in revokeOnChain:', error.message);
    console.error('[Blockchain] Full error:', error);
    throw error;
  }
}

module.exports = { registerOnChain, verifyOnChain, revokeOnChain, checkBlockchainConnection };
