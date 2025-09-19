import axios from 'axios';

// ✅ 백엔드 허용 값과 동일하게 타입 정의
export type CharacterKey = 'insightful' | 'trauma_sensitive' | 'empathic' | 'pragmatic';

const API = axios.create({
  baseURL: 'http://localhost:8000/chat', // 현재 구조 유지 (원래 코드 그대로)
  headers: { 'Content-Type': 'application/json' },
});

export const sendChatMessage = async (
  user_id: string,
  character: CharacterKey, // ✅ 여기 타입 교체
  message: string,
  show_emotion_score: boolean = false
) => {
  const response = await API.post('/', {
    user_id,
    character,
    message,
    show_emotion_score,
  });

  return response.data; // { reply: "...", emotion_score: {...} }
};
