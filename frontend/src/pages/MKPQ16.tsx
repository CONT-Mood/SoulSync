import React, { useState } from "react";
import axios from "axios"

type MkpqResult = {
  range: string;
  level: string;
  description: string;
};

const MKPQ16: React.FC = () => {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [score, setScore] = useState<number | null>(null);

  const questions = [
    { id: 1, text: "내가 이전에 즐겨했던 일에 흥미가 없어진다." },
    {
      id: 2,
      text:
        "지금 경험하는 일이 마치 전에도 똑같이 일어났던 것처럼 느껴질 때가 종종 있다(데자뷰).",
    },
    {
      id: 3,
      text:
        "나는 때때로 다른 사람들이 느끼지 못하는 냄새나 맛을 느낀다.",
    },
    {
      id: 4,
      text:
        "나는 쿵, 찰칵, 짝짝, 딸랑딸랑 거리는 등의 특이한 소리를 종종 듣는다.",
    },
    {
      id: 5,
      text:
        "때로는 내가 경험한 상황이 실제인지 상상인지 헷갈릴 때가 있다.",
    },
    {
      id: 6,
      text:
        "내가 다른 사람을 쳐다보거나 거울 속의 내 자신을 볼 때, 나는 바로 앞에서 얼굴이 바뀌는 것을 본 적이 있다.",
    },
    {
      id: 7,
      text:
        "나는 가끔 어떤 일이 실제로 일어난 것인지 꿈에서 본 것인지 구분이 되지 않는다.",
    },
    {
      id: 8,
      text:
        "다른 사람들이 나를 조종하거나 조종하려 한다고 느낀다.",
    },
    {
      id: 9,
      text:
        "때때로 내가 다른 사람보다 특별한 능력이나 사명을 지녔다고 느낀다.",
    },
    {
      id: 10,
      text:
        "내 생각이 내 의지와 상관없이 다른 사람에게 전해진다고 느낀 적이 있다.",
    },
    {
      id: 11,
      text:
        "내가 생각하는 것들이 다른 사람의 생각과 섞여 버리는 느낌이 들 때가 있다.",
    },
    {
      id: 12,
      text:
        "때로는 TV·라디오·인터넷의 내용이 나와 특별히 관련되어 있다고 느낀다.",
    },
    {
      id: 13,
      text:
        "때때로 누군가 나를 해치려 하거나, 나를 감시하고 있다는 느낌이 든다.",
    },
    {
      id: 14,
      text:
        "갑자기 생각이 끊기거나, 방금 하려던 말을 잊어버리는 일이 자주 있다.",
    },
    {
      id: 15,
      text:
        "내가 하는 행동이나 말이 나도 모르게 달라지는 느낌이 들 때가 있다.",
    },
    {
      id: 16,
      text:
        "이상한 생각이나 지각 경험 때문에 학교·직장·대인관계에서 문제가 생긴 적이 있다.",
    },
  ];

  const options = ["예", "아니오"];

  const scoreMap: Record<string, number> = {
    예: 1,
    아니오: 0,
  };

  const handleChange = (questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const getResult = (total: number): MkpqResult => {
    if (total <= 6) {
      return {
        range: "0–6점",
        level: "비교적 낮은 위험 가능성",
        description:
          "mKPQ-16 점수만 보았을 때, 정신증 고위험군 선별 기준에는 해당되지 않을 가능성이 커요. " +
          "다만 문항 내용 중 어떤 것이든 나에게 크게 불편함을 주거나, 일상생활에 지장을 줄 정도라면 점수와 상관없이 전문가와 상의해 보는 것이 좋아요.",
      };
    }
    return {
      range: "7점 이상",
      level: "정신증 고위험 가능성이 높은 구간",
      description:
        "연구들에서 mKPQ-16은 보통 총점 7점 이상일 때 정신증 고위험 가능성이 높다고 보고하고 있어요. " +
        "점수가 이 구간에 해당한다고 해서 반드시 질환이 있다는 뜻은 아니지만, " +
        "현실감, 지각 경험, 사고 내용과 관련된 어려움을 더 자세히 살펴볼 필요가 있다는 신호일 수 있어요. " +
        "가능하다면 정신건강의학과, 대학 상담센터, 지역 정신건강복지센터 등에서 전문적인 평가와 상담을 받아 보기를 권장해요.",
    };
  };

  const handleSubmit = async () => {
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

  // ✅ 총점 서버에 전달 (백엔드: /assessment/submit)
  try {
    await axios.post("/assessment/submit", {
      user_id: "testuser",   // 로그인 연동 시 실제 사용자 ID로 교체
      type: "mkpq16", 
      total: total
    });
    console.log("MKPQ-16 점수 서버 저장 완료");
  } catch (error) {
    console.error("서버 저장 오류:", error);
  }
};

  const result = score !== null ? getResult(score) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-100 via-white to-purple-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl bg-white/90 backdrop-blur rounded-3xl shadow-xl border border-white/60 px-6 py-8 sm:px-10 sm:py-10">
        <header className="mb-6 sm:mb-8">
          <p className="text-s font-semibold text-indigo-500 uppercase tracking-[0.25em]">
            mKPQ-16
          </p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
            교정된 정신증 고위험군 선별도구 (mKPQ-16)
          </h1>
          <p className="mt-3 text-sm text-slate-700 whitespace-pre-line leading-relaxed">
            지난 한 달 동안 다음의 생각, 느낌, 경험이 있었는지에 대해 “예” 또는
            “아니오”로 응답해 주세요.
            {"\n"}
            술이나 약물 복용 등으로 인한 경험은 제외하며, “예”라고 답한 항목은 그
            경험이 얼마나 힘들었는지도 함께 떠올려 보시면 좋아요.
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
              <div className="mt-3 grid grid-cols-2 gap-2 max-w-xs">
                {options.map((opt) => (
                  <label
                    key={opt}
                    className="inline-flex items-center space-x-2 text-sm text-slate-800"
                  >
                    <input
                      type="radio"
                      name={`mkpq-q${q.id}`}
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
              * mKPQ-16은 정신증 고위험 가능성을 “선별”하는 도구이며, 이 결과만으로
              어떤 질환을 확정할 수는 없어요.{"\n"}
              * 일상생활이나 대인관계에 영향을 줄 정도로 이상한 생각·지각 경험이
              반복된다면, 점수와 무관하게 전문가와의 상담을 권장해요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MKPQ16;
