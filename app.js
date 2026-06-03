const el = (id) => document.getElementById(id);

const inputs = [
  "roomWidth", "roomDepth", "roomHeight", "budget", "sceneType", "ambient",
  "frontWash", "spot", "moving", "par", "profile", "strip", "intensity", "mood", "cameraSafe"
];

const fixtureMeta = {
  frontWash: { label: "面光", color: "#e2a53a", role: "front" },
  spot: { label: "聚光", color: "#f2d36b", role: "key" },
  moving: { label: "摇头", color: "#6454b8", role: "effect" },
  par: { label: "染色", color: "#c14e2f", role: "color" },
  profile: { label: "轮廓", color: "#167f7a", role: "edge" },
  strip: { label: "灯带", color: "#5b8d49", role: "ambient" }
};

let siteImage = null;
let activeView = "plan";

function getState() {
  const state = {
    roomWidth: Number(el("roomWidth").value),
    roomDepth: Number(el("roomDepth").value),
    roomHeight: Number(el("roomHeight").value),
    budget: el("budget").value,
    sceneType: el("sceneType").value,
    ambient: el("ambient").value,
    intensity: Number(el("intensity").value),
    mood: Number(el("mood").value),
    cameraSafe: el("cameraSafe").checked,
    fixtures: {}
  };
  Object.keys(fixtureMeta).forEach((key) => {
    state.fixtures[key] = Number(el(key).value);
  });
  return state;
}

function sceneLabel(type) {
  return {
    speech: "发布会 / 演讲",
    wedding: "婚礼 / 宴会",
    gallery: "展览 / 陈列",
    performance: "小型演出",
    livestream: "直播 / 拍摄"
  }[type];
}

function makePlan(state) {
  const w = state.roomWidth;
  const d = state.roomDepth;
  const h = state.roomHeight;
  const fixtures = [];
  const addRow = (key, count, y, z, aimY, spread = 0.72) => {
    if (!count) return;
    for (let i = 0; i < count; i += 1) {
      const t = count === 1 ? 0.5 : i / (count - 1);
      const margin = Math.min(1.2, w * 0.08);
      const x = margin + t * (w - margin * 2);
      fixtures.push({
        key,
        label: fixtureMeta[key].label,
        color: fixtureMeta[key].color,
        x,
        y,
        z,
        aimX: x,
        aimY,
        spread
      });
    }
  };
  const addSides = (key, count, z, aimY) => {
    const left = Math.ceil(count / 2);
    const right = Math.floor(count / 2);
    for (let side = 0; side < 2; side += 1) {
      const sideCount = side === 0 ? left : right;
      for (let i = 0; i < sideCount; i += 1) {
        const t = sideCount === 1 ? 0.5 : i / (sideCount - 1);
        fixtures.push({
          key,
          label: fixtureMeta[key].label,
          color: fixtureMeta[key].color,
          x: side === 0 ? 0.35 : w - 0.35,
          y: d * (0.18 + t * 0.66),
          z,
          aimX: w / 2,
          aimY,
          spread: 0.58
        });
      }
    }
  };

  addRow("frontWash", state.fixtures.frontWash, d * 0.08, h * 0.86, d * 0.48, 0.9);
  addRow("spot", state.fixtures.spot, d * 0.12, h * 0.9, d * 0.42, 0.38);
  addRow("moving", state.fixtures.moving, d * 0.9, h * 0.82, d * 0.52, 0.62);
  addSides("par", state.fixtures.par, h * 0.72, d * 0.5);
  addRow("profile", state.fixtures.profile, d * 0.84, h * 0.84, d * 0.58, 0.35);
  addRow("strip", state.fixtures.strip, d * 0.98, h * 0.35, d * 0.85, 0.78);

  return { fixtures };
}

function resizeCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.max(640, Math.floor(rect.width * ratio));
  canvas.height = Math.max(420, Math.floor(rect.height * ratio));
  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { width: rect.width, height: rect.height, ctx };
}

