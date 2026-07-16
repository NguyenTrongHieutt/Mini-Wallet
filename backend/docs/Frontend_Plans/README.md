# Điều phối triển khai React Officer Portal

## Mục tiêu và nguồn sự thật

Chuyển app Customer JavaScript hiện có trong `frontend Mini-Wallet/` thành Officer Portal dùng Vite, React và TypeScript. Giữ nguyên `frontend Mini-Wallet/backup/`, `frontend Mini-Wallet/public/` và các asset có sẵn; không sửa backend Sails, root `package.json` hoặc pipeline Grunt.

Nguồn sự thật theo thứ tự: `config/routes.js` → controller → service → model. Không gọi endpoint chỉ có trong tài liệu. Mọi request Officer là `POST`, gửi cookie bằng `credentials: "include"`, đọc envelope `{ err, message, data }`, và coi `err !== 200` là lỗi kể cả HTTP status là 200.

## Hợp đồng subagent và skill

- Mỗi file `01`–`09` giao cho đúng **một subagent**; subagent chỉ sửa route/file được sở hữu.
- Trước khi code, subagent phải nạp `$react-frontend-coder` và tuân thủ skill. Nếu skill không tồn tại/không đọc được, **dừng triển khai**, báo blocker cho agent điều phối; chỉ được fallback sang quy ước React/TypeScript trong plan khi người dùng hoặc agent điều phối chấp thuận rõ ràng.
- Agent 01 hoàn thành trước. Sau đó 02, 05, 08, 09 có thể làm độc lập; 03 sau 02; 04 và 06 sau 03; 07 làm cuối.
- Shared contract do Agent 01 sở hữu: TypeScript strict, React Router, TanStack Query, React Hook Form + Zod, Tailwind + shadcn/ui, Vitest + Testing Library + MSW, Playwright. Node 22 cho frontend; không đổi runtime Node 8.9 của backend.
- UI tiếng Việt, nhưng giữ nguyên code/field/path backend. Loading, empty, inline error, toast thành công, confirm thao tác trạng thái và responsive desktop/tablet là bắt buộc.

## Route frontend và chủ sở hữu

| Agent | Route |
|---|---|
| 01 | `/login`, app shell, protected route, `/` redirect |
| 02 | `/services`, `/services/new`, `/services/:serviceId/config/basic` |
| 03 | `/services/:serviceId/config/field-builder` |
| 04 | `/services/:serviceId/config/trans-fields`, `/services/:serviceId/config/validations` |
| 05 | `/providers`, `/providers/new`, `/providers/:providerId`, `/providers/:providerId/edit` |
| 06 | `/services/:serviceId/config/actions` |
| 07 | `/services/:serviceId/config/ledger`, `/services/:serviceId/config/review` |
| 08 | `/customers`, `/customers/:customerId`, `/pockets`, `/pockets/new`, `/pockets/:pocketId` |
| 09 | `/operations/trigger`, `/trails`, `/trails/:trailId`, `/transactions`, `/transactions/:transactionId`, `/ledger/entries`, `/ledger/entries/:entryId` |

Workspace Service dùng stepper: **Cơ bản → Dựng biến → Trường nhập → Kiểm tra nghiệp vụ → Actions → Định khoản → Xuất bản**. Service `active` chỉ đọc; muốn sửa phải xác nhận unpublish. Không có nút xóa vì backend chỉ hỗ trợ chuyển trạng thái.

## Coverage 41 endpoint Officer

| Chủ sở hữu | Endpoint |
|---|---|
| 01 | `POST /api/v1/officer/auth/login`, `POST /api/v1/officer/auth/logout`, `POST /api/v1/officer/me` |
| 02 | `POST /api/v1/officer/services/create`, `POST /api/v1/officer/services/list`, `POST /api/v1/officer/services/detail`, `POST /api/v1/officer/services/update` |
| 03 | `POST /api/v1/officer/services/field-builder/update` |
| 04 | `POST /api/v1/officer/services/trans-fields/list`, `POST /api/v1/officer/services/trans-fields/insert`, `POST /api/v1/officer/services/trans-fields/update`, `POST /api/v1/officer/services/trans-validations/list`, `POST /api/v1/officer/services/trans-validations/insert`, `POST /api/v1/officer/services/trans-validations/update` |
| 05 | `POST /api/v1/officer/providers/create`, `POST /api/v1/officer/providers/list`, `POST /api/v1/officer/providers/detail`, `POST /api/v1/officer/providers/update`, `POST /api/v1/officer/providers/activate`, `POST /api/v1/officer/providers/deactivate` |
| 06 | `POST /api/v1/officer/services/actions/update` |
| 07 | `POST /api/v1/officer/services/trans-definition/detail`, `POST /api/v1/officer/services/trans-definition/update`, `POST /api/v1/officer/services/publish`, `POST /api/v1/officer/services/unpublish` |
| 08 | `POST /api/v1/officer/customers/list`, `POST /api/v1/officer/customers/detail`, `POST /api/v1/officer/customers/lock`, `POST /api/v1/officer/customers/unlock`, `POST /api/v1/officer/pockets/create`, `POST /api/v1/officer/pockets/list`, `POST /api/v1/officer/pockets/detail`, `POST /api/v1/officer/pockets/lock`, `POST /api/v1/officer/pockets/unlock` |
| 09 | `POST /api/v1/officer/transactions/trigger`, `POST /api/v1/officer/trails/list`, `POST /api/v1/officer/trails/detail`, `POST /api/v1/officer/transactions/list`, `POST /api/v1/officer/transactions/detail`, `POST /api/v1/officer/ledger/entries/list`, `POST /api/v1/officer/ledger/entries/detail` |

Các agent được phép **đọc** service detail/provider list/pocket list từ query layer dùng chung dù endpoint có chủ sở hữu khác; không được tạo API wrapper hoặc mutation trùng lặp.

## Hợp đồng tích hợp và nghiệm thu chung

- Query key chuẩn: `['me']`, `['services', filters]`, `['service', id]`, `['providers', filters]`, `['customers', filters]`, `['pockets', filters]`, `['trails', filters]`, `['transactions', filters]`, `['ledgerEntries', filters]`.
- Cấu hình phức tạp có form trực quan mặc định và “Cấu hình nâng cao” JSON theo từng phần. JSON phải parse/format, đồng bộ hai chiều và bảo toàn thuộc tính chưa được form hỗ trợ.
- Không cho chọn Provider khác `serviceCode`; Service Actions không tạo/sửa Provider và chỉ có link sang `/providers`.
- Mỗi agent chỉ bàn giao khi `npm run lint`, `npm run typecheck`, unit/integration test liên quan và `npm run build` trong `frontend Mini-Wallet/` đều đạt. Agent 07 bổ sung E2E toàn luồng tạo Provider → tạo Service → cấu hình → publish.

