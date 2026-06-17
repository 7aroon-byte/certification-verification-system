# Examiner Guide — IHECVS Demonstration & Verification

This guide is for examiners, supervisors, and panel members who will review the hosted IHECVS demonstration. It describes what to watch in the demonstration video and step-by-step actions you can perform on the hosted system to verify features.

IMPORTANT: replace `HOSTED_URL` below with the live URL you will share (for example, https://ihecvs.online). If you have a demonstration video, add its link in the `Demo video` section.

---

## 1) Demo video (5–10 minutes)

Record a 5–10 minute demonstration video that covers these items in order. If you upload it to YouTube/Vimeo/Drive, paste the URL here so examiners can watch it before testing the hosted site.

- Video URL: (paste your video link here)

Suggested sequence for the recorded demo:
1. System introduction — short overview of IHECVS purpose and hosted URL (show homepage).
2. Admin login — show the Admin login page and sign in.
3. Add Student — create a student account using the Admin UI.
4. Issue Certificate — demonstrate issuing a certificate for the created student.
5. Generate PDF certificate — open the generated PDF preview or download it.
6. QR code verification — scan the certificate QR and follow the verification link.
7. Public verification page — perform a public verification by code or upload.
8. Blockchain transaction/hash information — show where the certificate page displays the on-chain transaction or hash, and open it on the explorer if available.
9. Student download certificate — show the student logging in and downloading their certificate.
10. Quick wrap-up — mention any limitations, test credentials, and contact for support.

---

## 2) How to access the hosted system

Open the hosted site at:

    HOSTED_URL

Examples:
- Admin login page: `HOSTED_URL/admin/login`
- Student login page: `HOSTED_URL/student/login`
- Public verify page: `HOSTED_URL/verify`

If the hosted site requires credentials, the demonstration should either:
- Show the seeded demo account credentials in the video, or
- Provide a temporary/demo admin account (email + password) for examiners.

Default seeded admin (development only):
- Email: `miko@example.com`
- Password: `Admin123!`

Note: On the hosted deployment these credentials may be changed or disabled — use the credentials provided with the demo, or ask the presenter for a demo account.

---

## 3) Examiner checklist (interactive verification)

Follow these steps on the hosted site. Mark each item as you confirm it.

1. Homepage
   - [ ] Open `HOSTED_URL` and confirm branding, header and navigation appear correctly.

2. Admin login
   - [ ] Visit `HOSTED_URL/admin/login` and sign in using the demo admin account provided.
   - [ ] Confirm successful redirect to Admin Dashboard.

3. Add student
   - [ ] In Admin Dashboard, navigate to Add Student.
   - [ ] Create a new student (name, email, enrollment number) and save.
   - [ ] Confirm the student appears in Manage Students listing.

4. Issue certificate
   - [ ] Navigate to Issue Certificate (or Certificates -> Issue).
   - [ ] Select the newly created student and fill required fields (exam type, start/finish dates, position, conduct, etc.).
   - [ ] Submit to issue certificate and note the certificate ID/verification code.

5. Generate & preview PDF
   - [ ] After issuing, open the certificate record and click Preview / Download.
   - [ ] Confirm a PDF is generated and opens in the browser (or downloads).
   - [ ] Verify the certificate includes a QR code and a verification code string.

6. QR code verification
   - [ ] Scan the QR code on the PDF using a phone camera or QR scanner app.
   - [ ] Ensure the QR resolves to a verification URL, e.g. `HOSTED_URL/verify?code=...` and shows certificate details.

7. Public verification page
   - [ ] Visit `HOSTED_URL/verify` and enter the verification code (or upload the PDF if supported).
   - [ ] Confirm the verification status, certificate details, and certificate image/PDF preview are displayed.

8. Blockchain transaction/hash information
   - [ ] On the certificate or verification page, locate the blockchain transaction hash or on-chain status.
   - [ ] If a transaction hash is present, copy it and open it in the appropriate block explorer for the deployed network (link or instructions should appear in the UI if available).
   - [ ] Confirm the transaction shows the write of the certificate hash, where applicable.

9. Student download certificate
   - [ ] Optionally log in as the created student (use temporary credentials communicated by the system) and confirm the certificate is available for download from the student dashboard.

10. Email / OTP checks (optional)
   - [ ] If the demo includes email flows (account creation, OTP, reset), confirm sample emails are delivered to the demo address or that the video evidences the email send.

11. Edge cases & errors
   - [ ] Test verification with an invalid code and confirm the system returns an appropriate message.
   - [ ] Try to re-issue the same certificate type to the same student and validate the system's duplicate prevention (if implemented).

---

## 4) Scoring / Evaluation suggestions (for panels)

Suggested pass/fail checklist items:
- Admin login works and Dashboard is reachable (Pass/Fail)
- Creation of student account is functional (P/F)
- Issuing a certificate generates a PDF with QR (P/F)
- Verification page resolves codes correctly (P/F)
- Blockchain transaction/hash is displayed (P/F — may be N/A for some demos)
- Student can download certificate (P/F)

Optionally award partial credit for demo completeness (video covers all steps) and robustness (error cases handled).

---

## 5) How to check blockchain details (if applicable)

- If the deployed system integrates with a public or testnet blockchain, the certificate page should display a transaction hash. Use a block explorer (Etherscan, Polygonscan, etc.) for the network used.
- If the network is private or local (Hardhat/Anvil), the transaction will not be visible on public explorers — the demo should note this.

---

## 6) Troubleshooting quick tips

- If PDF does not appear: check certificate record for generation status, and contact the presenter for server logs or re-issue.
- If QR does not scan: open the PDF in a browser and copy the verification URL to the address bar, then open it.
- If emails fail: the demo may use a transactional provider (Resend) — confirm the demo account email used and check the mail provider's logs (presenter can supply screenshots if needed).

---

## 7) Optional — Local testing (for examiners who want to run locally)

If an examiner prefers to run the system locally (not required for hosted review), basic steps are:

1. Clone repository and install dependencies (server and client):

```powershell
cd certification-verification-system\server
npm install
cd ..\client
npm install
```

2. Create server `.env` and set required variables (example):

```
PORT=5000
PUBLIC_BASE_URL=http://localhost:5000
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=secret
DB_NAME=certificates
RESEND_API_KEY=... (optional for email flows)
```

3. Start backend and frontend in separate terminals:

```powershell
cd server
npm run dev

cd ../client
npm run dev
```

4. Visit `http://localhost:5173` (client dev server) and `http://localhost:5000` (server API).

Note: the seeded admin account (development default) is `miko@example.com` / `Admin123!`. The local setup may require database initialization; run `node server/setup.js` or follow `server/README.md` instructions.

---

## 8) Contact / support

If examiners encounter issues, ask the presenter to provide:
- The hosted URL used for the demo
- Demo credentials (admin + student) and any one-time passwords used
- The demo video link (if available)
- A short screenshot of server logs for failing operations (PDF, email, blockchain) if requested

---

If you want, I can add your demo video URL and embed it in this file, or generate a short printable checklist PDF for examiners. Paste the hosted system URL and the video link and I will update the guide for you.
