const STORAGE_KEY = "monkeyturnv-counter-v01";
const SETS = [1, 2, 4, 5, 6];

const COUNTERS = {
  games: { name: "総ゲーム数", unit: "G", type: "games", defaultVisible: true },
  atHit: { name: "AT初当たり", unit: "回", denom: "games", defaultVisible: true },
  fiveCoin: { name: "5枚役", unit: "回", denom: "games", defaultVisible: false },
  directAT: { name: "AT直撃", unit: "回", defaultVisible: false },
};

const RARE_COUNTERS = {
  weakCherry: { name: "弱チェリー", unit: "回", denom: "games" },
  strongCherry: { name: "強チェリー", unit: "回", denom: "games" },
  weakChance: { name: "弱チャンス目", unit: "回", denom: "games" },
  strongChance: { name: "強チャンス目", unit: "回", denom: "games" },
  boat: { name: "ボート", unit: "回", denom: "games" },
};

const PUBLIC_VALUES = {
  atHit: { label: "AT初当たり", values: { 1: 299.8, 2: 295.5, 4: 258.8, 5: 235.7, 6: 222.9 } },
  fiveCoin: { label: "5枚役", values: { 1: 38.15, 2: 36.86, 4: 30.27, 5: 24.51, 6: 22.53 } },
  directStrong: { label: "AT直撃 強チェリー・強チャンス目契機", values: { 1: 0.4, 2: 1.2, 4: 2.0, 5: 3.9, 6: 6.3 } },
  directWeakChance: { label: "AT直撃 弱チャンス目契機", values: { 1: null, 2: null, 4: 0.8, 5: 2.0, 6: 3.1 } },
  directWeak: { label: "AT直撃 弱チェリー・ボート契機", values: { 1: null, 2: null, 4: 0.4, 5: 0.4, 6: 0.4 } },
};

const DEFAULT_STATE = {
  data: { games: 0, atHit: 0, fiveCoin: 0, directAT: 0, weakCherry: 0, strongCherry: 0, weakChance: 0, strongChance: 0, boat: 0 },
  visible: { games: true, atHit: true, fiveCoin: false, directAT: false, rare: false },
  gameStep: { plus: 500, minus: 100 },
};

let state = loadState();
let holdTimer = null;

document.addEventListener("DOMContentLoaded", () => {
  bindStaticEvents();
  renderAll();
  registerServiceWorker();
});

