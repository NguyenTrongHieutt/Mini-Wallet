# Plan 09 — Trigger và giám sát vận hành

## Phân công và phụ thuộc

Giao cho **một subagent duy nhất: Agent 09**, sau Agent 01. Bắt buộc nạp `$react-frontend-coder`; thiếu skill thì dừng/báo blocker, fallback chỉ khi được duyệt.

## Quyền sở hữu

- Route: `/operations/trigger`, `/trails`, `/trails/:trailId`, `/transactions`, `/transactions/:transactionId`, `/ledger/entries`, `/ledger/entries/:entryId`.
- File: `src/features/operations/trigger/*`, `src/features/operations/trails/*`, `src/features/operations/transactions/*`, `src/features/operations/ledger-entries/*`.

## Endpoint và payload

- `POST /api/v1/officer/transactions/trigger`: body nghiệp vụ tự do theo Service nhưng phải có identifier Service theo runtime; tạo form từ TransField active khi có thể và luôn có JSON advanced.
- `POST /api/v1/officer/trails/list`: `{page,pageSize,status?,customerId?,officerId?,serviceId?|serviceCode?,dateFrom?,dateTo?,q?,sortBy?,sortOrder?}`; `POST /api/v1/officer/trails/detail`: `{ id: trailId }` (backend cũng nhận `transRefId` như ID).
- `POST /api/v1/officer/transactions/list`: `{page,pageSize,status?,senderCustomerId?,receiverCustomerId?,receiverProviderId?,transRefId?,serviceId?|serviceCode?,amountFrom?,amountTo?,totalAmountFrom?,totalAmountTo?,dateFrom?,dateTo?,q?,sortBy?,sortOrder?}`; `POST /api/v1/officer/transactions/detail`: `{ transactionId }` (cũng nhận `id|code|transRefId`).
- `POST /api/v1/officer/ledger/entries/list`: `{page,pageSize,transRefId?,status?,pocketId?,direction?:'debit'|'credit',currencyId?|currency?,dateFrom?,dateTo?,sortBy?,sortOrder?}`; `POST /api/v1/officer/ledger/entries/detail`: `{ entryId }`.

## UX và hành vi

- Trigger: chọn Service active, dựng input thân thiện từ TransField, xác nhận payload, chống double-submit, hiển thị transRef/status và link sang Trail/Transaction. Không tự gọi public request/confirm/verify.
- Ba màn list dùng filter bar, pagination, URL search params, status/timestamp chuẩn; detail có raw JSON thu gọn và liên kết chéo theo `transRefId`, pocket, service, customer/provider.
- Trail detail hiển thị expired/error/outputMessage; Transaction detail hiển thị parties, amount/fee/total; Entry detail hiển thị debit/credit pocket và currency, kể cả record liên quan đã missing.

## Edge cases và test

- Trigger timeout/duplicate click, payload JSON sai, trail expired, service/currency/pocket missing, filter range sai, empty/no-result, identifier theo code/transRef, deep-link back preserving filters.
- MSW integration cho 7 endpoint; test filter serialization, detail drill-down, amount/date rendering, missing relations, trigger success/failure. Không cần polling nếu backend chưa có contract.

## Hoàn thành và ranh giới

Hoàn thành khi bảy route/list-detail/trigger hoạt động và lint/typecheck/test/build đạt. Không gọi `/api/v1/transactions/request|confirm|verify`, không sửa transaction/ledger, không tạo polling/websocket hay endpoint chưa tồn tại.
