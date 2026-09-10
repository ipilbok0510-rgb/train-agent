import os
from datetime import datetime
from urllib.parse import unquote

import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request

# .env 파일의 환경변수를 불러온다.
load_dotenv()

app = Flask(__name__)

# 한국철도공사_열차운행정보 API
TRAIN_PLAN_URL = (
    "https://apis.data.go.kr/B551457/run/v2/travelerTrainRunPlan2"
)

# 이번 프로젝트에서 사용하는 역
STATIONS = {
    "서울": "3900023",
    "부산": "3900114",
}


def get_api_key():
    """환경변수에서 인증키를 읽는다."""
    api_key = os.getenv("API_KEY", "").strip()

    if not api_key:
        raise RuntimeError(
            ".env 파일에 API_KEY가 없습니다."
        )

    # 공공데이터포털에서 받은 키가 URL 인코딩된 형태여도
    # requests가 다시 안전하게 인코딩할 수 있도록 한 번 풀어준다.
    return unquote(api_key)


def validate_search(departure, arrival, date_text):
    """사용자 입력값을 검사하고 API용 날짜로 변환한다."""
    if departure not in STATIONS:
        raise ValueError("출발역은 서울 또는 부산이어야 합니다.")

    if arrival not in STATIONS:
        raise ValueError("도착역은 서울 또는 부산이어야 합니다.")

    if departure == arrival:
        raise ValueError("출발역과 도착역은 달라야 합니다.")

    try:
        date_value = datetime.strptime(date_text, "%Y-%m-%d")
    except ValueError as exc:
        raise ValueError("날짜 형식은 YYYY-MM-DD 이어야 합니다.") from exc

    return date_value.strftime("%Y%m%d")


def request_train_plan(departure, arrival, run_date, page_no=1):
    """한국철도공사 열차 운행계획 API의 한 페이지를 요청한다."""
    params = {
        "serviceKey": get_api_key(),
        "pageNo": page_no,
        "numOfRows": 100,
        "returnType": "JSON",
        "cond[run_ymd::GTE]": run_date,
        "cond[run_ymd::LTE]": run_date,
    }

    response = requests.get(
        TRAIN_PLAN_URL,
        params=params,
        timeout=10,
    )
    response.raise_for_status()

    return response.json()


@app.route("/", methods=["GET"])
def index():
    """HTML 조회 화면."""
    return render_template("index.html")


@app.route("/health", methods=["GET"])
def health():
    """서비스 상태 확인용."""
    return jsonify({"status": "ok"})


@app.route("/api/trains", methods=["GET"])
def trains():
    """
    HTML 화면에서 호출할 조회 API.

    예:
    /api/trains?departure=서울&arrival=부산&date=2026-09-12

    현재 버전은 먼저 API 연결을 검증하기 위해
    공공데이터의 JSON 응답을 그대로 반환한다.
    다음 단계에서 필요한 필드 추출과 전체 페이지 조회를 추가한다.
    """
    departure = request.args.get("departure", "").strip()
    arrival = request.args.get("arrival", "").strip()
    date_text = request.args.get("date", "").strip()

    try:
        run_date = validate_search(
            departure,
            arrival,
            date_text,
        )

        data = request_train_plan(
            departure,
            arrival,
            run_date,
        )

        return jsonify(data)

    except ValueError as exc:
        return jsonify({
            "status": "error",
            "message": str(exc),
        }), 400

    except RuntimeError as exc:
        return jsonify({
            "status": "error",
            "message": str(exc),
        }), 500

    except requests.Timeout:
        return jsonify({
            "status": "error",
            "message": "공공데이터 API 응답 시간이 초과되었습니다.",
        }), 504

    except requests.RequestException as exc:
        # 인증키나 요청 URL 전체가 사용자 화면에 노출되지 않도록
        # 상세 예외 문자열은 반환하지 않는다.
        print(f"API request failed: {type(exc).__name__}")

        return jsonify({
            "status": "error",
            "message": "공공데이터 API 호출에 실패했습니다.",
        }), 502


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True,
    )