function drawPlan() {
  const state = getState();
  const plan = makePlan(state);
  const canvas = el("planCanvas");
  const { width, height, ctx } = resizeCanvas(canvas);
  ctx.clearRect(0, 0, width, height);
  const pad = 42;
  const scale = Math.min((width - pad * 2) / state.roomWidth, (height - pad * 2) / state.roomDepth);
  const ox = (width - state.roomWidth * scale) / 2;
  const oy = (height - state.roomDepth * scale) / 2;
  const px = (x) => ox + x * scale;
  const py = (y) => oy + y * scale;

  if (siteImage) {
    ctx.save();
    ctx.globalAlpha = 0.38;
    ctx.drawImage(siteImage, ox, oy, state.roomWidth * scale, state.roomDepth * scale);
    ctx.restore();
  }

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(ox, oy, state.roomWidth * scale, state.roomDepth * scale);
  if (siteImage) {
    ctx.save();
    ctx.globalAlpha = 0.42;
    ctx.drawImage(siteImage, ox, oy, state.roomWidth * scale, state.roomDepth * scale);
    ctx.restore();
  }

  ctx.strokeStyle = "#1f2a37";
  ctx.lineWidth = 2;
  ctx.strokeRect(ox, oy, state.roomWidth * scale, state.roomDepth * scale);

  ctx.fillStyle = "rgba(22,127,122,0.09)";
  ctx.fillRect(px(state.roomWidth * 0.18), py(state.roomDepth * 0.26), state.roomWidth * 0.64 * scale, state.roomDepth * 0.48 * scale);
  ctx.strokeStyle = "rgba(22,127,122,0.45)";
  ctx.strokeRect(px(state.roomWidth * 0.18), py(state.roomDepth * 0.26), state.roomWidth * 0.64 * scale, state.roomDepth * 0.48 * scale);

  plan.fixtures.forEach((f) => {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(px(f.x), py(f.y));
    const dx = f.aimX - f.x;
    const dy = f.aimY - f.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const cone = 1.2 + f.spread * 2.5;
    ctx.lineTo(px(f.aimX + nx * cone), py(f.aimY + ny * cone));
    ctx.lineTo(px(f.aimX - nx * cone), py(f.aimY - ny * cone));
    ctx.closePath();
    ctx.fillStyle = hexToRgba(f.color, 0.16);
    ctx.fill();
    ctx.restore();
  });

  plan.fixtures.forEach((f) => {
    ctx.fillStyle = f.color;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px(f.x), py(f.y), 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });

  ctx.fillStyle = "#1d252c";
  ctx.font = "600 14px system-ui";
  ctx.fillText(`${state.roomWidth}m x ${state.roomDepth}m | ${sceneLabel(state.sceneType)}`, ox, oy - 14);
}

function draw3D() {
  const state = getState();
  const plan = makePlan(state);
  const canvas = el("threeCanvas");
  const { width, height, ctx } = resizeCanvas(canvas);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#f7f9fb";
  ctx.fillRect(0, 0, width, height);

  const scale = Math.min(width / (state.roomWidth * 2.2), height / (state.roomDepth * 1.75 + state.roomHeight * 1.2));
  const origin = { x: width * 0.5, y: height * 0.68 };
  const project = (x, y, z) => ({
    x: origin.x + (x - state.roomWidth / 2) * scale + (y - state.roomDepth / 2) * scale * 0.62,
    y: origin.y + (y - state.roomDepth / 2) * scale * 0.34 - z * scale
  });

  const corners = [
    project(0, 0, 0), project(state.roomWidth, 0, 0), project(state.roomWidth, state.roomDepth, 0), project(0, state.roomDepth, 0),
    project(0, 0, state.roomHeight), project(state.roomWidth, 0, state.roomHeight),
    project(state.roomWidth, state.roomDepth, state.roomHeight), project(0, state.roomDepth, state.roomHeight)
  ];

  polygon(ctx, [corners[0], corners[1], corners[2], corners[3]], "#e8edf2", "#aab5c2");
  polygon(ctx, [corners[4], corners[5], corners[6], corners[7]], "rgba(215,221,228,0.28)", "#c8d0d9");
  [[0, 4], [1, 5], [2, 6], [3, 7]].forEach(([a, b]) => line(ctx, corners[a], corners[b], "#c8d0d9"));

  const stage = [
    project(state.roomWidth * 0.18, state.roomDepth * 0.26, 0.04),
    project(state.roomWidth * 0.82, state.roomDepth * 0.26, 0.04),
    project(state.roomWidth * 0.82, state.roomDepth * 0.74, 0.04),
    project(state.roomWidth * 0.18, state.roomDepth * 0.74, 0.04)
  ];
  polygon(ctx, stage, "rgba(22,127,122,0.15)", "rgba(22,127,122,0.55)");

  plan.fixtures.forEach((f) => {
    const p = project(f.x, f.y, f.z);
    const a = project(f.aimX, f.aimY, 0.05);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(a.x - 18 * f.spread, a.y + 8 * f.spread);
    ctx.lineTo(a.x + 18 * f.spread, a.y - 8 * f.spread);
    ctx.closePath();
    ctx.fillStyle = hexToRgba(f.color, 0.18);
    ctx.fill();
  });

  plan.fixtures.forEach((f) => {
    const p = project(f.x, f.y, f.z);
    ctx.fillStyle = f.color;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });

  ctx.fillStyle = "#1d252c";
  ctx.font = "700 15px system-ui";
  ctx.fillText(`简化 3D 预览 | 层高 ${state.roomHeight}m`, 22, 28);
}

