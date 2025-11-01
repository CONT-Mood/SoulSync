from fastapi import APIRouter, Query
import os
import httpx

router = APIRouter(prefix="/crisis", tags=["crisis"])

# 항상 내려줄 24시간 핫라인(권한 거부 시에도 표시)
HOTLINES = [
    {"name": "자살위기 상담(국번없이 1393)", "phone": "1393", "desc": "24시간"},
    {"name": "정신건강 상담전화", "phone": "1577-0199", "desc": "24시간"},
    {"name": "보건복지상담센터", "phone": "129", "desc": "24시간"},
]

@router.get("/nearby")
async def nearby(
    lat: float = Query(..., description="WGS84 latitude"),
    lng: float = Query(..., description="WGS84 longitude"),
    radius: int = Query(3000, description="검색 반경(m) — Kakao Local API 최대 20000")
):
    """
    좌표 기반으로 주변 '정신건강의학과/상담센터'를 거리순으로 반환.
    KAKAO_REST_KEY가 없으면 핫라인만 반환.
    """
    out = {"hotlines": HOTLINES, "places": []}

    kakao_key = os.getenv("KAKAO_REST_KEY")
    if not kakao_key:
        # 키 없으면 기본 핫라인만
        return out

    headers = {"Authorization": f"KakaoAK {kakao_key}"}
    url = "https://dapi.kakao.com/v2/local/search/keyword.json"
    keywords = ["정신건강의학과", "정신과", "상담센터"]

    places = []
    async with httpx.AsyncClient(timeout=10) as client:
        for q in keywords:
            r = await client.get(
                url, headers=headers,
                params={"query": q, "x": lng, "y": lat, "radius": radius, "sort": "distance"}
            )
            r.raise_for_status()
            for d in r.json().get("documents", []):
                places.append({
                    "id": d["id"],
                    "name": d["place_name"],
                    "address": d["road_address_name"] or d["address_name"],
                    "phone": d["phone"],
                    "distance_m": int(d.get("distance") or 0),
                    "lat": float(d["y"]),
                    "lng": float(d["x"]),
                    "url": d["place_url"],
                    "category": d["category_name"],
                })

    # 중복 제거 + 거리순 정렬
    seen, dedup = set(), []
    for p in sorted(places, key=lambda x: x["distance_m"]):
        if p["id"] in seen:
            continue
        seen.add(p["id"])
        dedup.append(p)

    out["places"] = dedup[:20]
    return out