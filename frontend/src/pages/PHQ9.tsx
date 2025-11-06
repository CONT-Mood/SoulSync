// pages/PHQ9.tsx
import React, { useState } from 'react';

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
    <div className="min-h-screen bg-white text-black px-6 py-10 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">우울증 건강설문-9 ( PHQ-9 )</h1>
      <p className="text-m text-gray-700 mb-10 font-bold whitespace-pre-line">
        각 문항의 감정을 얼마나 자주 느꼈는지 신중히 답변 부탁드립니다.

      </p>

      {questions.map((q) => (
        <div key={q.id} className="mb-4 border rounded-lg bg-gray-50 p-3">
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
        className="block mx-auto px-4 py-2 bg-blue-100 hover:bg-blue-100 rounded-md text-sm font-semibold transition font-['Pretendard']"
        style={{ color: "#3D56A6" }}
      >
        결과보기
      </button>

      {score !== null && (
        <div
        className="text-center mt-10 mb-20 text-xl font-semibold"
        style={{ color: "#3D56A6" }}
        >
        사용자의 우울도 검사 점수는 <span className="font-bold">{score}</span>점 입니다.
      </div>
)}
    </div>
  );
};

export default PHQ9;
