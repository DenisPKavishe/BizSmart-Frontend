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


curl -X POST 'http://localhost:8000/api/v1/inventory/purchase-orders/' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzc5NzE2MjQyLCJpYXQiOjE3Nzk3MTUzNDIsImp0aSI6IjVmYzk4MGE0OGUwNTQxZGY4ZTBlNDdkYTFiOGUwNDIxIiwidXNlcl9pZCI6MX0.pkjr3iwgSNIHmTgBbXOC5HdQPKJQdLbfseeOuQHUzbs' \
  -d '{
    "supplier": 1,
    "business": 1,
    "created_by": 1,
    "status": "draft",
    "expected_delivery": "2026-05-30",
    "notes": "Test order",
    "subtotal": "250.00",
    "tax_amount": "45.00",
    "total_amount": "295.00",
    "items": [
      {
        "product": 1,
        "quantity": 5,
        "unit_cost": "50.00"
      }
    ]
  }'