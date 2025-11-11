import React, { useState } from "react";
import axios from "axios";

type PhqResult = {
  range: string;
  level: string;
  description: string;
};

const PHQ9: React.FC = () => {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [score, setScore] = useState<number | null>(null);

  const questions = [
    { id: 1, text: "기분이 가라앉거나, 우울하거나, 희망이 없다고 느꼈다." },
    { id: 2, text: "평소 하던 일에 대한 흥미가 없어지거나 즐거움을 느끼지 못했다." },
    { id: 3, text: "잠들기 어렵거나, 자주 깨거나, 너무 많이 잤다." },
    { id: 4, text: "피곤하고 기운이 없었다." },
    { id: 5, text: "식욕이 없거나 과식했다." },
    { id: 6, text: "자신이 실패자라고 느끼거나 자신이나 가족을 실망시켰다고 느꼈다." },
    { id: 7, text: "신문을 읽거나 TV를 볼 때 집중하기 어려웠다." },
    {
      id: 8,
      text:
        "다른 사람들이 알아차릴 정도로 평소보다 말을 느리게 하거나, " +
        "반대로 너무 안절부절 못해서 가만히 있기가 힘들었다.",
    },
    { id: 9, text: "죽거나 자해하는 생각이 들었다." },
  ];

  const options = ["없음", "2~6일", "7~12일", "거의 매일"];

  const scoreMap: Record<string, number> = {
    없음: 0,
    "2~6일": 1,
    "7~12일": 2,
    "거의 매일": 3,
  };

  const handleChange = (questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const getResult = (total: number): PhqResult => {
    if (total <= 4) {
      return {
        range: "0–4점 (우울감 거의 없음 또는 매우 낮은 수준)",
        level: "정상 ~ 경미한 수준",
        description:
          "현재 PHQ-9 점수만 보면 우울감이 크지 않은 편일 수 있어요. " +
          "다만 여전히 힘든 일이 있거나, 일상에서 불편함이 느껴진다면 혼자 참기보다는 주변 사람이나 전문가와 이야기해 보는 것도 좋아요.",
      };
    }
    if (total <= 9) {
      return {
        range: "5–9점",
        level: "가벼운 우울감",
        description:
          "가벼운 수준의 우울감이 나타난 상태예요. 최근 스트레스나 환경의 영향일 수 있지만, " +
          "기운이 없고 흥미가 떨어지는 날이 잦다면 스스로를 돌보는 시간과 휴식이 더 필요할 수 있어요.",
      };
    }
    if (total <= 14) {
      return {
        range: "10–14점",
        level: "중간 정도의 우울감",
        description:
          "중등도 수준의 우울감이 나타난 상태예요. 일상생활이나 인간관계에 영향을 줄 수 있는 정도라서, " +
          "가능하면 정신건강의학과나 상담센터 등 전문적인 도움이 있는 곳과 상담을 받아보길 권장해요.",
      };
    }
    if (total <= 19) {
      return {
        range: "15–19점",
        level: "상당한 우울감",
        description:
          "상당히 강한 우울감이 느껴지는 구간이에요. 일상 기능이 눈에 띄게 떨어지거나, " +
          "아무것도 하고 싶지 않은 느낌이 반복될 수 있어요. 가능한 한 빠르게 전문가와의 상담을 권장해요.",
      };
    }
    return {
      range: "20–27점",
      level: "중증 우울 가능성",
      description:
        "매우 강한 수준의 우울감이 의심되는 점수예요. 일상생활 유지가 어렵거나, 무기력과 자책감이 심하게 느껴질 수 있어요. " +
        "가능하면 가까운 정신건강의학과, 상담센터, 또는 위기 지원 기관에 빠르게 도움을 요청하는 것이 안전해요.",
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
      type: "phq9",          // 이 파일은 GAD-7 설문이니까 type: gad7
      total: total
    });
    console.log("PHQ-9 점수 서버 저장 완료");
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
            PHQ-9
          </p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
            우울증 건강설문-9 (PHQ-9)
          </h1>
          <p className="mt-3 text-sm text-slate-700 whitespace-pre-line leading-relaxed">
            지난 2주간, 얼마나 자주 다음과 같은 문제들을 겪으셨습니까?
            {"\n"}
            각 문항에 대해 해당하는 빈도를 선택해 주세요.
          </p>
        </header>

        {/* 질문 리스트 */}
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
                      name={`phq9-q${q.id}`}
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

        {/* 제출 버튼 */}
        <div className="mt-6 sm:mt-8 flex justify-center">
          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex items-center justify-center px-6 sm:px-8 py-2.5 sm:py-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm sm:text-base font-semibold shadow-md hover:shadow-lg hover:brightness-105 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            결과 확인하기
          </button>
        </div>

        {/* 결과 영역 */}
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
              {"\n"}
              특히 9번 문항(“죽거나 자해하는 생각이 들었다”)에 자주 해당한다고 느껴진다면,
              점수와 관계없이 주변 사람이나 전문 기관에 빠르게 도움을 요청하는 것을
              강하게 권장해요.
            </p>
            <p className="mt-2 text-[11px] sm:text-xs text-slate-500">
              * PHQ-9는 자기보고식 선별 도구이며, 의학적 진단을 대신하지 않습니다.
              실제 진단과 치료는 정신건강의학과 전문의 또는 심리전문가와의 상담을 통해
              이루어져야 해요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PHQ9;
