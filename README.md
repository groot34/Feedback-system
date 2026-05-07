# IIIT Gwalior Feedback System

A full-stack, secure web application designed to collect, manage, and analyze student feedback for faculty at ABV-IIITM Gwalior. The system features a modern UI, web-scraped teacher verification, a hybrid authentication model, JWT-secured API routes, and a local proof-of-work blockchain ledger for an immutable audit trail.

---

## 🚀 Key Features

*   **Clerk Google Authentication:** Secure, passwordless login for students and teachers using their Google accounts.
*   **Domain Restriction:** Only `@iiitm.ac.in` email addresses are permitted to log in.
*   **Automated Teacher Verification:** Admins can sync the teacher database by dynamically scraping the official IIITM website. Only verified faculty are permitted to access the teacher dashboard.
*   **Role-Based Access Control (RBAC):** Distinct dashboards and access levels for Students, Teachers, and Admins, enforced by JWT middleware on all backend routes.
*   **Admin Command Center:** Powerful admin tools to create feedback forms, approve/revoke feedback batches, view overall analytics, and delete forms.
*   **Teacher Analytics:** Faculty can securely view aggregated, anonymous analytics of their approved feedback.
*   **Paginated Dashboards:** Admin and Teacher dashboards paginate feedback responses (10 per page) so large datasets remain navigable.
*   **Local Blockchain Audit Ledger:** Every significant event (form creation/deletion, student submission, approval) is written as a mined block into a local JSON blockchain — providing a tamper-evident, permanent audit trail independent of MongoDB. The chain is inspectable via REST API:
    *   `GET /api/blockchain/summary` — quick stats on all chains
    *   `GET /api/blockchain/ledger` — full raw ledger JSON
    *   `GET /api/blockchain/chain/:name` — single chain (e.g. `feedback_forms`, `feedback_submissions`, `approvals`)
    *   `GET /api/blockchain/validate/:name` — cryptographic integrity check for a chain

---

## 🛠️ Tech Stack

*   **Frontend:** React, Vite, Tailwind CSS, Clerk Auth
*   **Backend:** Express.js, Node.js, Cheerio (for web scraping)
*   **Database:** MongoDB, Mongoose
*   **Blockchain:** Custom SHA-256 proof-of-work (difficulty 4), file-backed local ledger

---

## 🔐 Hybrid Authentication Architecture

This project uses a unique, highly secure "Hybrid" authentication model:

1.  **Clerk SSO (Frontend):** Students and Teachers log in via a Google popup managed securely by Clerk.
2.  **Bridging to Backend:** Once Clerk authenticates the user, the frontend sends a silent request to the `/api/auth/clerk-login` backend endpoint. The `userId` is persisted in `localStorage` at this step to correctly track form submissions.
3.  **Strict Validation:**
    *   **Students:** Automatically registered and issued a JWT token.
    *   **Teachers:** The backend checks the scraped `VerifiedTeacher` database. If their email is not present, access is strictly denied. If present, their real name is extracted from their Google account and they are granted access.
    *   **Admins:** Use a traditional, manual Email/Password login to ensure administrative fallback access.

---

## 🔒 API Security

All backend API routes are protected by JWT middleware (`server/middleware/auth.js`):

| Middleware | Applied To |
|---|---|
| `auth` | All authenticated routes (students, teachers, admins) |
| `isAdmin` | Form creation/deletion, approval, response viewing, admin batch operations |
| `isTeacher` | Teacher-specific response endpoints |

A global **Axios request interceptor** on the frontend (`client/src/App.jsx`) automatically attaches the JWT token to every outgoing API request — no manual header management needed.

---

## ⛓️ Local Blockchain Ledger

Every action in the system is recorded as a **mined block** in `server/blockchain_ledger.json`. The chain uses SHA-256 proof-of-work with difficulty 4 (hashes must start with `0000`).

### Chains

