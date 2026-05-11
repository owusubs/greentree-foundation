const API_BASE_URL =
  window.GREENTREE_API_BASE_URL || "https://greentree-foundation-api.onrender.com";
const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const forms = document.querySelectorAll("form");
const statNumbers = document.querySelectorAll(".stats-grid strong");
const parallaxImages = document.querySelectorAll(".hero img, .page-hero > img, .split-image img");
const backgroundDriftSections = document.querySelectorAll(".intro, .programs, .volunteer");
const magneticButtons = document.querySelectorAll(".button");
const tiltCards = document.querySelectorAll(
  ".program-card, .impact-grid article, .detail-grid article, .donate-notes article, .stats-grid article, .feature-list li, .steps li, .donate-doctor-proof article, .donation-journey-steps article, .volunteer-project-list article, .volunteer-authority-grid article, .volunteer-work-grid article, .volunteer-process-list li, .impact-service-grid article, .impact-method-grid article, .impact-audience-grid article"
);
const pageLinks = document.querySelectorAll("a[href]");
const shouldReduceMotion =
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const sectionNavLinks = {
  mission: "missions.html",
  programs: "programs.html",
  impact: "impacts.html",
  volunteer: "volunteer.html",
  donate: "donate.html"
};
const revealSelectors = [
  "main > section",
  ".site-footer",
  ".site-footer > *",
  ".hero-content",
  ".hero-content > *",
  ".page-hero-content",
  ".page-hero-content > *",
  ".intro-text",
  ".intro-text > *",
  ".section-heading",
  ".section-heading > *",
  ".text-stack",
  ".text-stack > *",
  ".hero-copy",
  ".donation-band > *",
  ".donate-copy",
  ".donate-copy > *",
  ".volunteer-copy",
  ".volunteer-copy > *",
  ".split-copy",
  ".split-copy > *",
  ".program-card",
  ".program-card div > *",
  ".program-card img",
  ".impact-grid article",
  ".impact-grid article > *",
  ".impact-grid img",
  ".split-image",
  ".split-image img",
  ".gallery-strip img",
  ".page-hero > img",
  ".detail-grid article",
  ".detail-grid article > *",
  ".stats-grid article",
  ".stats-grid article > *",
  ".contact-form",
  ".contact-form > *",
  ".donate-notes article",
  ".donate-notes article > *",
  ".doctor-donate-quote",
  ".donate-doctor-proof article",
  ".donation-journey-steps article",
  ".doctor-donate-notes article",
  ".donate-doctor-care-images img",
  ".volunteer-feature-frame",
  ".volunteer-index-panel",
  ".volunteer-project-list article",
  ".volunteer-authority-grid article",
  ".volunteer-work-grid article",
  ".volunteer-work-grid img",
  ".volunteer-process-list li",
  ".impact-service-grid article",
  ".impact-method-grid article",
  ".impact-method-grid img",
  ".impact-audience-grid article",
  ".feature-list li",
  ".feature-list li > *",
  ".steps li"
];
const revealElements = Array.from(
  document.querySelectorAll(revealSelectors.join(", "))
);
const activeNavSections = Object.entries(sectionNavLinks)
  .map(([sectionId, href]) => {
    const section = document.getElementById(sectionId);
    const link = nav ? nav.querySelector(`a[href="${href}"]`) : null;

    return section && link ? { section, link } : null;
  })
  .filter(Boolean);
const scrollProgressBar = document.createElement("div");
const scrollTopButton = document.createElement("button");

scrollProgressBar.className = "scroll-progress";
scrollProgressBar.setAttribute("aria-hidden", "true");
scrollTopButton.className = "scroll-top-button";
scrollTopButton.type = "button";
scrollTopButton.setAttribute("aria-label", "Scroll to top");
scrollTopButton.innerHTML = "&uarr;";
document.body.append(scrollProgressBar, scrollTopButton);

window.requestAnimationFrame(() => {
  document.body.classList.add("page-is-ready");
  if (header) {
    header.classList.add("header-is-ready");
  }
});

const updateHeader = () => {
  if (header) {
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  }
};

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

const updateScrollProgress = () => {
  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollableHeight > 0 ? (window.scrollY / scrollableHeight) * 100 : 0;

  scrollProgressBar.style.setProperty("--scroll-progress", `${Math.min(100, Math.max(0, progress)) / 100}`);
  scrollTopButton.classList.toggle("is-visible", window.scrollY > 520);
};

const updateActiveNavLink = () => {
  if (!activeNavSections.length || !nav) {
    return;
  }

  const anchorLine = window.innerHeight * 0.42;
  const activeTarget = activeNavSections.reduce((closest, item) => {
    const rect = item.section.getBoundingClientRect();
    const isNearViewport = rect.top <= anchorLine && rect.bottom >= window.innerHeight * 0.18;
    const distance = Math.abs(rect.top - anchorLine);

    if (!isNearViewport) {
      return closest;
    }

    return !closest || distance < closest.distance ? { ...item, distance } : closest;
  }, null);

  if (!activeTarget) {
    nav.querySelectorAll("a.is-active").forEach((link) => link.classList.remove("is-active"));
    return;
  }

  nav.querySelectorAll("a.is-active").forEach((link) => link.classList.remove("is-active"));
  activeTarget.link.classList.add("is-active");
};

