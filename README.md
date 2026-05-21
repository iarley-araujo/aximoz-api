# 🚀 Aximoz Wallet API

<div align="center">
  <h1>㉿</h1>
  
  ### Intelligent Financial Management & Dividend Tracking
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
  [![Tech Stack](https://img.shields.io/badge/Stack-Next.js_|_Prisma_|_TypeScript-black)](https://nextjs.org/)
  
  *A high-performance backend architecture built for secure investment monitoring.*
</div>

---

## 📖 Project Overview
The **Aximoz Wallet API** is the core backend engine powering the Aximoz ecosystem. Designed to help users track their real estate investment funds (FIIs), monitor dividends, and compete in investment rankings, this project prioritizes **Data Integrity** and **Security**.

Unlike standard financial apps, Aximoz integrates a custom **Web Scraping Engine** to fetch real-time dividend data and implements strict security measures to prevent common vulnerabilities like IDOR and data leakage.

## 🛡️ Security First (The "Gate of Babylon")
Security is not an afterthought here. This API implements:
* **Strict IDOR Prevention:** Every request is authenticated, and all DB queries are scoped to the specific `user_id` extracted from a secure JWT.
* **Input Sanitization:** Using **Zod** to validate every payload, ensuring that malicious inputs never reach the database.
* **Edge Execution:** Middleware-based protection to block unauthorized access before it hits the application core.
* **Credential Protection:** Passwords are hashed with `bcryptjs` and stored securely.

## 🛠 Tech Stack
- **Framework:** [Next.js (App Router)](https://nextjs.org/)
- **Language:** TypeScript
- **Database:** MySQL
- **ORM:** [Prisma](https://www.prisma.io/)
- **Validation:** [Zod](https://zod.dev/)
- **Auth:** JSON Web Tokens (JWT) & HttpOnly Cookies
- **Scraping Engine:** Cheerio

## 🚀 Key Features
- **Automated Dividend Monitoring:** A cron-job based scraper that fetches and notifies users about upcoming payments.
- **Investment Dashboard:** Secure, authenticated endpoints to manage portfolios.
- **Gamification System:** Global ranking based on user tiers (Elo Rating).
- **Subscription Engine:** Feature-flagging architecture to manage 'Pro' vs 'Free' users.
- **Audit-ready Logging:** Standardized error handling and logging.

## 🔧 Getting Started

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/iarley-araujo/aximoz-api.git](https://github.com/iarley-araujo/aximoz-api.git)
Install dependencies:

Bash
npm install
Configure Environment:
Create a .env file in the root directory:

Snippet de código
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE"
JWT_SECRET="your_super_secret_key"
CRON_SECRET="your_cron_secret"
Run Database Migrations:

Bash
npx prisma db push
Start Development:

Bash
npm run dev
👨‍💻 Developer
