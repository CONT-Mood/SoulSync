// src/pages/ChatLog.tsx
import { useEffect, useMemo, useState } from "react";
import { getChatDates, getChatsByDate } from "../api/chatLog";
import type { ChatPair } from "../api/chatLog";

const dateTabLabel = (d: string) =>
  new Date(d).toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });

export default function ChatLog() {
  const userId =
    (typeof window !== "undefined" && localStorage.getItem("user_id")) || "testuser";

  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatPair[]>([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  }, []);

  // 1) 날짜 목록
  useEffect(() => {
    let mounted = true;
    setLoadingDates(true);
    (async () => {
      try {
        const list = await getChatDates(userId);
        if (!mounted) return;
        const sorted = [...list].sort((a, b) => +new Date(b) - +new Date(a));
        setDates(sorted);
        setSelectedDate(sorted.includes(todayStr) ? todayStr : sorted[0] ?? null);
      } finally {
        mounted && setLoadingDates(false);
      }
    })();
    return () => { mounted = false; };
  }, [userId, todayStr]);

  // 2) 선택일 메시지
  useEffect(() => {
    if (!selectedDate) return setMessages([]);
    let mounted = true;
    setLoadingMsgs(true);
    (async () => {
      try {
        const data = await getChatsByDate(userId, selectedDate);
        if (!mounted) return;
        setMessages(data.messages || []);
      } finally {
        mounted && setLoadingMsgs(false);
      }
    })();
    return () => { mounted = false; };
  }, [userId, selectedDate]);

  return (
    <div className="w-full h-screen overflow-y-auto
      bg-gradient-to-b from-indigo-50 via-white to-white p-6">
      <div className="max-w-3xl mx-auto">
        {/* 날짜 탭 */}
        <div className="mb-3">
          <div className="flex flex-wrap gap-2">
            {loadingDates ? (
              <span className="text-slate-500 text-sm">날짜 불러오는 중…</span>
            ) : dates.length ? (
              dates.map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDate(d)}
                  className={`px-3 py-1.5 rounded-xl text-sm transition-all shadow-sm
                    ${selectedDate === d
                      ? "bg-violet-100 text-violet-700 ring-1 ring-violet-200"
                      : "bg-white text-slate-700 hover:bg-slate-50 ring-1 ring-slate-200"}`}
                >
                  {dateTabLabel(d)}
                </button>
              ))
            ) : (
              <span className="text-slate-400 text-sm">저장된 날짜가 없습니다.</span>
            )}
          </div>
        </div>

        {/* 날짜/대화 구분선 */}
        <div className="relative mb-6">
          {/* 가운데 날짜 칩 */}
          {selectedDate && (
            <div className="absolute inset-x-0 -top-3 flex justify-center">
              <span className="px-3 py-1 rounded-full text-xs font-medium
                bg-white text-violet-700 ring-1 ring-violet-200 shadow-sm">
                {dateTabLabel(selectedDate)}
              </span>
            </div>
          )}
          {/* 선 */}
          <div className="h-[2px] w-full rounded-full bg-gradient-to-r
              from-indigo-400/60 via-indigo-300/40 to-indigo-400/60"></div>
        </div>

        {/* 메시지 리스트 */}
        <div className="space-y-6"> {/* ⬅️ 간격 더 넓게 */}
          {loadingMsgs ? (
            <div className="text-center text-slate-500">대화를 불러오는 중…</div>
          ) : messages.length ? (
            messages.map((msg, i) => {
              const isUser = msg.sender === "user";
              return (
                <div
                  key={`${msg.timestamp || i}-${i}`}
                  className={`flex ${isUser ? "justify-start" : "justify-end"} px-4`} // ⬅️ 좌우 여유 폭
                >
                  <div className={`max-w-[86%] ${isUser ? "items-start" : "items-end"} flex flex-col`}> {/* ⬅️ 더 넓게 */}
                    <div
                      className={[
                        // 말풍선 자체 크게: 폰트/패딩/라인간격 업
                        "px-5 py-3 rounded-2xl text-[16px] leading-7 whitespace-pre-wrap break-words select-text",
                        // 공통 윤곽/그림자
                        "ring-1 shadow-[0_14px_30px_-18px_rgba(99,102,241,0.4)]",
                        isUser
                          ? "bg-gradient-to-b from-violet-400/95 to-indigo-500/95 text-white ring-indigo-500/30"
                          : "bg-white text-slate-900 ring-slate-200"
                      ].join(" ")}
                    >
                      {msg.message}
                    </div>
                    {/* ⛔ 시간 표기 제거 (요청사항) */}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-slate-400">이 날짜의 대화가 없습니다.</div>
          )}
        </div>
      </div>
    </div>
  );
}
