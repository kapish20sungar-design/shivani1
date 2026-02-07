// ============================================
// Config (loaded from config.json)
// ============================================
let config = {};
let noClickCount = 0;
let yesBtnBaseSize = 1.3; // rem

// ============================================
// Load config
// ============================================
async function loadConfig() {
  const res = await fetch("config.json");
  config = await res.json();
  applyConfig();
}

function applyConfig() {
  // Populate all text from config
  document.getElementById("recipientName").textContent = config.recipientName;
  document.getElementById("greeting").textContent = config.greeting;
  document.getElementById("yesMessage").textContent = config.yesMessage;
  document.getElementById("yayTitle").textContent = config.yayTitle;
  document.getElementById("signed").textContent = `- ${config.senderName}`;
  document.getElementById("yesBtn").textContent = config.yesBtnText;
  document.getElementById("noBtn").textContent = config.noBtnText;
  document.getElementById("subtext").textContent = config.subtext;

  // Start with the sweet innocent question
  const questionEl = document.getElementById("question");
  questionEl.textContent = config.initialQuestion;

  document.title = `${config.recipientName}, Will You Be My Valentine?`;

  // Kick off the flicker transition
  scheduleFlicker();
}

// ============================================
// Flicker Transition: loops between sweet <-> assertive
// sweet (hold) -> glitch -> assertive (hold) -> fade back -> sweet -> repeat
// ============================================
function scheduleFlicker() {
  const questionEl = document.getElementById("question");
  const subtextEl = document.getElementById("subtext");

  const t = config.timing;
  const initialDelay = t.initialDelay;
  const flickerDuration = t.flickerDuration;
  const flickerInterval = t.flickerInterval;
  const holdReal = t.holdReal;
  const holdSweet = t.holdSweet;
  const fadeBackDuration = t.fadeBackDuration;

  function glitchToReal() {
    // Clear the initial fadeInUp so it doesn't replay on loops
    questionEl.style.animation = "none";

    // Phase 1: Rapid flicker
    questionEl.classList.remove("glitch-settle", "fade-back");
    questionEl.classList.add("glitching");
    let toggle = false;

    const flickerTimer = setInterval(() => {
      toggle = !toggle;
      questionEl.textContent = toggle
        ? config.realQuestion
        : config.initialQuestion;
    }, flickerInterval);

    // Phase 2: Settle on the assertive version
    setTimeout(() => {
      clearInterval(flickerTimer);
      questionEl.textContent = config.realQuestion;
      questionEl.classList.remove("glitching");
      questionEl.classList.add("glitch-settle");

      // Show subtext
      subtextEl.classList.remove("hidden");
      subtextEl.classList.add("reveal");

      // Phase 3: After holding, fade back to sweet
      setTimeout(() => {
        fadeBackToSweet();
      }, holdReal);
    }, flickerDuration);
  }

  function fadeBackToSweet() {
    // Smooth fade: assertive -> sweet
    questionEl.classList.remove("glitch-settle");
    questionEl.classList.add("fade-back");

    // Hide subtext
    subtextEl.classList.remove("reveal");
    subtextEl.classList.add("fade-out");

    setTimeout(() => {
      questionEl.textContent = config.initialQuestion;
      questionEl.classList.remove("fade-back");
      subtextEl.classList.add("hidden");
      subtextEl.classList.remove("fade-out");

      // Hold on sweet version, then glitch again
      setTimeout(() => {
        glitchToReal();
      }, holdSweet);
    }, fadeBackDuration);
  }

  // Kick it off after the initial delay
  setTimeout(() => {
    glitchToReal();
  }, initialDelay);
}

