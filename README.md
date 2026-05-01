# IIIT Gwalior Feedback System

A full-stack, secure web application designed to collect, manage, and analyze student feedback for faculty at ABV-IIITM Gwalior. The system features a modern UI, web-scraped teacher verification, and a hybrid authentication model.

## 🚀 Key Features

*   **Clerk Google Authentication:** Secure, passwordless login for students and teachers using their Google accounts.
*   **Domain Restriction:** Only `@iiitm.ac.in` email addresses are permitted to log in.
*   **Automated Teacher Verification:** Admins can sync the teacher database by dynamically scraping the official IIITM website. Only verified faculty are permitted to access the teacher dashboard.
*   **Role-Based Access Control (RBAC):** Distinct dashboards and access levels for Students, Teachers, and Admins.
*   **Admin Command Center:** Powerful admin tools to create feedback forms, approve/revoke feedback batches, manually force batch processing, and view overall analytics.
*   **Teacher Analytics:** Faculty can securely view aggregated, anonymous analytics of their approved feedback.

---

## 🛠️ Tech Stack

*   **Frontend:** React, Vite, Tailwind CSS, Clerk Auth
*   **Backend:** Express.js, Node.js, Cheerio (for web scraping)
*   **Database:** MongoDB, Mongoose

---

## 🔐 Hybrid Authentication Architecture

This project uses a unique, highly secure "Hybrid" authentication model:

1.  **Clerk SSO (Frontend):** Students and Teachers log in via a Google popup managed securely by Clerk.
2.  **Bridging to Backend:** Once Clerk authenticates the user, the frontend sends a silent request to the `/api/auth/clerk-login` backend endpoint.
3.  **Strict Validation:**
    *   **Students:** Automatically registered and issued a JWT token.
    *   **Teachers:** The backend checks the scraped `VerifiedTeacher` database. If their email is not present, access is strictly denied. If present, their real name is extracted from their Google account and they are granted access.
    *   **Admins:** Use a traditional, manual Email/Password login to ensure administrative fallback access.

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
VITE_CLERK_PUBLISHABLE_KEY=pk_test_Y2xlcmsgcHVibGlzaGFibGUga2V5IGhlcmU=
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

---

## 🗄️ Database Structure (MongoDB)

*   `User`: Stores all registered students, admins, and verified teachers (who have logged in at least once).
*   `VerifiedTeacher`: An isolated, email-only collection populated by the Admin Web Scraper to act as a strict whitelist for faculty logins.
*   `FeedbackForm`: Represents a feedback session (e.g., "Maths 2 Feedback") assigned to a specific faculty member, complete with open/close dates.
*   `FeedbackResponse`: Individual feedback submissions linked to a `FeedbackForm` and a student.

---

## 👨‍💻 Admin Workflows

### How to add Teachers:
Teachers **cannot** sign themselves up. You must add them via the Admin Dashboard.
1. Log in as an Admin.
2. Click **"SYNC TEACHERS"**.
3. The server will scrape `iiitm.ac.in` and securely store all valid faculty emails in the database.
4. When a teacher logs in via Google with that exact email, the system will automatically let them in and grab their real name from Google.
