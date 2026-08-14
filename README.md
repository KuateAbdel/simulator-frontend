# Finzuu Dashboard

A comprehensive financial dashboard built with **TypeScript + Vite + React**.

## Color Charter
- **Background**: `#ffffff` (white)
- **Primary Accent**: `#c68cff` (violet)
- **Secondary / Contrast**: `#19af58` (green)
- **Dark surface** (sidebar): `#1a0a2e → #2d1456`

## Fonts
- **Display**: Sora (headings)
- **Body**: DM Sans
- **Mono**: JetBrains Mono (IDs, figures)

## Features
- 🌍 **Multi-language**: French & English toggle (top bar)
- 📐 **Retractable sidebar** with smooth animation
- 📊 **7 full pages**: Overview, Onboarding, Bulk Payment, Clients, Lender, Analytics, Back-Office
- 📱 **Fully responsive** (mobile-first)
- ⏱️ **Live session timer** in header
- 🔔 **Alert center** with unread badges
- 👤 **Staff profile** dropdown (ID, role, enrollment date, phone, QR code)
- 🔍 **Global filter bar**: Client ID, Score, Segment, Category, Branch, Phone, Operator

## Quick Start

```bash
npm install
npm run dev
```

Then open http://localhost:5173

## Build

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── Layout/        # Sidebar, Header, Layout wrapper
│   └── ui/            # Reusable: StatCard, TabBar, badges, charts
├── context/
│   └── AppContext.tsx  # Global state (lang, page, filters, session)
├── data/
│   └── mockData.ts    # Demo data (clients, loans, transactions, programs)
├── i18n/
│   └── index.ts       # FR/EN translations
├── pages/
│   ├── Overview.tsx   # KPIs, charts, risk, offers
│   ├── Onboarding.tsx # Client workflow (Individual/Company/Institutional)
│   ├── Bulk.tsx       # Bulk payment & metrics
│   ├── Clients.tsx    # Banking profile, loans, analytics
│   ├── Lender.tsx     # Programs, beneficiaries, cashflow
│   ├── Analytics.tsx  # PAR, exposure, volatility, radar
│   └── BackOffice.tsx # Admin, products, reporting, marketing
├── types/
│   └── index.ts       # TypeScript types
├── App.tsx            # Router
└── main.tsx           # Entry point
```

## Pages Summary

| Page | Sections |
|------|----------|
| **Overview** | 6 KPI cards, portfolio chart, score donut, PAR risk, payments, active offers |
| **Onboarding** | Multi-step form (Individual/Company/Institutional), client list, loan graph |
| **Bulk** | Payment table with multi-select, program metrics, cashflow bar chart |
| **Clients** | Client list, banking profile, transactions, loan profile with progress |
| **Lender** | Program cards, cashflow composed chart, beneficiary table |
| **Analytics** | PAR bars, exposure by segment, volatility stack, radar, defaults trend |
| **Back-Office** | User CRUD + RBAC, country/company setup, plugins, products, export/import, SMS + social |
