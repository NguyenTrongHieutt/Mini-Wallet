# Plan 08 — Khách hàng và ví

## Phân công và phụ thuộc

Giao cho **một subagent duy nhất: Agent 08**, sau Agent 01. Phải nạp `$react-frontend-coder`; thiếu skill thì dừng/báo blocker, fallback chỉ khi được duyệt.

## Quyền sở hữu

- Route: `/customers`, `/customers/:customerId`, `/pockets`, `/pockets/new`, `/pockets/:pocketId`.
- File: `src/features/customers/*`, `src/features/pockets/*`, API/type/query tương ứng.

## Endpoint và payload

- `POST /api/v1/officer/customers/list`: `{page,pageSize,q?,status?:'active'|'locked',sortBy?,sortOrder?}`.
- `POST /api/v1/officer/customers/detail`, `POST /api/v1/officer/customers/lock`, `POST /api/v1/officer/customers/unlock`: `{ customerId }`.
- `POST /api/v1/officer/pockets/list`: `{page,pageSize,q?,ownerType?:'customer'|'provider'|'system'|'bank',status?:'active'|'locked',currency?,sortBy?,sortOrder?}`.
- `POST /api/v1/officer/pockets/detail`, `POST /api/v1/officer/pockets/lock`, `POST /api/v1/officer/pockets/unlock`: `{ pocketId }`.
- `POST /api/v1/officer/pockets/create`: `{ ownerType:'system'|'bank', ownerId, name, currency?:'VND', balance?:integer>=0 }`. Backend không cho Officer tạo customer/provider pocket qua endpoint này.

## UX và hành vi

- Customer list/detail hiển thị profile và các pocket; lock/unlock qua confirm. Nêu rõ lock Customer thu hồi session active nhưng không tự lock pocket.
- Pocket list có filter owner/status/currency; create chỉ hai lựa chọn gần gũi “Ví hệ thống”/“Ví ngân hàng”. Customer/provider pocket chỉ đọc và được tạo theo luồng tương ứng.
- Detail hiển thị balance/currency, owner và lock type. Chỉ cho unlock nếu lock do Officer; transaction lock hiển thị cảnh báo và vô hiệu nút.
- Không có delete hoặc chỉnh balance thủ công.

## Edge cases và test

- Customer lock/unlock idempotent; pocket uniqueness `(ownerType,ownerId,currency)`; currency missing/inactive; transaction lock `POCKET_TRANSACTION_LOCKED`; pocket missing; balance không nguyên/âm; pagination/filter.
- Test list/detail/create/status, session-revocation message, lock ownership gating và cache invalidation ở customer detail/pocket list.

## Hoàn thành và ranh giới

Hoàn thành khi năm route và chín endpoint hoạt động, test/build đạt. Không đăng ký Customer, không tạo provider/customer pocket, không sửa số dư, không xử lý ledger entries.
