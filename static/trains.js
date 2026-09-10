"use strict";

const form = document.querySelector("#search-form");
const fields = document.querySelector("#search-fields");
const departure = document.querySelector("#departure");
const arrival = document.querySelector("#arrival");
const date = document.querySelector("#date");
const button = document.querySelector("#search-button");
const results = document.querySelector("#results");
const status = document.querySelector("#status");
const summary = document.querySelector("#summary");
const tableWrap = document.querySelector("#table-wrap");
const tbody = document.querySelector("#train-rows");
const stationNames = { "3900023": "서울", "3900114": "부산" };

function showStatus(message, error = false) {
  status.textContent = message;
  status.classList.toggle("error", error);
}

function readRows(data) {
  if (!data || typeof data !== "object") throw new Error("shape");
  const header = data.response?.header ?? data.header;
  const code = header?.resultCode ?? data.resultCode;
  if (data.status === "error" || (code != null && !["0", "00", "0000", "INFO-000"].includes(String(code)))) {
    throw new Error("api");
  }
  const body = data.response?.body ?? data.body ?? data;
  const rows = Array.isArray(body) ? body : body.data ?? body.items?.item ?? body.items;
  if (Array.isArray(rows)) return rows;
  if (rows && typeof rows === "object") return [rows];
  if (Number(body.totalCount) === 0 || Number(body.total_count) === 0) return [];
  throw new Error("shape");
}

function pick(row, keys) {
  for (const key of keys) {
    if (row[key] != null && String(row[key]).trim() !== "") return String(row[key]).trim();
  }
  return "";
}

function normalize(row) {
  if (!row || typeof row !== "object") throw new Error("shape");
  const dep = pick(row, ["dptre_stn_nm", "dep_stn_nm", "departure", "depplacename", "dptre_stn_cd"]);
  const arr = pick(row, ["arvl_stn_nm", "arr_stn_nm", "arrival", "arrplacename", "arvl_stn_cd"]);
  const train = pick(row, ["trn_no", "train_no", "trainNo", "trainno"]);
  const depTime = pick(row, ["trn_plan_dptre_dt", "trn_plan_dptre_dtm", "dptre_dt", "departure_time", "depplandtime"]);
  const arrTime = pick(row, ["trn_plan_arvl_dt", "trn_plan_arvl_dtm", "arvl_dt", "arrival_time", "arrplandtime"]);
  if (!dep || !arr || !train || !depTime || !arrTime) throw new Error("shape");
  return { train, dep: stationNames[dep] ?? dep, arr: stationNames[arr] ?? arr, depTime, arrTime };
}

function formatTime(value) {
  const digits = value.replace(/\D/g, "");
  if (/^\d{12}(\d{2})?$/.test(digits)) return `${digits.slice(8, 10)}:${digits.slice(10, 12)}`;
  if (/^\d{4}(\d{2})?$/.test(digits)) return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
  return value;
}

function validateStations() {
  arrival.setCustomValidity(departure.value === arrival.value ? "출발역과 도착역은 달라야 합니다." : "");
}
departure.addEventListener("change", validateStations);
arrival.addEventListener("change", validateStations);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  validateStations();
  if (!form.reportValidity() || fields.disabled) return;
  const search = { departure: departure.value, arrival: arrival.value, date: date.value };
  const params = new URLSearchParams(search);
  tbody.replaceChildren();
  tableWrap.hidden = true;
  summary.hidden = true;
  fields.disabled = true;
  results.setAttribute("aria-busy", "true");
  button.textContent = "조회 중…";
  showStatus("열차 운행정보를 조회하고 있습니다.");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`/api/trains?${params}`, { method: "GET", signal: controller.signal, headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("http");
    const rows = readRows(await response.json()).map(normalize)
      .filter(row => row.dep === search.departure && row.arr === search.arrival)
      .sort((a, b) => a.depTime.replace(/\D/g, "").localeCompare(b.depTime.replace(/\D/g, "")));
    const unique = [...new Map(rows.map(row => [JSON.stringify(row), row])).values()];
    summary.textContent = `${search.departure} → ${search.arrival} · ${search.date} · 조회 결과 ${unique.length}건`;
    summary.hidden = false;
    for (const row of unique) {
      const tr = document.createElement("tr");
      for (const value of [row.train, row.dep, formatTime(row.depTime), row.arr, formatTime(row.arrTime)]) {
        const td = document.createElement("td");
        td.textContent = value;
        tr.append(td);
      }
      tbody.append(tr);
    }
    tableWrap.hidden = unique.length === 0;
    showStatus(unique.length ? "열차 운행정보 조회가 완료되었습니다." : "해당 날짜의 열차 운행정보가 없습니다");
  } catch (error) {
    showStatus(error.name === "AbortError" ? "조회 시간이 초과되었습니다. 잠시 후 다시 조회해 주세요." : "열차 운행정보를 불러오지 못했습니다. 잠시 후 다시 조회해 주세요.", true);
  } finally {
    clearTimeout(timeout);
    fields.disabled = false;
    results.setAttribute("aria-busy", "false");
    button.textContent = "조회";
  }
});
