<<<<<<< HEAD
import React from "react";
import { useNavigate } from "react-router-dom";
=======
// DiagnosisPick.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
>>>>>>> parent of 252229b (내꺼 chromadb Keep)

const DiagnosisPick: React.FC = () => {
  const navigate = useNavigate();

<<<<<<< HEAD
  const tests = [
    {
      key: "PHQ-9",
      title: "PHQ-9 우울감 자가검사",
      description: "지난 2주 동안의 기분과 흥미 변화를 간단히 체크해요.",
      tag: "우울감",
      path: "/phq9",
    },
    {
      key: "GAD-7",
      title: "GAD-7 불안 자가검사",
      description: "긴장 / 걱정 / 불안으로 인한 어려움 정도를 확인해요.",
      tag: "불안",
      path: "/gad7",
    },
    {
      key: "PSS",
      title: "PSS 지각된 스트레스",
      description: "요즘 내가 느끼는 스트레스 수준이 어느 정도인지 살펴봐요.",
      tag: "스트레스",
      path: "/pss",
    },
    {
      key: "mKPQ-16",
      title: "mKPQ-16 정신증 고위험 선별",
      description: "현실감 / 지각 경험과 관련된 특이한 경험을 확인하는 선별도구예요.",
      tag: "초기정신건강",
      path: "/mkpq16",
    },
  ];

  const handleClick = (path: string) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-100 via-white to-purple-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl mx-auto">
        {/* 제목 */}
        <header className="text-center mb-10 sm:mb-14 flex flex-col items-center justify-center space-y-5">
          <div className="w-12 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mt-10">
            <span className="text-white font-bold text-xs">S</span>
          </div>
          <p className="text-xs sm:text-sm font-semibold tracking-[0.25em] text-indigo-500 uppercase">
            Soulsync Diagnosis
          </p>
          <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-slate-900">
            SoulSync는 처음이시군요!
          </h1>
          <p className="mt-3 sm:mt-4 text-sm sm:text-lg text-slate-700 leading-relaxed">
            몇 가지 간단한 자가 설문을 통해 지금의 마음 상태를 함께 살펴볼게요.
          </p>
          <p className="mt-2 text-xs sm:text-sm text-slate-500">
            모든 결과는 <span className="font-semibold">선별용 참고 정보</span>이며,
            진단은 아닙니다.
          </p>
        </header>

        {/* 검사 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {tests.map((test) => (
            <button
              key={test.key}
              type="button"
              onClick={() => handleClick(test.path)}
              className="group text-left rounded-3xl bg-white/90 border border-white/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition transform px-6 py-6 sm:px-7 sm:py-7 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              <p className="inline-flex items-center rounded-full bg-indigo-50 text-indigo-600 text-[11px] sm:text-xs font-semibold px-3 py-1 mb-2">
                {test.tag}
              </p>
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
                {test.title}
              </h2>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                {test.description}
              </p>
              <p className="mt-4 text-sm font-semibold text-indigo-600 group-hover:text-purple-600">
                검사 시작하기 →
              </p>
            </button>
          ))}
        </div>
        <div className="relative z-10 mt-20 text-center">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xs">S</span>
            </div>
            <p className="text-gray-500 text-sm">
              <span className="font-medium"></span> 응답 내용은 SoulSync에서 더 섬세한 상담 경험을 제공하기 위해서만 사용되며,
          외부에 공유되지 않습니다.
            </p>
          </div>
        </div>
=======
  const handleClick = (tool: string) => {
    console.log(`${tool} 선택됨`);
    if (tool === 'PSS') navigate('/pss');
    if (tool === 'PHQ-9') navigate('/phq9');
    if (tool === 'GAD-7') navigate('/gad7');
    if (tool === 'mKPQ-16') navigate('/mkpq16');
  };

  const buttonClass =
    'w-[350px] py-10 px-8 text-2xl rounded-3xl text-center whitespace-pre-line transition font-semibold hover:bg-blue-500 hover:text-white focus:outline-none ring-0';

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-10 bg-white text-black">
      {/* 상단 제목 */}
      <div className="mt-20 text-center">
        <h1 className="text-5xl font-bold mb-2">SoulSync는 처음이시군요!</h1>
        <h2 className="text-2xl font-medium mt-6 mb-8">당신에 대해 알려주세요.</h2>
      </div>

      {/* 버튼 + 안내 문구 영역 */}
      <div className="flex flex-col items-center justify-center mt-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-3xl mb-4">
          <button className={`bg-gray-200 text-black ${buttonClass}`} onClick={() => handleClick('PSS')}>
            지각된 스트레스 척도<br />(PSS)
          </button>
          <button className={`bg-gray-200 text-black ${buttonClass}`} onClick={() => handleClick('PHQ-9')}>
            우울증 건강설문-9<br />(PHQ-9)
          </button>
          <button className={`bg-gray-200 text-black ${buttonClass}`} onClick={() => handleClick('GAD-7')}>
            일반화된 불안장애 척도-7<br />(GAD-7)
          </button>
          <button className={`bg-gray-200 text-black ${buttonClass}`} onClick={() => handleClick('mKPQ-16')}>
            정신증 고위험군 선별도구<br />(mKPQ-16)
          </button>
        </div>

        {/* 하단 문구 */}
        <p className="text-sm text-gray-500 text-center mt-4">
          <span className="text-blue-600 cursor-pointer hover:underline">아니요,</span>{' '}
          를 선택하시면 SoulSync의 정확도가 떨어질 수 있어요.
        </p>
>>>>>>> parent of 252229b (내꺼 chromadb Keep)
      </div>
    </div>
  );
};

export default DiagnosisPick;