function bindStaticEvents() {
  document.getElementById("openSettings").addEventListener("click", () => showScreen("settings"));
  document.getElementById("judgeNav").addEventListener("click", () => showScreen("judge"));
  document.getElementById("rareNav").addEventListener("click", () => showScreen("rare"));
  document.getElementById("resetData").addEventListener("click", resetData);

  document.querySelectorAll(".back").forEach((button) => {
    button.addEventListener("click", () => showScreen(button.dataset.screen));
  });

  document.getElementById("gamePlusStep").addEventListener("change", (e) => {
    state.gameStep.plus = Number(e.target.value);
    saveState();
    renderAll();
  });

  document.getElementById("gameMinusStep").addEventListener("change", (e) => {
    state.gameStep.minus = Number(e.target.value);
    saveState();
    renderAll();
  });
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return deepMerge(structuredClone(DEFAULT_STATE), saved || {});
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

function deepMerge(base, override) {
  for (const key of Object.keys(override)) {
    if (override[key] && typeof override[key] === "object" && !Array.isArray(override[key]) && base[key] && typeof base[key] === "object") {
      deepMerge(base[key], override[key]);
    } else {
      base[key] = override[key];
    }
  }
  return base;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach((screen) => screen.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  renderAll();
}

function renderAll() {
  renderHome();
  renderSettings();
  renderJudge();
  renderRare();
}

function renderHome() {
  const counterList = document.getElementById("counterList");
  counterList.innerHTML = Object.entries(COUNTERS)
    .filter(([key]) => state.visible[key])
    .map(([key, config]) => counterRowHtml(key, config))
    .join("");

  document.getElementById("rareNav").classList.toggle("hidden", !state.visible.rare);
  bindCounterEvents(counterList);
}

function counterRowHtml(key, config) {
  const value = state.data[key] || 0;

  if (config.type === "games") {
    return `<div class="counter-row">
      <div class="counter-top">
        <div class="counter-name">${config.name}</div>
        <div class="counter-value editable-value" data-key="${key}">${value}${config.unit}</div>
        <button class="small-button game-button" data-action="change" data-key="${key}" data-delta="${state.gameStep.plus}">＋${state.gameStep.plus}</button>
        <button class="small-button game-button" data-action="change" data-key="${key}" data-delta="-${state.gameStep.minus}">－${state.gameStep.minus}</button>
      </div>
    </div>`;
  }

  return `<div class="counter-row">
    <div class="counter-top">
      <div class="counter-name">${config.name}</div>
      <div class="counter-value editable-value" data-key="${key}">${value}${config.unit}</div>
      <button class="small-button" data-action="change" data-key="${key}" data-delta="1">＋</button>
      <button class="small-button" data-action="change" data-key="${key}" data-delta="-1">－</button>
    </div>
    <div class="counter-rate">${config.denom ? formatRate(value, state.data[config.denom]) : ""}</div>
  </div>`;
}

function renderRare() {
  const rareList = document.getElementById("rareList");
  rareList.innerHTML = Object.entries(RARE_COUNTERS).map(([key, config]) => counterRowHtml(key, config)).join("");
  bindCounterEvents(rareList);
}

function bindCounterEvents(root) {
  root.querySelectorAll("[data-action='change']").forEach((button) => {
    button.addEventListener("click", () => changeValue(button.dataset.key, Number(button.dataset.delta)));
  });

  root.querySelectorAll(".editable-value").forEach((el) => {
    el.addEventListener("touchstart", () => startHold(el.dataset.key), { passive: true });
    el.addEventListener("touchend", cancelHold);
    el.addEventListener("touchcancel", cancelHold);
    el.addEventListener("mousedown", () => startHold(el.dataset.key));
    el.addEventListener("mouseup", cancelHold);
    el.addEventListener("mouseleave", cancelHold);
    el.addEventListener("contextmenu", (e) => e.preventDefault());
  });
}

function changeValue(key, delta) {
  state.data[key] = Math.max(0, (state.data[key] || 0) + delta);
  saveState();
  renderAll();
}

function startHold(key) {
  cancelHold();
  holdTimer = setTimeout(() => promptValue(key), 550);
}

function cancelHold() {
  if (holdTimer) clearTimeout(holdTimer);
  holdTimer = null;
}

function promptValue(key) {
  const label = COUNTERS[key]?.name || RARE_COUNTERS[key]?.name || key;
  const current = state.data[key] || 0;
  const input = prompt(`${label}を入力`, String(current));
  if (input === null) return;
  const next = Math.max(0, Math.floor(Number(input)));
  if (!Number.isFinite(next)) return;
  state.data[key] = next;
  saveState();
  renderAll();
}

function renderSettings() {
  const displaySettings = document.getElementById("displaySettings");
  const items = [
    ["games", "総ゲーム数", true],
    ["atHit", "AT初当たり", true],
    ["fiveCoin", "5枚役", false],
    ["directAT", "AT直撃", false],
    ["rare", "レア小役", false],
  ];

  displaySettings.innerHTML = items.map(([key, label, fixed]) => `<label class="setting-row">
    <span>${label}</span>
    <input type="checkbox" data-visible-key="${key}" ${state.visible[key] ? "checked" : ""} ${fixed ? "disabled" : ""}>
  </label>`).join("");

  displaySettings.querySelectorAll("[data-visible-key]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const key = checkbox.dataset.visibleKey;
      if (key === "games" || key === "atHit") return;
      state.visible[key] = checkbox.checked;
      saveState();
      renderAll();
    });
  });

  const options = [50, 100, 150, 200, 250, 300, 500, 1000].map((n) => `<option value="${n}">${n}</option>`).join("");
  const plus = document.getElementById("gamePlusStep");
  const minus = document.getElementById("gameMinusStep");
  plus.innerHTML = options;
  minus.innerHTML = options;
  plus.value = String(state.gameStep.plus);
  minus.value = String(state.gameStep.minus);
}

function renderJudge() {
  renderBars();
  renderJudgeDetails();
}

function renderBars() {
  const probs = calculateProbabilities();
  const values = Object.values(probs);
  const max = Math.max(...values);
  const min = Math.min(...values);

  document.getElementById("probBars").innerHTML = Object.entries(probs).map(([setting, percent]) => {
    const colorClass = percent === max ? "max" : percent === min ? "min" : "";
    return `<div class="bar-row">
      <div>設定${setting}</div>
      <div class="track"><div class="fill ${colorClass}" style="width:${Math.max(1, percent)}%"></div></div>
      <div>${percent}%</div>
    </div>`;
  }).join("");
}

