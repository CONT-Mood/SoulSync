// pages/PSS.tsx
import React, { useState } from 'react';

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
    <div className="min-h-screen bg-white text-black px-6 py-10 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">지각된 스트레스 척도 ( PSS )</h1>
      <p className="text-m text-gray-700 mb-10 font-bold whitespace-pre-line mt-4">
        각 문항의 감정을 얼마나 자주 느꼈는지 신중히 답변 부탁드립니다.
      </p>

      {questions.map((q) => (
        <div key={q.id} className="mb-4 border rounded-lg bg-gray-50 p-3">
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
        className="block mx-auto px-4 py-2 bg-blue-100 hover:bg-blue-100 rounded-md text-sm font-semibold transition font-['Pretendard']"
        style={{ color: "#3D56A6" }}
      >
        결과보기
      </button>

      {score !== null && (
        <div
        className="text-center mt-4 mb-20 text-xl font-semibold"
        style={{ color: "#3D56A6" }}
        >
        사용자의 스트레스 검사 점수는 <span className="font-bold">{score}</span>점 입니다.
      </div>
      )}
    </div>
  );
};

export default PSS;
