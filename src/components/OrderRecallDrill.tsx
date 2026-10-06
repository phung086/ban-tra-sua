import { useMemo, useState } from "react";
import {
  DRINKS,
  FILL_OPTIONS,
  PERCENT_OPTIONS,
  SHAKE_OPTIONS,
  TOPPINGS,
} from "../game/content";
import type { BaseId, Order, ToppingId } from "../game/types";

type RecallQuestion = {
  id: string;
  icon: string;
  label: string;
  answer: string;
  choices: Array<{ value: string; label: string }>;
};

function rotateChoices<T extends string>(items: T[], answer: T, count = 3): T[] {
  const index = Math.max(0, items.indexOf(answer));
  const picked = [answer];

  for (let offset = 1; picked.length < Math.min(count, items.length); offset += 1) {
    const candidate = items[(index + offset) % items.length];
    if (!picked.includes(candidate)) picked.push(candidate);
  }

  return picked.sort((a, b) => {
    const av = a.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const bv = b.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return av - bv;
  });
}

function numericChoices(values: readonly number[], answer: number) {
  return rotateChoices(values.map(String), String(answer), Math.min(4, values.length))
    .map((value) => ({ value, label: `${value}%` }));
}

export function OrderRecallDrill({ order }: { order: Order }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const questions = useMemo<RecallQuestion[]>(() => {
    const baseIds = Object.keys(DRINKS) as BaseId[];
    const toppingIds = Object.keys(TOPPINGS) as ToppingId[];

    return [
      {
        id: "base",
        icon: "🫖",
        label: "Nền trà gì?",
        answer: order.base,
        choices: rotateChoices(baseIds, order.base).map((id) => ({
          value: id,
          label: `${DRINKS[id].emoji} ${DRINKS[id].shortName}`,
        })),
      },
      {
        id: "size",
        icon: "🥤",
        label: "Size nào?",
        answer: order.size,
        choices: [
          { value: "M", label: "Size M" },
          { value: "L", label: "Size L" },
        ],
      },
      {
        id: "topping",
        icon: "🍮",
        label: "Topping gì?",
        answer: order.topping,
        choices: rotateChoices(toppingIds, order.topping).map((id) => ({
          value: id,
          label: `${TOPPINGS[id].emoji} ${TOPPINGS[id].name}`,
        })),
      },
      {
        id: "sugar",
        icon: "🍬",
        label: "Bao nhiêu đường?",
        answer: String(order.sugar),
        choices: numericChoices(PERCENT_OPTIONS, order.sugar),
      },
      {
        id: "ice",
        icon: "🧊",
        label: "Bao nhiêu đá?",
        answer: String(order.ice),
        choices: numericChoices(PERCENT_OPTIONS, order.ice),
      },
      {
        id: "fill",
        icon: "🫗",
        label: "Rót tới đâu?",
        answer: String(order.targetFill),
        choices: numericChoices(FILL_OPTIONS, order.targetFill),
      },
      {
        id: "shake",
        icon: "🌀",
        label: "Lắc mức nào?",
        answer: String(order.targetShake),
        choices: numericChoices(SHAKE_OPTIONS, order.targetShake),
      },
    ];
  }, [order]);

  const answeredCount = questions.filter((question) => answers[question.id] !== undefined).length;
  const correctCount = submitted
    ? questions.filter((question) => answers[question.id] === question.answer).length
    : 0;
  const complete = answeredCount === questions.length;
  const score = submitted ? Math.round((correctCount / questions.length) * 100) : 0;

  const result =
    score === 100
      ? { emoji: "🧠✨", label: "Nhớ order hoàn hảo" }
      : score >= 70
        ? { emoji: "🌷", label: "Trí nhớ khá chắc" }
        : { emoji: "📝", label: "Nên liếc ticket thêm một lần" };

  const answer = (questionId: string, value: string) => {
    if (submitted) return;
    setAnswers((current) => ({ ...current, [questionId]: value }));
  };

  const retry = () => {
    setAnswers({});
    setSubmitted(false);
  };

  return (
    <section className="recall-drill" aria-label="Mini game nhớ order">
      <div className="recall-head">
        <div>
          <span className="eyebrow">MEMORY DRILL · OPTIONAL</span>
          <h4>🧠 Nhớ được bao nhiêu chi tiết?</h4>
          <p>Trả lời nhanh trước khi mở ticket lại. Kết quả này không ảnh hưởng điểm ly.</p>
        </div>
        <div className="recall-progress" aria-label={`Đã trả lời ${answeredCount} trên ${questions.length}`}>
          <b>{answeredCount}/{questions.length}</b>
          <small>đã nhớ</small>
        </div>
      </div>

      {!submitted ? (
        <>
          <div className="recall-question-list">
            {questions.map((question, questionIndex) => (
              <fieldset className="recall-question" key={question.id}>
                <legend>
                  <span>{question.icon}</span>
                  <b>{questionIndex + 1}. {question.label}</b>
                </legend>
                <div className="recall-choices">
                  {question.choices.map((choice) => {
                    const selected = answers[question.id] === choice.value;
                    return (
                      <button
                        type="button"
                        className={selected ? "selected" : ""}
                        aria-pressed={selected}
                        key={choice.value}
                        onClick={() => answer(question.id, choice.value)}
                      >
                        {choice.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>

          <button
            type="button"
            className="recall-submit"
            disabled={!complete}
            onClick={() => setSubmitted(true)}
          >
            {complete ? "Chấm trí nhớ ✨" : `Còn ${questions.length - answeredCount} câu chưa chọn`}
          </button>
        </>
      ) : (
        <div className="recall-result" aria-live="polite">
          <div className="recall-score-ring">
            <strong>{score}%</strong>
            <small>{correctCount}/{questions.length}</small>
          </div>
          <div className="recall-result-copy">
            <h4>{result.emoji} {result.label}</h4>
            <div className="recall-review">
              {questions.map((question) => {
                const correct = answers[question.id] === question.answer;
                const selected = question.choices.find((choice) => choice.value === answers[question.id]);
                const expected = question.choices.find((choice) => choice.value === question.answer);
                return (
                  <div className={correct ? "correct" : "wrong"} key={question.id}>
                    <span>{correct ? "✓" : "!"}</span>
                    <p>
                      <b>{question.label}</b>
                      <small>{correct ? selected?.label : `${selected?.label ?? "—"} → ${expected?.label ?? question.answer}`}</small>
                    </p>
                  </div>
                );
              })}
            </div>
            <button type="button" className="recall-retry" onClick={retry}>Làm lại memory drill</button>
          </div>
        </div>
      )}
    </section>
  );
}
