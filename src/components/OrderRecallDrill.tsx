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
  group: "recipe" | "technique";
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

export function OrderRecallDrill({ order, peekCount }: { order: Order; peekCount: number }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [focusQuestionIds, setFocusQuestionIds] = useState<string[] | null>(null);
  const [attempt, setAttempt] = useState(1);

  const questions = useMemo<RecallQuestion[]>(() => {
    const baseIds = Object.keys(DRINKS) as BaseId[];
    const toppingIds = Object.keys(TOPPINGS) as ToppingId[];

    return [
      {
        id: "base",
        icon: "🫖",
        label: "Nền trà gì?",
        group: "recipe",
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
        group: "recipe",
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
        group: "recipe",
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
        group: "recipe",
        answer: String(order.sugar),
        choices: numericChoices(PERCENT_OPTIONS, order.sugar),
      },
      {
        id: "ice",
        icon: "🧊",
        label: "Bao nhiêu đá?",
        group: "recipe",
        answer: String(order.ice),
        choices: numericChoices(PERCENT_OPTIONS, order.ice),
      },
      {
        id: "fill",
        icon: "🫗",
        label: "Rót tới đâu?",
        group: "technique",
        answer: String(order.targetFill),
        choices: numericChoices(FILL_OPTIONS, order.targetFill),
      },
      {
        id: "shake",
        icon: "🌀",
        label: "Lắc mức nào?",
        group: "technique",
        answer: String(order.targetShake),
        choices: numericChoices(SHAKE_OPTIONS, order.targetShake),
      },
    ];
  }, [order]);

  const activeQuestions = focusQuestionIds
    ? questions.filter((question) => focusQuestionIds.includes(question.id))
    : questions;
  const answeredCount = activeQuestions.filter((question) => answers[question.id] !== undefined).length;
  const correctCount = submitted
    ? activeQuestions.filter((question) => answers[question.id] === question.answer).length
    : 0;
  const complete = answeredCount === activeQuestions.length;
  const score = submitted && activeQuestions.length
    ? Math.round((correctCount / activeQuestions.length) * 100)
    : 0;
  const incorrectIds = submitted
    ? activeQuestions.filter((question) => answers[question.id] !== question.answer).map((question) => question.id)
    : [];

  const recipeQuestions = activeQuestions.filter((question) => question.group === "recipe");
  const techniqueQuestions = activeQuestions.filter((question) => question.group === "technique");
  const recipeCorrect = submitted
    ? recipeQuestions.filter((question) => answers[question.id] === question.answer).length
    : 0;
  const techniqueCorrect = submitted
    ? techniqueQuestions.filter((question) => answers[question.id] === question.answer).length
    : 0;

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

  const resetAttempt = (ids: string[] | null) => {
    setAnswers({});
    setSubmitted(false);
    setFocusQuestionIds(ids);
    setAttempt((value) => value + 1);
  };

  return (
    <section className="recall-drill" aria-label="Mini game nhớ order">
      <div className="recall-head">
        <div>
          <span className="eyebrow">MEMORY DRILL · OPTIONAL</span>
          <h4>🧠 Nhớ được bao nhiêu chi tiết?</h4>
          <p>
            {focusQuestionIds
              ? "Đang luyện lại đúng những chi tiết vừa nhớ sai."
              : "Trả lời nhanh trước khi mở ticket lại. Kết quả này không ảnh hưởng điểm ly."}
          </p>
        </div>
        <div className="recall-progress" aria-label={`Đã trả lời ${answeredCount} trên ${activeQuestions.length}`}>
          <b>{answeredCount}/{activeQuestions.length}</b>
          <small>lần {attempt}</small>
        </div>
      </div>

      {focusQuestionIds && (
        <div className="recall-focus-banner">
          <span>🎯</span>
          <p><b>Focus practice</b><small>{activeQuestions.length} chi tiết cần củng cố</small></p>
          <button type="button" onClick={() => resetAttempt(null)}>Luyện full order</button>
        </div>
      )}

      {!submitted ? (
        <>
          <div className="recall-question-list">
            {activeQuestions.map((question, questionIndex) => (
              <fieldset className="recall-question" key={question.id}>
                <legend>
                  <span>{question.icon}</span>
                  <b>{questionIndex + 1}. {question.label}</b>
                  <i>{question.group === "recipe" ? "Công thức" : "Kỹ thuật"}</i>
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
            {complete ? "Chấm trí nhớ ✨" : `Còn ${activeQuestions.length - answeredCount} câu chưa chọn`}
          </button>
        </>
      ) : (
        <div className="recall-result" aria-live="polite">
          <div className="recall-score-column">
            <div className="recall-score-ring">
              <strong>{score}%</strong>
              <small>{correctCount}/{activeQuestions.length}</small>
            </div>
            <div className="recall-split-score">
              {recipeQuestions.length > 0 && (
                <span>🍹 {recipeCorrect}/{recipeQuestions.length}<small>công thức</small></span>
              )}
              {techniqueQuestions.length > 0 && (
                <span>🪄 {techniqueCorrect}/{techniqueQuestions.length}<small>kỹ thuật</small></span>
              )}
            </div>
          </div>

          <div className="recall-result-copy">
            <div className={`recall-integrity ${peekCount === 0 ? "pure" : ""}`}>
              {peekCount === 0 ? "🏅 No-peek memory" : `👀 ${peekCount} quick peek${peekCount > 1 ? "s" : ""}`}
            </div>
            <h4>{result.emoji} {result.label}</h4>
            <div className="recall-review">
              {activeQuestions.map((question) => {
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

            <div className="recall-result-actions">
              {incorrectIds.length > 0 && (
                <button type="button" className="recall-focus-retry" onClick={() => resetAttempt(incorrectIds)}>
                  🎯 Luyện lại {incorrectIds.length} câu sai
                </button>
              )}
              <button type="button" className="recall-retry" onClick={() => resetAttempt(null)}>
                Làm lại full order
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
