---
name: html-motion
description: Thêm animation sống động (mặc định mức expressive) cho web HTML, CSS, JavaScript thuần — không React, không framework — theo nguyên tắc chuyển động của Animate UI, dùng token CSS (spring bằng linear(), curve, scale, blur) và helper Web Animations API kèm sẵn. Dùng skill này mỗi khi người dùng muốn làm động, thêm hiệu ứng, chuyển cảnh, hover, nhấn nút, xuất hiện khi cuộn, modal, dropdown, tabs, accordion, toast, đếm số, chuyển trang, hoặc nói "cho web sinh động / mượt / hiện đại hơn", "làm animation", "hiệu ứng", "animate", kể cả khi không nói chữ "animation", miễn là dự án là file .html/.css/.js thuần. Trả lời bằng tiếng Việt.
---

# HTML Motion

Mang nguyên tắc chuyển động của Animate UI sang web HTML/CSS/JS thuần: gần như mọi thứ chạy trên **spring**, mỗi vai trò có **một token**, tween chọn curve theo việc phần tử đang làm. Mặc định ở mức **expressive**: nảy rõ, có blur khi xuất hiện, có stagger, có khoảnh khắc "delight" — nhưng vẫn mạch lạc và không bao giờ bắt người dùng chờ.

**Luôn trả lời, giải thích và báo cáo kết quả bằng tiếng Việt.** Tên biến, class, comment trong code có thể tiếng Anh hoặc tiếng Việt theo phong cách sẵn có của dự án.

## 1. Cài vào dự án

Skill có hai file dùng ngay:

- `assets/motion.css` — token (`--spring-*`, `--ease-*`, `--dur-*`, `--scale-*`, `--shift-*`, `--blur-*`, `--tempo`) + class tiện ích `.m-press`, `.m-card`, `.m-reveal` + xử lý reduced motion.
- `assets/motion.js` — `window.Motion`: `animate`, `enter`, `exit`, `originFrom`, `reveal`, `stagger`, `swap`, `counter`, `slideTo`, `disclose`, `transition`, `loopWhenVisible`, `setTempo`.

Lần đầu trong một dự án: copy hai file vào thư mục CSS/JS sẵn có của dự án (đọc cấu trúc trước: `css/`, `assets/css/`, `styles/`… — theo cái đang có, không tạo cấu trúc mới nếu đã có), rồi thêm vào mọi trang:

```html
<link rel="stylesheet" href="css/motion.css">   <!-- trước CSS của trang -->
<script src="js/motion.js" defer></script>        <!-- trước script của trang -->
```

Nếu dự án đã có `motion.css`/`motion.js` thì dùng lại, không copy đè (người dùng có thể đã chỉnh token). Script của trang phải chạy sau `motion.js` (cùng `defer`, đặt sau; hoặc trong `DOMContentLoaded`).

Không cần cài gì. Không thêm thư viện (GSAP, anime.js, Motion…) trừ khi người dùng yêu cầu — token + WAAPI đủ cho mọi recipe.

## 2. Đọc đúng tài liệu

| Yêu cầu                                                    | Làm gì                                                          |
| ---------------------------------------------------------- | --------------------------------------------------------------- |
| Một thành phần cụ thể (nút, card, modal, tabs, quiz…)      | `references/recipes.md`, mục tương ứng                          |
| "Làm cả trang sinh động", trang mới                        | § 4 Kế hoạch trang, rồi recipes                                 |
| Cảm giác bằng lời ("nhanh hơn", "mềm hơn", "nảy hơn")      | § 6 Cảm giác                                                    |
| Cần spring mới                                              | `node scripts/spring.mjs <stiffness> <damping>`                 |
| Rà soát animation có sẵn, tìm chỗ giật/chậm                | § 7 Rà soát                                                     |

## 3. Mức độ

Mặc định **expressive** — không hỏi lại mức, cứ làm. Chỉ hạ mức khi người dùng nói ("nhẹ thôi", "tinh tế", "đừng lòe loẹt") hoặc theo cổng tần suất bên dưới.

