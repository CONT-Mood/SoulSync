import React, { useState } from 'react';
import sendIcon from '../assets/send_img.png';
import { sendChatMessage } from '../api/chat';
import { useCharacter } from '../contexts/CharacterContext';

interface ChatInputProps {
  setModelReply: (text: string) => void;
  setEmotionScore: (score: { depression: number; anxiety: number; lethargy: number }) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ setModelReply, setEmotionScore }) => {
  const { selectedCharacter } = useCharacter();
  const [message, setMessage] = useState('');

  // 누적 점수 및 횟수 상태 추가
  const [totalScore, setTotalScore] = useState({
    depression: 0,
    anxiety: 0,
    lethargy: 0,
  });
  const [count, setCount] = useState(0);

  const handleSend = async () => {
    if (!message.trim()) return;

    try {
      const res = await sendChatMessage(
        'testuser',       // 임시 사용자 ID
        selectedCharacter?.id || 'empath',  // 선택된 캐릭터 ID
        message,
        true              // 감정 점수 포함 요청
      );

      console.log('보낸 메시지:', message);
      console.log('GPT 응답:', res.reply);
      console.log('감정 점수:', res.emotion_score);

      setModelReply(res.reply);

      // 누적 점수 및 평균 계산
      const newCount = count + 1;
      const newTotal = {
        depression: totalScore.depression + res.emotion_score.depression,
        anxiety: totalScore.anxiety + res.emotion_score.anxiety,
        lethargy: totalScore.lethargy + res.emotion_score.lethargy,
      };

      setTotalScore(newTotal);
      setCount(newCount);

      // 평균 감정 점수 업데이트
      setEmotionScore({
        depression: newTotal.depression / newCount,
        anxiety: newTotal.anxiety / newCount,
        lethargy: newTotal.lethargy / newCount,
      });

      setMessage('');
    } catch (err) {
      console.error('메시지 전송 실패:', err);
    }
  };



  return (
    <div className="w-full px-6 py-6 border-t border-gray-200 bg-gradient-to-br from-blue-50 via-white to-purple-150">
      <div className="max-w-4xl mx-auto">
        <div className="relative">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-100 transition-all duration-200 hover:shadow-xl">
            <div className="flex items-center">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="당신의 이야기를 자유롭게 이야기해주세요 !"
                className="flex-1 px-6 py-4 bg-transparent resize-none focus:outline-none text-gray-800 placeholder-gray-500 min-h-[56px] max-h-32 text-base"
                rows={1}
                style={{
                  height: 'auto',
                  minHeight: '56px',
                  maxHeight: '128px'
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 128) + 'px';
                }}
              />
              
              <button
                onClick={handleSend}
                disabled={!message.trim()}
                className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 mr-2 ${
                  message.trim()
                    ? 'bg-transparent text-gray-600 hover:scale-125'
                    : 'bg-transparent text-gray-400 cursor-not-allowed'
                }`}
                style={{ outline: 'none', border: 'none' }}
              >
                <img src={sendIcon} alt="보내기" className="w-13 h-13" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
