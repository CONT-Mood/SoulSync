import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatSidebar from '../components/ChatSidebar';
import ChatHeader from '../components/ChatHeader';
import ChatInput from '../components/ChatInput';
import GaugeBox from '../components/GuageBox';
import { useCharacter } from '../contexts/CharacterContext';
import character from '../assets/character_Main.png';
import bubble from '../assets/Bold2.svg';


const ChatMain = () => {
  const { selectedCharacter } = useCharacter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [, setActiveChat] = useState<number | null>(null);
  const [modelReply, setModelReply] = useState('');
  const [showGauge, setShowGauge] = useState(false);
  const [showCrisisModal, setShowCrisisModal] = useState(false);

  const [emotionScore, setEmotionScore] = useState({
    depression: 0,
    anxiety: 0,
    lethargy: 0,
  });

  const [, setEmotionHistory] = useState({
    depression: [] as number[],
    anxiety: [] as number[],
    lethargy: [] as number[],
  });

  const navigate = useNavigate();

  useEffect(() => {
    if (!selectedCharacter) {
      navigate('/pick');
    } else {
      setModelReply(selectedCharacter.greeting);
    }
  }, [selectedCharacter, navigate]);

  const handleNewEmotion = (newScore: { depression: number; anxiety: number; lethargy: number }) => {
    setEmotionHistory((prev) => {
      const updated = {
        depression: [...prev.depression, newScore.depression],
        anxiety: [...prev.anxiety, newScore.anxiety],
        lethargy: [...prev.lethargy, newScore.lethargy],
      };

      const average = {
        depression: Math.round(updated.depression.reduce((a, b) => a + b, 0) / updated.depression.length),
        anxiety: Math.round(updated.anxiety.reduce((a, b) => a + b, 0) / updated.anxiety.length),
        lethargy: Math.round(updated.lethargy.reduce((a, b) => a + b, 0) / updated.lethargy.length),
      };

      setEmotionScore(average);

      if (average.depression >= 70 && average.anxiety >= 70 && average.lethargy >= 50) {
        setShowCrisisModal(true);
      }

      return updated;
    });
  };

  return (
    <div className="relative w-full h-screen bg-black text-white overflow-hidden">
      <img
        src={selectedCharacter?.image || character}
        alt={selectedCharacter?.name || "케릭터"}
        className="absolute z-0 left-1/2 top-1/2 w-[500px] h-auto -translate-x-1/2 -translate-y-1/2 opacity-90"
      />

      <div className="absolute z-10 top-32 right-16 w-[500px] h-[300px]">
        <div className="w-full h-full bg-white rounded-full shadow-2xl border border-gray-100 overflow-hidden">
          <div className="w-full h-full flex items-center justify-center p-12">
            <div
              className="text-center text-base leading-relaxed max-w-full whitespace-pre-wrap overflow-y-auto scrollbar-hide"
              style={{ 
                color: '#0A1172', 
                fontFamily: 'Segoe UI, Pretendard, Noto Sans KR, sans-serif', 
                fontWeight: 500,
                maxHeight: '100%'
              }}
            >
              {modelReply.split(/\n|\\n/).map((line, idx) => (
                <p key={idx} className="mb-2 last:mb-0">{line}</p>
              ))}
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => setShowGauge(true)}
        className="absolute bottom-[32%] left-[30%] z-20 group focus:outline-none active:outline-none"
        style={{ outline: 'none', border: 'none' }}
      >
        <div className="w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-white/20 flex items-center justify-center">
          <span className="text-white font-semibold text-m tracking-wide text-center select-none">
            나의 상태
          </span>
        </div>
      </button>

      {showGauge && (
        <div style={{ position: 'absolute', bottom: '48%', left: '14.5%', zIndex: 30 }}>
          <GaugeBox
            depression={emotionScore.depression}
            anxiety={emotionScore.anxiety}
            lethargy={emotionScore.lethargy}
            onClose={() => setShowGauge(false)}
          />
        </div>
      )}

      {showCrisisModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* 배경 */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowCrisisModal(false)}
          />

          {/* 은은한 장식 */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-32 -right-28 w-72 h-72 bg-gradient-to-br from-blue-400/25 to-purple-400/25 rounded-full blur-3xl" />
            <div className="absolute -bottom-32 -left-28 w-72 h-72 bg-gradient-to-br from-purple-400/25 to-pink-400/25 rounded-full blur-3xl" />
          </div>

          {/* 카드 */}
          <div className="relative z-[101] w-[min(92vw,480px)]">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
              {/* 헤더 */}
              <div className="px-6 pt-6 text-center">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
                  도움이 필요하신가요?
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  가까운 상담기관과 <span className="whitespace-nowrap">24시간 핫라인</span>을 안내해 드릴 수 있어요.
                </p>
              </div>

              {/* 아이콘 + 메시지 */}
              <div className="px-6 pb-2 pt-4 flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white grid place-items-center shadow-md mb-3">
                  <span className="text-xl font-bold">💬</span>
                </div>
                <p className="text-[15px] leading-relaxed text-gray-800">
                  지금 바로 안내를 받으시겠어요?
                </p>
              </div>

              {/* 버튼 */}
              <div className="px-6 pt-4 pb-6 flex items-center justify-center gap-3">
                <button
                  onClick={() => setShowCrisisModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                >
                  아니요, 괜찮아요.
                </button>
                <button
                  onClick={() => navigate("/crisis", { state: { fromChat: true } })}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:opacity-90 transition shadow-sm"
                >
                  네, 안내해주세요.
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex h-screen bg-transparent text-white">
        {sidebarOpen && (
          <ChatSidebar
            onSelectChat={setActiveChat}
            onClose={() => setSidebarOpen(false)}
          />
        )}

        <div className="flex-1 flex flex-col bg-white text-black">
          <ChatHeader onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          <div className="flex flex-col justify-between flex-1">
            <div className="flex-1 flex items-center justify-center"></div>
            <ChatInput
              setModelReply={setModelReply}
              setEmotionScore={handleNewEmotion}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMain;