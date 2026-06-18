const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const text = {
  relief: "次虚拟解压",
  worryIdle: "烦恼暂存中",
  worryEmpty: "没有写出来也没关系",
  worryDone: "已回收，今天先放过自己",
  payReady: "请先选几件并不真存在的东西。",
  payDone: "已假装付款。余额没有变少，心情先加 20。",
  bottleEmpty: "空瓶子也可以出发，但要不要写一句？",
  bottleSent: "它已经离开这个屏幕了。",
  breathStart: "开始",
  breathPause: "暂停",
  breathIn: "吸气",
  breathHold: "停留",
  breathOut: "呼气"
};

const rooms = [
  ["worry", "烦恼回收", "把今天的小烦人丢进虚拟箱子。"],
  ["mist", "压力雾化", "一团会散开的动画雾气。"],
  ["shop", "幻想商店", "不花钱，假装买点无用的快乐。"],
  ["bubble", "泡泡纸", "一颗一颗点掉，没有负担。"],
  ["desk", "桌面整理", "点击零散物件，让桌面清爽。"],
  ["bottle", "情绪漂流", "写一句话，让它离开屏幕。"],
  ["breath", "呼吸圆", "慢一点，把节奏找回来。"],
  ["noise", "白噪音", "把背景变得温柔一点。"]
];

const products = [
  ["一片很慢的云", "配送时间：看心情", 0],
  ["十分钟安静", "自动屏蔽脑内杂音", 0],
  ["不焦虑体验券", "使用后获得“先吃饭再说”", 0],
  ["重启今天按钮", "虚拟按钮，按下后心情刷新", 0],
  ["月亮汽水", "气泡是假的，快乐可以是真的", 0],
  ["明天再说许可", "允许把一件小事留到明天", 0]
];

const deskItems = ["note", "cup", "key", "card", "pen", "coin", "tape", "book"];
let reliefCount = 0;
let cart = [];
let audioContext;
const noiseNodes = {};
let breathTimer;
let breathStep = 0;

function addRelief(amount = 1) {
  reliefCount += amount;
  $("#reliefCount").textContent = reliefCount;
}

function openView(view) {
  $$(".dock-item").forEach((item) => item.classList.toggle("active", item.dataset.view === view));
  $$(".panel").forEach((panel) => panel.classList.toggle("active", panel.id === view));
}

function buildRooms() {
  const grid = $("#roomGrid");
  grid.innerHTML = rooms.map(([id, title, body]) => `
    <button class="room-card" data-open="${id}">
      <span>${title}</span>
      <small>${body}</small>
    </button>
  `).join("");
  $$("[data-open]").forEach((button) => button.addEventListener("click", () => openView(button.dataset.open)));
}

function buildShop() {
  $("#productGrid").innerHTML = products.map(([name, detail, price], index) => `
    <button class="product" data-product="${index}">
      <strong>${name}</strong>
      <span>${detail}</span>
      <em>${price} 元</em>
    </button>
  `).join("");
  $$("[data-product]").forEach((button) => {
    button.addEventListener("click", () => {
      cart.push(products[Number(button.dataset.product)][0]);
      renderCart();
      addRelief();
    });
  });
}

function renderCart() {
  $("#cartList").innerHTML = cart.length
    ? `<ul>${cart.map((item) => `<li>${item}</li>`).join("")}</ul>`
    : "选一个虚拟商品吧。";
}

function buildBubbles() {
  const board = $("#bubbleBoard");
  board.innerHTML = "";
  for (let i = 0; i < 48; i += 1) {
    const bubble = document.createElement("button");
    bubble.className = "bubble";
    bubble.type = "button";
    bubble.setAttribute("aria-label", "pop");
    bubble.addEventListener("click", () => {
      if (bubble.classList.contains("popped")) return;
      bubble.classList.add("popped");
      updateBubbleCount();
      addRelief();
    });
    board.appendChild(bubble);
  }
  updateBubbleCount();
}

function updateBubbleCount() {
  const popped = $$(".bubble.popped").length;
  $("#bubbleCount").textContent = `${popped} / 48`;
}

function scatterDesk() {
  const stage = $("#deskStage");
  stage.innerHTML = "";
  deskItems.forEach((name, index) => {
    const item = document.createElement("button");
    item.className = `desk-item ${name}`;
    item.type = "button";
    item.style.left = `${8 + Math.random() * 76}%`;
    item.style.top = `${14 + Math.random() * 66}%`;
    item.style.transform = `rotate(${-22 + Math.random() * 44}deg)`;
    item.textContent = ["便签", "杯子", "钥匙", "卡片", "笔", "硬币", "胶带", "本子"][index];
    item.addEventListener("click", () => {
      item.classList.add("stored");
      window.setTimeout(() => item.remove(), 260);
      updateDeskCount();
      addRelief();
    });
    stage.appendChild(item);
  });
  updateDeskCount();
}

function updateDeskCount() {
  window.setTimeout(() => {
    $("#deskCount").textContent = `待整理：${$$(".desk-item:not(.stored)").length}`;
  }, 20);
}

