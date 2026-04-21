// Sticky header — shrink logo on scroll
const header = document.querySelector(".header");
const SCROLL_THRESHOLD_ON = 60;
const SCROLL_THRESHOLD_OFF = 10; // hysteresis: prevents oscillation caused by layout shift

function handleHeaderScroll() {
  const isScrolled = header.classList.contains("header--scrolled");
  if (!isScrolled && window.scrollY > SCROLL_THRESHOLD_ON) {
    header.classList.add("header--scrolled");
  } else if (isScrolled && window.scrollY < SCROLL_THRESHOLD_OFF) {
    header.classList.remove("header--scrolled");
  }
}

// Back to top button
const backToTop = document.querySelector(".back-to-top");
const BACK_TO_TOP_THRESHOLD = 400;

function handleBackToTopVisibility() {
  if (window.scrollY > BACK_TO_TOP_THRESHOLD) {
    backToTop.classList.add("visible");
  } else {
    backToTop.classList.remove("visible");
  }
}

if (backToTop) {
  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

window.addEventListener(
  "scroll",
  () => {
    handleHeaderScroll();
    handleBackToTopVisibility();
  },
  { passive: true },
);

// Run once on load in case page is already scrolled
handleHeaderScroll();
handleBackToTopVisibility();

// Leadership cards: keep heights equal to the tallest hover/default content.
function syncLeadershipCardHeights() {
  const leaderCards = Array.from(document.querySelectorAll(".leader-card"));
  if (!leaderCards.length) return;

  const supportsHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (!supportsHover) {
    leaderCards.forEach((card) => {
      card.style.minHeight = "";
    });
    return;
  }

  leaderCards.forEach((card) => {
    card.style.minHeight = "";
  });

  let maxRequiredHeight = 0;

  leaderCards.forEach((card) => {
    const defaultContent = card.querySelector(".leader-default");
    const hoverContent = card.querySelector(".leader-hover");
    const hoverScroll = card.querySelector(".leader-hover-scroll");
    const hoverButton = card.querySelector(".leader-linkedin");

    if (!defaultContent || !hoverContent || !hoverScroll || !hoverButton) return;

    const cardStyles = window.getComputedStyle(card);
    const cardPaddingTop = parseFloat(cardStyles.paddingTop) || 0;
    const cardPaddingBottom = parseFloat(cardStyles.paddingBottom) || 0;
    const defaultHeight = defaultContent.offsetHeight + cardPaddingTop + cardPaddingBottom;

    const hoverStyles = window.getComputedStyle(hoverContent);
    const hoverPaddingTop = parseFloat(hoverStyles.paddingTop) || 0;
    const hoverPaddingBottom = parseFloat(hoverStyles.paddingBottom) || 0;
    const hoverGap = parseFloat(hoverStyles.gap) || 0;

    const hoverHeight = hoverPaddingTop + hoverScroll.scrollHeight + hoverGap + hoverButton.offsetHeight + hoverPaddingBottom;

    const requiredHeight = Math.max(defaultHeight, hoverHeight);
    maxRequiredHeight = Math.max(maxRequiredHeight, requiredHeight);
  });

  if (!maxRequiredHeight) return;

  const normalizedHeight = Math.ceil(maxRequiredHeight);
  leaderCards.forEach((card) => {
    card.style.minHeight = `${normalizedHeight}px`;
  });
}

let leadershipResizeTimer;
window.addEventListener("resize", () => {
  window.clearTimeout(leadershipResizeTimer);
  leadershipResizeTimer = window.setTimeout(syncLeadershipCardHeights, 150);
});

window.addEventListener("load", syncLeadershipCardHeights);
syncLeadershipCardHeights();

// Intro video modal
const watchVideoButton = document.querySelector(".btn-watch-video");
const videoModal = document.getElementById("video-modal");
const introVideoFrame = document.getElementById("intro-video-frame");
const videoModalCloseTriggers = document.querySelectorAll("[data-video-modal-close]");
const youtubeOriginParam = window.location.protocol === "http:" || window.location.protocol === "https:" ? `&origin=${encodeURIComponent(window.location.origin)}` : "";
const introVideoEmbedUrl = `https://www.youtube.com/embed/8wc-EUQ2rOY?autoplay=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1${youtubeOriginParam}`;

function openVideoModal() {
  if (!videoModal || !introVideoFrame) return;

  introVideoFrame.src = introVideoEmbedUrl;
  videoModal.classList.add("is-open");
  videoModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeVideoModal() {
  if (!videoModal || !introVideoFrame) return;

  videoModal.classList.remove("is-open");
  videoModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  introVideoFrame.src = "about:blank";
}

if (watchVideoButton) {
  watchVideoButton.addEventListener("click", openVideoModal);
}

videoModalCloseTriggers.forEach((trigger) => {
  trigger.addEventListener("click", closeVideoModal);
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (videoModal?.classList.contains("is-open")) closeVideoModal();
    if (newsletterModal?.classList.contains("is-open")) closeNewsletterModal();
  }
});

// Newsletter modal
const newsletterModal = document.getElementById("newsletter-modal");
const newsletterOpenTriggers = document.querySelectorAll("[data-newsletter-open]");
const newsletterModalCloseTriggers = document.querySelectorAll("[data-newsletter-modal-close]");

function openNewsletterModal() {
  if (!newsletterModal) return;
  newsletterModal.classList.add("is-open");
  newsletterModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeNewsletterModal() {
  if (!newsletterModal) return;
  newsletterModal.classList.remove("is-open");
  newsletterModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

newsletterOpenTriggers.forEach((trigger) => {
  trigger.addEventListener("click", openNewsletterModal);
});

newsletterModalCloseTriggers.forEach((trigger) => {
  trigger.addEventListener("click", closeNewsletterModal);
});

// Newsletter form — validation + JSONP submit (no off-site redirect)
const mcForm = document.getElementById("mc-embedded-subscribe-form");
const mcSubmit = document.getElementById("mc-embedded-subscribe");
const mcToast = document.getElementById("mc-toast");

function showToast(message, type) {
  if (!mcToast) return;
  mcToast.textContent = message;
  mcToast.className = "mc-toast mc-toast--" + type + " is-visible";
  clearTimeout(mcToast._hideTimer);
  mcToast._hideTimer = setTimeout(() => {
    mcToast.classList.remove("is-visible");
  }, 5000);
}

if (mcForm && mcSubmit) {
  const getRequiredFields = () => [mcForm.querySelector("#mce-EMAIL"), mcForm.querySelector("#mce-FNAME"), mcForm.querySelector("#mce-LNAME"), mcForm.querySelector("#mce-MMERGE7")];

  const isFormValid = () => {
    const textFields = getRequiredFields();
    const allTextFilled = textFields.every((f) => f && f.value.trim() !== "");
    const radioChecked = mcForm.querySelector('input[name="MMERGE8"]:checked') !== null;
    return allTextFilled && radioChecked;
  };

  const updateSubmitState = () => {
    mcSubmit.disabled = !isFormValid();
  };

  updateSubmitState();

  mcForm.querySelectorAll('input[type="email"], input[type="text"], select, input[type="radio"]').forEach((el) => {
    el.addEventListener("input", updateSubmitState);
    el.addEventListener("change", updateSubmitState);
  });

  mcForm.addEventListener("submit", function (e) {
    e.preventDefault();

    // Show loading state
    mcSubmit.classList.add("is-loading");
    mcSubmit.disabled = true;

    // Build query string from all form fields
    const params = new URLSearchParams(new FormData(mcForm));
    const callbackName = "mcCallback_" + Date.now();
    params.set("c", callbackName);

    const script = document.createElement("script");
    script.src = mcForm.action.replace("/post?", "/post-json?") + "&" + params.toString();

    // Safety timeout — clear loading state if no response after 15s
    const timeoutId = setTimeout(function () {
      delete window[callbackName];
      script.remove();
      mcSubmit.classList.remove("is-loading");
      updateSubmitState();
      const errorEl = document.getElementById("mce-error-response");
      if (errorEl) {
        errorEl.textContent = "Request timed out. Please try again.";
        errorEl.style.display = "block";
      }
    }, 15000);

    window[callbackName] = function (data) {
      clearTimeout(timeoutId);
      delete window[callbackName];
      script.remove();
      mcSubmit.classList.remove("is-loading");

      const errorEl = document.getElementById("mce-error-response");

      if (data.result === "success") {
        closeNewsletterModal();
        mcForm.reset();
        updateSubmitState();
        showToast("You're subscribed! Welcome to the Aethl newsletter.", "success");
      } else {
        updateSubmitState();
        // Strip any Mailchimp HTML from error msg
        const msg = data.msg
          ? data.msg
            .replace(/<[^>]+>/g, "")
            .replace(/^\d+ - /, "")
            .trim()
          : "Something went wrong. Please try again.";
        if (errorEl) {
          errorEl.textContent = msg;
          errorEl.style.display = "block";
        }
      }
    };

    document.head.appendChild(script);
  });
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  });
});