function computeReport() {
  const state = getState();
  const total = Object.values(state.fixtures).reduce((sum, n) => sum + n, 0);
  const area = state.roomWidth * state.roomDepth;
  const density = total / Math.max(area, 1);
  const baseLux = Math.round(260 + state.intensity * 90 + density * 380);
  const coverage = Math.max(42, Math.min(96, Math.round(58 + density * 80 + state.fixtures.frontWash * 1.8 + state.fixtures.par * 0.8)));
  const risk = state.roomHeight < 3.2 || state.ambient === "window" || total > area * 0.32 ? "中" : "低";

  const advice = [
    `主光建议控制在 ${baseLux} lux 左右，面光以 35° 到 45° 下射角覆盖核心区域。`,
    `场地为 ${sceneLabel(state.sceneType)}，优先保证人物/主体区均匀，再用侧后方灯具塑造层次。`,
    state.ambient === "window" ? "窗光会造成色温混杂，建议现场锁定白平衡，并用 5600K 附近的面光补齐阴影。" : "环境光可作为基础照明，舞台/主体区使用独立回路便于压暗背景。",
    state.cameraSafe ? "拍摄场景建议使用无频闪电源模式，快门测试后再提高亮度。" : "若不考虑拍摄，可把动态效果集中在入场、转场和高潮段落。",
    state.roomHeight < 3.5 ? "层高偏低，避免大角度摇头灯扫观众眼部，优先用柔和面光和低亮度染色。" : "层高足够，可将效果灯抬高到后区，减少直射观众。"
  ];

  el("coverageScore").textContent = `${coverage}`;
  el("keyLux").textContent = `${baseLux}`;
  el("fixtureTotal").textContent = `${total}`;
  el("riskLevel").textContent = risk;
  el("strategyText").textContent = strategyText(state);

  el("adviceList").innerHTML = advice.map((item) => `<li>${item}</li>`).join("");
  el("fixtureTable").innerHTML = Object.entries(state.fixtures).map(([key, count]) => {
    const pos = {
      frontWash: "前区灯杆 / 吊杆",
      spot: "前区或二道吊点",
      moving: "后区高位",
      par: "左右侧边",
      profile: "后侧轮廓位",
      strip: "背景或地排"
    }[key];
    return `<tr><td>${fixtureMeta[key].label}</td><td>${count}</td><td>${pos}</td></tr>`;
  }).join("");

  const notes = siteNotes(state, coverage, risk);
  el("siteNotes").innerHTML = notes.map((item) => `<li>${item}</li>`).join("");
  el("palette").innerHTML = paletteFor(state.sceneType).map((p) => (
    `<div class="swatch" style="background:${p.color}"><span>${p.name}</span><span>${p.temp}</span></div>`
  )).join("");

  const exportData = {
    scene: sceneLabel(state.sceneType),
    room: { width: state.roomWidth, depth: state.roomDepth, height: state.roomHeight },
    fixtures: state.fixtures,
    metrics: { coverage, baseLux, risk },
    advice
  };
  el("exportText").textContent = JSON.stringify(exportData, null, 2);
}