| Mức        | Khác biệt                                                                                                 |
| ---------- | --------------------------------------------------------------------------------------------------------- |
| subtle     | `--spring-dialog`/`--spring-press` thay `--spring-bounce`; bỏ blur entrance; shift 8px; không stagger từ chữ |
| more       | như expressive nhưng `--blur-enter: 4px`, không delight, không hiệu ứng theo con trỏ                       |
| expressive | token mặc định của `motion.css` và preset của `motion.js`                                                 |

### Cổng tần suất (vẫn áp dụng ở mức expressive)

Expressive ở chỗ hiếm gặp, nhanh ở chỗ dùng cả ngày:

| Tần suất dùng                                                     | Chuyển động                                                                        |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Liên tục (nhấn nút, tooltip, menu, tabs, toggle, hover)           | Nhanh: `--spring-press`, `--spring-pop`, preset `menu`; hover không scale          |
| Thỉnh thoảng (popover, modal, sheet, toast, accordion)            | Token của vai trò: `dialog`, `sheet`, `toast`, `disclose`                           |
| Hiếm (hero, thống kê, thành công, hoàn thành bài, huy hiệu)       | Đầy đủ expressive: `--spring-bounce`, `--spring-delight`, stagger, blur, chữ từng từ |
| Bật bằng phím tắt cả ngày (ô tìm kiếm ⌘K)                         | Fade + scale nhẹ trên `--dur-menu`, không stagger, không chờ                       |

Mỗi chuyển động phải gọi tên được mục đích bằng một từ: feedback, không gian, trạng thái, liên tục, delight. Khi người dùng yêu cầu mở ("làm web sinh động hơn") mà không gọi tên được → không animate chỗ đó.

## 4. Kế hoạch cho cả trang

Khi được yêu cầu "làm cả trang/web sinh động":
1. Đọc các file HTML/CSS/JS liên quan. Liệt kê thành phần: hero, nav, nút, card, section, form, modal, số liệu…
2. Gán mỗi thành phần một recipe + mức theo cổng tần suất.
3. Thêm `motion.css`/`motion.js` (§ 1), rồi áp dụng. Ưu tiên thêm class (`m-press`, `m-card`, `m-reveal`, `data-stagger`) hơn viết JS mới.
4. Hero chạy bằng CSS animation (không chờ JS); phần dưới màn hình đầu dùng `.m-reveal`.
5. Web nhiều trang: thêm chuyển trang View Transitions (recipe 13).

## 5. Quy tắc (chất lượng — bắt buộc)

1. **Chỉ animate `transform`, `opacity`, `filter`** (và `clip-path`). Không animate `width`, `left`, `top`, `margin`. Ngoại lệ: `height` cho accordion (`Motion.disclose`), kích thước thanh chỉ báo tabs (`Motion.slideTo`).
2. **Mọi giá trị từ token.** Không gõ tay `300ms`, `cubic-bezier(...)` hay spring lạ cho một vai trò token đã có. Khoảng cách/scale riêng của một recipe được giữ như viết.
3. **Không bao giờ ease-in** cho thứ đi vào hoặc rời đi (trừ `--ease-dismiss` khi đóng dialog/sheet). Không ease-in-out cho entrance. Ease-out cho vào/ra, `--ease-out-soft` cho thứ mắt nhìn mở ra, `--ease-in-out` cho thứ di chuyển trên màn hình, `--ease-color` cho màu.
4. **Exit nhanh hơn entrance** (`--dur-exit`) và là bản ngược của entrance.
5. **Reduced motion đi kèm mỗi animation.** CSS: khối `@media (prefers-reduced-motion: reduce)`. JS: đi qua `Motion.animate/enter/exit` (tự bỏ transform, giữ opacity). Animation tự viết bằng `el.animate()` hoặc rAF phải tự kiểm tra `Motion.reduced()`. Mọi thứ vẫn hiện ra/biến mất, chỉ không di chuyển.
6. **Popup mọc từ trigger** (`Motion.originFrom`); modal luôn ở giữa.
7. **Nhấn = scale 0.96 trên spring** (0.985 cho cả card); phần tử đang nhấn không scale khi hover. Hover đổi màu/nền/viền/bóng; card có thể nâng vài px; ảnh trong card bị clip có thể zoom.
8. **Hover chỉ cho chuột thật**: `@media (hover: hover) and (pointer: fine)`.
9. **Bàn phím chuyển động giống con trỏ**: Enter/Space/phím mũi tên gọi cùng hàm như click. Giữ `:focus-visible` rõ ràng.
10. **Bấm lại giữa chừng thì retarget**, không giật về đầu — `Motion.animate` lo việc này; CSS transition cũng tự làm được.
11. **Không gì bị kéo giãn**: chữ đổi thì mờ/blur/trượt, không scale chữ; số dùng `font-variant-numeric: tabular-nums`; nút đổi chữ giữ `min-width`.
12. **Mọi phần đổi trạng thái đều chuyển động**: mũi tên ▾ xoay, icon đổi, màu đổi — không có phần nào "nhảy" tức thì cạnh phần đang animate.
13. **Vòng lặp tạm dừng khi khuất màn hình** (`Motion.loopWhenVisible`).
14. **Nội dung chính màn hình đầu không bị ẩn chờ JS**: dùng CSS animation; `.m-reveal` có sẵn fallback `html:not(.m-js)` để trang không trắng khi JS lỗi.
15. **Giữ semantics & a11y**: `aria-expanded`, `aria-controls`, `aria-live` cho toast, `role` cho tabs; chữ tách từng từ phải có `aria-label` trên phần tử cha và `aria-hidden` trên các span.

