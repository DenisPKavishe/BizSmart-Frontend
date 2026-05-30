This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.


## dependencies
- node used is 14:  npx create-next-app@14 bizsmart-frontend --typescript --tailwind --app
- npm install axios zustand jwt-decode react-hot-toast react-hook-form date-fns react-icons recharts


python manage.py runserver 0.0.0.0:8000


curl -X POST http://127.0.0.1:8000/api/v1/financials/budgets/ \
-H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzgwMTQzNjA2LCJpYXQiOjE3ODAxNDI3MDYsImp0aSI6IjA3ZDJkNDBkYzAyNTQwYTFhMWFiMzgwMjFhNjZiM2VhIiwidXNlcl9pZCI6MX0.ohYZR_IHRHunfLckd-Ha--RRDogTuzut9JaZxiHkDn0" \
-H "Content-Type: application/json" \
-d '{
  "name": "July 2026 Budget",
  "period": "monthly",
  "year": 2026,
  "month": 7,
  "status": "draft",
  "notes": "July Budget",
  "items": [
    {
      "category": "sales",
      "category_name": "Sales Revenue",
      "type": "income",
      "planned_amount": 1500000
    },
    {
      "category": "service",
      "category_name": "Service Revenue",
      "type": "income",
      "planned_amount": 500000
    },
    {
      "category": "salary",
      "category_name": "Employee Salaries",
      "type": "expense",
      "planned_amount": 300000
    },
    {
      "category": "rent",
      "category_name": "Office Rent",
      "type": "expense",
      "planned_amount": 150000
    }
  ]
}'