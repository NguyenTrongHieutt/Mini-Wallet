# Điều phối triển khai Customer Portal và Customer Protected API

## Mục tiêu

Triển khai hai Customer Protected API và Customer Portal React dưới `/customer/*` mà không làm thay đổi hành vi của Officer Portal. Nguồn sự thật phải được đọc theo thứ tự:

`config/routes.js` → `config/policies.js` → controller → service/model → `docs/API/customer-openapi.yaml`.

Tất cả Customer API dùng `POST`, HTTP status luôn là `200`, và trả envelope `{ err, message, data }`. Frontend coi `err === 200` là thành công; mọi giá trị khác là lỗi nghiệp vụ.

## Phân công và thứ tự

Mỗi file kế hoạch `00`–`04` được giao cho **đúng một subagent**:

| Agent | Kế hoạch | Phạm vi chính |
| --- | --- | --- |
| Agent 00 | `00-customer-protected-api.md` | `/customer/me`, `/customer/wallet/balance`, policy, tài liệu API |
| Agent 01 | `01-foundation-auth-shell.md` | Auth/session customer, protected route, shell |
| Agent 02 | `02-service-catalog.md` | Danh sách và tìm kiếm service |
| Agent 03 | `03-dynamic-transaction-flow.md` | Dynamic fields, provider suggestions, request/confirm/verify |
| Agent 04 | `04-history-detail-profile.md` | Lịch sử, chi tiết, profile, số dư, E2E |

Thứ tự tích hợp bắt buộc: **Agent 00 → Agent 01 → Agent 02 → Agent 03 → Agent 04**. Agent sau được phép đọc kết quả agent trước nhưng không được sửa lại phần thuộc quyền sở hữu nếu chưa báo điều phối.

## Quy tắc skill

- Agent 00 phải nạp `$security-best-practices` đã được cài cho phiên triển khai, tập trung kiểm tra authentication, authorization, IDOR, checksum và dữ liệu nhạy cảm. Conventions SailsJS hiện có trong repo vẫn là nguồn triển khai chính.
- Không tìm thấy nguồn `$react-frontend-coder` phù hợp trong phiên triển khai hiện tại. Vì vậy Agent 01–04 triển khai theo conventions React/TypeScript, dependency và cấu trúc có sẵn trong repo; không được tuyên bố đã dùng skill này.
- Nếu `$react-frontend-coder` được cài ở một phiên sau, Agent 01–04 phải nạp skill trước khi tiếp tục hoặc chỉnh sửa phần frontend tương ứng, miễn là chỉ dẫn của skill không xung đột yêu cầu trong các plan này.

## Contract chung

- Customer identity luôn lấy từ `req.info.user`. API profile/ví không nhận và không tin `customerId`, `ownerId` hoặc `pocketId` từ client.
- Frontend gửi cookie bằng `credentials: "include"`; không lưu access token hoặc customer profile trong localStorage.
- `/api/v1/customer/me` là nguồn sự thật của phiên customer sau reload.
- Query key customer đều bắt đầu bằng `["customer-portal", ...]` để không xung đột cache Officer Portal.
- Cookie `jwt` đang dùng chung cho customer và officer; đăng nhập một loại tài khoản sẽ thay phiên loại còn lại trong cùng browser profile.
- UI tiếng Việt, mobile-first, responsive cho tablet/desktop; phải có loading, empty, retry và business-error state.
- Mọi màn tìm kiếm thông thường chỉ truy vấn sau khi bấm nút **Tìm kiếm**. Việc nhập form không tự áp dụng bộ lọc và không tự điền kết quả.
- Riêng provider suggestions được phép tự tải khi focus/nhập vì đây là combobox hỗ trợ chọn `providerCode`; kết quả không được tự chọn hoặc ghi đè input.

## Route frontend

- `/customer/login`
- `/customer/register`
- `/customer/services`
- `/customer/services/:serviceCode`
- `/customer/transactions`
- `/customer/transactions/:transactionId`
- `/customer/profile`

## Coverage Customer API

| Nhóm | Endpoint |
| --- | --- |
| Auth/account | `/api/v1/customer/auth/register`, `/api/v1/customer/auth/login`, `/api/v1/customer/auth/logout`, `/api/v1/customer/me` |
| Wallet | `/api/v1/customer/wallet/balance` |
| Catalog | `/api/v1/customer/services/list`, `/api/v1/customer/providers/list`, `/api/v1/customer/services/input-fields` |
| Transaction flow | `/api/v1/transactions/request`, `/api/v1/transactions/confirm`, `/api/v1/transactions/verify` |
| History | `/api/v1/customer/transactions/list`, `/api/v1/customer/transactions/detail` |

## Nghiệm thu chung

- Hai API mới không thể đọc profile hoặc pocket của customer khác.
- `docs/API/customer-openapi.yaml` và `frontend Mini-Wallet/customer-openapi.yaml` đồng bộ với code.
- Customer route không tự gọi `/api/v1/officer/me`; Officer Portal tiếp tục hoạt động như trước.
- Frontend lấy phiên từ `/customer/me` và số dư thật từ `/customer/wallet/balance`.
- Backend đạt syntax check, boot check và integration flow liên quan.
- Frontend đạt lint, typecheck, unit/integration test, E2E và production build bằng script thực tế có trong project.

