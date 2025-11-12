import React, { useState } from "react";

type GadResult = {
  range: string;
  level: string;
  description: string;
};

const GAD7: React.FC = () => {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [score, setScore] = useState<number | null>(null);

  const questions = [
    { id: 1, text: "초조하거나, 불안하거나, 조마조마하게 느꼈다." },
    { id: 2, text: "걱정을 멈추거나 조절하기 어려웠다." },
    { id: 3, text: "여러 가지 일을 지나치게 걱정했다." },
    { id: 4, text: "편히 앉아 있기가 어려울 정도로 안절부절못했다." },
    { id: 5, text: "쉽게 짜증이 나거나, 참을성이 없었다." },
    { id: 6, text: "무언가 끔찍한 일이 일어날 것 같아 두려웠다." },
    { id: 7, text: "긴장되거나, 신경이 곤두서 있는 느낌이 자주 들었다." },
  ];

  const options = [
    "전혀 방해 받지 않았다",
    "며칠 동안 방해 받았다",
    "2주중 절반 이상 방해 받았다",
    "거의 매일 방해 받았다",
  ];

  const scoreMap: Record<string, number> = {
    "전혀 방해 받지 않았다": 0,
    "며칠 동안 방해 받았다": 1,
    "2주중 절반 이상 방해 받았다": 2,
    "거의 매일 방해 받았다": 3,
  };

  const handleChange = (questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const getResult = (total: number): GadResult => {
    if (total <= 4) {
      return {
        range: "0–4점 (불안 증상이 거의 없음)",
        level: "정상 ~ 경미한 수준",
        description:
          "현재 GAD-7 점수만 보면 불안 증상이 크지 않은 편일 수 있어요. " +
          "다만 긴장이나 걱정이 전혀 없어야 한다는 뜻은 아니고, 일상적으로 느낄 수 있는 수준일 수 있어요.",
      };
    }
    if (total <= 9) {
      return {
        range: "5–9점 (경도 불안)",
        level: "가벼운 불안",
        description:
          "가벼운 수준의 불안이 느껴지는 구간이에요. 요즘 스트레스 상황이 많다면 자연스러운 반응일 수도 있지만, " +
          "불안 때문에 잠이 어렵거나, 집중이 힘들어진다면 조금씩 조절 전략을 연습해 보는 것이 도움이 될 수 있어요.",
      };
    }
    if (total <= 14) {
      return {
        range: "10–14점 (중등도 불안)",
        level: "중간 정도의 불안",
        description:
          "중등도 수준의 불안이 나타나는 점수예요. 걱정과 긴장이 일상생활, 공부, 대인관계에 영향을 줄 수 있는 수준이라, " +
          "가능하면 정신건강의학과나 상담센터와 같은 전문 기관과 상의해 보는 것을 권장해요.",
      };
    }
    return {
      range: "15–21점 (중증 불안)",
      level: "중증 불안 가능성",
      description:
        "꽤 강한 수준의 불안이 지속되고 있을 가능성이 있어요. 몸의 긴장, 두근거림, 숨 막히는 느낌, 끊이지 않는 걱정 등으로 매우 지칠 수 있는 상태예요. " +
        "혼자서 버티기보다는 가능한 빨리 전문가에게 도움을 요청하는 것이 안전해요.",
    };
  };

  const handleSubmit = () => {
    const allAnswered = questions.every((q) => answers[q.id]);
    if (!allAnswered) {
      alert("모든 문항에 응답해 주세요.");
      return;
    }

    const total = questions.reduce((sum, q) => {
      const selected = answers[q.id];
      const value = scoreMap[selected] ?? 0;
      return sum + value;
    }, 0);

    setScore(total);
  };

  const result = score !== null ? getResult(score) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-100 via-white to-purple-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl bg-white/90 backdrop-blur rounded-3xl shadow-xl border border-white/60 px-6 py-8 sm:px-10 sm:py-10">
        <header className="mb-6 sm:mb-8">
          <p className="text-s font-semibold text-indigo-500 uppercase tracking-[0.25em]">
            GAD-7
          </p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
            일반화된 불안장애 척도-7 (GAD-7)
          </h1>
          <p className="mt-3 text-sm text-slate-700 whitespace-pre-line leading-relaxed">
            지난 2주 동안 아래 문제들로 인해 얼마나 자주 방해를 받으셨습니까?
            {"\n"}
            해당하는 빈도를 선택해 주세요.
          </p>
        </header>

        <div className="space-y-4 sm:space-y-5">
          {questions.map((q) => (
            <div
              key={q.id}
              className="border border-slate-100 rounded-2xl bg-slate-50/80 px-4 py-4 sm:px-6 sm:py-5"
            >
              <p className="font-semibold text-sm sm:text-base text-slate-900">
                {q.id}. {q.text}
              </p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                {options.map((opt) => (
                  <label
                    key={opt}
                    className="inline-flex items-center space-x-2 text-sm text-slate-800"
                  >
                    <input
                      type="radio"
                      name={`gad7-q${q.id}`}
                      value={opt}
                      checked={answers[q.id] === opt}
                      onChange={() => handleChange(q.id, opt)}
                      className="h-4 w-4 accent-indigo-500"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 sm:mt-8 flex justify-center">
          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex items-center justify-center px-6 sm:px-8 py-2.5 sm:py-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm sm:text-base font-semibold shadow-md hover:shadow-lg hover:brightness-105 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            결과 확인하기
          </button>
        </div>

        {score !== null && result && (
          <div className="mt-8 sm:mt-10 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 px-5 py-4 sm:px-6 sm:py-5">
            <p className="text-sm sm:text-base font-semibold text-indigo-900">
              당신의 총 점수는{" "}
              <span className="font-bold">{score}</span>점 입니다.
            </p>
            <p className="mt-1 text-sm sm:text-base text-slate-800">
              <span className="font-semibold">{result.level}</span>
            </p>
            <p className="mt-2 text-xs sm:text-sm text-slate-700 whitespace-pre-line">
              {result.description}
            </p>
            <p className="mt-2 text-[11px] sm:text-xs text-slate-500">
              * GAD-7 역시 선별 도구이며, 불안장애의 최종 진단은 전문가의 면담과
              평가를 통해 이루어져야 해요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GAD7;