Quy tắc phong cách (mặc định, có thể đổi khi người dùng muốn và ghi rõ trong báo cáo): độ nảy, khoảng shift, lượng blur, stagger.

## 6. Cảm giác & nhịp

- "Nhanh hơn / chậm hơn" cho **cả web** → `--tempo` trong `motion.css` (hoặc `Motion.setTempo`): một bước = `0.85`/`1.15`, "nhiều" = `0.7`/`1.3`, giữ trong `0.5–2`. Hỏi lại lần nữa → thêm một bước.
- Cho **một thành phần**: đổi sang token khác cùng họ (bounce → pop: gọn hơn; pop → bounce: nảy hơn; dialog: êm, gần như không vượt).
- "Nảy hơn" mà token có sẵn chưa đủ → sinh spring mới: `node scripts/spring.mjs 300 14` (stiffness thấp = chậm, damping thấp = nảy nhiều), thêm thành token mới trong `motion.css` (`--spring-<tên>` + `--dur-<tên>` lấy đúng duration script in ra). Không gõ tay curve.
- Trình duyệt không hỗ trợ `linear()` (cũ hơn Chrome 113 / Safari 17.2 / Firefox 112): `motion.js` tự lùi về `--ease-out`; CSS cần một dòng fallback trước khi dùng spring trong transition nếu dự án phải hỗ trợ trình duyệt cũ.

## 7. Rà soát animation có sẵn

Đọc CSS/JS, tìm: `transition: all`, animate `width/height/top/left/margin`, `ease-in` khi vào, duration > 400ms cho thứ dùng liên tục, hover scale trên nút, thiếu `prefers-reduced-motion`, `setInterval` animation, vòng lặp chạy khi khuất, `transition` gõ tay lẽ ra dùng token. Báo cáo dạng `file:dòng — vấn đề — cách sửa`, rồi sửa nếu được yêu cầu.

## 8. Kiểm tra

Có trình duyệt: mở trang, xem khung hình giữa animation (DevTools > Animations, tốc độ 10%), bật giả lập `prefers-reduced-motion: reduce`, bấm hai lần liên tiếp để xem retarget, dùng bàn phím. Không có trình duyệt: kiểm tra bằng mắt đọc — mọi giá trị từ token, mọi animation có đường reduced motion, không animate thuộc tính layout, `motion.js` được nạp trước script dùng `Motion` — và nói rõ trong báo cáo là chưa chạy trên trình duyệt.

## 9. Báo cáo (tiếng Việt)

Sau khi sửa code, báo ngắn gọn:
- **File đã thêm/sửa** (và nơi đặt `motion.css`/`motion.js` nếu mới thêm).
- **Mức** (expressive mặc định, hay mức người dùng chọn) và chỗ nào cổng tần suất làm chuyển động gọn hơn, vì sao.
- **Recipe & token** đã dùng cho từng thành phần.
- **Quy tắc phong cách đã đổi** (nếu có) và lý do.
- **Đã kiểm tra thế nào** (trình duyệt hay chỉ đọc code).
