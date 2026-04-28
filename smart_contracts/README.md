# CertificateRegistry (Hardhat)

This workspace includes a `CertificateRegistry` contract that records SHA-256 PDF hashes for issued certificates. It exposes:

- registerCertificate(bytes32 pdfHash, string enrollmentNumber) – record issuer, timestamp, and enrollment number.
- isRegistered(bytes32 pdfHash) – check if a hash is registered.
- getRecord(bytes32 pdfHash) – returns `{ issuer, timestamp, revoked, enrollmentNumber }`.
- revokeCertificate(bytes32 pdfHash) – allows the original issuer to revoke.

Deploy via Ignition:

```shell
npx hardhat help
npx hardhat compile
npx hardhat ignition deploy ./ignition/modules/CertificateRegistry.js --network <network>
```

Use the deployed address in the server `.env` as `CONTRACT_ADDRESS`.