function strategyText(state) {
  const map = {
    speech: "均匀面光优先，背景保留轻微层次，减少高频动态效果。",
    wedding: "暖白主光配合琥珀和浅粉色氛围，保留入口和主桌重点。",
    gallery: "高显指、低眩光，避免强色彩污染展品表面。",
    performance: "后区效果灯和侧光承担情绪变化，主光保持可见度。",
    livestream: "肤色、眼神光和背景分离优先，控制频闪和过曝。"
  };
  return map[state.sceneType];
}

function siteNotes(state, coverage, risk) {
  const notes = [
    `面积约 ${Math.round(state.roomWidth * state.roomDepth)} 平米，当前灯具密度评分为 ${coverage}。`,
    `风险等级 ${risk}，重点检查电源负载、吊挂安全和观众视线。`
  ];
  if (state.budget === "lean") notes.push("预算克制时优先保留面光、轮廓光和少量染色。");
  if (state.budget === "premium") notes.push("预算充足时可增加控台分组和预设场景，提升转场质感。");
  if (state.ambient === "bright") notes.push("明亮环境下动态灯效会被稀释，应提高背景对比或压低环境光。");
  return notes;
}

function paletteFor(type) {
  const palettes = {
    speech: [
      { name: "主光", color: "#f1d7a0", temp: "4300K" },
      { name: "背景", color: "#167f7a", temp: "青绿" },
      { name: "轮廓", color: "#f2f5f7", temp: "5600K" }
    ],
    wedding: [
      { name: "主光", color: "#f0c27b", temp: "3200K" },
      { name: "氛围", color: "#c66d83", temp: "玫瑰" },
      { name: "背景", color: "#7f6ab7", temp: "淡紫" }
    ],
    gallery: [
      { name: "展品", color: "#f2efe4", temp: "4000K" },
      { name: "墙面", color: "#d8e2dc", temp: "柔白" },
      { name: "导视", color: "#5b8d49", temp: "低饱和" }
    ],
    performance: [
      { name: "主光", color: "#f4d35e", temp: "暖白" },
      { name: "效果", color: "#6454b8", temp: "靛紫" },
      { name: "冲击", color: "#c14e2f", temp: "红橙" }
    ],
    livestream: [
      { name: "肤色", color: "#f5d7b5", temp: "4500K" },
      { name: "背景", color: "#167f7a", temp: "低饱和" },
      { name: "轮廓", color: "#dbe7f0", temp: "冷白" }
    ]
  };
  return palettes[type];
}

function hexToRgba(hex, alpha) {
  const raw = hex.replace("#", "");
  const value = parseInt(raw, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function polygon(ctx, points, fill, stroke) {
  ctx.beginPath();
  points.forEach((p, idx) => idx ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.stroke();
}

function line(ctx, a, b, color) {
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.strokeStyle = color;
  ctx.stroke();
}

function render() {
  drawPlan();
  draw3D();
  computeReport();
}

inputs.forEach((id) => {
  el(id).addEventListener("input", render);
  el(id).addEventListener("change", render);
});

document.querySelectorAll(".tab").forEach((button) => {
  button.addEventListener("click", () => {
    activeView = button.dataset.view;
    document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab === button));
    document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
    el(`${activeView}View`).classList.add("active");
    render();
  });
});

el("siteImage").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const img = new Image();
  img.onload = () => {
    siteImage = img;
    render();
  };
  img.src = URL.createObjectURL(file);
});

el("sampleBtn").addEventListener("click", () => {
  el("roomWidth").value = 22;
  el("roomDepth").value = 14;
  el("roomHeight").value = 5.5;
  el("sceneType").value = "livestream";
  el("ambient").value = "mixed";
  el("frontWash").value = 8;
  el("spot").value = 4;
  el("moving").value = 6;
  el("par").value = 10;
  el("profile").value = 4;
  el("strip").value = 8;
  el("intensity").value = 4;
  el("mood").value = 3;
  render();
});

el("exportBtn").addEventListener("click", async () => {
  const text = el("exportText").textContent;
  try {
    await navigator.clipboard.writeText(text);
    el("exportBtn").textContent = "已复制";
    setTimeout(() => {
      el("exportBtn").textContent = "导出方案";
    }, 1200);
  } catch {
    activeView = "report";
    document.querySelector('[data-view="report"]').click();
  }
});

window.addEventListener("resize", render);
render();