// News Carousel
const newsData = [
  {
    title: "Aethl Bio Appoints Dr. Joseph Maroon to Scientific Advisory Board, Strengthening Clinical and Scientific Leadership",
    description: "Aethl Bio announces the appointment of Dr. Joseph Maroon, MD, FACS, to its Scientific Advisory Board. A renowned neurosurgeon, UPMC professor, and expert in oxygen-based therapies, Dr. Maroon brings deep clinical insight that will help advance the company’s platform and support the continued evolution of its next-generation wound care and wellness solutions.",
    link: "https://www.einpresswire.com/article/890084290/aethl-bio-appoints-dr-joseph-maroon-to-scientific-advisory-board-strengthening-clinical-and-scientific-leadership",
  },
  {
    title: "Aethl Bio Strengthens Leadership with Appointment of Melissa A. Thompson, PhD",
    description: "Aethl Bio announces the appointment of Melissa A. Thompson, PhD, to its Scientific Advisory Board and leadership team as Chief Compliance Officer. With more than 30 years of experience in regulatory and quality strategy, Dr. Thompson will play a critical role in advancing the company’s technology platform and supporting its continued growth.",
    link: "https://www.linkedin.com/posts/carmelormontalvo_pgh-biotech-innovation-share-7415262891173679105-VXvl/?utm_source=share&utm_medium=member_desktop&rcm=ACoAAAwduKkBz-3a812mwgVGDM1p08LOoX_E_uA",
  },
];

