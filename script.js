/**
 * Compact horizontal journey slider
 */
(function () {
  const journey = document.querySelector(".journey");
  if (!journey) return;

  const slider = document.getElementById("journey-slider");
  const sceneTrack = document.getElementById("scene-track");
  const steps = [...journey.querySelectorAll(".journey-steps li")];
  const bulletsPanel = journey.querySelector(".journey-bullets-panel");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const MAX = Number(slider.max);
  let progress = 0;
  let draggingScene = false;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function smoothstep(t) {
    const x = clamp(t, 0, 1);
    return x * x * (3 - 2 * x);
  }

  function setProgress(value) {
    progress = clamp(value, 0, 1);
    slider.value = String(Math.round(progress * MAX));
    journey.style.setProperty("--progress", progress.toFixed(4));

    /* Cell → walking figure (no labels, just motion) */
    const cellOpacity = progress < 0.16 ? 1 - smoothstep(progress / 0.16) : 0;
    const humanOpacity = smoothstep((progress - 0.05) / 0.14);
    const humanScale = lerp(0.36, 1.02, smoothstep((progress - 0.08) / 0.88));

    let stage = 0;
    if (progress >= 0.55) stage = 3;
    else if (progress >= 0.32) stage = 2;
    else if (progress >= 0.12) stage = 1;

    journey.style.setProperty("--cell-opacity", cellOpacity.toFixed(3));
    journey.style.setProperty("--human-opacity", humanOpacity.toFixed(3));
    journey.style.setProperty("--human-scale", humanScale.toFixed(3));
    journey.dataset.stage = String(stage);

    /* Walk cycle tied to distance traveled */
    const walkPhase = progress * Math.PI * 32;
    const legSwing = Math.sin(walkPhase) * 34;
    const armSwing = Math.sin(walkPhase + Math.PI) * 24;
    const bob = humanOpacity * Math.abs(Math.sin(walkPhase * 2)) * 2.5;

    journey.style.setProperty("--leg-l", `${legSwing}deg`);
    journey.style.setProperty("--leg-r", `${-legSwing}deg`);
    journey.style.setProperty("--arm-l", `${armSwing * 0.65}deg`);
    journey.style.setProperty("--arm-r", `${-armSwing * 0.65}deg`);
    journey.style.setProperty("--bob", `${bob.toFixed(2)}px`);

    /* One bullet at a time */
    const stepCount = steps.length;
    const segmentSize = 1 / stepCount;
    const activeIndex = clamp(Math.floor(progress / segmentSize), 0, stepCount - 1);
    const showBullets = progress > 0.02;

    steps.forEach((step, index) => {
      const segmentStart = index * segmentSize;
      const segmentEnd = segmentStart + segmentSize;
      const isCurrent = showBullets && index === activeIndex;

      step.classList.toggle("is-visible", isCurrent);
      step.classList.toggle("is-active", isCurrent);
      step.classList.toggle("is-past", progress >= segmentEnd);
      step.classList.toggle("is-upcoming", progress < segmentStart);
    });

    if (bulletsPanel) {
      bulletsPanel.classList.toggle("has-bullet", showBullets);
    }
  }

  function progressFromClientX(clientX) {
    const rect = sceneTrack.getBoundingClientRect();
    return clamp((clientX - rect.left) / rect.width, 0, 1);
  }

  if (reducedMotion) {
    journey.classList.add("journey--static");
    steps.forEach((step) => {
      step.classList.add("is-visible");
      step.classList.remove("is-active", "is-past", "is-upcoming");
    });
    setProgress(1);
    return;
  }

  slider.addEventListener("input", () => setProgress(Number(slider.value) / MAX));
  slider.addEventListener("change", () => setProgress(Number(slider.value) / MAX));

  sceneTrack.addEventListener("pointerdown", (event) => {
    draggingScene = true;
    sceneTrack.setPointerCapture(event.pointerId);
    setProgress(progressFromClientX(event.clientX));
  });

  sceneTrack.addEventListener("pointermove", (event) => {
    if (!draggingScene) return;
    setProgress(progressFromClientX(event.clientX));
  });

  sceneTrack.addEventListener("pointerup", (event) => {
    draggingScene = false;
    sceneTrack.releasePointerCapture(event.pointerId);
  });

  sceneTrack.addEventListener("pointercancel", () => {
    draggingScene = false;
  });

  journey.addEventListener(
    "wheel",
    (event) => {
      const horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY);
      if (!horizontal && !event.shiftKey) return;
      event.preventDefault();
      const delta = (horizontal ? event.deltaX : event.deltaY) * (event.deltaMode === 1 ? 0.004 : 0.0015);
      setProgress(progress + delta);
    },
    { passive: false }
  );

  setProgress(0);
})();
