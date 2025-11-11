// src/pages/PSS.tsx
import React, { useState } from "react";

type PssResult = {
  range: string;
  level: string;
  description: string;
};

const PSS: React.FC = () => {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [score, setScore] = useState<number | null>(null);

  const questions = [
    {
      id: 1,
      text:
        "최근 1개월 동안, 예상치 못했던 일 때문에 당황했던 적이 얼마나 있었습니까?",
    },
    {
      id: 2,
      text:
        "최근 1개월 동안, 인생에서 중요한 일들을 조절할 수 없다는 느낌을 얼마나 경험하였습니까?",
    },
    {
      id: 3,
      text: "최근 1개월 동안, 신경이 예민해지고 스트레스를 많이 받았습니까?",
    },
    {
      id: 4,
      text: "최근 1개월 동안, 분노를 억제하기 어려운 적이 있었습니까?",
    },
    {
      id: 5,
      text:
        "최근 1개월 동안, 예기치 못한 일이 발생해서 당황한 적이 있었습니까?",
    },
    {
      id: 6,
      text:
        "최근 1개월 동안, 모든 일을 잘 처리하고 있다는 느낌이 들었습니까?",
    },
    {
      id: 7,
      text:
        "최근 1개월 동안, 일상의 어려움을 잘 통제할 수 있었습니까?",
    },
    { id: 8, text: "최근 1개월 동안, 짜증을 낸 적이 있었습니까?" },
    {
      id: 9,
      text: "최근 1개월 동안, 일이 잘 풀린다는 느낌이 들었습니까?",
    },
    {
      id: 10,
      text:
        "최근 1개월 동안, 어려운 일이 닥쳐도 극복할 수 있을 것 같았습니까?",
    },
  ];

  const options = ["전혀없음", "거의없음", "때때로있음", "자주있음", "매우자주"];

  const scoreMap: Record<string, number> = {
    전혀없음: 0,
    거의없음: 1,
    때때로있음: 2,
    자주있음: 3,
    매우자주: 4,
  };

  const handleChange = (questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const getResult = (total: number): PssResult => {
    if (total <= 13) {
      return {
        range: "0–13점 (낮은 스트레스)",
        level: "낮은 스트레스 수준",
        description:
          "현재 PSS 점수만 보면 전반적인 스트레스 수준이 비교적 낮은 편일 수 있어요. " +
          "물론 때때로 힘든 날은 누구에게나 있지만, 지금은 비교적 잘 버티고 있는 상태일 가능성이 커요.",
      };
    }
    if (total <= 26) {
      return {
        range: "14–26점 (중간 정도 스트레스)",
        level: "보통~중간 수준의 스트레스",
        description:
          "일상에서 스트레스를 꽤 자주 느끼고 있을 수 있는 점수예요. " +
          "휴식, 취미 활동, 운동, 호흡·이완 연습 등 스트레스 관리 전략을 조금씩 시도해 보는 것이 도움이 될 수 있어요.",
      };
    }
    return {
      range: "27–40점 (높은 스트레스)",
      level: "높은 스트레스 수준",
      description:
        "상당히 높은 수준의 스트레스를 경험하고 있을 가능성이 있어요. " +
        "이 상태가 오래 지속되면 몸과 마음이 많이 지칠 수 있기 때문에, 주변의 도움을 구하거나 전문적인 상담을 검토해 보는 것이 좋아요.",
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
      <div className="w-full max-w-3xl bg-white/90 backdrop-blur rounded-3xl shadow-xl border border-white/60 px-6 py-8 sm:px-10 sm:py-10">
        <header className="mb-6 sm:mb-8">
          <p className="text-xs font-semibold text-indigo-500 uppercase tracking-[0.25em]">
            PSS-10
          </p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
            지각된 스트레스 척도 (PSS)
          </h1>
          <p className="mt-3 text-sm text-slate-700 whitespace-pre-line leading-relaxed">
            다음의 문항들은 최근 1개월 동안 당신이 느끼고 생각한 것에 대한 것입니다.
            {"\n"}
            각 문항의 내용을 얼마나 자주 느꼈는지 선택해 주세요.
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
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {options.map((opt) => (
                  <label
                    key={opt}
                    className="inline-flex items-center space-x-2 text-sm text-slate-800"
                  >
                    <input
                      type="radio"
                      name={`pss-q${q.id}`}
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
              * PSS-10은 “요즘 나에게 스트레스가 얼마나 많은 것처럼 느껴지는지”를
              보는 척도이며, 스트레스의 원인이나 질병 여부를 직접 진단하는 도구는
              아니에요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PSS;