let currentNewsIndex = 0;

// Calculate and set the maximum height for the news carousel
function setCarouselHeight() {
  const newsCard = document.querySelector(".news-card");
  if (!newsCard) return;

  let maxHeight = 0;

  // Measure each news item's height
  newsData.forEach((news) => {
    // Temporarily set the content
    newsCard.innerHTML = `
      <h3>${news.title}</h3>
      <p>${news.description}</p>
      <a href="${news.link}" class="btn btn-secondary" target="_blank" rel="noopener noreferrer">Read Story</a>
    `;

    // Get the height
    const height = newsCard.offsetHeight;
    if (height > maxHeight) {
      maxHeight = height;
    }
  });

  // Set the min-height to prevent jumping
  newsCard.style.minHeight = `${maxHeight}px`;

  // Reset to the first news item
  updateNewsCard();
}

function updateNewsCard() {
  const newsCard = document.querySelector(".news-card");
  const currentNews = newsData[currentNewsIndex];

  newsCard.innerHTML = `
        <h3>${currentNews.title}</h3>
        <p>${currentNews.description}</p>
        <a href="${currentNews.link}" class="btn btn-secondary" target="_blank" rel="noopener noreferrer">Read Story</a>
    `;

  // Add fade animation
  newsCard.style.opacity = "0";
  setTimeout(() => {
    newsCard.style.opacity = "1";
  }, 50);
}