const updateBackgroundDrift = () => {
  if (shouldReduceMotion || !backgroundDriftSections.length) {
    return;
  }

  backgroundDriftSections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    const sectionCenter = rect.top + rect.height / 2;
    const viewportCenter = window.innerHeight / 2;
    const offset = Math.max(-24, Math.min(24, (viewportCenter - sectionCenter) * 0.035));

    section.style.setProperty("--bg-drift-y", `${offset}px`);
  });
};

const updateScrollAnimations = () => {
  updateScrollProgress();
  updateActiveNavLink();
  updateBackgroundDrift();
};

scrollTopButton.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: shouldReduceMotion ? "auto" : "smooth"
  });
});

if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
  });

  nav.addEventListener("click", (event) => {
    if (event.target.matches("a")) {
      nav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Open menu");
    }
  });
}

const isApiConfigured = () =>
  Boolean(API_BASE_URL) && !API_BASE_URL.includes("YOUR-RENDER-SERVICE");

const setFormStatus = (form, message, type = "info") => {
  let status = form.querySelector("[data-form-status]");

  if (!status) {
    status = document.createElement("p");
    status.className = "form-status";
    status.setAttribute("data-form-status", "");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    form.append(status);
  }

  status.textContent = message;
  status.dataset.type = type;
};

const setFormLoading = (form, isLoading) => {
  const button = form.querySelector("button[type='submit'], button");

  if (!button) {
    return;
  }

  if (!button.dataset.originalText) {
    button.dataset.originalText = button.textContent.trim();
  }

  button.disabled = isLoading;
  button.textContent = isLoading ? "Please wait..." : button.dataset.originalText;
};

const getFormType = (form) => {
  if (form.dataset.formType) {
    return form.dataset.formType;
  }

  if (form.classList.contains("footer-newsletter")) {
    return "newsletter";
  }

  if (form.classList.contains("donation-form") || form.classList.contains("donation-page-form")) {
    return "donation";
  }

  if (form.classList.contains("contact-form")) {
    return "volunteer";
  }

  return "contact";
};

const toBoolean = (value) => value === "on" || value === "true" || value === true;

const formToPayload = (form) => {
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  payload.sourcePage = window.location.pathname || "index.html";
  payload.website = payload.website || "";

  if ("consent" in payload) {
    payload.consent = toBoolean(payload.consent);
  }

  return payload;
};

const apiRequest = async (path, payload) => {
  if (!isApiConfigured()) {
    throw new Error("The backend API URL still needs to be set in script.js before the live forms can work.");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Something went wrong. Please try again.");
  }

  return data;
};

const handleDonationSubmit = async (form) => {
  const payload = formToPayload(form);
  const data = await apiRequest("/api/donations/create-checkout-session", payload);

  if (!data.url) {
    throw new Error("Stripe did not return a checkout link. Please try again.");
  }

  window.location.href = data.url;
};

const handleStandardSubmit = async (form, type) => {
  const endpointMap = {
    contact: "/api/contact",
    newsletter: "/api/newsletter",
    volunteer: "/api/volunteer"
  };
  const successMap = {
    contact: "Thank you. Your message has been sent.",
    newsletter: "Thank you. You are on the newsletter list.",
    volunteer: "Thank you. Your interest has been sent."
  };

  await apiRequest(endpointMap[type], formToPayload(form));
  setFormStatus(form, successMap[type], "success");
  form.reset();
};

const setupApiForms = () => {
  forms.forEach((form) => {
    const type = getFormType(form);
    const honeypot = document.createElement("label");

    honeypot.className = "form-honeypot";
    honeypot.setAttribute("aria-hidden", "true");
    honeypot.innerHTML = '<span>Website</span><input type="text" name="website" tabindex="-1" autocomplete="off">';
    form.append(honeypot);

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      try {
        setFormLoading(form, true);
        setFormStatus(form, type === "donation" ? "Opening secure checkout..." : "Sending...", "info");

        if (type === "donation") {
          await handleDonationSubmit(form);
        } else {
          await handleStandardSubmit(form, type);
        }
      } catch (error) {
        setFormStatus(form, error.message, "error");
      } finally {
        setFormLoading(form, false);
      }
    });
  });
};

const setupCustomDonationAmount = () => {
  document.querySelectorAll("[data-custom-amount-field]").forEach((field) => {
    const form = field.closest("form");
    const select = form ? form.querySelector("select[name='amount']") : null;
    const input = field.querySelector("input");

    if (!form || !select || !input) {
      return;
    }

    const updateCustomField = () => {
      const isCustom = select.value === "custom";

      field.hidden = !isCustom;
      input.required = isCustom;
      if (!isCustom) {
        input.value = "";
      }
    };

    select.addEventListener("change", updateCustomField);
    updateCustomField();
  });
};

