# iSuccess Scan Barcode — Hướng dẫn cấu hình (SETUP)

Tài liệu này mô tả **tất cả** cấu hình của app: nằm ở đâu, giá trị mặc định là gì, và
cách chỉnh. Mục tiêu: máy mới cài **chạy được ngay** mà không cần setup tay; nếu cần đổi
thì chỉnh trong app.

> Nguyên tắc: **Giá trị đã lưu (trong app) luôn được ưu tiên.** Chỉ khi chưa có cấu hình
> (máy mới) app mới dùng **giá trị mặc định** được nhúng trong code.

---

## 1. Tổng quan các nhóm cấu hình

| Nhóm | Mở ở đâu trong app | Lưu vào |
|---|---|---|
| **Cấu hình API** (tìm đơn + cập nhật trạng thái) | Menu user (góc trên phải) → ⚙️ **Cấu hình API** | `config.encrypted` |
| **Hình ảnh** (thư mục local + Thumbnail Server) | Menu user → 🖼️ **Hình ảnh** | `config.encrypted` |
| **Máy in** (BarTender) | Menu user → 🏷️ **BarTender** | `config.encrypted` |

> Elasticsearch **đã bị tắt** (trước đây gây chậm tải ảnh tới 8 giây khi server không
> truy cập được). Phần cấu hình ES đã được gỡ khỏi UI. Ảnh tải thẳng từ **Thumbnail
> Server** → **thư mục local**.

---

## 2. Cấu hình API

Mở: menu user → ⚙️ **Cấu hình API**.

| Trường | Ý nghĩa | Mặc định |
|---|---|---|
| Environment | Chọn môi trường | `Custom` |
| Custom Base URL | URL Meilisearch để **tìm đơn** | `http://103.139.203.10:7700` |
| Timeout (ms) | Timeout gọi API | `10000` |
| Username / Password | Xác thực kiểu Basic (tuỳ chọn) | trống |
| **API Key (Bearer Token)** | **Key Meilisearch** — bắt buộc để tìm đơn | `cbf33c1c…ccb691e` (đã nhúng) |
| Update API Base URL | (tuỳ chọn) | trống |
| Update API Key | (tuỳ chọn) | trống |

**Lưu ý kỹ thuật quan trọng:**
- **Tìm đơn (scan):** gọi Meilisearch, index `order_details`, lọc theo
  `task_code_front_prefix`. URL Meili hiện đang **hard-code** trong
  `src/main/api.ts` (`searchOrders`), nhưng **API Key thì lấy từ cấu hình** ở trên —
  nên key phải đúng thì mới tìm được đơn.
- **Cập nhật trạng thái / Add to Inventory:** gọi `https://production.trackingis.info`
  (hard-code trong `src/main/api.ts` → `updateOrderStatusCodes`), dùng **token đăng nhập**
  (login), không dùng API Key Meili.

---

## 3. Cấu hình Hình ảnh

Mở: menu user → 🖼️ **Hình ảnh**. Có 2 phần:

### 3.1. Thư mục local
- **Đường dẫn thư mục chứa ảnh** — mặc định `/Volumes/Designer ZenE`.
- Dùng khi không lấy được ảnh từ Thumbnail Server.

### 3.2. Thumbnail Server (WebP) — **đường ảnh nhanh nhất**
| Trường | Mặc định |
|---|---|
| Bật Thumbnail Server | ✅ bật |
| Base URL | `http://172.26.207.206:8081/thumbs/` |
| NAS prefix (bị strip khỏi path) | `/Volumes/` |
| Đuôi file thumb | `.webp` |

Cách map ví dụ:
`/Volumes/Designer ZenE/foo/bar.png` → `http://172.26.207.206:8081/thumbs/Designer ZenE/foo/bar.png.webp`

**Thứ tự tải ảnh** (trong `OrderView.tsx`): Thumbnail Server (WebP) → thumbnail local
(tự resize, cache trong `userData/thumbs`) → convert AI/PDF (ImageMagick).

---

## 4. Cấu hình Máy in (BarTender) — **chỉ 1 nơi**

> **Trả lời câu hỏi “cái nào là cấu hình chính cho máy in?”**
> Chỉ còn **một** nơi: tab riêng 🏷️ **BarTender** (menu user). Phần “BarTender
> Configuration” cũ nằm trong ⚙️ Cấu hình API **đã được gỡ** vì nó **không lưu xuống đĩa**
> (handler `set-config` không xử lý `barTenderConfig`) — gây nhầm lẫn.

Mở: menu user → 🏷️ **BarTender**.

