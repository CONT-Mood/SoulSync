// DiagnosisPick.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const DiagnosisPick: React.FC = () => {
  const navigate = useNavigate();

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
        <h2 className="text-2xl font-medium mt-6 mb-8">사용자님에 대해 알려주세요.</h2>
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
        <div className="w-12 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mt-10">
            <span className="text-white font-bold text-xs">S</span>
          </div>
        <p className="text-sm text-gray-500 text-center mt-4">
          <span className="text-blue-600 cursor-pointer hover:underline">아니요,</span>{' '}
          를 선택하시면 SoulSync의 정확도가 떨어질 수 있어요.
        </p>
        <p className="text-sm text-gray-500 text-center mt-2">
          해당 검사는 SoulSync 모델의 정확한 상담을 위한 모델 학습에만 사용되며, 그 외 목적으로 절대 이용되지 않습니다.
        </p>

      </div>
    </div>
  );
};

export default DiagnosisPick;