// src/pages/ChatLog.tsx
import { useEffect, useMemo, useState } from "react";
import { getChatDates, getChatsByDate } from "../api/chatLog";
import type { ChatPair } from "../api/chatLog";

const dateTabLabel = (d: string) =>
  new Date(d).toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });

const timeLabel = (ts: string) => {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const ChatLog = () => {
  // ✅ userId 가져오기 (프로젝트 규칙에 맞게 교체 가능)
  const userId =
    (typeof window !== "undefined" && localStorage.getItem("user_id")) || "testuser";

  // 날짜 목록 + 선택일
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // 선택일의 메시지
  const [messages, setMessages] = useState<ChatPair[]>([]);

  // 로딩 상태
  const [loadingDates, setLoadingDates] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);

  // 1) 날짜 목록 로드
  useEffect(() => {
    let mounted = true;
    setLoadingDates(true);
    (async () => {
      try {
        const list = await getChatDates(userId); // ["YYYY-MM-DD", ...]
        if (!mounted) return;
        const sorted = [...list].sort((a, b) => +new Date(b) - +new Date(a));
        setDates(sorted);
        setSelectedDate(sorted.includes(todayStr) ? todayStr : sorted[0] ?? null);
      } catch (e) {
        console.error("getChatDates error:", e);
        setDates([]);
        setSelectedDate(null);
      } finally {
        if (mounted) setLoadingDates(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [userId, todayStr]);

  // 2) 선택일 메시지 로드
  useEffect(() => {
    if (!selectedDate) {
      setMessages([]);
      return;
    }
    let mounted = true;
    setLoadingMsgs(true);
    (async () => {
      try {
        const data = await getChatsByDate(userId, selectedDate);
        if (!mounted) return;
        setMessages(data.messages || []);
      } catch (e) {
        console.error("getChatsByDate error:", e);
        if (!mounted) return;
        setMessages([]);
      } finally {
        if (mounted) setLoadingMsgs(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [userId, selectedDate]);

  return (
    <div className="w-full h-screen bg-white p-6 overflow-y-auto">
      {/* 날짜 탭 */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex flex-wrap gap-2">
          {loadingDates ? (
            <span className="text-gray-500 text-sm">날짜 불러오는 중…</span>
          ) : dates.length ? (
            dates.map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDate(d)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  selectedDate === d
                    ? "bg-blue-100 text-blue-700 font-semibold"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {dateTabLabel(d)}
              </button>
            ))
          ) : (
            <span className="text-gray-400 text-sm">저장된 날짜가 없습니다.</span>
          )}
        </div>
      </div>

      {/* 메시지 리스트 (현재 화면 스타일 최대한 유지) */}
      <div className="max-w-2xl mx-auto space-y-4">
        {loadingMsgs ? (
          <div className="text-center text-gray-500">대화를 불러오는 중…</div>
        ) : messages.length ? (
          messages.map((msg, i) => (
            <div
              key={`${msg.timestamp}-${i}`}
              className={`flex ${msg.sender === "user" ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`px-4 py-2 rounded-lg max-w-[70%] ${
                  msg.sender === "user" ? "bg-gray-500 text-white" : "bg-gray-300 text-black"
                }`}
                title={timeLabel(msg.timestamp)}
              >
                {msg.message}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-400">이 날짜의 대화가 없습니다.</div>
        )}
      </div>
    </div>
  );
};

export default ChatLog;