| Trường | Ý nghĩa |
|---|---|
| Enable BarTender Integration | Bật/tắt in |
| Integration Method | `File System` / `Excel Export` / `Named Pipes (Windows)` / `HTTP` |
| File Path | (method = file) đường dẫn `print_queue.json` |
| Excel File Path | (method = excel) đường dẫn `.xlsx` xuất ra |
| Named Pipe Path / HTTP URL | theo method tương ứng |
| Template Name | tên template BarTender |
| Print Quantity | số bản in |

**Mặc định máy in** (cho máy mới) ở `src/main/config.ts` → `DEFAULT_BARTENDER_CONFIG`:
`enabled=false`, `method='file'`, `templateName='Default'`, `printQuantity=1`,
`printMethod='direct'`.

**Giới hạn cần biết:** một số trường cho luồng *xuất Excel rồi BarTender tự in trên Windows*
(`bartenderPath`, `templatePath`, `autoPrint`, `printScriptPath`, `printMethod`) hiện
**không có ô nhập trong tab này** — chúng được lấy từ `DEFAULT_BARTENDER_CONFIG`. Nếu nhà
máy cần luồng đó, dev chỉnh giá trị mặc định trong `config.ts` (hoặc báo để bổ sung ô nhập
vào tab BarTender).

---

## 5. Giá trị mặc định nằm ở đâu trong code (cho Dev)

Khi muốn đổi mặc định cho **tất cả máy mới**, sửa các nơi sau:

| File | Hằng số / vị trí | Dùng cho |
|---|---|---|
| `src/main/config.ts` | `DEFAULT_API_CONFIG`, `DEFAULT_IMAGE_PATH`, `DEFAULT_ELASTICSEARCH_CONFIG`, `DEFAULT_THUMB_SERVER_CONFIG`, `DEFAULT_BARTENDER_CONFIG` → dùng trong `createDefaultConfig()` | **Nguồn chính** — tạo `config.encrypted` lần đầu |
| `src/renderer/App.tsx` | state `config` khởi tạo | Giá trị tạm trước khi load config |
| `src/renderer/components/Settings.tsx` | fallback trong `localConfig` | Pre-fill form Cấu hình API |
| `src/renderer/components/ImageSettings.tsx` | `DEFAULT_IMAGE_PATH`, `DEFAULT_THUMB` | Pre-fill form Hình ảnh |

> Lưu ý: `config.ts` là **nguồn quyết định** cho máy mới. Các file renderer chỉ là giá trị
> hiển thị tạm / pre-fill.

---

## 6. File cấu hình & cách reset

- **Vị trí file** (mã hoá AES-256): `app.getPath('userData')/config.encrypted`
  - Dev (`npm run dev`): `~/Library/Application Support/isuccess-scan-barcode/config.encrypted`
  - Bản đóng gói: `~/Library/Application Support/iSuccess Scan Barcode/config.encrypted`
- **Cache thumbnail:** `…/userData/thumbs/` (có thể xoá an toàn để giải phóng dung lượng).
- **Reset về mặc định:** thoát app → xoá `config.encrypted` → mở lại app (app sẽ tự tạo
  config mặc định từ `config.ts`).
- Danh sách đơn đã quét lưu ở `localStorage` (key `scannedOrders`); tự xoá khi cấu trúc dữ
  liệu đổi (xem `ORDERS_STORAGE_VERSION` trong `App.tsx`).

---

## 7. Lưu ý vận hành

- Các server `172.26.207.206` (Thumbnail) và NAS `/Volumes/Designer ZenE` là **nội bộ**.
  Khi máy **không ở trong mạng nội bộ** (hoặc NAS chưa mount), ảnh có thể không tải được —
  đây là vấn đề mạng, không phải lỗi app.
- Khi sửa code trong `src/main/**` (api.ts, main.ts, config.ts…) phải **khởi động lại app**
  (`Ctrl+C` rồi `npm run dev`); sửa trong `src/renderer/**` chỉ cần **Cmd+R**.

---

## 8. Tóm tắt nhanh khi cài máy mới

1. Cài app → mở lên (app tự tạo cấu hình mặc định).
2. Đăng nhập tài khoản (để cập nhật trạng thái / Add to Inventory hoạt động).
3. Đảm bảo đang trong **mạng nội bộ** và NAS `/Volumes/Designer ZenE` đã mount.
4. (Nếu cần in) mở 🏷️ **BarTender** → bật + cấu hình máy in.
5. Quét thử 1 mã → kiểm tra ra đơn + hiện ảnh.

> Nếu không đổi gì, app dùng toàn bộ giá trị mặc định ở trên — không cần setup tay.
