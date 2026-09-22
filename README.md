# 🌸 Bloomix

**Bloomix** là một dự án cá nhân — ứng dụng trợ lý AI giúp gợi ý và thiết kế bó hoa, kết hợp giữa một scoring engine tự xây dựng (deterministic) và khả năng tư vấn thiết kế từ Gemini AI.

## Giới thiệu

Bloomix nhận đầu vào là dịp tặng hoa, phong cách mong muốn, loại hoa yêu thích... rồi tính toán và đề xuất các bó hoa phù hợp dựa trên hệ thống chấm điểm (màu sắc, phong cách, độ tương thích), đồng thời sử dụng Gemini để tư vấn thêm về mặt thẩm mỹ.

Đây là dự án t tự làm để học và thực hành, đang trong quá trình phát triển và cải thiện dần.

## Công nghệ sử dụng

- React + TypeScript (Vite)
- Google Gemini API
- Deterministic scoring engine (tự viết)

## Trạng thái

🚧 Đang phát triển — một số tính năng có thể chưa hoàn thiện.

## Chạy thử local

```bash
npm install
npm run dev
```

Cần tạo file `.env` (dựa theo `.env.example`) và điền Gemini API key của bạn.
