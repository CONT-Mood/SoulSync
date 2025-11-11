import { useNavigate } from "react-router-dom";
import { useCharacter } from "../contexts/CharacterContext";
import { useEffect, useMemo, useState } from "react";
import { getChatDates, getSummaryByDate } from "../api/chatLog";
import heartimg from "../assets/heart.png";

type EmotionScore = {
  depression: number;
  anxiety: number;
  lethargy: number;
};

type ChatSidebarProps = {
  onSelectChat: (id: number) => void;
  onClose: () => void;
  emotionScore: EmotionScore;
};

const getDateString = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });
};

const getFullDateString = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
};

const MiniGauge = ({ scores }: { scores: EmotionScore }) => {
  const items = [
    { key: "depression" as const, label: "우울" },
    { key: "anxiety" as const, label: "불안" },
    { key: "lethargy" as const, label: "무기력" },
  ];

  return (
    <div className="space-y-3">
      {items.map(({ key, label }) => (
        <div key={key}>
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span className="font-medium text-gray-800">{label}</span>
            <span className="font-semibold text-gray-900">{scores[key]}%</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
              style={{ width: `${Math.max(0, Math.min(100, scores[key]))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const ChatSidebar = ({ onClose, emotionScore }: ChatSidebarProps) => {
  const navigate = useNavigate();
  const { selectedCharacter } = useCharacter();

  const userId =
    (typeof window !== "undefined" && localStorage.getItem("user_id")) ||
    "testuser";

  const [showGauge, setShowGauge] = useState(false);

  // 날짜/요약 상태
  const [dates, setDates] = useState<string[]>([]);
  const [datesLoading, setDatesLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [summary, setSummary] = useState<string>("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(true);

  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);

  // 날짜 목록 로드
  useEffect(() => {
    let mounted = true;
    setDatesLoading(true);
    (async () => {
      try {
        const list = await getChatDates(userId);
        if (!mounted) return;
        const sorted = [...list].sort(
          (a, b) => new Date(b).getTime() - new Date(a).getTime()
        );
        setDates(sorted);
        setSelectedDate((prev) =>
          prev ?? (sorted.includes(todayStr) ? todayStr : sorted[0] ?? null)
        );
      } catch (e) {
        console.error("getChatDates error:", e);
        setDates([]);
        setSelectedDate(null);
      } finally {
        mounted && setDatesLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [userId, todayStr]);

  // 특정 날짜의 요약 로드
  useEffect(() => {
    if (!selectedDate) {
      setSummary("");
      return;
    }
    let mounted = true;
    setSummaryLoading(true);
    (async () => {
      try {
        const s = await getSummaryByDate(userId, selectedDate);
        if (!mounted) return;

        let text = "";
        if (typeof s === "string") {
          text = s;
        } else if (s && typeof s === "object") {
          const obj = s as { summary?: string; data?: { summary?: string } };
          text = obj.summary ?? obj.data?.summary ?? "";
        }
        setSummary(text);
      } catch (e) {
        console.error("getSummaryByDate error:", e);
        mounted && setSummary("");
      } finally {
        mounted && setSummaryLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [userId, selectedDate]);

  return (
    <div className="w-80 bg-white border-r border-gray-200 h-full flex flex-col">
      {/* 헤더 */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">상담 내역</h2>
              <p className="text-sm text-gray-500">{selectedCharacter?.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-300/80"
            aria-label="Close sidebar"
          >
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="text-sm text-gray-600">
          {selectedDate
            ? getFullDateString(selectedDate)
            : datesLoading
            ? "불러오는 중..."
            : "-"}
        </div>
      </div>

      {/* 날짜 선택 */}
      <div className="px-4 py-2 border-b border-gray-100">
        <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
          {dates.map((date) => (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              className={`px-3 py-2 text-sm rounded-lg whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-purple-300/60 ${
                selectedDate === date
                  ? "bg-blue-100 text-blue-700 font-semibold"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {getDateString(date)}
            </button>
          ))}
          {dates.length === 0 && !datesLoading && (
            <span className="text-xs text-gray-400">저장된 날짜가 없습니다</span>
          )}
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="px-4 pt-3">
        <button
          onClick={() => setSummaryOpen((v) => !v)}
          className="w-full flex items-center justify-between bg-indigo-50 hover:bg-indigo-100 transition-colors rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-300/80"
        >
          <span className="text-sm font-semibold text-indigo-800">
            {selectedDate ? `${getDateString(selectedDate)} 분석` : "감정 분석"}
          </span>
        </button>

        {summaryOpen && (
          <div className="mt-2 mb-2 bg-gray-50 rounded-xl p-3 text-sm text-gray-700 border border-gray-200">
            {summaryLoading ? (
              <span className="text-gray-500">감정 분석 중…</span>
            ) : summary ? (
              <p className="whitespace-pre-wrap leading-relaxed">{summary}</p>
            ) : (
              <span className="text-gray-400">이 날짜에는 감정 분석 가능 내역이 없습니다.</span>
            )}
          </div>
        )}
      </div>

      <div className="flex-1" />

      {/* 하단 버튼 */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        {showGauge && (
          <div className="mb-2 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50 p-4 shadow-[0_6px_20px_rgba(0,0,0,0.06)]">
            <MiniGauge scores={emotionScore} />
          </div>
        )}

        <button
          onClick={() => setShowGauge((v) => !v)}
          className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-800 py-3 px-4 rounded-xl font-semibold hover:bg-gray-50 transition-all hover:shadow-lg hover:scale-105"
        >
          <img
            src={heartimg}
            alt="게이지 아이콘"
            className={`w-5 h-5 ${showGauge ? "opacity-40" : "opacity-100"} transition-opacity`}
          />
          {showGauge ? "게이지 숨기기" : "위험 게이지"}
        </button>

        <button
          onClick={() => navigate("/chatlog")}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-300/60"
        >
          전체 상담 내역 보기
        </button>
      </div>
    </div>
  );
};

export default ChatSidebar;
