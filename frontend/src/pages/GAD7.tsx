<<<<<<< HEAD
import React, { useState } from "react";
=======
// pages/GAD7.tsx
import React, { useState } from 'react';
>>>>>>> parent of 252229b (내꺼 chromadb Keep)

const GAD7 = () => {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [score, setScore] = useState<number | null>(null);

  const questions = [
    { id: 1, text: '초조하거나 불안하거나 조마조마하게 느낀다.' },
    { id: 2, text: '걱정하는 것을 멈출 수가 없다.' },
    { id: 3, text: '여러 가지 것들에 대해 걱정을 너무 많이 한다.' },
    { id: 4, text: '편하게 있기가 어렵다.' },
    { id: 5, text: '너무 안절부절 못해서 가만히 있기가 힘들다.' },
    { id: 6, text: '쉽게 짜증이 나거나 쉽게 성을 내게 된다.' },
    { id: 7, text: '마치 끔찍한 일이 생길 것처럼 두렵게 느껴진다.' },
  ];

  const options = [
    '전혀 방해 받지 않았다',
    '며칠 동안 방해 받았다',
    '2주중 절반 이상 방해 받았다',
    '거의 매일 방해 받았다',
  ];

  const scoreMap: Record<string, number> = {
    '전혀 방해 받지 않았다': 0,
    '며칠 동안 방해 받았다': 1,
    '2주중 절반 이상 방해 받았다': 2,
    '거의 매일 방해 받았다': 3,
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
=======
    <div className="min-h-screen bg-white text-black px-6 py-10 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">일반화된 불안장애 척도-7 (GAD-7)</h1>
      <p className="text-sm text-gray-700 mb-10 whitespace-pre-line">
        지난 2주 동안 아래 문제들로 인해 얼마나 자주 방해를 받으셨습니까?
        해당하는 빈도를 선택해주세요.
      </p>
>>>>>>> parent of 252229b (내꺼 chromadb Keep)

      {questions.map((q) => (
        <div key={q.id} className="mb-6 border rounded-lg bg-gray-50 p-4">
          <p className="font-semibold mb-4">{q.id}. {q.text}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-6 px-2 text-sm">
            {options.map((opt) => (
              <label key={opt} className="flex items-center space-x-2 text-black mb-1">
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

export default GAD7;
