import { formatMoney, getCustomer, getRelationshipTier, replyToReview } from "../../game/engine";
import type { GameState, ReplyStyle } from "../../game/types";
import { RoomBackdrop } from "./RoomBackdrop";
import { ChibiPortrait } from "../ChibiCustomer";

interface Props {
  game: GameState;
  onGame: (state: GameState) => void;
  onReset: () => void;
}

const stars = (value: number) => "★".repeat(value) + "☆".repeat(5 - value);

export function ReviewsRoom({ game, onGame, onReset }: Props) {
  const average = game.reviews.length
    ? game.reviews.reduce((total, item) => total + item.stars, 0) / game.reviews.length
    : 0;
  const replyStyles: Array<{ id: ReplyStyle; emoji: string; label: string }> = [
    { id: "sweet", emoji: "💗", label: "Ngọt" },
    { id: "witty", emoji: "😌", label: "Duyên" },
    { id: "spicy", emoji: "🔥", label: "Cà khịa" },
  ];

  return (
    <section className="v6-room v6-reviews-room">
      <RoomBackdrop kind="reviews">
        <div className="v6-room-title">
          <small>SOCIAL DESK · REVIEWS</small>
          <h2>Điện thoại của tiệm</h2>
          <p>Đọc lời nhắn của khách và chọn cách trả lời để xây uy tín cho tiệm.</p>
        </div>

        <div className="v6-social-sticky v6-social-sticky-a">
          <span>💗</span><b>{game.reputation}</b><small>UY TÍN</small>
        </div>
        <div className="v6-social-sticky v6-social-sticky-b">
          <span>📱</span><b>{game.fans}</b><small>FOLLOWERS</small>
        </div>
        <div className="v6-social-sticky v6-social-sticky-c">
          <span>🔥</span><b>{game.viral}</b><small>VIRAL</small>
        </div>

        <div className="v6-phone">
          <div className="v6-phone-notch" />
          <div className="v6-phone-appbar">
            <div><span>🧋</span><b>@tiemtrachibi</b></div>
            <small>{game.reviews.length} posts</small>
          </div>

          <div className="v6-phone-rating">
            <strong>{average ? average.toFixed(1) : "—"}</strong>
            <div><span>{stars(Math.round(average))}</span><small>{game.stats.replies} replies</small></div>
          </div>

          <div className="v6-phone-feed">
            {game.reviews.length === 0 ? (
              <div className="v6-phone-empty">
                <span>🐰</span>
                <b>Inbox đang yên ắng</b>
                <p>Mở cửa và phục vụ khách để social của tiệm bắt đầu sống.</p>
              </div>
            ) : (
              game.reviews.map((review) => (
                <article className="v6-social-post" key={review.id}>
                  <div className="v6-post-avatar"><ChibiPortrait customer={getCustomer(review.customerId)} /></div>
                  <div>
                    <header><b>{review.customerName}</b><small>ngày {review.day}</small></header>
                    <span className="v6-post-stars">{stars(review.stars)} · {review.score}/100</span>
                    <p>{review.text}</p>
                    <small>{getRelationshipTier(game.customerBond[review.customerId] ?? 0).emoji} bond {game.customerBond[review.customerId] ?? 0}</small>
                    {review.replyText ? (
                      <div className="v6-owner-bubble">
                        <b>Chủ tiệm</b><p>{review.replyText}</p>
                      </div>
                    ) : (
                      <div className="v6-reply-row">
                        {replyStyles.map((style) => (
                          <button key={style.id} onClick={() => onGame(replyToReview(game, review.id, style.id))}>
                            <span>{style.emoji}</span>{style.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="v6-social-note">
          <span>NOTE</span>
          <p>💗 Ngọt → uy tín</p>
          <p>😌 Duyên → fan + viral</p>
          <p>🔥 Cà khịa → viral mạnh</p>
          <button onClick={onReset}>Chơi lại từ ngày 1</button>
        </div>

        <div className="v6-social-ledger">
          <small>DOANH THU LIFETIME</small>
          <b>{formatMoney(game.stats.revenue)}</b>
        </div>
      </RoomBackdrop>
    </section>
  );
}
