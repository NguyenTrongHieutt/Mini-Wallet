# Plan 01 — Foundation, đăng nhập và app shell

## Phân công và phụ thuộc

Giao cho **một subagent duy nhất: Agent 01**. Trước khi code phải nạp `$react-frontend-coder`; nếu không có/không đọc được thì dừng, báo blocker và chỉ fallback khi được điều phối viên chấp thuận.

## Quyền sở hữu

- Route: `/login`, `/` redirect về `/services`, protected layout cho toàn bộ route Officer.
- File: cấu hình/package trong `frontend Mini-Wallet/`; `src/main.tsx`, `src/app/*`, `src/lib/api/*`, `src/lib/query/*`, `src/types/api.ts`, `src/components/ui/*`, `src/layouts/*`, `src/features/auth/*`, test setup.
- Chuyển entrypoint `.jsx` sang TypeScript; giữ `backup/`, `public/` và asset. Không xóa prototype Customer trước khi xác nhận mọi entrypoint đã chuyển và không dùng lại được.

## Endpoint và hợp đồng

- `POST /api/v1/officer/auth/login`: body `{ phone, password }`; lưu profile từ `data.officer`, không lưu access token vào localStorage.
- `POST /api/v1/officer/me`: body `{}`; phục hồi phiên cookie, nhận `data.officer`.
- `POST /api/v1/officer/auth/logout`: body `{}`; luôn xóa state/cache phía client sau khi request kết thúc.
- API client dùng base URL từ `VITE_API_BASE_URL`, `credentials: 'include'`, JSON headers, timeout/abort, envelope error có `code=message`, `details=data`; gặp `UNAUTHENTICATED` thì xóa session và về `/login`.

## UX và hành vi

- Login gọn, tiếng Việt, validate số điện thoại/mật khẩu, chống submit lặp và không tiết lộ credential sai ở trường nào.
- Khi mở app: skeleton toàn trang lúc gọi `/me`; phiên hợp lệ vào route yêu cầu, không hợp lệ vào login và giữ `returnTo` nội bộ an toàn.
- Shell desktop có sidebar: Dịch vụ, Provider, Khách hàng, Ví, Vận hành; tablet dùng drawer. Header hiển thị officer và logout.
- Tạo error boundary, 404, toast, dialog confirm, table/pagination/form primitives và status badge dùng chung.

## Edge cases và test

- Test envelope `err !== 200` dù HTTP 200, network/timeout, session hết hạn, `/me` race, logout lỗi mạng, `returnTo` không cho external URL.
- MSW integration: login thành công/thất bại, reload phục hồi cookie, protected redirect, logout xóa query cache.
- Không mock localStorage token; không gọi API Customer.

## Hoàn thành và ranh giới

Hoàn thành khi TypeScript strict, lint/typecheck/test/build đạt và các agent khác có thể đăng ký route/lazy module qua contract đã tạo. Không làm màn nghiệp vụ, không sửa backend/root package, không thay đổi `backup/` hoặc `public/`.