function releaseMist() {
  const stage = $("#mistStage");
  const bounds = stage.getBoundingClientRect();
  for (let index = 0; index < 14; index += 1) {
    const puff = document.createElement("span");
    const size = 42 + Math.random() * 86;
    puff.className = "puff";
    puff.style.setProperty("--size", `${size}px`);
    puff.style.setProperty("--x", `${bounds.width * (0.18 + Math.random() * 0.64)}px`);
    puff.style.setProperty("--y", `${bounds.height * (0.38 + Math.random() * 0.32)}px`);
    puff.style.setProperty("--drift", `${-120 + Math.random() * 240}px`);
    stage.appendChild(puff);
    puff.addEventListener("animationend", () => puff.remove());
  }
  addRelief(2);
}

function sendBottle() {
  const input = $("#bottleText");
  const bottle = $("#bottleShape");
  bottle.textContent = input.value.trim() ? "已收到" : text.bottleEmpty;
  bottle.classList.remove("sail");
  void bottle.offsetWidth;
  bottle.classList.add("sail");
  window.setTimeout(() => {
    bottle.textContent = text.bottleSent;
    input.value = "";
  }, 1300);
  addRelief(2);
}

function updateBreathWord() {
  const words = [text.breathIn, text.breathHold, text.breathOut];
  $("#breathCircle").textContent = words[breathStep % words.length];
  breathStep += 1;
}

function createNoise(type) {
  audioContext ||= new AudioContext();
  const bufferSize = 2 * audioContext.sampleRate;
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;

  for (let i = 0; i < bufferSize; i += 1) {
    const white = Math.random() * 2 - 1;
    if (type === "rain") data[i] = white * 0.42;
    else if (type === "wave") {
      last = (last + 0.018 * white) / 1.018;
      data[i] = last * 3.1;
    } else if (type === "hum") {
      data[i] = Math.sin(i / 36) * 0.08 + white * 0.03;
    } else {
      last = 0.92 * last + 0.08 * white;
      data[i] = last * 0.9;
    }
  }

  const source = audioContext.createBufferSource();
  const gain = audioContext.createGain();
  source.buffer = buffer;
  source.loop = true;
  gain.gain.value = 0;
  source.connect(gain).connect(audioContext.destination);
  source.start();
  return { gain };
}

$$(".dock-item").forEach((button) => button.addEventListener("click", () => openView(button.dataset.view)));

$("#worryText").addEventListener("input", () => {
  $("#worryPaper").textContent = $("#worryText").value.trim() || text.worryIdle;
});

$$("[data-dispose]").forEach((button) => {
  button.addEventListener("click", () => {
    const paper = $("#worryPaper");
    paper.textContent = $("#worryText").value.trim() || text.worryEmpty;
    paper.className = `paper ${button.dataset.dispose}`;
    window.setTimeout(() => {
      $("#worryText").value = "";
      paper.textContent = text.worryDone;
      paper.className = "paper";
    }, 820);
    addRelief(2);
  });
});

$$("[data-mood]").forEach((button) => {
  button.addEventListener("click", () => {
    const lines = {
      calm: "那就去呼吸圆或白噪音。",
      fun: "那就去泡泡纸或幻想商店。",
      blank: "那就点一下压力雾化−什么都不想。"
    };
    $("#moodText").textContent = lines[button.dataset.mood];
  });
});

$("#mistButton").addEventListener("click", releaseMist);
$("#fakePay").addEventListener("click", () => {
  $("#cartList").textContent = cart.length ? text.payDone : text.payReady;
  cart = [];
  addRelief(3);
});
$("#resetBubbles").addEventListener("click", buildBubbles);
$("#messDesk").addEventListener("click", scatterDesk);
$("#sendBottle").addEventListener("click", sendBottle);

$("#breathToggle").addEventListener("click", () => {
  const circle = $("#breathCircle");
  const running = circle.classList.toggle("running");
  $("#breathToggle").textContent = running ? text.breathPause : text.breathStart;
  if (running) {
    updateBreathWord();
    breathTimer = window.setInterval(updateBreathWord, 3000);
  } else {
    window.clearInterval(breathTimer);
  }
});

$("#breathReset").addEventListener("click", () => {
  window.clearInterval(breathTimer);
  breathStep = 0;
  $("#breathCircle").textContent = text.breathIn;
  $("#breathCircle").classList.remove("running");
  $("#breathToggle").textContent = text.breathStart;
});

$$("[data-noise]").forEach((slider) => {
  slider.addEventListener("input", async () => {
    const type = slider.dataset.noise;
    if (!noiseNodes[type]) noiseNodes[type] = createNoise(type);
    if (audioContext.state === "suspended") await audioContext.resume();
    noiseNodes[type].gain.gain.value = Number(slider.value) / 130;
  });
});

$("#stopNoise").addEventListener("click", () => {
  $$("[data-noise]").forEach((slider) => {
    slider.value = 0;
    const node = noiseNodes[slider.dataset.noise];
    if (node) node.gain.gain.value = 0;
  });
});

buildRooms();
buildShop();
buildBubbles();
scatterDesk();