const setupMagneticButtons = () => {
  if (shouldReduceMotion) {
    return;
  }

  magneticButtons.forEach((button) => {
    button.addEventListener("pointermove", (event) => {
      const rect = button.getBoundingClientRect();
      const x = (event.clientX - rect.left - rect.width / 2) * 0.18;
      const y = (event.clientY - rect.top - rect.height / 2) * 0.22;

      button.style.setProperty("--magnet-x", `${x}px`);
      button.style.setProperty("--magnet-y", `${y}px`);
    });

    button.addEventListener("pointerleave", () => {
      button.style.setProperty("--magnet-x", "0px");
      button.style.setProperty("--magnet-y", "0px");
    });
  });
};

const setupCardTilt = () => {
  if (shouldReduceMotion) {
    return;
  }

  tiltCards.forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;

      card.style.setProperty("--tilt-x", `${(-y * 5).toFixed(2)}deg`);
      card.style.setProperty("--tilt-y", `${(x * 6).toFixed(2)}deg`);
    });

    card.addEventListener("pointerleave", () => {
      card.style.removeProperty("--tilt-x");
      card.style.removeProperty("--tilt-y");
    });
  });
};

const animateCounter = (element) => {
  const originalText = element.dataset.counterValue || element.textContent.trim();
  const match = originalText.match(/^([^0-9]*)([0-9]+(?:\.[0-9]+)?)(.*)$/);

  if (!match) {
    return;
  }

  const [, prefix, number, suffix] = match;
  const target = Number(number);
  const decimals = number.includes(".") ? number.split(".")[1].length : 0;
  const duration = 1200;
  const startTime = performance.now();

  element.dataset.counterValue = originalText;
  element.textContent = `${prefix}${(0).toFixed(decimals)}${suffix}`;

  const renderFrame = (now) => {
    const progress = Math.min((now - startTime) / duration, 1);
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    const currentValue = target * easedProgress;
    const formattedValue = currentValue.toFixed(decimals).replace(/\.0$/, "");

    element.textContent = `${prefix}${formattedValue}${suffix}`;

    if (progress < 1) {
      requestAnimationFrame(renderFrame);
    } else {
      element.textContent = originalText;
    }
  };

  requestAnimationFrame(renderFrame);
};

const animateStatNumbers = () => {
  if (!statNumbers.length) {
    return;
  }

  if (shouldReduceMotion || !("IntersectionObserver" in window)) {
    return;
  }

  const counterObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.55 }
  );

  statNumbers.forEach((number) => counterObserver.observe(number));
};

const updateParallaxImages = () => {
  if (shouldReduceMotion || !parallaxImages.length) {
    return;
  }

  parallaxImages.forEach((image) => {
    const rect = image.getBoundingClientRect();
    const viewportCenter = window.innerHeight / 2;
    const imageCenter = rect.top + rect.height / 2;
    const offset = (viewportCenter - imageCenter) * 0.045;
    const limitedOffset = Math.max(-18, Math.min(18, offset));

    image.style.setProperty("--parallax-y", `${limitedOffset}px`);
  });
};

const setupPageTransitions = () => {
  if (shouldReduceMotion) {
    return;
  }

  pageLinks.forEach((link) => {
    const url = new URL(link.href, window.location.href);
    const isSameOrigin = url.origin === window.location.origin;
    const isHtmlPage = !url.hash && (url.pathname.endsWith(".html") || !url.pathname.includes("."));

    if (!isSameOrigin || !isHtmlPage || link.target === "_blank") {
      return;
    }

    link.addEventListener("click", (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      event.preventDefault();
      document.body.classList.add("page-is-leaving");
      window.setTimeout(() => {
        window.location.href = link.href;
      }, 220);
    });
  });
};

const revealScrollElements = () => {
  if (!revealElements.length) {
    return;
  }

  revealElements.forEach((element) => {
    element.classList.add("reveal-on-scroll");

    if (
      element.matches("img") ||
      element.matches(".split-image") ||
      element.matches(".program-card") ||
      element.matches(".impact-grid article")
    ) {
      element.classList.add("reveal-image");
    }

    const siblingIndex = Array.from(element.parentElement.children).indexOf(element);
    const delay = Math.max(0, siblingIndex % 5) * 90;
    element.style.setProperty("--reveal-delay", `${delay}ms`);
  });

  if (shouldReduceMotion || !("IntersectionObserver" in window)) {
    revealElements.forEach((element) => {
      element.classList.add("is-visible");
    });
    return;
  }

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      rootMargin: "0px 0px -12% 0px",
      threshold: 0.16
    }
  );

  revealElements.forEach((element) => revealObserver.observe(element));
};

setupApiForms();
setupCustomDonationAmount();
revealScrollElements();
animateStatNumbers();
setupMagneticButtons();
setupCardTilt();
setupPageTransitions();
updateScrollAnimations();
updateParallaxImages();
window.addEventListener("scroll", updateParallaxImages, { passive: true });
window.addEventListener("scroll", updateScrollAnimations, { passive: true });
window.addEventListener("resize", updateParallaxImages);
window.addEventListener("resize", updateScrollAnimations);