// ============================================
// Floating Hearts Background
// ============================================
function createFloatingHearts() {
  const container = document.getElementById("heartsBg");
  const hearts = [
    "\u2764\uFE0F",
    "\uD83D\uDC95",
    "\uD83D\uDC96",
    "\uD83D\uDC97",
    "\uD83D\uDC98",
    "\uD83D\uDC9D",
    "\uD83E\uDE77",
    "\u2763\uFE0F",
    "\uD83C\uDF39",
  ];

  function spawnHeart() {
    const heart = document.createElement("span");
    heart.classList.add("floating-heart");
    heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
    heart.style.left = Math.random() * 100 + "%";
    heart.style.fontSize = Math.random() * 20 + 16 + "px";
    heart.style.animationDuration = Math.random() * 6 + 6 + "s";
    heart.style.animationDelay = "0s";
    container.appendChild(heart);

    // Remove after animation
    setTimeout(() => {
      heart.remove();
    }, 12000);
  }

  // Initial batch
  for (let i = 0; i < 15; i++) {
    setTimeout(spawnHeart, Math.random() * 3000);
  }

  // Continuous spawning
  setInterval(spawnHeart, 800);
}

// ============================================
// No Button - Runaway Logic
// ============================================
function initNoButton() {
  const noBtn = document.getElementById("noBtn");
  const yesBtn = document.getElementById("yesBtn");

  function dodgeButton() {
    noClickCount++;

    // Update No button text
    const texts = config.noButtonTexts;
    const textIndex = Math.min(noClickCount, texts.length - 1);
    noBtn.textContent = texts[textIndex];

    // Show attempt counter after a few tries
    let counter = document.getElementById("attemptCounter");
    if (!counter) {
      counter = document.createElement("p");
      counter.id = "attemptCounter";
      counter.className = "attempt-counter";
      document.getElementById("questionScreen").appendChild(counter);
    }
    if (noClickCount >= 3) {
      counter.textContent = `Failed attempts to say no: ${noClickCount}`;
    }

    // Grow the Yes button
    yesBtnBaseSize += 0.15;
    yesBtn.style.fontSize = yesBtnBaseSize + "rem";
    yesBtn.style.padding = `${15 + noClickCount * 2}px ${40 + noClickCount * 4}px`;
    yesBtn.classList.remove("grow");
    // Force reflow to restart animation
    void yesBtn.offsetWidth;
    yesBtn.classList.add("grow");

    // Teleport No button to random position
    const container = document.querySelector(".container");
    const containerRect = container.getBoundingClientRect();

    // Calculate safe bounds (keep within the card)
    const btnWidth = noBtn.offsetWidth;
    const btnHeight = noBtn.offsetHeight;

    // Sometimes escape the card for extra comedy
    if (noClickCount > 10) {
      // Move anywhere on screen
      const maxX = window.innerWidth - btnWidth - 20;
      const maxY = window.innerHeight - btnHeight - 20;
      const newX = Math.random() * maxX + 10;
      const newY = Math.random() * maxY + 10;

      noBtn.style.position = "fixed";
      noBtn.style.left = newX + "px";
      noBtn.style.top = newY + "px";
      noBtn.style.zIndex = "50";
    } else {
      // Stay within card area but move around
      const padding = 20;
      const maxX = containerRect.width - btnWidth - padding * 2;
      const maxY = containerRect.height - btnHeight - padding * 2;
      const newX = Math.random() * maxX + padding;
      const newY = Math.random() * maxY + padding;

      noBtn.style.position = "absolute";
      noBtn.style.left = newX + "px";
      noBtn.style.top = newY + "px";
    }

    // Shrink the No button over time
    const shrink = Math.max(0.6, 1 - noClickCount * 0.05);
    noBtn.style.transform = `scale(${shrink})`;
  }

  // Desktop: dodge on hover
  noBtn.addEventListener("mouseover", dodgeButton);

  // Mobile: dodge on touch (prevent actual click)
  noBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    dodgeButton();
  });

  // If they somehow manage to click it, still dodge
  noBtn.addEventListener("click", (e) => {
    e.preventDefault();
    dodgeButton();
  });
}

