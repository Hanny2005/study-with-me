# html-motion

Agent Skill giúp Claude làm animation cho web **HTML, CSS, JavaScript thuần** theo nguyên tắc chuyển động của [Animate UI](https://animate-ui.com): spring, token cho từng vai trò, exit nhanh hơn entrance, tôn trọng giảm chuyển động. Mặc định ở mức **expressive** và trả lời bằng **tiếng Việt**.

Trang Study With Me trong repo này được làm bằng skill này.

## Skill làm gì

Khi bạn nhờ Claude "làm trang sinh động hơn", "thêm hiệu ứng cho nút", "cho card xuất hiện khi cuộn"… trong một dự án HTML/CSS/JS thuần, Claude sẽ:

1. Thêm `motion.css` và `motion.js` vào dự án (hoặc dùng lại nếu đã có).
2. Chọn recipe phù hợp cho từng thành phần: nút, card, hero, dropdown, modal, tabs, accordion, toast, đếm số, quiz, thanh tiến độ, chuyển trang…
3. Chỉnh mức chuyển động theo tần suất dùng: thứ dùng cả ngày thì nhanh gọn, khoảnh khắc hiếm (hoàn thành, thành công) thì nảy và rực rỡ.
4. Kiểm tra theo 15 quy tắc chất lượng và báo lại bằng tiếng Việt: file đã sửa, recipe và token đã dùng, đã kiểm tra thế nào.

## Cài đặt

**Claude (claude.ai / ứng dụng):** mở file [`html-motion.skill`](../html-motion.skill) trong một cuộc trò chuyện với Claude và bấm **Save skill**, hoặc nén thư mục `html-motion` thành `.zip` rồi tải lên phần Skills trong cài đặt của Claude.

**Claude Code:** chép thư mục vào `~/.claude/skills/html-motion/` (dùng cho mọi dự án) hoặc `.claude/skills/html-motion/` trong một dự án.

Sau đó chỉ cần nhắn như bình thường, ví dụ:

> Làm trang chủ sinh động hơn, hero xuất hiện từng chữ, card nảy khi hover.

## Cấu trúc

```
html-motion/
├── SKILL.md              hướng dẫn cho Claude: khi nào dùng, quy trình, quy tắc, cách báo cáo
├── assets/
│   ├── motion.css        token: --spring-*, --ease-*, --dur-*, --scale-*, --shift-*, --blur-*, --tempo
│   └── motion.js         window.Motion: animate, enter, exit, reveal, stagger, swap, counter,
│                         slideTo, disclose, transition, loopWhenVisible, setTempo…
├── references/
│   └── recipes.md        15 recipe có sẵn HTML + CSS + JS
└── scripts/
    └── spring.mjs        sinh CSS linear() từ thông số lò xo
```

## Dùng không cần Claude

`motion.css` và `motion.js` là file bình thường, dùng thẳng được:

```html
<link rel="stylesheet" href="css/motion.css">
<script src="js/motion.js" defer></script>
```

```html
<!-- Nút có phản hồi khi nhấn -->
<button class="m-press">Bắt đầu</button>

<!-- Card nâng lên khi hover -->
<a class="m-card" href="#">…</a>

<!-- Xuất hiện lần lượt khi cuộn tới -->
<section data-stagger>
  <div class="m-reveal">…</div>
  <div class="m-reveal">…</div>
</section>
```

```js
document.addEventListener('DOMContentLoaded', () => {
  Motion.reveal();                               // kích hoạt .m-reveal
  Motion.enter(menu, 'menu');                    // hiện popup (preset: popover, menu, dialog, sheet, toast, rise, pop)
  Motion.exit(menu, 'menu');                     // ẩn, đặt hidden khi xong
  Motion.swap(label, (el) => (el.textContent = 'Đã lưu'));   // đổi nội dung tại chỗ
  Motion.counter(stat, 12500);                   // đếm số
  Motion.slideTo(indicator, activeTab);          // thanh trượt cho tabs
  Motion.disclose(panel, true);                  // mở accordion
});
```

### Token chính

| Token | Dùng cho |
| --- | --- |
| `--spring-press` | Nhấn nút (gọn, vượt 3.7%) |
| `--spring-pop` | Menu, popover, tabs, chip (vượt 10%) |
| `--spring-dialog` | Modal, sheet, panel lớn (êm, vượt 3%) |
| `--spring-bounce` | Xuất hiện biểu cảm, card, toast (vượt 13%) |
| `--spring-delight` | Thành công, huy hiệu, khoảnh khắc hiếm (vượt 14.5%, dài) |
| `--ease-out` / `--ease-out-soft` | Thứ đi vào, đi ra / thứ mắt nhìn mở ra |
| `--ease-in-out` | Thứ di chuyển trên màn hình |
| `--tempo` | Nhân toàn bộ thời lượng: `0.85` nhanh hơn, `1.15` chậm hơn |

### Tạo spring mới

```bash
node scripts/spring.mjs 300 14     # stiffness 300, damping 14
# duration: 989ms  overshoot: 24.8%
# linear(0, 0.09, ...)
```

Dán kết quả thành token mới trong `motion.css` (`--spring-<tên>` và `--dur-<tên>`).

## Quy tắc chính

- Chỉ animate `transform`, `opacity`, `filter` (ngoại lệ: chiều cao accordion, kích thước thanh tabs).
- Mọi giá trị lấy từ token, không gõ tay thời gian hay curve.
- Không dùng ease-in cho thứ xuất hiện; exit nhanh hơn entrance.
- Mỗi animation đều có đường cho `prefers-reduced-motion`.
- Hover chỉ áp dụng cho chuột thật; bàn phím chuyển động giống chuột.
- Nội dung chính ở màn hình đầu không bị ẩn chờ JavaScript.

Danh sách đầy đủ trong [SKILL.md](SKILL.md).

## Ghi chú

Skill lấy cảm hứng từ nguyên tắc chuyển động của Animate UI; không chứa mã nguồn của Animate UI và không phụ thuộc thư viện nào.
