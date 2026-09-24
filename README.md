# WalletWise Rwanda

A personal finance app for Rwanda: budget with the 50/30/20 rule, save toward goals, and track net worth. Works offline, syncs to the cloud, and speaks English and Kinyarwanda.

## Features

- **Money** – every income and expense in one list, with a month picker, search, filters (category, MTN MoMo / Airtel Money / cash / bank / card) and CSV export. Tap an entry to edit or delete it.
- **Money habits** – built for self-discipline:
  - a monthly *money health score* (0–100) from saving, budget-keeping, emergency fund and debt, with a 6-month trend and one next step
  - a *daily spending allowance* ("you can spend X today") after bills and planned savings, with a day streak and a no-spend calendar
  - a *spending patterns* report: peak spending day, small purchases that add up, payday spending, and category changes against your 3-month average
  - *monthly commitments* tracked daily, plus an automatic review of last month
  - *challenges* (no-spend weekend, a week without eating out, cut Wants by 20%, save 10%) and badges
  - *think before you buy*: big Wants purchases show their cost in days of work and goal delay, with a 24-hour waiting list
- **Debt payoff planner** – avalanche or snowball order, debt-free date, and the effect of paying extra each month.
- **Reminders** – optional notifications to record spending, save on payday, pay bills, and when over the daily limit.
- **Salary & Payday** – a payday plan that splits your salary into Needs/Wants/Savings and, with one tap, saves each goal's monthly share first ("pay yourself first"). Also shows bills still due this month and has a net salary calculator (PAYE, RSSB pension, maternity, mutuelle).
- **Spending limits** – optional monthly caps per category (e.g. transport, airtime) with warnings at 80% and 100%.
- **Emergency fund** – a suggested target of 3 months of essential spending, and how many months your fund already covers.
- **Budget** – a monthly 50/30/20 split (adjustable) with per-category breakdowns. You get a warning as soon as Needs or Wants passes 80% and again at 100%.
- **Goals** – savings goals with a pet avatar, a forecast of when you'll reach them, the monthly amount needed to hit the deadline, and celebrations at 25/50/75/100%. Deposits can count as Savings in the monthly budget.
- **Smart insights** – plain-language tips: safe amount to spend per day, projected overspending, month-over-month changes, top category, goals falling behind.
- **Recurring** – salary, rent or ikimina added automatically each month, including months missed while the app was closed.
- **Net worth** – assets (MoMo, ikimina/SACCO, land, livestock…) and liabilities (bank, SACCO, mobile loans) with a history chart.
- **Reports** – a printable monthly report ("Download PDF" opens the print dialog, where you choose *Save as PDF*).
- **Offline-first sync** – everything is saved on the device first, then synced to Firestore in the background and pulled down on other devices.
- Dark mode, installable PWA, mobile bottom navigation, full Kinyarwanda translation.

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in your Firebase web config
npm run dev
```

### Firestore security rules

Every document stores its owner's uid in `user_id`. The rules in [`firestore.rules`](firestore.rules) only let a signed-in user read and write their own documents. Deploy them with the Firebase CLI:

```bash
firebase deploy --only firestore:rules
```

or paste the file into *Firebase console → Firestore Database → Rules*.

### Development tips

- `localStorage.setItem('walletwise:noSync', '1')` in the dev server turns cloud sync off, so test data never reaches Firebase.
- In dev, the app store is available as `window.__walletwiseStore`.

## Structure

- `src/lib/db.js` – local IndexedDB schema (Dexie) and migrations
- `src/lib/repo.js` – every write goes through here: saves locally and queues it for sync
- `src/lib/sync.js` – pushes queued changes to Firestore, pulls remote changes back
- `src/lib/insights.js`, `goals.js`, `recurring.js` – budgeting, forecasting and recurring logic
- `src/locales/` – English and Kinyarwanda strings