| Chain | What it records |
|---|---|
| `feedback_forms` | Form created, closed, deleted |
| `feedback_submissions` | Each student submission (student identity is SHA-256 hashed for anonymity) |
| `approvals` | Single approval toggles and bulk approve/revoke actions |
| `identity_commitments` | Semaphore ZK identity commitments submitted by students |
| `batch_operations` | Batch pushes of identity commitments to the on-chain Semaphore group |

### Ledger API Endpoints

```
GET /api/blockchain/ledger          # Full JSON ledger
GET /api/blockchain/summary         # Quick stats for all chains
GET /api/blockchain/chain/:name     # Single chain (e.g., feedback_forms)
GET /api/blockchain/validate/:name  # Integrity check for a chain
```

### Tamper Detection

If `blockchain_ledger.json` is manually edited, the SHA-256 hash chain breaks. Calling `/api/blockchain/validate/<chain>` will return:

```json
{
  "valid": false,
  "errors": ["Block #3: prev_hash mismatch (expected 0000abc..., got 0000def...)"]
}
```

> `blockchain_ledger.json` is excluded from version control via `.gitignore` (it is runtime data).

---

## ⚙️ Prerequisites

*   [Node.js](https://nodejs.org/) (v18+)
*   [MongoDB](https://www.mongodb.com/) (v7.0)

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone <repo-url>
cd Feedback-system
```

### 2. Install dependencies

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 3. Environment variables

**Frontend (`client/.env`):**
```env
VITE_API_URL=http://localhost:5000
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```
*(Replace the Clerk Publishable Key with your actual development key from the Clerk Dashboard).*

**Backend (`server/.env`):**
```env
MONGO_URI=mongodb://127.0.0.1:27017/feedback-system
JWT_SECRET=your_super_secret_jwt_key
PORT=5000
```

### 4. Start Local MongoDB

```bash
cd server
npm run start-db
```
> This starts `mongod` using a local `data/` folder inside your project. Keep this terminal open.

### 5. Seed the database (Optional)

```bash
cd server
node create_accounts.js
```
This drops the existing database and creates an initial admin account, test forms, and test students.
*   **Admin Email:** `admin@test.com`
*   **Admin Password:** `Test@123`

### 6. Run the Application

You will need two separate terminal windows.

**Terminal 1 (Backend):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
```

The app will automatically open at `http://localhost:5173`.

> **Note:** On first backend start, `blockchain_ledger.json` is auto-generated in the `server/` directory with genesis blocks for all five chains.

---

## 🗄️ Database Structure (MongoDB)

*   `User`: Stores all registered students, admins, and verified teachers. Includes `identityCommitment` and `isOnChain` fields for Semaphore ZK integration.
*   `VerifiedTeacher`: An isolated, email-only collection populated by the Admin Web Scraper to act as a strict whitelist for faculty logins.
*   `FeedbackForm`: Represents a feedback session (e.g., "Maths 2 Feedback") assigned to a specific faculty member, complete with open/close dates and optional student email allowlists.
*   `FeedbackResponse`: Individual feedback submissions linked to a `FeedbackForm` and a student.

---

## 👨‍💻 Admin Workflows

### How to add Teachers
Teachers **cannot** sign themselves up. You must add them via the Admin Dashboard.
1. Log in as an Admin.
2. Click **"SYNC TEACHERS"**.
3. The server will scrape `iiitm.ac.in` and securely store all valid faculty emails in the database.
4. When a teacher logs in via Google with that exact email, the system will automatically let them in and grab their real name from Google.

### How to create a Feedback Form
1. Log in as Admin and navigate to the dashboard.
2. Click **"Create New Form"**.
3. Fill in the subject name, assign a professor from the dropdown, and optionally set open/close dates or upload a student email CSV to restrict access.
4. Click **"Generate & Deploy Form"**.

### Approving Feedback for Teachers
By default, submitted feedback is **not visible to teachers**. An admin must approve responses:
*   Click the **Approve** toggle on individual responses, or
*   Use **"Approve All"** to release all responses for a form at once.

Each approval action is recorded as a block in the blockchain ledger.
