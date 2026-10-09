import type { CustomerMood } from "./types";

type Lines = readonly [great: string, okay: string, poor: string, late: string];

const lines: Record<string, Lines> = {
  miu: ["Đúng vị quá! Mình mang về hiệu sách uống lúc nghỉ trưa.", "Thơm đấy, nhưng lần sau mình muốn vị trà rõ hơn.", "Hình như ly này khác món mình gọi. Bạn xem lại giúp nhé?", "Mình còn ca ở hiệu sách, lần sau giúp mình nhanh hơn nha."],
  bo: ["Đúng gu! Cầm ly này đi làm là tỉnh cả buổi.", "Uống được, nhưng đường đá chưa đúng gu mình lắm.", "Công thức hơi lệch rồi, mình đang vội nên đành mang đi.", "Mình sắp muộn giờ làm, lần sau nhanh hơn chút nhé!"],
  nana: ["Topping đúng rồi, vị cũng vừa. Mình thích lắm!", "Tạm ổn, nhưng vị vẫn cần cân lại một chút.", "Mình có dặn kỹ món này mà, bạn xem lại phiếu nhé.", "Sắp đến giờ dạy rồi, mình phải đi ngay đây."],
  sunny: ["Vị nhẹ nhàng ghê, đúng kiểu chiều ngồi vẽ.", "Cũng chill đấy, chỉ thiếu một chút cân bằng.", "Hơi khác món mình tưởng tượng, lần sau thử lại nhé.", "Mình còn hẹn vẽ ngoài hồ, đợi lâu quá mất nắng rồi."],
  chi: ["Ly này xinh mà còn ngon nữa, thích ghê!", "Trông xinh rồi, chỉnh vị thêm chút là hoàn hảo.", "Nhìn dễ thương nhưng vị hơi lạ, tiệm xem lại nhé.", "Mình còn phải về trông shop, lần sau nhanh hơn nha."],
  khanh: ["Đậm trà vừa đủ. Mình sẽ nhớ công thức này.", "Khá ổn, nhưng mình thích vị trà rõ hơn.", "Hôm nay vị chưa tới, bạn xem lại tỷ lệ pha nhé.", "Mình đợi hơi lâu, lần sau giữ nhịp phục vụ nhé."],
  lyly: ["Ly lên hình đẹp quá, vị cũng đáng quay một đoạn.", "Màu đẹp đó, còn vị thì cần cân lại chút.", "Màu xinh nhưng uống chưa đúng món mình đặt.", "Mình còn lịch quay tiếp, đợi lâu là trễ ánh sáng mất."],
  duc: ["Đúng vị! Giờ mình có sức xử lý deadline rồi.", "Ổn đấy, nhưng mình cần vị đậm hơn chút.", "Mình gọi món khác cơ, bạn kiểm tra ticket nhé.", "Deadline đang dí rồi, lần sau cho mình lấy nhanh hơn nhé."],
};

const fallback: Lines = [
  "Ngon quá, cảm ơn tiệm nhé!",
  "Cảm ơn bạn, lần sau mình thử vị khác nhé.",
  "Ly này chưa đúng ý mình lắm, lần sau chú ý hơn nhé.",
  "Cảm ơn nhé, nhưng mình đã đợi hơi lâu rồi.",
];

/** Pure, authored feedback; never rerolls or mutates customer memory. */
export function getCustomerDeliveryLine(
  customerId: string,
  score: number,
  serviceMood: CustomerMood = "neutral",
): string {
  const options = lines[customerId] ?? fallback;
  if (score < 65) return options[2];
  if (serviceMood === "restless" || serviceMood === "upset") return options[3];
  return score >= 90 ? options[0] : options[1];
}

export function getDeliveryReactionMood(
  score: number,
  serviceMood: CustomerMood = "neutral",
): CustomerMood {
  if (score < 65) return "upset";
  if (serviceMood === "upset" || serviceMood === "restless") return "restless";
  return score >= 90 ? "delighted" : score >= 80 ? "happy" : "neutral";
}
