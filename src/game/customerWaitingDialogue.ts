import type { CustomerMood } from "./types";

/**
 * Authored counter dialogue tied to the *current* customer's patience.
 * No random calls or timers: reload and identical wait state show the same line.
 * Dialogue is flavor only; the existing queue clock controls actual tips/bonds.
 */
type WaitingLines = readonly [arrival: string, settled: string, watching: string, hurried: string, upset: string];

const waitingLines: Record<string, WaitingLines> = {
  miu: [
    "Mình tranh thủ ghé trước ca ở hiệu sách.",
    "Mùi trà thơm quá, mình chờ chút nhé.",
    "Mình còn phải mở quầy sách nữa.",
    "Mình sắp vào ca, còn lâu không bạn?",
    "Mình trễ ca ở hiệu sách mất rồi...",
  ],
  bo: [
    "Cho mình lấy trà trước giờ làm nhé!",
    "Hôm nay văn phòng hơi nhiều việc.",
    "Mình phải kịp chuyến xe đến công ty.",
    "Mình sắp muộn giờ làm rồi!",
    "Mình cần đi ngay, đợi lâu quá.",
  ],
  nana: [
    "Mình có một tiết dạy lát nữa.",
    "Mình chờ được, cứ pha đúng công thức nhé.",
    "Mình cần mang trà tới lớp đúng giờ.",
    "Sắp đến giờ vào lớp rồi bạn ơi!",
    "Mình lỡ giờ dạy mất rồi...",
  ],
  sunny: [
    "Mình vừa tìm được một góc vẽ gần hồ.",
    "Trà thơm ghê, chắc hợp buổi vẽ hôm nay.",
    "Nắng đẹp thế này không đợi lâu được.",
    "Mình còn muốn kịp ánh nắng ngoài hồ.",
    "Nắng sắp tắt mất rồi, mình phải đi.",
  ],
  chi: [
    "Mình ghé lấy trà rồi quay về trông shop.",
    "Ly trà đẹp là có ảnh xinh ngay!",
    "Shop mình đang có khách hẹn.",
    "Bạn làm nhanh giúp, shop mình sắp mở!",
    "Mình phải về shop rồi, đợi lâu quá.",
  ],
  khanh: [
    "Mình có lịch họp sau giờ nghỉ.",
    "Mình thích trà pha vừa vị, không vội đâu.",
    "Còn ít phút trước cuộc họp.",
    "Mình sắp đến giờ họp, nhanh giúp nhé!",
    "Cuộc họp bắt đầu rồi, mình phải đi.",
  ],
  lyly: [
    "Mình đang quay một video dạo phố.",
    "Đợi trà một chút, mình chọn góc quay đã.",
    "Mình cần kịp ánh sáng để quay.",
    "Sắp mất ánh sáng đẹp rồi!",
    "Trễ lịch quay mất rồi, tiếc quá.",
  ],
  duc: [
    "Cho mình ly trà tiếp sức chạy deadline!",
    "Mình kiểm tra nốt công việc trong lúc chờ.",
    "Deadline gần đến rồi.",
    "Nhanh giúp mình với, deadline đang dí!",
    "Mình phải chạy về làm ngay rồi.",
  ],
};

const fallback: WaitingLines = [
  "Cho mình gọi một ly trà nhé!",
  "Mình đợi một chút được.",
  "Không biết trà sắp xong chưa nhỉ?",
  "Mình hơi vội, nhanh giúp nhé!",
  "Mình đợi lâu quá, phải đi thôi.",
];

const moodIndex: Record<CustomerMood, number> = {
  delighted: 0,
  happy: 1,
  neutral: 2,
  restless: 3,
  upset: 4,
};

export function getCustomerWaitingLine(customerId: string, mood: CustomerMood): string {
  return (waitingLines[customerId] ?? fallback)[moodIndex[mood]];
}
