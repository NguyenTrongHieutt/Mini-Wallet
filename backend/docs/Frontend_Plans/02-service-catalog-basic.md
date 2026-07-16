# Plan 02 — Danh mục Service và thông tin cơ bản

## Phân công và phụ thuộc

Giao cho **một subagent duy nhất: Agent 02**, sau Agent 01. Phải nạp `$react-frontend-coder`; thiếu skill thì dừng/báo blocker, chỉ fallback khi được duyệt.

## Quyền sở hữu

- Route: `/services`, `/services/new`, `/services/:serviceId/config/basic` và khung/stepper dùng chung dưới `/services/:serviceId/config/*`.
- File: `src/features/services/catalog/*`, `src/features/services/basic/*`, `src/features/services/workspace/*`, API/type/query Service cơ bản.

## Endpoint và payload

- `POST /api/v1/officer/services/list`: `{ page, pageSize, q?, serviceCode?, status?: 'draft'|'active'|'inactive', sortBy?: 'code'|'name'|'status'|'createdAt'|'updatedAt', sortOrder?: 'ASC'|'DESC' }`.
- `POST /api/v1/officer/services/create`: `{ code|serviceCode, name, description?, fieldBuilder?: [], actions?: {}, fee?: {type:'fixed'|'percent',value,min?,max?}, auth?: {method:'NONE'|'PIN'} }`; backend luôn tạo `draft`.
- `POST /api/v1/officer/services/detail`: `{ serviceId }` (hoặc `{ serviceCode }`); dùng `serviceId` từ route.
- `POST /api/v1/officer/services/update`: `{ serviceId, name?/description?/fee?/auth?/actions? }`; không gửi `code`, `fieldBuilder`, `status`; ít nhất một field phải có.

## UX và hành vi

- List có search debounce, filter trạng thái, sort, pagination, empty state và CTA “Tạo dịch vụ”. Click row mở workspace.
- Create chỉ hỏi code, tên, mô tả, phí và xác thực; code uppercase theo pattern `[A-Z0-9][A-Z0-9_-]{1,99}`, tên 2–100, mô tả ≤1000. Sau tạo điều hướng đến `config/basic`.
- Basic hiển thị code read-only; form phí fixed/percent với min/max có nhãn gần gũi; auth “Không yêu cầu”/“PIN”.
- Workspace tải detail một lần, stepper giữ service ID, cảnh báo dirty state. `active` khóa form và hiển thị CTA unpublish do Agent 07 cung cấp; `draft/inactive` được sửa.

## Edge cases và test

- Duplicate code `SERVICE_ALREADY_EXISTS`, `min > max`, no-op update `changed:false`, detail 404, filter/page reset, active trả `SERVICE_CONFIG_ACTIVE`.
- Test schema create/update, list states, cache invalidation, dirty-navigation confirm và read-only active.

## Hoàn thành và ranh giới

Hoàn thành khi 3 route hoạt động, contract workspace cho Agent 03/04/06/07 ổn định, lint/typecheck/test/build đạt. Không chỉnh field builder, TransField, validation, actions, ledger/publish; không quản lý Provider.

