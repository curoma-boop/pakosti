// ---- Заметки (хранятся в localStorage) ----

const noteForm = document.getElementById("note-form");
const noteInput = document.getElementById("note-input");
const noteList = document.getElementById("note-list");

function loadNotes() {
  const raw = localStorage.getItem("notes");
  return raw ? JSON.parse(raw) : [];
}

function saveNotes(notes) {
  localStorage.setItem("notes", JSON.stringify(notes));
}

function renderNotes() {
  const notes = loadNotes();
  noteList.innerHTML = "";

  notes.forEach((text, index) => {
    const li = document.createElement("li");

    const span = document.createElement("span");
    span.textContent = text;

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "убрать";
    removeBtn.addEventListener("click", () => {
      const updated = loadNotes();
      updated.splice(index, 1);
      saveNotes(updated);
      renderNotes();
    });

    li.appendChild(span);
    li.appendChild(removeBtn);
    noteList.appendChild(li);
  });
}

noteForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = noteInput.value.trim();
  if (!text) return;

  const notes = loadNotes();
  notes.push(text);
  saveNotes(notes);

  noteInput.value = "";
  renderNotes();
});

renderNotes();

// ---- Счётчик кликов ----

const counterBtn = document.getElementById("counter-btn");
const counterValue = document.getElementById("counter-value");
let count = parseInt(localStorage.getItem("clickCount"), 10) || 0;
counterValue.textContent = count;

counterBtn.addEventListener("click", () => {
  count += 1;
  counterValue.textContent = count;
  localStorage.setItem("clickCount", count);
});

// ---- Калькулятор ----

const calcDisplay = document.getElementById("calc-display");
const calcButtons = document.querySelectorAll(".calc-btn");

let calcCurrent = "0";
let calcPrevious = null;
let calcOperator = null;
let calcResetOnNextDigit = false;

function updateDisplay() {
  calcDisplay.textContent = calcCurrent.replace(".", ",");
}

function inputDigit(digit) {
  if (calcResetOnNextDigit) {
    calcCurrent = "0";
    calcResetOnNextDigit = false;
  }
  calcCurrent = calcCurrent === "0" ? digit : calcCurrent + digit;
}

function inputDecimal() {
  if (calcResetOnNextDigit) {
    calcCurrent = "0";
    calcResetOnNextDigit = false;
  }
  if (!calcCurrent.includes(".")) calcCurrent += ".";
}

function clearAll() {
  calcCurrent = "0";
  calcPrevious = null;
  calcOperator = null;
  calcResetOnNextDigit = false;
}

function toggleSign() {
  calcCurrent = String(parseFloat(calcCurrent) * -1);
}

function toPercent() {
  calcCurrent = String(parseFloat(calcCurrent) / 100);
}

function compute(a, b, op) {
  switch (op) {
    case "+": return a + b;
    case "-": return a - b;
    case "*": return a * b;
    case "/": return b === 0 ? 0 : a / b;
    default: return b;
  }
}

function setOperator(op) {
  if (calcOperator && !calcResetOnNextDigit) {
    equals();
  }
  calcPrevious = parseFloat(calcCurrent);
  calcOperator = op;
  calcResetOnNextDigit = true;
}

function equals() {
  if (calcOperator === null || calcPrevious === null) return;
  const result = compute(calcPrevious, parseFloat(calcCurrent), calcOperator);
  calcCurrent = String(Math.round(result * 1e10) / 1e10);
  calcOperator = null;
  calcPrevious = null;
  calcResetOnNextDigit = true;
}

calcButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const { action, value } = btn.dataset;

    if (value && "0123456789".includes(value)) {
      inputDigit(value);
    } else if (value && "+-*/".includes(value)) {
      setOperator(value);
    } else if (action === "decimal") {
      inputDecimal();
    } else if (action === "clear") {
      clearAll();
    } else if (action === "sign") {
      toggleSign();
    } else if (action === "percent") {
      toPercent();
    } else if (action === "equals") {
      equals();
    }

    updateDisplay();
  });
});

// ---- Тема ----

const themeToggle = document.getElementById("theme-toggle");
const savedTheme = localStorage.getItem("theme") || "dark";

if (savedTheme === "light") {
  document.body.setAttribute("data-theme", "light");
  themeToggle.textContent = "Тёмная тема";
}

themeToggle.addEventListener("click", () => {
  const isLight = document.body.getAttribute("data-theme") === "light";
  if (isLight) {
    document.body.removeAttribute("data-theme");
    themeToggle.textContent = "Светлая тема";
    localStorage.setItem("theme", "dark");
  } else {
    document.body.setAttribute("data-theme", "light");
    themeToggle.textContent = "Тёмная тема";
    localStorage.setItem("theme", "light");
  }
});

// ---- Курс Solana ----

const solPriceEl = document.getElementById("sol-price");
const solChangeEl = document.getElementById("sol-change");
const sparklineEl = document.getElementById("sol-sparkline");

function drawSparkline(prices, isUp) {
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const points = prices
    .map((price, i) => {
      const x = (i / (prices.length - 1)) * 120;
      const y = 40 - ((price - min) / range) * 40;
      return `${x},${y}`;
    })
    .join(" ");

  const color = isUp ? "#6fcf97" : "#e57373";
  sparklineEl.innerHTML = `<polyline points="${points}" style="stroke:${color}" />`;
}

fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=SOLUSDT")
  .then((res) => res.json())
  .then((data) => {
    const price = parseFloat(data.lastPrice);
    const change = parseFloat(data.priceChangePercent);

    solPriceEl.textContent = `$${price.toFixed(2)}`;
    solChangeEl.textContent = `${change >= 0 ? "+" : ""}${change.toFixed(2)}% за 24ч`;
    solChangeEl.classList.add(change >= 0 ? "up" : "down");

    return fetch("https://api.binance.com/api/v3/klines?symbol=SOLUSDT&interval=1h&limit=24");
  })
  .then((res) => res.json())
  .then((klines) => {
    const closePrices = klines.map((candle) => parseFloat(candle[4]));
    const isUp = closePrices[closePrices.length - 1] >= closePrices[0];
    drawSparkline(closePrices, isUp);
  })
  .catch((err) => {
    solPriceEl.textContent = "Не удалось загрузить";
    console.error(err);
  });
