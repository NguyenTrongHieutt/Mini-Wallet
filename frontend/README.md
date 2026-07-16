# Mini-Wallet Portal

Ứng dụng React/TypeScript chứa cả Officer Portal và Customer Portal.

## Yêu cầu

$env:PATH = "C:\Tools\node-v22.23.1-win-x64;$env:PATH"
cd D:\Intern-JITS\Mini-Wallet\frontend
npm run dev

- Frontend sử dụng Node.js 22 theo `.nvmrc`.
- Backend Sails chạy riêng, mặc định tại `http://localhost:1337`.
- Không dùng runtime Node 8 của backend để chạy lệnh frontend.

## Chạy local

```powershell
cd frontend
nvm use 22
npm install
npm run dev
```

Vite chạy tại `http://localhost:5173` và proxy `/api` sang backend. Có thể sao
chép `.env.example` thành `.env` và đặt `VITE_API_BASE_URL` khi backend nằm ở
địa chỉ khác.

Tài khoản Officer không còn được hardcode. Hãy cấu hình `OFFICER_PHONE` và
`OFFICER_PASSWORD` khi chạy seed phía backend.

## Kiểm tra

```powershell
npm run contract:check
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

`backend/docs/API/customer-openapi.yaml` là nguồn contract Customer chính.
Lệnh `contract:check` bảo đảm bản sao dùng bởi frontend không bị lệch.

## Các khu vực chính

- `/services`, `/providers`, `/customers`, `/pockets`: vận hành cấu hình và dữ liệu.
- `/operations/trigger`, `/transactions`, `/ledger/entries`: thực thi và giám sát.
- `/customer/*`: đăng nhập, dịch vụ động, giao dịch, lịch sử và ví Customer.

API giữ envelope tương thích `{ err, code?, message, data? }`. HTTP có thể vẫn
trả `200`; frontend coi `err !== 200` là lỗi nghiệp vụ và ưu tiên `code` để ánh
xạ thông báo ổn định.
