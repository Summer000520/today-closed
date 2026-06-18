const dockItems = document.querySelectorAll(".dock-item");
const panels = document.querySelectorAll(".panel");
const worryText = document.querySelector("#worryText");
const worryPaper = document.querySelector("#worryPaper");
const disposeButtons = document.querySelectorAll("[data-dispose]");
const mistButton = document.querySelector("#mistButton");
const mistStage = document.querySelector("#mistStage");
const productGrid = document.querySelector("#productGrid");
const receipt = document.querySelector("#receipt");
const breathCircle = document.querySelector("#breathCircle");
const breathToggle = document.querySelector("#breathToggle");
const breathReset = document.querySelector("#breathReset");
const stopNoise = document.querySelector("#stopNoise");
const noiseSliders = document.querySelectorAll("[data-noise]");

const products = [
  ["一片很慢的云", "配送时间：看心情，价格：0 元"],
  ["十分钟安静", "自动屏蔽脑内杂音，不支持退款"],
  ["不焦虑体验券", "使用后获得“先吃饭再说”状态"],
  ["重启今天按钮", "虚拟按钮，按下后心情刷新"],
  ["月亮汽水", "气泡是假的，快乐可以是真的"],
  ["明天再说许可", "允许你把一件小事留到明天"]
];

let audioContext;
const noiseNodes = {};
let breathTimer;
let breathStep = 0;
const breathWords = ["吸气", "停留", "呼气"];

dockItems.forEach((button) => {
  button.addEventListener("click", () => {
    const view = button.dataset.view;
    dockItems.forEach((item) => item.classList.toggle("active", item === button));
    panels.forEach((panel) => panel.classList.toggle("active", panel.id === view));
  });
});

worryText.addEventListener("input", () => {
  worryPaper.textContent = worryText.value.trim() || "烦恼暂存中";
});

disposeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const action = button.dataset.dispose;
    worryPaper.textContent = worryText.value.trim() || "没有写出来也没关系";
    worryPaper.className = `paper ${action}`;

    window.setTimeout(() => {
      worryText.value = "";
      worryPaper.textContent = "已回收，今天先放过自己";
      worryPaper.className = "paper";
    }, 760);
  });
});

function releaseMist() {
  const count = 9;
  const bounds = mistStage.getBoundingClientRect();

  for (let index = 0; index < count; index += 1) {
    const puff = document.createElement("span");
    const size = 42 + Math.random() * 70;
    puff.className = "puff";
    puff.style.setProperty("--size", `${size}px`);
    puff.style.setProperty("--x", `${bounds.width * (0.28 + Math.random() * 0.44)}px`);
    puff.style.setProperty("--y", `${bounds.height * (0.42 + Math.random() * 0.28)}px`);
    puff.style.setProperty("--drift", `${-80 + Math.random() * 160}px`);
    mistStage.appendChild(puff);
    puff.addEventListener("animationend", () => puff.remove());
  }
}

mistButton.addEventListener("click", releaseMist);

products.forEach(([name, detail]) => {
  const item = document.createElement("button");
  item.className = "product";
  item.innerHTML = `<strong>${name}</strong><span>${detail}</span>`;
  item.addEventListener("click", () => {
    receipt.textContent = `已假装买下「${name}」。没有付款，没有物流，心情值 +10。`;
  });
  productGrid.appendChild(item);
});

function updateBreathWord() {
  breathCircle.textContent = breathWords[breathStep % breathWords.length];
  breathStep += 1;
}

breathToggle.addEventListener("click", () => {
  const running = breathCircle.classList.toggle("running");
  breathToggle.textContent = running ? "暂停" : "开始";

  if (running) {
    updateBreathWord();
    breathTimer = window.setInterval(updateBreathWord, 3000);
  } else {
    window.clearInterval(breathTimer);
  }
});

breathReset.addEventListener("click", () => {
  window.clearInterval(breathTimer);
  breathStep = 0;
  breathCircle.textContent = "吸气";
  breathCircle.classList.remove("running");
  breathToggle.textContent = "开始";
});

function createNoise(type) {
  audioContext ||= new AudioContext();
  const bufferSize = 2 * audioContext.sampleRate;
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;

  for (let i = 0; i < bufferSize; i += 1) {
    const white = Math.random() * 2 - 1;
    if (type === "rain") {
      data[i] = white * 0.42;
    } else if (type === "wave") {
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.2;
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
  return { source, gain };
}

noiseSliders.forEach((slider) => {
  slider.addEventListener("input", async () => {
    const type = slider.dataset.noise;
    if (!noiseNodes[type]) {
      noiseNodes[type] = createNoise(type);
    }
    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }
    noiseNodes[type].gain.gain.value = Number(slider.value) / 130;
  });
});

stopNoise.addEventListener("click", () => {
  noiseSliders.forEach((slider) => {
    slider.value = 0;
    const node = noiseNodes[slider.dataset.noise];
    if (node) {
      node.gain.gain.value = 0;
    }
  });
});
