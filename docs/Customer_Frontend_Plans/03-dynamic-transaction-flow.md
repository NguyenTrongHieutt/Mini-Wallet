# Agent 03 — Dynamic Transaction Flow

## Phân công

Giao toàn bộ kế hoạch này cho **đúng một subagent: Agent 03**. `$react-frontend-coder` chưa tìm thấy nguồn phù hợp trong phiên hiện tại; dùng conventions React/form/query hiện có và nạp skill nếu về sau được cài.

Agent 03 sở hữu `/customer/services/:serviceCode`, dynamic field renderer, provider combobox và flow request → confirm → verify → receipt. Không sửa service catalog hoặc history/profile.

## Khởi tạo form động

- Khi route có `serviceCode`, gọi `POST /api/v1/customer/services/input-fields` trước.
- Chỉ dựng form sau khi response thành công; có loading, retry, invalid-service và empty-config state.
- Render mọi `bodyFields` theo:
  - `name`
  - `dataType`
  - `required`
  - `defaultValue`
  - `validation`
  - `role`
- Placeholder dùng `field.role`; nếu role rỗng mới fallback `field.name`.
- Tuyệt đối không lấy `requestExample` để tự điền form. Chỉ `defaultValue` được dùng làm giá trị khởi tạo.
- Hỗ trợ tối thiểu string, secured string, number/integer, boolean và object/JSON.
- Trước request, validate rồi chuẩn hóa kiểu; bỏ field optional đang rỗng, giữ `false` và `0` hợp lệ.

## Provider code combobox

Áp dụng case-insensitive khi `field.name === "providerCode"`:

- Input luôn cho phép nhập mã thủ công.
- Khi focus hoặc thay đổi text, debounce khoảng `300ms` rồi gọi `POST /api/v1/customer/providers/list` với `serviceCode`, `q`, page/pageSize.
- Hiển thị suggestions trong popup/cửa sổ cuộn bên dưới input, chiều cao tối đa khoảng `240px`.
- Hỗ trợ keyboard navigation, click chọn, loading, empty và tải trang tiếp theo.
- Kết quả API không tự chọn, không tự điền kết quả đầu tiên và không ghi đè text đang nhập.
- Chỉ click hoặc xác nhận bằng bàn phím mới gán `provider.code`.
- Blur/đóng popup không được xóa mã nhập tay hợp lệ về mặt field validation.

Provider suggestions là ngoại lệ duy nhất được tự truy vấn khi nhập; đây không phải màn tìm kiếm độc lập.

## Luồng giao dịch

1. Gửi `POST /api/v1/transactions/request` với `{ serviceCode, ...dynamicFields }`.
2. Hiển thị preview từ response; không tự confirm.
3. Người dùng bấm xác nhận mới gọi `POST /api/v1/transactions/confirm`.
4. Dựa trên `authMethod`:
   - `PIN`: hiện input PIN và nút verify; nhập đủ sáu số vẫn không tự submit.
   - `NONE`: hiện nút hoàn tất gọi verify không kèm PIN.
5. Verify thành công hiển thị receipt.

Các mutation phải chống double-submit. Nếu transaction hết hạn, khóa confirm/verify, giải thích lỗi và cho phép bắt đầu giao dịch mới.

Receipt hiển thị tối thiểu:

- Mã giao dịch
- Service
- Amount
- Fee
- Total
- Currency
- Status

Sau verify thành công invalidate:

- `["customer-portal", "transactions"]`
- `["customer-portal", "wallet", currency]`

## Kiểm thử và nghiệm thu

- `input-fields` được gọi trước khi form xuất hiện.
- Placeholder dùng role/fallback đúng; `requestExample` không tự điền.
- Default value và validation động hoạt động cho các data type hỗ trợ.
- Provider input cho nhập tay; suggestions debounce, cuộn/tải thêm được và không auto-select.
- Payload request giữ đúng kiểu dữ liệu và không gửi optional field rỗng.
- Request không tự confirm; confirm không tự verify.
- PIN đủ sáu số vẫn cần bấm nút; `NONE` chỉ verify sau click.
- Double-click chỉ tạo một mutation; transaction hết hạn không thể tiếp tục.
- Verify thành công render receipt và invalidate đúng history/wallet cache.

