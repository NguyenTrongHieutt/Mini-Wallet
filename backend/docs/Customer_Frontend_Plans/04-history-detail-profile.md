# Agent 04 — Lịch sử, Chi tiết, Profile và Số dư

## Phân công

Giao toàn bộ kế hoạch này cho **đúng một subagent: Agent 04**. `$react-frontend-coder` chưa tìm thấy nguồn phù hợp trong phiên hiện tại; dùng conventions/testing stack sẵn có và nạp skill nếu về sau được cài.

Agent 04 sở hữu history/detail/profile, wallet balance UI và E2E toàn Customer Portal. Không sửa contract auth/catalog/transaction nếu không báo điều phối.

## Lịch sử giao dịch

Xây `/customer/transactions` bằng `POST /api/v1/customer/transactions/list`.

- Filter hỗ trợ theo backend/OpenAPI thực tế: keyword, direction sent/received, status done/failed, serviceCode, khoảng ngày, amount và totalAmount.
- Tách `draftFilters` và `appliedFilters`.
- Thay đổi draft không gọi API; chỉ nút **Tìm kiếm** hoặc submit form mới áp dụng và reset page.
- **Đặt lại** đưa về danh sách mặc định.
- Pagination/sort dùng applied filters và serializer ổn định cho date/number.
- Không tự mở hoặc tự chọn giao dịch đầu tiên.
- Mỗi row/card có hành động mở `/customer/transactions/:transactionId`.

## Chi tiết giao dịch

Xây detail bằng `POST /api/v1/customer/transactions/detail`, gửi ID lấy từ route.

Hiển thị:

- Direction
- Service
- Sender/receiver
- Amount, fee, total, currency
- Message
- Status
- Created/updated timestamps

Backend hiện chỉ bảo đảm `transaction`; type cho phép `trail` và `entries` là optional. UI phải hoạt động bình thường khi hai phần này vắng mặt. Xử lý not-found/forbidden bằng business error an toàn, không hiển thị raw response.

## Profile và số dư ví

Xây `/customer/profile`:

- Profile lấy từ query/cache `["customer-portal", "me"]`; không dùng localStorage.
- Số dư lấy từ `POST /api/v1/customer/wallet/balance`.
- Query key `["customer-portal", "wallet", currency]`.
- Mặc định request `VND`; cấu trúc hook/API cho phép truyền currency khác về sau nhưng chưa cần UI đổi currency nếu sản phẩm chưa yêu cầu.
- Hiển thị balance, currency, tên ví và trạng thái `active`/`locked`.
- Có nút refresh số dư; refresh là hành động rõ ràng, không tạo polling ngoài yêu cầu.
- Không hiển thị số dư giả hoặc lấy lại số dư cũ từ browser storage.
- Sau giao dịch thành công, cache invalidation của Agent 03 phải khiến header/profile lấy số dư mới.
- Logout dùng contract Agent 01 và luôn xóa customer cache.

## E2E toàn luồng

Viết E2E hoặc integration journey phù hợp hạ tầng hiện có:

1. Register hoặc login.
2. `/me` khôi phục customer.
3. Xem balance.
4. Nhập filter service và bấm **Tìm kiếm**.
5. Chọn service rõ ràng.
6. Tải dynamic fields.
7. Nhập providerCode thủ công hoặc chọn từ popup suggestions.
8. Request → xem preview → confirm → verify.
9. Kiểm tra receipt và số dư được refresh/invalidate.
10. Vào history bằng nút **Tìm kiếm**, mở detail.
11. Logout và xác nhận protected route quay về login.

## Kiểm thử và nghiệm thu

- Gõ filter lịch sử không gọi API; bấm **Tìm kiếm** mới truy vấn.
- Reset, pagination, sort và serialization filter đúng.
- Không tự mở kết quả đầu tiên.
- Detail render được khi không có `trail`/`entries`.
- Profile dùng `/me`; wallet dùng `/wallet/balance`; không có dữ liệu giả trong storage.
- Refresh balance và invalidation sau verify cập nhật UI.
- Logout thành công/thất bại đều xóa local customer state.
- E2E bao phủ flow trên, đồng thời smoke-test Officer Portal không bị ảnh hưởng.