function calculateProbabilities() {
  const scores = Object.fromEntries(SETS.map((setting) => [setting, 1]));
  const games = state.data.games || 0;

  applyPoisson(scores, "atHit", PUBLIC_VALUES.atHit.values, 0.35);
  if (state.visible.fiveCoin || state.data.fiveCoin > 0) applyPoisson(scores, "fiveCoin", PUBLIC_VALUES.fiveCoin.values, 1.0);

  const direct = state.data.directAT || 0;
  if (direct > 0) {
    const directWeight = { 1: 0.4, 2: 1.2, 4: 2.0, 5: 3.9, 6: 6.3 };
    for (const setting of SETS) scores[setting] *= Math.pow(directWeight[setting], direct);
  }

  function applyPoisson(scoresObj, key, rates, weight) {
    const count = state.data[key] || 0;
    if (!games) return;
    for (const setting of SETS) {
      const p = 1 / rates[setting];
      const lambda = Math.max(games * p, 1e-9);
      const logLikelihood = count * Math.log(lambda) - lambda;
      scoresObj[setting] *= Math.exp(logLikelihood * weight);
    }
  }

  const total = Object.values(scores).reduce((sum, x) => sum + x, 0) || 1;
  const raw = Object.fromEntries(SETS.map((setting) => [setting, (scores[setting] / total) * 100]));
  return roundToHundred(raw);
}

function roundToHundred(raw) {
  const entries = Object.entries(raw).map(([key, value]) => ({ key, floor: Math.floor(value), rest: value - Math.floor(value) }));
  let sum = entries.reduce((s, x) => s + x.floor, 0);
  entries.sort((a, b) => b.rest - a.rest);
  for (let i = 0; sum < 100 && i < entries.length; i++, sum++) entries[i].floor += 1;
  entries.sort((a, b) => Number(a.key) - Number(b.key));
  return Object.fromEntries(entries.map((x) => [x.key, x.floor]));
}

function renderJudgeDetails() {
  document.getElementById("judgeDetails").innerHTML = [
    detailRateHtml("fiveCoin", PUBLIC_VALUES.fiveCoin),
    detailRateHtml("atHit", PUBLIC_VALUES.atHit),
    directDetailHtml(),
  ].join("");
}

function detailRateHtml(key, info) {
  const count = state.data[key] || 0;
  const games = state.data.games || 0;
  const rateNumber = count && games ? games / count : null;
  const rate = rateNumber ? `1/${trim(rateNumber, 1)}` : "-";
  const near = nearestSetting(rateNumber, info.values);
  const lines = Object.entries(info.values).map(([setting, value]) => `設定${setting}　1/${value}`).join("<br>");

  return `<details>
    <summary>
      <div class="detail-head">
        <div>
          <div class="detail-title">${info.label}</div>
          <div class="detail-rate">${rate}</div>
          <div class="near">（${near}）</div>
        </div>
        <div class="chev">▼</div>
      </div>
    </summary>
    <div class="pub">${lines}</div>
  </details>`;
}

function directDetailHtml() {
  const blocks = [PUBLIC_VALUES.directStrong, PUBLIC_VALUES.directWeakChance, PUBLIC_VALUES.directWeak].map((info) => {
    const lines = Object.entries(info.values).map(([setting, value]) => `設定${setting}　${value === null ? "-" : value + "%"}`).join("<br>");
    return `<div><b>${info.label}</b><br>${lines}</div>`;
  }).join("<br>");

  return `<details>
    <summary>
      <div class="detail-head">
        <div>
          <div class="detail-title">AT直撃</div>
          <div class="detail-rate">${state.data.directAT || 0}回</div>
        </div>
        <div class="chev">▼</div>
      </div>
    </summary>
    <div class="pub">${blocks}</div>
  </details>`;
}

function nearestSetting(rate, values) {
  if (!rate || !Number.isFinite(rate)) return "-";
  let bestSetting = null;
  let bestDiff = Infinity;
  for (const [setting, value] of Object.entries(values)) {
    if (value === null) continue;
    const diff = Math.abs(rate - value);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestSetting = setting;
    }
  }
  return bestSetting ? `設定${bestSetting}近似値` : "-";
}

function formatRate(count, denominator) {
  if (!count || !denominator) return "-";
  return `1/${trim(denominator / count, 1)}`;
}

function trim(value, digits) {
  return Number(value.toFixed(digits)).toString();
}

function resetData() {
  if (!confirm("現在の実戦データをリセットしますか？")) return;
  const visible = structuredClone(state.visible);
  const gameStep = structuredClone(state.gameStep);
  state = structuredClone(DEFAULT_STATE);
  state.visible = visible;
  state.gameStep = gameStep;
  saveState();
  renderAll();
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  }
}