// Carousel navigation
document.querySelectorAll(".carousel-prev").forEach((btn) => {
  btn.addEventListener("click", () => {
    currentNewsIndex = (currentNewsIndex - 1 + newsData.length) % newsData.length;
    updateNewsCard();
  });
});

document.querySelectorAll(".carousel-next").forEach((btn) => {
  btn.addEventListener("click", () => {
    currentNewsIndex = (currentNewsIndex + 1) % newsData.length;
    updateNewsCard();
  });
});

// Add transition effect to news card
const newsCard = document.querySelector(".news-card");
if (newsCard) {
  newsCard.style.transition = "opacity 0.3s ease-in-out";
  // Set the carousel height based on the tallest news item
  setCarouselHeight();
}

// Button click handlers for demo purposes
document.querySelectorAll(".btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    // Prevent default only if it's not a carousel button
    if (!e.target.closest(".carousel-btn")) {
      console.log("Button clicked:", e.target.textContent || e.currentTarget.textContent);
    }
  });
});

// Add subtle parallax effect to background
let ticking = false;
let lastScrollY = window.scrollY;

function updateParallax() {
  const backgroundDecoration = document.querySelector(".background-decoration");
  const backgroundSvg = document.querySelector(".background-svg");

  if (backgroundDecoration) {
    backgroundDecoration.style.transform = `translateX(-50%) translateY(${lastScrollY * 0.3}px)`;
  }

  if (backgroundSvg) {
    backgroundSvg.style.transform = `translateY(${lastScrollY * 0.1}px)`;
  }

  ticking = false;
}

window.addEventListener("scroll", () => {
  lastScrollY = window.scrollY;

  if (!ticking) {
    window.requestAnimationFrame(updateParallax);
    ticking = true;
  }
});

// Intersection Observer for fade-in animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px",
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = "1";
      entry.target.style.transform = "translateY(0)";
    }
  });
}, observerOptions);

// Observe sections for animation
document.querySelectorAll(".statistics-section, .problem-row, .approach-section, .team-section, .news-section, .contact-section").forEach((section) => {
  section.style.opacity = "0";
  section.style.transform = "translateY(30px)";
  section.style.transition = "opacity 0.6s ease-out, transform 0.6s ease-out";
  observer.observe(section);
});

// Log when page is fully loaded
window.addEventListener("load", () => {
  console.log("Aethl Bio website loaded successfully");
  // Set current year for copyright
  document.getElementById("copyright-year").textContent = new Date().getFullYear();
});

// Advisor card toggle functionality
document.querySelectorAll(".card-toggle").forEach((button) => {
  button.addEventListener("click", (e) => {
    e.stopPropagation();
    const card = button.closest(".advisor-card, .leader-card");
    if (!card) return;
    card.classList.toggle("expanded");
  });
});

// resources page filtering
document.addEventListener("DOMContentLoaded", () => {
  const filterButtons = document.querySelectorAll(".resources-filter .filter-btn");
  const items = document.querySelectorAll(".resources-list .resource-item");

  function setActiveButton(clickedBtn) {
    filterButtons.forEach((btn) => btn.classList.remove("active"));
    clickedBtn.classList.add("active");
  }

  function applyFilter(filter) {
    items.forEach((item) => {
      const matches = filter === "all" || item.classList.contains(filter);

      // Use hidden so it’s removed from layout and accessible
      item.hidden = !matches;
    });
  }

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const filter = btn.dataset.filter; // "all" | "press" | "publication"
      setActiveButton(btn);
      applyFilter(filter);
    });
  });

  // Initialize based on the default active button (or fall back to "all")
  const initial = document.querySelector(".resources-filter .filter-btn.active")?.dataset.filter || "all";
  applyFilter(initial);
});

