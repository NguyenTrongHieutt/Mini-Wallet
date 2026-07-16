# Mini-Wallet Officer Portal

React/TypeScript portal dành cho Officer quản lý Service, Provider, Customer, Pocket và theo dõi giao dịch.

## Yêu cầu

- Node.js 22 trở lên cho frontend (`.nvmrc` đã đặt là `22`).
- Backend Sails đang chạy tại `http://localhost:1337`.
- Backend có thể tiếp tục dùng Node.js cũ riêng; không dùng chung runtime với frontend.

## Chạy local

```powershell
cd "frontend Mini-Wallet"
nvm use 22
npm install
npm run dev
```

Vite chạy tại `http://localhost:5173` và proxy `/api` sang backend. Tài khoản seed mặc định:

```text
phone: 0900000000
password: Officer123
```

Có thể đặt backend khác bằng cách sao chép `.env.example` thành `.env` và thay `VITE_API_BASE_URL`.

## Kiểm tra

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

## Các khu vực chính

- `/services`: wizard cấu hình và publish Service.
- `/providers`: quản lý Provider độc lập.
- `/customers` và `/pockets`: quản lý khách hàng, ví và trạng thái khóa.
- `/operations/trigger`: chạy giao dịch Officer.
- `/trails`, `/transactions`, `/ledger/entries`: giám sát và đối soát.

API luôn được đọc qua envelope `{ err, message, data }`; `err !== 200` được xem là lỗi kể cả khi HTTP status bằng 200.
