# Quy trình một vòng phát triển

Áp dụng từ 08/10/2026 theo yêu cầu chủ dự án. Mỗi vòng bắt đầu bằng **một prompt cụ thể**, chủ dự án phản hồi, rồi mới thực hiện phạm vi vòng đó. [Lộ trình](production-roadmap.md) là nguồn ưu tiên; [prompt đang chờ](next-step-prompt.md) là công việc tiếp theo.

## Trước khi sửa

1. Đọc phản hồi mới và chốt một kết quả có thể nghiệm thu; ghi rõ phạm vi và các tiêu chí. Tự xử lý lựa chọn kỹ thuật thông thường trong phạm vi đã giao.
2. `git status --short`, `git fetch origin --prune`, xác nhận branch và SHA remote. Kiểm tra thay đổi mới trên Git; bảo toàn thay đổi của người dùng. Nếu source chưa push, báo riêng trạng thái này, không gọi là bản đã kiểm thử trên Git.
3. Tìm đúng file bằng `rg --files`/`rg -n`; đọc phần liên quan. Chạy baseline cần thiết và production preview; ghi SHA, engine, chất lượng, viewport và thiết bị của phép đo. Không mở thêm chức năng khi chưa hoàn tất mục tiêu.

## Thực hiện và kiểm chứng

4. Sửa từng phần, giữ luồng tiệm và save chơi được. Với tối ưu, đo cùng scene/route/camera, warm-up rồi ghi một khoảng mẫu; so sánh P50/P95 và workload. Ghi rõ cache lạnh/ấm, giới hạn FPS và công cụ đo.
5. Chạy test phù hợp với logic thay đổi; toàn bộ `npm test` và `npm run build` trước khi push. Test phải kiểm hành vi/invariant, không chỉ sao chép implementation.
6. Chạy build production và thao tác UI thật: mobile dọc 360×800, 390×844; ngang 844×390; desktop. Kiểm núm tròn, vuốt camera, modal, va chạm, nhiệm vụ và pha trà theo phạm vi. Lưu ảnh/trace/log; ghi rõ điều chưa kiểm được, đặc biệt máy thật và đa chạm.
7. Đồ họa cần xem ảnh trực tiếp ở gần/xa và khi chuyển động. Nhạc cần nghe trực tiếp ở vòng audio. Không dùng unit test để thay thế các bước này.

## Đóng vòng

8. Kiểm tra diff, dữ liệu nhạy cảm và giấy phép asset; commit code cùng báo cáo có thể tái lập, push nhánh `codex/…`. Không push lỗi đã biết là chặn build/gameplay.
9. Xác nhận SHA remote đúng commit và CI của SHA đó xanh. Không dùng CI của commit trước để xác nhận commit mới. Khi tạo PR phải gắn PR vào chat; merge/deploy theo phạm vi người dùng đã giao.
10. Cập nhật trạng thái mốc và `docs/next-step-prompt.md`. Trả lời ngắn: link/SHA, test/CI, kết quả thực tế, giới hạn còn lại có ảnh hưởng, **đúng một prompt tiếp theo**. Chủ dự án có thể đáp “thực hiện” hoặc điều chỉnh prompt.

## Nội dung báo cáo từng vòng

Lưu tại `docs/iterations/<moc>-<vong>.md`: source SHA đầu vòng; vấn đề và tiêu chí; thay đổi; lệnh/cách chạy; bảng trước/sau; ảnh cùng góc; test/CI; thiết bị thực tế; giới hạn; bước tiếp. Báo cáo nằm trong commit được kiểm chứng nên không tự ghi SHA commit chứa chính nó; tham chiếu source baseline và link CI được trả ở cuối vòng.

Chỉ gọi một tiêu chí “đạt” khi có bằng chứng. Chưa có điện thoại yếu thì đánh dấu cổng thiết bị thật chưa đạt, tiếp tục công việc độc lập có ích và chuẩn bị bản kiểm thử cho người dùng. Không tự kết luận production hoàn tất vì build xanh.


## Bổ sung cho kế hoạch Living City dài hạn (không thay đổi M1.1)

Mỗi AI tham gia phải đọc [Game Design Bible](game-design/README.md) và [AI delivery playbook](game-design/ai-delivery-playbook.md) **sau khi** đọc roadmap/protocol/next-step. `docs/game-design/` là đặc tả mục tiêu tương lai, **không phải bằng chứng gameplay đã triển khai**. Từ chối tiến hành một day pack `LC-DNN` nếu day director, save migration, zone và gates trước chưa đạt. Cần phân biệt status `PLAN` / `IMPLEMENTED_UNVERIFIED` / `MEASURED` / `BLOCKED` / `ACCEPTED`, giữ seed và content hashes khi đo. Không xóa hoặc ghi đè `next-step-prompt.md` bằng prompt LC khi M1.1 chưa nghiệm thu.
