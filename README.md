# CoinQuest 🛡️

A personal finance tracker for Malaysia.
Supports Maybank and CIMB credit card statement imports (CSV), subscription detection, budgets, and AI-generated insights.

> ⚔ DISCLAIMER: CoinQuest is for expense tracking only. Not financial advice.

---

## Features

- **CSV Import** — Maybank + CIMB credit card statements with heuristic column detection
- **Auto-Categorization** — Rule engine with 60+ built-in merchant rules
- **Deduplication** — SHA-256 fingerprint prevents duplicate imports
- **Subscription Detector** — Identifies recurring charges across months
- **Budgets** — Monthly per-category budgets with HP-bar progress
- **Insights** — Monthly reports, leak detector, spending comparisons
- **MMORPG UI** — Press Start 2P pixel font, beveled windows, quest log, hotbar

---

## Stack

- Next.js 15 (App Router) + TypeScript
- TailwindCSS + Custom MMORPG theme
- shadcn/ui components
- Prisma + PostgreSQL
- NextAuth (credentials)
- Recharts (ready, optional use)
- Framer Motion (window animations)
- papaparse (CSV parsing)
- SWR (client data fetching)

---

## Setup

### Prerequisites

- Node.js 20+
- PostgreSQL database

### 1. Clone & Install

```bash
git clone <repo>
cd coinquest
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env
```

Edit `.env`:
```
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/coinquest"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Create tables
npm run db:push

# Seed default categories + demo user + rules
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Demo login:**
- Email: `demo@coinquest.app`
- Password: `demo1234`

---

## How to Export Statements

### Maybank Credit Card
1. Log in to Maybank2U (www.maybank2u.com.my)
2. Go to **Accounts & Banking** → **Credit Cards**
3. Select your credit card
4. Click **Statement** → select month
5. Click **Download** → choose **CSV** format

**Expected columns:** `Date, Description, Amount, Balance`

### CIMB Credit Card
1. Log in to CIMB Clicks (www.cimbclicks.com.my)
2. Go to **Cards** → **Credit Card**
3. Select card → **e-Statement**
4. Click **Download CSV**

**Expected columns:** `Transaction Date, Posting Date, Description, Foreign Amount, Amount`

---

## CSV Format Support

### Built-in Profiles

| Profile | Detection | Columns |
|---------|-----------|---------|
| `MaybankProfile` | Date + Description headers | Date, Description, Amount/Debit/Credit |
| `CimbProfile` | "Transaction Date" or "Posting Date" | Transaction Date, Description, Amount |
| Heuristic fallback | Auto-detect | Any format with date + text + numbers |

### Adding a New Profile

Create `lib/parser/profiles/yourbank.ts`:

```typescript
import { StatementProfile } from "@/types";

export const YourBankProfile: StatementProfile = {
  name: "YourBank",
  detectHeaders(headers) {
    // Return true if this profile matches the CSV headers
    return headers.some(h => h.includes("YOUR_UNIQUE_COLUMN"));
  },
  mapColumns(headers) {
    return {
      dateColumn: "Date",
      descriptionColumn: "Narration",
      amountColumn: "Amount",
    };
  },
};
```

Then register in `lib/parser/csv-parser.ts`:
```typescript
import { YourBankProfile } from "./profiles/yourbank";
const PROFILES = [CimbProfile, MaybankProfile, YourBankProfile];
```

### Column Mapping Override

To manually override detection, edit the `mapColumns()` return in the profile file.

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/import/csv` | Upload CSV (multipart: file, accountId, month) |
| GET | `/api/transactions` | List transactions (filter: month, accountId, categoryId, search) |
| PATCH | `/api/transactions/:id` | Update category, notes, isSubscription |
| GET | `/api/insights?month=YYYY-MM` | Generate + return monthly insights |
| GET/POST/DELETE | `/api/rules` | Manage categorization rules |
| PUT | `/api/rules` | Retroactively apply all rules |
| GET/POST/DELETE | `/api/budgets` | Manage monthly budgets |
| GET/POST/DELETE | `/api/accounts` | Manage accounts |
| GET | `/api/categories` | List all categories |

---

## Acceptance Tests

```bash
# 1. Import same CSV twice — no duplicates
#    Import fixtures/maybank-sample.csv twice for same account/month
#    → Second import: importedRows=0, skippedRows=17

# 2. Create rule "NETFLIX" → all matching transactions categorized as Subscriptions
#    → Go to Settings → add rule: NETFLIX CONTAINS Subscriptions
#    → Click "Apply All" → Netflix transactions get Subscriptions category

# 3. Insights page shows subscription list + totals
#    → Import 2 months of data → Insights page → Generate Insights
#    → Subscription Tracker shows recurring merchants

# 4. Dashboard shows spend totals for current month
#    → After import → Dashboard shows updated spend in Overview
```

---

## Project Structure

```
coinquest/
├── app/
│   ├── (auth)/login/          # Login page
│   ├── (dashboard)/           # Protected pages
│   │   ├── dashboard/
│   │   ├── import/
│   │   ├── transactions/
│   │   ├── budgets/
│   │   ├── insights/
│   │   └── settings/
│   ├── api/                   # API routes
│   └── globals.css            # MMORPG theme CSS
├── components/
│   ├── game/                  # MMORPG UI primitives
│   └── ui/                    # shadcn-style components
├── lib/
│   ├── parser/                # CSV parser + profiles
│   ├── categorization.ts      # Rules engine
│   ├── subscription-detector.ts
│   └── insights-generator.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── fixtures/                  # Sample CSVs
└── docs/                      # Style guide
```
