# 🚀 Next.js Better Auth Template

This is a Next.js template with a complete authentication system and user settings
pages.

## ✨ Features

### 🔐 Authentication

- **Email & Password:** Standard email and password sign-up and login.
- **Social Login:** Support for GitHub and Google providers.
- **Passkeys:** Passwordless authentication using passkeys.
- **Forgot Password:** Allows users to reset their password.
- **Email Verification:** Verifies user's email address after sign-up.
- **Two-Factor Authentication:** TOTP and backup codes for extra security.
- **Logout:** Securely log out the user.

### ⚙️ User Settings

- **Profile:**
  - Update user's name.
  - Change user's avatar.
  - View email and verification status.
- **Account:**
  - Create or update password.
  - Enable or disable two-factor authentication.
  - Manage passkeys.
  - Delete user account.
- **Authentication:**
  - Link and unlink social login providers.
- **Sessions:**
  - View and manage active sessions.

## 👷 Built using

- **Framework:** [Next.js](https://nextjs.org/) 16
- **Hosting:** [Vercel](https://vercel.com/)
- **Auth:** [better-auth](https://www.npmjs.com/package/better-auth) (credentials,
  Google/GitHub, Passkeys)
- **UI:** [shadcn/ui](https://ui.shadcn.com/) and
  [Tailwind CSS](https://tailwindcss.com/) v4
- **Database:** [PostgreSQL](https://www.postgresql.org/)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Emails:** [Nodemailer](https://nodemailer.com/)
- **Validation:** [Zod](https://zod.dev/)
- **Forms:** [React Hook Form](https://react-hook-form.com/)

## 🚀 Getting Started

To get started with this template, follow these steps:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ezeparziale/nextjs-better-auth-template.git
   ```
2. **Install dependencies:**
   ```bash
   cd nextjs-better-auth-template
   npm install
   ```
3. **Set up environment variables:**

   ```bash
   cp .env.example .env
   ```

   You will need to fill in the required environment variables in the `.env` file.

4. **Run the development server:**
   ```bash
   npm run dev
   ```

## 🐳 Using Docker Compose

To set up PostgreSQL using Docker Compose, follow these steps:

1. Ensure Docker and Docker Compose are installed on your machine.
2. Start the PostgreSQL container:
   ```bash
   docker-compose up -d
   ```
   The PostgreSQL database will be available at `localhost:5432`.