// ============================================
// Yes Button - Celebration!
// ============================================
function initYesButton() {
  const yesBtn = document.getElementById("yesBtn");

  yesBtn.addEventListener("click", () => {
    // Hide the runaway No button if it escaped the card
    const noBtn = document.getElementById("noBtn");
    if (noBtn) noBtn.style.display = "none";

    // Hide question, show celebration
    document.getElementById("questionScreen").classList.add("hidden");
    document.getElementById("yesScreen").classList.remove("hidden");

    // Add attempt count to the yes screen if they tried to say no
    if (noClickCount > 0) {
      const attemptsNote = document.createElement("p");
      attemptsNote.className = "attempts-note";
      attemptsNote.textContent = `(You tried to say no ${noClickCount} time${noClickCount === 1 ? "" : "s"} but here we are)`;
      document.getElementById("yesMessage").after(attemptsNote);
    }

    // Launch confetti
    launchConfetti();

    // Burst hearts from center
    burstHearts();

    // Spawn extra floating hearts
    for (let i = 0; i < 20; i++) {
      setTimeout(() => {
        const container = document.getElementById("heartsBg");
        const heart = document.createElement("span");
        heart.classList.add("floating-heart");
        heart.textContent = ["\u2764\uFE0F", "\uD83D\uDC96", "\uD83D\uDC95", "\uD83D\uDC97"][
          Math.floor(Math.random() * 4)
        ];
        heart.style.left = Math.random() * 100 + "%";
        heart.style.fontSize = Math.random() * 30 + 20 + "px";
        heart.style.animationDuration = Math.random() * 4 + 4 + "s";
        container.appendChild(heart);
        setTimeout(() => heart.remove(), 8000);
      }, i * 100);
    }
  });
}

// ============================================
// Confetti (Canvas-based)
// ============================================
function launchConfetti() {
  const canvas = document.getElementById("confettiCanvas");
  const ctx = canvas.getContext("2d");

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const colors = [
    "#e91e63",
    "#f06292",
    "#f8bbd0",
    "#ff5252",
    "#ff1744",
    "#ff4081",
    "#f50057",
    "#c51162",
    "#ff80ab",
    "#ffffff",
    "#ffd700",
    "#ff6f00",
  ];

  // Create particles
  for (let i = 0; i < 200; i++) {
    particles.push({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 20,
      vy: (Math.random() - 0.5) * 20 - 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 3,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 15,
      gravity: 0.15,
      drag: 0.98,
      opacity: 1,
      shape: Math.random() > 0.5 ? "rect" : "circle",
    });
  }

  let frame = 0;
  const maxFrames = 180;

  function animate() {
    if (frame > maxFrames) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= p.drag;
      p.vy *= p.drag;
      p.rotation += p.rotationSpeed;
      p.opacity = Math.max(0, 1 - frame / maxFrames);

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;

      if (p.shape === "rect") {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });

    frame++;
    requestAnimationFrame(animate);
  }

  animate();

  // Second burst after a delay
  setTimeout(() => {
    frame = 0;
    particles.forEach((p) => {
      p.x = Math.random() * canvas.width;
      p.y = -20;
      p.vx = (Math.random() - 0.5) * 8;
      p.vy = Math.random() * 5 + 2;
      p.opacity = 1;
    });
    animate();
  }, 1500);
}

// ============================================
// Heart Burst Effect
// ============================================
function burstHearts() {
  const container = document.getElementById("celebration");
  const heartEmojis = ["\u2764\uFE0F", "\uD83D\uDC96", "\uD83D\uDC95", "\uD83D\uDC97", "\uD83D\uDC98", "\uD83E\uDE77"];

  for (let i = 0; i < 30; i++) {
    const heart = document.createElement("span");
    heart.classList.add("burst-heart");
    heart.textContent = heartEmojis[Math.floor(Math.random() * heartEmojis.length)];

    const angle = (Math.PI * 2 * i) / 30;
    const distance = Math.random() * 300 + 100;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;

    heart.style.left = "50%";
    heart.style.top = "50%";
    heart.style.setProperty("--tx", tx + "px");
    heart.style.setProperty("--ty", ty + "px");
    heart.style.animationDelay = Math.random() * 0.3 + "s";
    heart.style.fontSize = Math.random() * 20 + 20 + "px";

    container.appendChild(heart);

    setTimeout(() => heart.remove(), 2500);
  }
}

// ============================================
// Init
// ============================================
document.addEventListener("DOMContentLoaded", () => {
  loadConfig();
  createFloatingHearts();
  initNoButton();
  initYesButton();
});
