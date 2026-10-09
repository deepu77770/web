const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#primary-navigation");
const introSplash = document.querySelector("#intro-splash");
const skipIntroButton = document.querySelector("#opening-skip");
const loadingPercentage = document.querySelector("#loading-percentage");
const loadingProgress = document.querySelector("#loading-progress");
const loadingTrack = document.querySelector("#loading-track");

const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const hangingSpider = document.querySelector(".web-swing");
if (
  hangingSpider instanceof HTMLElement &&
  !motionPreference.matches
) {
  let spiderFrame = 0;
  let currentOffset = 0;
  let targetOffset = 0;
  const updateSpiderPosition = () => {
    spiderFrame = 0;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const scrollProgress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    const startTop = Number.parseFloat(
      window.getComputedStyle(hangingSpider).getPropertyValue("--spider-start-top"),
    ) || 72;
    const travelDistance = Math.max(
      window.innerHeight - hangingSpider.offsetHeight - startTop - 24,
      0,
    );
    targetOffset = travelDistance * scrollProgress;
    const offsetDelta = targetOffset - currentOffset;
    currentOffset += offsetDelta * 0.18;
    if (Math.abs(offsetDelta) < 0.15) currentOffset = targetOffset;
    hangingSpider.style.setProperty("--spider-scroll-offset", `${currentOffset}px`);

    if (Math.abs(targetOffset - currentOffset) >= 0.15) {
      spiderFrame = window.requestAnimationFrame(updateSpiderPosition);
    }
  };
  const scheduleSpiderPosition = () => {
    if (!spiderFrame) {
      spiderFrame = window.requestAnimationFrame(updateSpiderPosition);
    }
  };

  window.addEventListener("scroll", scheduleSpiderPosition, { passive: true });
  window.addEventListener("resize", scheduleSpiderPosition);
  updateSpiderPosition();
}

if (
  introSplash instanceof HTMLElement &&
  loadingPercentage instanceof HTMLElement &&
  loadingProgress instanceof HTMLElement &&
  loadingTrack instanceof HTMLElement
) {
  let animationFrame = 0;
  let finishTimeout = 0;
  const loadingDuration = 3000;

  const setLoadingProgress = (value) => {
    const percentage = Math.max(0, Math.min(100, value));
    loadingPercentage.textContent = `${percentage}%`;
    loadingProgress.style.width = `${percentage}%`;
    loadingTrack.setAttribute("aria-valuenow", String(percentage));
  };

  const dismissIntro = () => {
    window.cancelAnimationFrame(animationFrame);
    window.clearTimeout(finishTimeout);
    setLoadingProgress(100);
    introSplash.classList.add("is-done");
    introSplash.setAttribute("aria-hidden", "true");
    document.documentElement.classList.add("intro-finished");
  };

  skipIntroButton?.addEventListener("click", dismissIntro, { once: true });

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    dismissIntro();
  } else {
    let startedAt;
    const updateProgress = (now) => {
      if (startedAt === undefined) startedAt = now;
      const progress = Math.min((now - startedAt) / loadingDuration, 1);
      setLoadingProgress(Math.floor(progress * 100));

      if (progress === 1) {
        finishTimeout = window.setTimeout(dismissIntro, 180);
      } else {
        animationFrame = window.requestAnimationFrame(updateProgress);
      }
    };

    animationFrame = window.requestAnimationFrame(updateProgress);
  }
}

if (menuButton && navigation) {
  document.documentElement.classList.add("js");
  navigation.dataset.open = "false";

  const closeMenu = (restoreFocus = false) => {
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open navigation menu");
    navigation.dataset.open = "false";

    if (restoreFocus) {
      menuButton.focus();
    }
  };

  menuButton.addEventListener("click", () => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!isOpen));
    menuButton.setAttribute("aria-label", isOpen ? "Open navigation menu" : "Close navigation menu");
    navigation.dataset.open = String(!isOpen);
  });

  navigation.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
      closeMenu(true);
    }
  });

  window.matchMedia("(min-width: 651px)").addEventListener("change", (event) => {
    if (event.matches) {
      closeMenu();
    }
  });
}

const revealTargets = document.querySelectorAll(
  ".hero-copy, .hero-art, .proof-strip, .section-heading, .service-card, .process-copy, .step, .network-banner > *, .contact-form",
);

if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    }
  }, { threshold: 0.12 });

  revealTargets.forEach((target) => {
    target.classList.add("reveal-on-scroll");
    revealObserver.observe(target);
  });
} else {
  revealTargets.forEach((target) => target.classList.add("is-visible"));
}

const contactForm = document.querySelector("#contact-form");
const formStatus = document.querySelector("#form-status");

if (contactForm instanceof HTMLFormElement && formStatus instanceof HTMLElement) {
  const fields = [...contactForm.querySelectorAll("input, select, textarea")];

  const setFieldState = (field) => {
    if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement)) {
      return;
    }

    const isInvalid = field.validity && !field.validity.valid;
    field.setAttribute("aria-invalid", String(isInvalid));
  };

  fields.forEach((field) => {
    field.addEventListener("blur", () => setFieldState(field));
    field.addEventListener("input", () => setFieldState(field));
  });

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = contactForm.querySelector('button[type="submit"]');
    if (!(submitButton instanceof HTMLButtonElement)) return;

    const isValid = contactForm.reportValidity();
    if (!isValid) {
      formStatus.classList.remove("is-success");
      formStatus.classList.add("is-error");
      formStatus.textContent = "Please complete the highlighted fields and try again.";
      fields.forEach((field) => setFieldState(field));
      return;
    }

    formStatus.textContent = "";
    formStatus.classList.remove("is-error", "is-success");
    submitButton.disabled = true;

    try {
      const formData = new FormData(contactForm);
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData.entries())),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "We could not send your inquiry. Please try again.");
      }

      contactForm.reset();
      fields.forEach((field) => field.setAttribute("aria-invalid", "false"));
      formStatus.classList.remove("is-error");
      formStatus.classList.add("is-success");
      formStatus.textContent = result.message;
    } catch (error) {
      formStatus.classList.remove("is-success");
      formStatus.classList.add("is-error");
      formStatus.textContent = error instanceof Error
        ? error.message
        : "We could not send your inquiry. Please try again.";
    } finally {
      submitButton.disabled = false;
    }
  });
}
