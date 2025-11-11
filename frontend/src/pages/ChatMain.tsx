import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatSidebar from '../components/ChatSidebar';
import ChatHeader from '../components/ChatHeader';
import ChatInput from '../components/ChatInput';
import AnimatedImage from '../components/AnimatedImage';
import { useCharacter } from '../contexts/CharacterContext';
import character from '../assets/character_Main.png';

const ChatMain = () => {

  const { selectedCharacter } = useCharacter();

  // UI 상태
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [, setActiveChat] = useState<number | null>(null);
  const [modelReply, setModelReply] = useState('');
  const [showGauge, setShowGauge] = useState(false);
  const [showCrisisModal, setShowCrisisModal] = useState(false);

  // 감정 점수
  const [emotionScore, setEmotionScore] = useState({
    depression: 0,
    anxiety: 0,
    lethargy: 0,
  });

  // 감정 히스토리
  const [, setEmotionHistory] = useState({
    depression: [] as number[],
    anxiety: [] as number[],
    lethargy: [] as number[],
  });

  const navigate = useNavigate();

  // 초기 인사
  useEffect(() => {
    if (!selectedCharacter) {
      navigate('/pick');
      return;
    }
    setModelReply(selectedCharacter.greeting);
  }, [selectedCharacter, navigate]);

  // 사이드바 토글
  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  // 사이드바 닫기
  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  // 채팅 선택
  const handleSelectChat = useCallback((idx: number | null) => {
    setActiveChat(idx);
  }, []);

  // 위기 모달 닫기
  const closeCrisis = useCallback(() => {
    setShowCrisisModal(false);
  }, []);

  // 위기 안내 이동
  const goCrisis = useCallback(() => {
    navigate('/crisis', { state: { fromChat: true } });
  }, [navigate]);

  // 감정 갱신
  const handleNewEmotion = useCallback(
    (newScore: { depression: number; anxiety: number; lethargy: number }) => {
      setEmotionHistory((prev) => {
        const updated = {
          depression: [...prev.depression, newScore.depression],
          anxiety: [...prev.anxiety, newScore.anxiety],
          lethargy: [...prev.lethargy, newScore.lethargy],
        };

        const avg = {
          depression: Math.round(
            updated.depression.reduce((a, b) => a + b, 0) / updated.depression.length
          ),
          anxiety: Math.round(
            updated.anxiety.reduce((a, b) => a + b, 0) / updated.anxiety.length
          ),
          lethargy: Math.round(
            updated.lethargy.reduce((a, b) => a + b, 0) / updated.lethargy.length
          ),
        };

        setEmotionScore(avg);

        if (avg.depression >= 70 && avg.anxiety >= 70 && avg.lethargy >= 50) {
          setShowCrisisModal(true);
        }

        return updated;
      });
    },
    []
  );

  // 텍스트 스타일
  const chatTextStyle: React.CSSProperties = {
    color: '#0A1172',
    fontFamily: 'Segoe UI, Pretendard, Noto Sans KR, sans-serif',
    fontWeight: 500,
  };

  // (초기화 기능 넣어주세요 -> 혜련님)
  const handleFloatingAction = useCallback(async () => {
    const confirmReset = window.confirm('정말 모든 대화 내역을 초기화하시겠습니까?');
    if (!confirmReset) return;

    // 로그인 기능 구현 시 요청 주소 수정 필요
    await fetch(`${import.meta.env.VITE_API_BASE}/chat-log/reset?user_id=testuser`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    alert('모든 대화 내역이 초기화되었습니다.');
    navigate('/pick');
  }, [navigate]);


  return (
    <div className="min-h-screen w-full bg-white text-black flex flex-col overflow-hidden">
      {/* 헤더 */}
      <div className="sticky top-0 z-50 bg-white">
        <ChatHeader onToggleSidebar={toggleSidebar} />
      </div>

      {/* 사이드바 */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/10"
            onClick={closeSidebar}
            />
        <aside className="fixed left-0 top-0 h-screen w-[320px] z-[60] bg-white border-r border-gray-200 shadow-xl overflow-y-auto">
          <ChatSidebar
            onSelectChat={handleSelectChat}
            onClose={closeSidebar}
            emotionScore={emotionScore}
            />
        </aside>
        </>
      )}

      {/* 메인 섹션 */}
      <section className="relative z-10 flex-1 w-full max-w-[1200px] mx-auto px-6 mt-52 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-10 w-full">
          {/* 캐릭터 */}
          <div className="lg:col-span-5 flex justify-center">
            <AnimatedImage
              src={selectedCharacter?.image || character}
              alt={selectedCharacter?.name || '캐릭터'}
              wrapperClassName="w-[300px] sm:w-[380px] md:w-[460px] lg:w-[600px] xl:w-[600px] pointer-events-none select-none"
              width={600}
            />
          </div>

          {/* 말풍선 */}
          <div className="lg:col-span-7 flex justify-center lg:justify-end">
            <div className="max-w-[640px] w-full bg-white rounded-[24px] shadow-[0_18px_50px_rgba(0,0,0,0.1)] border border-gray-100 px-6 py-5">
              <div
                className="text-center text-[15px] md:text-base leading-relaxed whitespace-pre-wrap"
                style={chatTextStyle}
              >
                {modelReply.split(/\n|\\n/).map((line, idx) => (
                  <p key={idx} className="mb-2 last:mb-0">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 게이지(옵션) 
      {showGauge && (
        <div style={{ position: 'absolute', bottom: '48%', left: '14.5%', zIndex: 30 }}>
          <GaugeBox
            depression={emotionScore.depression}
            anxiety={emotionScore.anxiety}
            lethargy={emotionScore.lethargy}
            onClose={() => setShowGauge(false)}
          />
        </div>
      )} */}

      {/* 위기 모달 */}
      {showCrisisModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeCrisis} />
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-32 -right-28 w-72 h-72 bg-gradient-to-br from-blue-400/25 to-purple-400/25 rounded-full blur-3xl" />
            <div className="absolute -bottom-32 -left-28 w-72 h-72 bg-gradient-to-br from-purple-400/25 to-pink-400/25 rounded-full blur-3xl" />
          </div>
          <div className="relative z-[101] w-[min(92vw,480px)]">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 pt-6 text-center">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
                  도움이 필요하신가요?
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  가까운 상담기관과 <span className="whitespace-nowrap">24시간 핫라인</span>을 안내해 드릴 수 있어요.
                </p>
              </div>
              <div className="px-6 pb-2 pt-4 flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white grid place-items-center shadow-md mb-3">
                  <span className="text-xl font-bold">💬</span>
                </div>
                <p className="text-[15px] leading-relaxed text-gray-800">지금 바로 안내를 받으시겠어요?</p>
              </div>
              <div className="px-6 pt-4 pb-6 flex items-center justify-center gap-3">
                <button
                  onClick={closeCrisis}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                >
                  아니요, 괜찮아요.
                </button>
                <button
                  onClick={goCrisis}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:opacity-90 transition shadow-sm"
                >
                  네, 안내해주세요.
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 채팅 */}
      <div className="flex-1 flex flex-col bg-white">
        <div className="flex flex-col justify-between flex-1">
          <div className="flex-1" />
          <ChatInput setModelReply={setModelReply} setEmotionScore={handleNewEmotion} />
        </div>
      </div>

      <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-2 pointer-events-none select-none">        
        {/* 버튼 (초기화 기능-임시) */}
        <button
          type="button"
          aria-label="빠른 액션"
          onClick={handleFloatingAction}
          className="pointer-events-auto w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg ring-0 focus:outline-none focus:ring-4 focus:ring-purple-300/60 active:scale-95 transition animate-bounce"
        >
          <span className="text-2xl leading-none">+</span>
        </button>
      </div>
    </div>
  );
};

export default ChatMain;