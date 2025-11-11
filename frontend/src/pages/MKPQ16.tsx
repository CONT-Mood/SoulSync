<<<<<<< HEAD
import React, { useState } from "react";
=======
// pages/MKPQ16.tsx
import React, { useState } from 'react';
>>>>>>> parent of 252229b (내꺼 chromadb Keep)

const MKPQ16 = () => {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [score, setScore] = useState<number | null>(null);

  const questions = [
    { id: 1, text: '내가 이전에 즐겨했던 일에 흥미가 없어진다.' },
    { id: 2, text: '지금 경험하는 일이 마치 전에도 똑같이 일어났던 것처럼 느껴질 때가 종종 있다(데자뷰).' },
    { id: 3, text: '나는 때때로 다른 사람들이 느끼지 못하는 냄새나 맛을 느낀다.' },
    { id: 4, text: '나는 쿵, 찰칵, 짝짝, 딸랑딸랑 거리는 등의 특이한 소리를 종종 듣는다.' },
    { id: 5, text: '때로는 내가 경험한 상황이 실제인지 상상인지 헷갈릴 때가 있다.' },
    { id: 6, text: '내가 다른 사람을 쳐다보거나 거울 속의 내 자신을 볼 때, 나는 바로 앞에서 얼굴이 바뀌는 것을 본 적이 있다.' },
    { id: 7, text: '나는 가끔 어떤 일이 실제로 일어난 것인지 꿈에서 본 것인지 구분이 되지 않는다.' },
    { id: 8, text: '다른 사람들이 나를 조종하거나 조종하려 한다고 느낀다.' },
    { id: 9, text: '텔레비전이나 라디오가 나에게 특별한 메시지를 보내는 것 같다고 느낀다.' },
    { id: 10, text: '내가 하는 생각이 나의 의지와는 상관없이 갑자기 떠오를 때가 있다.' },
    { id: 11, text: '내가 어떤 사람이나 사물에 의해 조종당한다고 느낀 적이 있다.' },
    { id: 12, text: '나는 어떤 생각을 하면 그것이 현실이 된다고 느낄 때가 있다.' },
    { id: 13, text: '나는 종종 다른 사람들이 나를 감시하고 있다고 느낀다.' },
    { id: 14, text: '사람들이 나에 대해 수군거리는 소리를 들은 적이 있다.' },
    { id: 15, text: '내가 혼자 있을 때 누군가가 나에게 말하는 소리를 들은 적이 있다.' },
    { id: 16, text: '가끔 어떤 일이 실제로 일어난 것인지 꿈을 꾼 것인지 헷갈릴 때가 있다.' },
  ];

  const options = ['예', '아니오'];

  const scoreMap: Record<string, number> = {
    '예': 1,
    '아니오': 0,
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
=======
    <div className="min-h-screen bg-white text-black px-6 py-10 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">교정된 정신증 고위험군 선별도구 (mKPQ-16)</h1>
      <p className="text-sm text-gray-700 mb-10 whitespace-pre-line">
        지난 한달 동안 다음의 생각, 느낌, 경험이 있었는지에 대해 "예" 또는 "아니오"로 응답해주세요.
        술이나 약물 복용 등으로 인한 경험은 제외하며, "예"라고 답한 항목은 해당 경험이 얼마나 힘들었는지도 고려해주세요.
      </p>
>>>>>>> parent of 252229b (내꺼 chromadb Keep)

      {questions.map((q) => (
        <div key={q.id} className="mb-6 border rounded-lg bg-gray-50 p-4">
          <p className="font-semibold mb-4">{q.id}. {q.text}</p>
          <div className="grid grid-cols-2 gap-x-4 px-2 text-sm">
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

export default MKPQ16;
