# Plan 05 — Quản lý Provider độc lập

## Phân công và phụ thuộc

Giao cho **một subagent duy nhất: Agent 05**, sau Agent 01. Bắt buộc nạp `$react-frontend-coder`; thiếu skill thì dừng/báo blocker, fallback chỉ khi được duyệt.

## Quyền sở hữu

- Route: `/providers`, `/providers/new`, `/providers/:providerId`, `/providers/:providerId/edit`.
- File: `src/features/providers/*`, API/type/query key Provider dùng chung. Agent 06 chỉ được đọc contract này.

## Endpoint và payload

- `POST /api/v1/officer/providers/list`: `{ page,pageSize,q?,serviceCode?,providerCode?,type?,category?,status?:'active'|'inactive',sortBy?,sortOrder? }`.
- `POST /api/v1/officer/providers/create`: `{ type, providerCode|code, serviceCode, name, category?, requestUrl?, confirmUrl?, verifyUrl?, currency?:'VND', balance?:integer>=0, pocketName? }`; tạo Provider active và provider pocket cùng lúc.
- `POST /api/v1/officer/providers/detail`: `{ providerId }`.
- `POST /api/v1/officer/providers/update`: `{ providerId, type?/providerCode?/serviceCode?/name?/category?/requestUrl?/confirmUrl?/verifyUrl? }`; không cập nhật pocket/currency/balance.
- `POST /api/v1/officer/providers/activate` và `/deactivate`: `{ providerId }`.

Code Provider uppercase pattern `[A-Z0-9][A-Z0-9_-]{1,49}`, type lowercase `[a-z][a-z0-9_-]{1,49}`, name 2–100, URL chỉ HTTP(S), uniqueness `(serviceCode, providerCode)`.

## UX và hành vi

- Module cấp cao riêng, list filter/search/sort/pagination và status badge. Create chọn Service từ catalog, tách nhóm “Thông tin Provider”, “Địa chỉ kết nối”, “Ví Provider”.
- Detail hiển thị request/confirm/verify URL và pocket (currency, balance, status) read-only. Edit không giả vờ cho sửa pocket.
- Activate/deactivate qua dialog xác nhận; không có delete. Hiển thị duplicate conflict với link tới Provider đã tồn tại nếu backend trả ID.
- Không đặt form/modal CRUD Provider trong Service workspace.

## Edge cases và test

- Service không tồn tại, currency inactive/missing, duplicate identity, URL sai, create rollback, `changed:false`, status idempotent, pocket missing.
- Integration test list/detail/create/update/status; khẳng định module không phụ thuộc Service Actions và query invalidation đúng.

## Hoàn thành và ranh giới

Hoàn thành khi bốn route và sáu endpoint hoạt động, Provider type/query contract xuất cho Agent 06, test/build đạt. Không cấu hình `Service.actions`, không sửa pocket Provider qua Pocket API, không nhúng CRUD Provider vào Service.

