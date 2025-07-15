let counters = JSON.parse(localStorage.getItem("multiCounters")) || [];

const countersContainer = document.getElementById("countersContainer");
const addCounterBtn = document.getElementById("addCounter");
const counterNameInput = document.getElementById("counterName");
const enableTarget = document.getElementById("enableTarget");
const targetInputContainer = document.getElementById("targetInputContainer");
const counterTargetInput = document.getElementById("counterTarget");

const logList = document.getElementById("logList");
const sidebar = document.getElementById("sidebar");
const toggleSidebarBtn = document.getElementById("toggleSidebar");

function logAction(message) {
  const li = document.createElement("li");
  const time = new Date().toLocaleTimeString();
  li.textContent = `[${time}] ${message}`;
  logList.prepend(li);
}

const themeSwitcher = document.getElementById("themeSwitcher");
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  themeSwitcher.checked = true;
}
themeSwitcher.addEventListener("change", () => {
  document.body.classList.toggle("dark", themeSwitcher.checked);
  localStorage.setItem("theme", themeSwitcher.checked ? "dark" : "light");
});

if (toggleSidebarBtn) {
  toggleSidebarBtn.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
  });
}

function saveCounters() {
  localStorage.setItem("multiCounters", JSON.stringify(counters));
}

function setProgressBarColor(bar, current, target) {
  const percent = (current / target) * 100;
  if (percent >= 100) {
    bar.className = "progress-complete";
  } else if (percent >= 80) {
    bar.className = "progress-green";
  } else if (percent >= 50) {
    bar.className = "progress-orange";
  } else {
    bar.className = "progress-gray";
  }
}

function renderCounters() {
  countersContainer.innerHTML = "";

  counters.forEach((counter, index) => {
    if (!counter.history) counter.history = [counter.value];
    if (!counter.redoStack) counter.redoStack = [];

    const card = document.createElement("div");
    card.className = "counter-card";

    let progressBar = null;

    card.innerHTML = `
      <h3>${counter.name}</h3>
      <label>Step:
        <input type="number" class="step-input" value="${counter.step}" min="1" />
      </label>
      <div class="counter-value" id="count-${index}">${counter.value}</div>
      <div class="counter-buttons">
        <button class="dec">−</button>
        <button class="inc">+</button>
        <button class="reset">Reset</button><br />
        <button class="undo">Undo</button>
        <button class="redo">Redo</button>
        <button class="del">🗑️ Delete</button>
      </div>
    `;

    if (counter.target && counter.target > 0) {
      progressBar = document.createElement("progress");
      progressBar.max = counter.target;
      progressBar.value = counter.value;
      progressBar.style.width = "100%";
      progressBar.style.height = "20px";
      progressBar.style.marginTop = "10px";
      setProgressBarColor(progressBar, counter.value, counter.target);
      card.appendChild(progressBar);
    }

    const valueDisplay = card.querySelector(`#count-${index}`);
    const stepInput = card.querySelector(".step-input");
    const incBtn = card.querySelector(".inc");
    const decBtn = card.querySelector(".dec");
    const resetBtn = card.querySelector(".reset");
    const undoBtn = card.querySelector(".undo");
    const redoBtn = card.querySelector(".redo");
    const delBtn = card.querySelector(".del");

    stepInput.addEventListener("input", () => {
      counter.step = parseInt(stepInput.value) || 1;
      saveCounters();
    });

    const updateValue = (newValue, actionLabel) => {
      counter.history.push(counter.value);
      counter.redoStack = [];
      counter.value = newValue;
      valueDisplay.textContent = counter.value;

      if (progressBar && counter.target) {
        progressBar.value = counter.value;
        setProgressBarColor(progressBar, counter.value, counter.target);
      }

      saveCounters();
      logAction(`${counter.name} ${actionLabel} to ${counter.value}`);
    };

    incBtn.addEventListener("click", () => {
      updateValue(counter.value + counter.step, "incremented");
    });

    decBtn.addEventListener("click", () => {
      updateValue(counter.value - counter.step, "decremented");
    });

    resetBtn.addEventListener("click", () => {
      updateValue(0, "reset");
    });

    undoBtn.addEventListener("click", () => {
      if (counter.history.length > 0) {
        counter.redoStack.push(counter.value);
        counter.value = counter.history.pop();
        valueDisplay.textContent = counter.value;

        if (progressBar && counter.target) {
          progressBar.value = counter.value;
          setProgressBarColor(progressBar, counter.value, counter.target);
        }

        saveCounters();
        logAction(`${counter.name} undo to ${counter.value}`);
      }
    });

    redoBtn.addEventListener("click", () => {
      if (counter.redoStack.length > 0) {
        counter.history.push(counter.value);
        counter.value = counter.redoStack.pop();
        valueDisplay.textContent = counter.value;

        if (progressBar && counter.target) {
          progressBar.value = counter.value;
          setProgressBarColor(progressBar, counter.value, counter.target);
        }

        saveCounters();
        logAction(`${counter.name} redo to ${counter.value}`);
      }
    });

    delBtn.addEventListener("click", () => {
      if (confirm(`Delete "${counter.name}" counter?`)) {
        logAction(`${counter.name} deleted`);
        counters.splice(index, 1);
        renderCounters();
        saveCounters();
      }
    });

    countersContainer.appendChild(card);
  });
}

addCounterBtn.addEventListener("click", () => {
  const name = counterNameInput.value.trim();
  const target = enableTarget.checked ? parseInt(counterTargetInput.value.trim()) : null;

  if (name === "") return alert("Counter name cannot be empty");

  counters.push({
    name,
    value: 0,
    step: 1,
    target: target > 0 ? target : null,
    history: [],
    redoStack: []
  });

  counterNameInput.value = "";
  enableTarget.checked = false;
  targetInputContainer.style.display = "none";
  counterTargetInput.value = "";

  renderCounters();
  saveCounters();
  logAction(`Created new counter "${name}"`);
});

const resetAllBtn = document.getElementById("resetAllCounters");

resetAllBtn.addEventListener("click", () => {
  if (counters.length === 0) return alert("No counters to reset.");
  if (!confirm("Are you sure you want to reset all counters to 0?")) return;

  counters.forEach(counter => {
    counter.value = 0;
    counter.history = [];
    counter.redoStack = [];
  });

  saveCounters();
  renderCounters();
  logAction("All counters reset to 0");
});


enableTarget.addEventListener("change", () => {
  targetInputContainer.style.display = enableTarget.checked ? "block" : "none";
});

renderCounters();