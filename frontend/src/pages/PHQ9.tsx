<<<<<<< HEAD
import React, { useState } from "react";
=======
// pages/PHQ9.tsx
import React, { useState } from 'react';
>>>>>>> parent of 252229b (내꺼 chromadb Keep)

const PHQ9 = () => {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [score, setScore] = useState<number | null>(null);

  const questions = [
    { id: 1, text: '기분이 가라앉거나, 우울하거나, 희망이 없다고 느꼈다.' },
    { id: 2, text: '평소 하던 일에 대한 흥미가 없어지거나 즐거움을 느끼지 못했다.' },
    { id: 3, text: '잠들기 어렵거나, 자주 깨거나, 너무 많이 잤다.' },
    { id: 4, text: '피곤하고 기운이 없었다.' },
    { id: 5, text: '식욕이 없거나 과식했다.' },
    { id: 6, text: '자신이 실패자라고 느끼거나 자신이나 가족을 실망시켰다고 느꼈다.' },
    { id: 7, text: '신문을 읽거나 TV를 볼 때 집중하기 어려웠다.' },
    { id: 8, text: '다른 사람들이 알아차릴 정도로 평소보다 말을 느리게 하거나, 반대로 너무 안절부절 못해서 가만히 있기가 힘들었다.' },
    { id: 9, text: '죽거나 자해하는 생각이 들었다.' },
  ];

  const options = ['없음', '2~6일', '7~12일', '거의 매일'];

  const scoreMap: Record<string, number> = {
    '없음': 0,
    '2~6일': 1,
    '7~12일': 2,
    '거의 매일': 3,
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
=======
    <div className="min-h-screen bg-white text-black px-6 py-10 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">우울증 건강설문-9 (PHQ-9)</h1>
      <p className="text-sm text-gray-700 mb-10 whitespace-pre-line">
        지난 2주간, 얼마나 자주 다음과 같은 문제들로 고통을 겪으셨습니까?
        각 문항에 대해 아래와 같은 기간에 해당하면 선택해 주세요.
      </p>
>>>>>>> parent of 252229b (내꺼 chromadb Keep)

      {questions.map((q) => (
        <div key={q.id} className="mb-6 border rounded-lg bg-gray-50 p-4">
          <p className="font-semibold mb-4">{q.id}. {q.text}</p>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-y-2 gap-x-4 px-2 text-sm">
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

export default PHQ9;
