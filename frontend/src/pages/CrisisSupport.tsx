import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

type Hotline = { name: string; phone: string; desc?: string };
type Place = {
  id: string; name: string; address: string; phone: string;
  distance_m: number; lat: number; lng: number; url: string; category: string;
};

const ITEMS_PER_PAGE = 5;
const CHILD_EXCLUDE_KEYWORDS = ["아동", "소아", "유아", "어린이", "청소년", "학생"];

const CrisisSupport = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fromChat = location.state?.fromChat === true;

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [hotlines, setHotlines] = useState<Hotline[]>([]);
  const [placesRaw, setPlacesRaw] = useState<Place[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [page, setPage] = useState(1);

  // 아동 관련 기관 제외 (이름/카테고리에 포함되면 제외)
  const places = useMemo(() => {
    const hasChildKeyword = (s: string) =>
      CHILD_EXCLUDE_KEYWORDS.some((kw) => s?.toLowerCase().includes(kw.toLowerCase()));
    return placesRaw.filter(
      (p) => !(hasChildKeyword(p.name || "") || hasChildKeyword(p.category || ""))
    );
  }, [placesRaw]);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setErr("이 브라우저는 위치 기능을 지원하지 않아요.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });

        fetch(`http://localhost:8000/crisis/nearby?lat=${lat}&lng=${lng}&radius=3000`)
          .then(async (r) => {
            if (!r.ok) throw new Error(await r.text());
            return r.json();
          })
          .then((data) => {
            setHotlines(data.hotlines || []);
            setPlacesRaw(data.places || []);
            setLoading(false);
          })
          .catch(() => {
            setErr("근처 정보를 불러오지 못했어요.");
            setLoading(false);
          });
      },
      () => {
        // 권한 거부 → 핫라인만
        fetch(`http://localhost:8000/crisis/nearby?lat=0&lng=0&radius=0`)
          .then((r) => r.json())
          .then((data) => {
            setHotlines(data.hotlines || []);
            setPlacesRaw([]);
            setErr("위치 권한이 없어 가까운 기관은 표시되지 않아요.");
            setLoading(false);
          })
          .catch(() => {
            setErr("정보를 불러오지 못했어요.");
            setLoading(false);
          });
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const handleReturn = () => {
    if (fromChat) navigate("/chat", { replace: true });
    else navigate("/");
  };

  const totalPages = Math.ceil(places.length / ITEMS_PER_PAGE) || 1;
  const current = Math.max(1, Math.min(page, totalPages));
  const currentItems = places.slice((current - 1) * ITEMS_PER_PAGE, current * ITEMS_PER_PAGE);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-lg font-semibold text-gray-700 animate-pulse">주변 정보를 불러오는 중…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 py-10 flex flex-col items-center">
      {/* 배경 장식: 로그인/캐릭터 스타일 참조 (은은한 블러 구체) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-3xl">
        {/* 헤더: 앱 톤 맞춤 */}
        <h1 className="text-3xl font-bold text-center mb-8">
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            당신의 안전이 가장 중요해요
          </span>
        </h1>

        {err && (
          <div className="bg-yellow-100 border border-yellow-300 text-sm p-3 mb-6 rounded-lg text-gray-800">
            {err}
          </div>
        )}

        {/* 핫라인 카드 */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3 border-b border-gray-200 pb-2 text-gray-800">
            24시간 상담 핫라인
          </h2>
          <div className="grid gap-4">
            {hotlines.map((h, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-xl p-4 border border-gray-100 flex items-center justify-between hover:shadow-2xl transition"
              >
                <div>
                  <div className="font-medium text-gray-900">{h.name}</div>
                  {h.desc && <div className="text-sm opacity-70 text-gray-600">{h.desc}</div>}
                </div>
                <a
                  href={`tel:${h.phone}`}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm shadow-sm hover:opacity-90 transition"
                >
                  {h.phone}
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* 근처 기관 리스트 */}
        <section className="mb-8">
          <div className="flex items-end justify-between mb-3">
            <h2 className="text-xl font-semibold border-b border-gray-200 pb-2 text-gray-800">
              가까운 병원/상담센터
            </h2>
            <div className="text-xs text-gray-500">
              총 {places.length}곳 · 페이지 {current}/{totalPages}
            </div>
          </div>

          {currentItems.length === 0 ? (
            <div className="text-sm opacity-70">표시할 근처 기관이 없어요.</div>
          ) : (
            <div className="grid gap-4">
              {currentItems.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl shadow-xl p-5 border border-gray-100 hover:shadow-2xl transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-lg text-gray-900">{p.name}</div>
                    {/* 거리 km 표기 */}
                    <div className="text-sm text-gray-700">약 {(p.distance_m / 1000).toFixed(1)} km</div>
                  </div>

                  <div className="text-sm text-gray-700">{p.address}</div>

                  <div className="mt-1 text-sm text-gray-700">
                    {p.phone ? (
                      <a href={`tel:${p.phone}`} className="underline text-blue-600">
                        {p.phone}
                      </a>
                    ) : (
                      "전화번호 정보 없음"
                    )}
                  </div>

                  <div className="mt-2 flex gap-3 text-sm">
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition"
                    >
                      상세 정보
                    </a>
                    {coords && (
                      <a
                        target="_blank"
                        rel="noreferrer"
                        href={`https://map.kakao.com/link/to/${encodeURIComponent(p.name)},${p.lat},${p.lng}`}
                        className="px-3 py-1 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition"
                      >
                        길찾기
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-6">
              <button
                disabled={current <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={`px-3 py-1 rounded-xl text-sm transition ${
                  current <= 1
                    ? "border border-gray-300 text-gray-500 cursor-not-allowed bg-gray-100"
                    : "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-sm hover:opacity-90"
                }`}
              >
                이전
              </button>
              ...
              <button
                disabled={current >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className={`px-3 py-1 rounded-xl text-sm transition ${
                  current >= totalPages
                    ? "border border-gray-300 text-gray-500 cursor-not-allowed bg-gray-100"
                    : "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-sm hover:opacity-90"
                }`}
              >
                다음
              </button>
            </div>
          )}
        </section>

        {/* 좌표 표시 (디버깅용, 기존 톤 살려 얇게) */}
        {coords && (
          <div className="text-xs opacity-60 text-center text-gray-500">
            현재 좌표: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </div>
        )}

        {/* 하단 버튼: 앱 공통 버튼 톤 */}
        <div className="flex justify-center mt-10">
          <button
            onClick={handleReturn}
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-sm hover:opacity-90 transition"
          >
            다시 상담 이어가기
          </button>
        </div>
      </div>
    </div>
  );
};

export default CrisisSupport;