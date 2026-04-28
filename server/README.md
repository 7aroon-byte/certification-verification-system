# Server Setup (Certificates + Blockchain)

## Environment Variables
Create a `.env` file in `server/` with:

- `PORT=5000`
- `PUBLIC_BASE_URL=http://localhost:5000` # used in QR verification URL
- `ETH_RPC_URL=` # your Ethereum RPC URL (e.g., Alchemy/Infura)
- `ADMIN_PRIVATE_KEY=` # issuer admin wallet private key for on-chain writes
- `CONTRACT_ADDRESS=` # deployed CertificateRegistry address
- `DB_HOST=...` `DB_USER=...` `DB_PASSWORD=...` `DB_NAME=...` # MySQL connection (if not already set)

## Flow
- Admin issues certificate via API/UI.
- Server generates a PDF at `server/public/certificates/<id>.pdf` with embedded QR pointing to `/api/verify?code=...`.
### Using a custom PDF template
- Place your template at `server/assets/templates/certificate_template.pdf`.
- The server will overlay student details and a QR code onto the first page of the template using `pdf-lib`.
- If the file is missing, the system falls back to a built-in styled PDF.

- Server computes SHA-256 of the PDF and stores it in DB.
- Server writes the hash to Ethereum via `CertificateRegistry` using the admin wallet.
- Public users can visit `/verify?code=...` to confirm on-chain registration and status. No student wallet required.

## Commands
Install server deps:

```powershell
cd server
npm install
npm run dev
```

Deploy the contract (from `smart_contracts`):

```powershell
cd smart_contracts
npm install
npx hardhat compile

# Option A: Local node (recommended for development)
npx hardhat node
# In a new terminal:
npx hardhat ignition deploy ./ignition/modules/CertificateRegistry.js --network localhost

# Option B: Hardhat in-process network (ephemeral)
npx hardhat ignition deploy ./ignition/modules/CertificateRegistry.js --network hardhat
```

Update `CONTRACT_ADDRESS` with the deployed address.

## One-time DB Migration (blockchain status)
If your `blockchain_status` column was created as enum `('issued','revoked')`, run:

```sql
SOURCE server/sql/fix_blockchain_status_column.sql;
```

Or open and execute `server/sql/fix_blockchain_status_column.sql` in phpMyAdmin.
