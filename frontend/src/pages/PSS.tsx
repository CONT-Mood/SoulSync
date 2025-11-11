<<<<<<< HEAD
import React, { useState } from "react";
=======
// pages/PSS.tsx
import React, { useState } from 'react';
>>>>>>> parent of 252229b (내꺼 chromadb Keep)

const PSS = () => {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [score, setScore] = useState<number | null>(null);

  const questions = [
    { id: 1, text: '최근 1개월 동안, 예상치 못했던 일 때문에 당황했던 적이 얼마나 있었습니까?' },
    { id: 2, text: '최근 1개월 동안, 인생에서 중요한 일들을 조절할 수 없다는 느낌을 얼마나 경험하였습니까?' },
    { id: 3, text: '최근 1개월 동안, 신경이 예민해지고 스트레스를 많이 받았습니까?' },
    { id: 4, text: '최근 1개월 동안, 분노를 억제하기 어려운 적이 있었습니까?' },
    { id: 5, text: '최근 1개월 동안, 예기치 못한 일이 발생해서 당황한 적이 있었습니까?' },
    { id: 6, text: '최근 1개월 동안, 모든 일을 잘 처리하고 있다는 느낌이 들었습니까?' },
    { id: 7, text: '최근 1개월 동안, 일상의 어려움을 잘 통제할 수 있었습니까?' },
    { id: 8, text: '최근 1개월 동안, 짜증을 낸 적이 있었습니까?' },
    { id: 9, text: '최근 1개월 동안, 일이 잘 풀린다는 느낌이 들었습니까?' },
    { id: 10, text: '최근 1개월 동안, 어려운 일이 닥쳐도 극복할 수 있을 것 같았습니까?' },
  ];

  const options = ['전혀없음', '거의없음', '때때로있음', '자주있음', '매우자주'];

  const scoreMap: Record<string, number> = {
    '전혀없음': 0,
    '거의없음': 1,
    '때때로있음': 2,
    '자주있음': 3,
    '매우자주': 4,
  };

  const handleChange = (questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = () => {
    const total = questions.reduce((sum, q) => {
      const selected = answers[q.id];
      const value = scoreMap[selected] ?? 0;
      return sum + value;
    }, 0);

    setScore(total);
  };

  return (
<<<<<<< HEAD
    <div className="min-h-screen bg-gradient-to-b from-indigo-100 via-white to-purple-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl bg-white/90 backdrop-blur rounded-3xl shadow-xl border border-white/60 px-6 py-8 sm:px-10 sm:py-10">
        <header className="mb-6 sm:mb-8">
          <p className="text-s font-semibold text-indigo-500 uppercase tracking-[0.25em]">
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
=======
    <div className="min-h-screen bg-white text-black px-6 py-10 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">지각된 스트레스 척도 (PSS)</h1>
      <p className="text-sm text-gray-700 mb-10 whitespace-pre-line">
        다음의 문항들은 최근 1개월 동안 당신이 느끼고 생각한 것에 대한 것입니다.
        각 문항의 내용을 얼마나 자주 느꼈는지 O표 해주시기 바랍니다.
      </p>
>>>>>>> parent of 252229b (내꺼 chromadb Keep)

      {questions.map((q) => (
        <div key={q.id} className="mb-6 border rounded-lg bg-gray-50 p-4">
          <p className="font-semibold mb-4">{q.id}. {q.text}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-y-2 gap-x-4 px-2 text-sm">
            {options.map((opt) => (
              <label key={opt} className="flex items-center space-x-2 text-black">
                <input
                  type="radio"
                  name={`question-${q.id}`}
                  value={opt}
                  checked={answers[q.id] === opt}
                  onChange={() => handleChange(q.id, opt)}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </div>
      ))}

      <button
        onClick={handleSubmit}
        className="block mx-auto px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-md text-sm font-semibold transition font-['Pretendard']"
        style={{ color: "#3D56A6" }}
      >
        결과보기
      </button>

      {score !== null && (
        <div
        className="text-center mt-10 mb-20 text-xl font-semibold"
        style={{ color: "#0A1172" }}
        >
        당신의 총 점수는 <span className="font-bold">{score}</span>점 입니다.
      </div>
)}
    </div>
  );
};

export default PSS;
