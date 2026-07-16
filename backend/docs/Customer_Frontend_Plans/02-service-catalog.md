# Agent 02 — Danh sách và tìm kiếm Service

## Phân công

Giao toàn bộ kế hoạch này cho **đúng một subagent: Agent 02**. `$react-frontend-coder` chưa tìm thấy nguồn phù hợp trong phiên hiện tại; dùng conventions/component/query stack sẵn có trong repo và nạp skill nếu về sau được cài.

Agent 02 sở hữu `/customer/services`, service list types/API/query/components. Không sửa auth shell, backend hoặc transaction form.

## Mục tiêu

Xây màn danh sách service active từ `POST /api/v1/customer/services/list`, có tìm kiếm bằng nút bấm, sort và pagination. Không tự chọn hoặc tự mở service.

## Contract dữ liệu

Tạo hoặc mở rộng shared types tối thiểu:

- `PublicService`
- `ServiceListRequest`
- `ServiceListData`
- Query key `["customer-portal", "services", appliedFilters]`

Payload bám OpenAPI/backend thực tế, gồm các trường hỗ trợ như `page`, `pageSize`, `q`, `code`, `sortBy`, `sortOrder`.

## Hành vi màn hình

- Khi mở trang lần đầu, tải danh sách mặc định.
- Duy trì hai state riêng:
  - `draftFilters`: dữ liệu người dùng đang nhập.
  - `appliedFilters`: dữ liệu đã bấm **Tìm kiếm** và đang dùng cho query.
- Nhập từ khóa, mã service hoặc thay controls không gọi API.
- Chỉ nút **Tìm kiếm** hoặc submit form mới copy draft sang applied, reset page về `1` và truy vấn.
- Nút **Đặt lại** xóa draft/applied về mặc định, reset page và tải danh sách mặc định.
- Pagination và sort thao tác trên applied filters, không lấy draft chưa áp dụng.
- Mỗi card/row có hành động chọn rõ ràng; chỉ hành động đó mới chuyển tới `/customer/services/:serviceCode`.
- Không tự chọn, tự điền hoặc tự điều hướng khi API trả một kết quả.

## Trạng thái UI

- Skeleton/loading cho lần tải đầu.
- Loading nhẹ khi đổi trang/sort mà vẫn giữ layout ổn định.
- Empty state phân biệt danh sách mặc định rỗng và không có kết quả tìm kiếm.
- Retry cho lỗi mạng; hiển thị business message cho `err !== 200`.
- Pagination phải dùng metadata thực tế từ response và không cho đi quá giới hạn.

## Kiểm thử và nghiệm thu

- Initial render gọi list đúng một lần với filter mặc định.
- Gõ/chỉnh filter không gọi lại API.
- Bấm **Tìm kiếm** mới đổi payload/query key và reset page.
- Pagination/sort giữ applied filters.
- Đặt lại tải danh sách mặc định.
- Một kết quả duy nhất không tự điều hướng.
- Click/chọn service mới điều hướng đúng `serviceCode`.
- Loading, empty, retry và business error đều có test.