// white paper contest list highlight on scroll
document.addEventListener("DOMContentLoaded", () => {
  const listLinks = document.querySelectorAll(".contents-list a");
  const sections = Array.from(listLinks).map((link) => document.querySelector(link.getAttribute("href")));

  let isManualScrolling = false; // The "Lock" flag

  const updateActiveLink = () => {
    // If we are currently moving due to a click, stop the scroll spy logic
    if (isManualScrolling) return;

    const scrollPosition = window.scrollY;
    const windowHeight = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;
    let activeIndex = -1;

    // Bottom of page check
    if (scrollPosition + windowHeight >= docHeight - 10) {
      activeIndex = sections.length - 1;
    } else {
      const triggerMargin = windowHeight * 0.2;
      sections.forEach((section, index) => {
        if (section && section.getBoundingClientRect().top <= triggerMargin) {
          activeIndex = index;
        }
      });
    }

    listLinks.forEach((link, index) => {
      link.classList.toggle("active", index === activeIndex);
    });
  };

  // 1. ATTACH CLICK EVENTS TO LINKS
  listLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      // Optional: if you want smooth scroll via JS instead of CSS
      // e.preventDefault();
      // const targetId = link.getAttribute('href');
      // document.querySelector(targetId).scrollIntoView({ behavior: 'smooth' });

      isManualScrolling = true;

      // Remove active from others and set it immediately for the clicked item
      listLinks.forEach((l) => l.classList.remove("active"));
      link.classList.add("active");

      // 2. RELEASE THE LOCK
      // We wait until the scrolling stops. 'scrollend' is the modern way to do this.
      if ("onscrollend" in window) {
        window.addEventListener(
          "scrollend",
          () => {
            isManualScrolling = false;
          },
          { once: true },
        );
      } else {
        // Fallback for older browsers: use a timeout
        setTimeout(() => {
          isManualScrolling = false;
        }, 1000);
      }
    });
  });

  // 3. SCROLL LISTENER (Standard Throttling)
  let ticking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateActiveLink();
          ticking = false;
        });
        ticking = true;
      }
    },
    { passive: true },
  );

  updateActiveLink();
});

// Copy to clipboard for citation

async function copyCitationFromElement(el) {
  const html = el.innerHTML.trim();
  const text = el.textContent.trim();

  if (navigator.clipboard && window.ClipboardItem) {
    const item = new ClipboardItem({
      "text/html": new Blob([html], { type: "text/html" }),
      "text/plain": new Blob([text], { type: "text/plain" }),
    });
    await navigator.clipboard.write([item]);
    return;
  }
  await navigator.clipboard.writeText(text);
}

const copyCitationBtn = document.getElementById("copyCitationBtn");
if (!copyCitationBtn) {
  // This page doesn't have the citation UI, so do nothing.
} else {
  const live = document.getElementById("copyLive");
  let resetTimer;

  copyCitationBtn.addEventListener("click", async () => {
    clearTimeout(resetTimer);

    try {
      const citationEl = document.getElementById("citation");
      if (!citationEl) throw new Error("Missing #citation element");

      await copyCitationFromElement(citationEl);

      copyCitationBtn.classList.add("is-copied");
      if (live) live.textContent = "Copied citation to clipboard.";

      resetTimer = setTimeout(() => {
        copyCitationBtn.classList.remove("is-copied");
      }, 1200);
    } catch (err) {
      console.error("Copy failed:", err);
      if (live) live.textContent = "Copy failed.";
    }
  });
}

//solution for autoplay blocking in bg video — if play() fails, add a class to show fallback content instead of the video element. This is needed because some browsers (especially Safari) block autoplay videos with sound by default, even if muted attribute is present.
const video = document.querySelector("video");

async function tryPlayVideo() {
  if (video) {
    try {
      await video.play();
      video.classList.add("is-playing");
    } catch (error) {
      video.classList.add("autoplay-blocked");
      // Show poster, static image, or custom play button.
    }
  }
}

tryPlayVideo();
