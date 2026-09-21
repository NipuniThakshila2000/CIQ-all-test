const header = document.querySelector(".site-header");
const navLinks = document.querySelectorAll(".nav-links a[href^='#']");

function setHeaderState() {
  if (!header) {
    return;
  }

  header.classList.toggle("is-scrolled", window.scrollY > 8);
}

function setActiveNavLink() {
  const sections = [...document.querySelectorAll("main section[id]")];
  const currentSection = sections.reverse().find((section) => {
    const bounds = section.getBoundingClientRect();
    return bounds.top <= 140;
  });

  navLinks.forEach((link) => {
    const isActive = currentSection && link.hash === `#${currentSection.id}`;
    if (isActive) {
      link.setAttribute("aria-current", "page");
      return;
    }

    link.removeAttribute("aria-current");
  });
}

function handleScroll() {
  setHeaderState();
  setActiveNavLink();
}

function setupAnchorLinks() {
  const anchorLinks = document.querySelectorAll("a[href^='#']");

  anchorLinks.forEach((link) => {
    if (link.dataset.anchorBound === "true") {
      return;
    }

    link.dataset.anchorBound = "true";
    link.addEventListener("click", (event) => {
      const target = document.querySelector(link.getAttribute("href"));

      if (!target) {
        return;
      }

      event.preventDefault();
      window.parent.postMessage(
        {
          source: "ciq-use-case",
          type: "anchor",
          target: link.getAttribute("href").slice(1),
          top: Math.round(target.getBoundingClientRect().top + window.scrollY),
        },
        "*",
      );
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.pushState(null, "", link.getAttribute("href"));
    });
  });
}

function loadVideo(video) {
  if (!video || video.dataset.loaded === "true") {
    return;
  }

  const sources = video.querySelectorAll("source[data-src]");

  sources.forEach((source) => {
    source.src = source.dataset.src;
    source.removeAttribute("data-src");
  });

  video.dataset.loaded = "true";
  video.closest(".deferred-video")?.classList.add("is-loaded");
  video.load();

  const playPromise = video.play();
  if (playPromise) {
    playPromise.catch(() => {});
  }
}

function getVideoTopInParent(video, viewportState) {
  const bounds = video.getBoundingClientRect();
  return bounds.top - viewportState.iframeViewportTop;
}

function loadVideosInViewport() {
  const isEmbedded = window.parent !== window;

  if (isEmbedded && !window.ciqParentViewport) {
    return;
  }

  const viewportState = window.ciqParentViewport || {
    iframeViewportTop: window.scrollY,
    parentViewportHeight: window.innerHeight,
  };
  const preloadMargin = 260;

  document.querySelectorAll("video.lazy-video").forEach((video) => {
    if (video.dataset.loaded === "true") {
      return;
    }

    const top = getVideoTopInParent(video, viewportState);
    const bottom = top + video.getBoundingClientRect().height;
    const isNearViewport = bottom >= -preloadMargin && top <= viewportState.parentViewportHeight + preloadMargin;

    if (isNearViewport) {
      loadVideo(video);
    }
  });
}

function setupDeferredVideos() {
  const lazyVideos = [...document.querySelectorAll("video.lazy-video")];

  if (!lazyVideos.length) {
    return;
  }

  lazyVideos.forEach((video) => {
    if (video.dataset.deferredReady === "true") {
      return;
    }

    const frame = video.parentElement;
    video.dataset.deferredReady = "true";
    video.setAttribute("autoplay", "");
    video.muted = true;

    if (frame) {
      frame.classList.add("deferred-video");
    }
  });

  if (window.parent === window) {
    loadVideosInViewport();
  }
}

function setupManualVideos() {
  document.querySelectorAll("video.manual-video").forEach((video) => {
    if (video.dataset.manualReady === "true") {
      return;
    }

    video.dataset.manualReady = "true";
    video.addEventListener(
      "pointerdown",
      () => {
        loadVideo(video);
      },
      { once: true },
    );
    video.addEventListener(
      "play",
      () => {
        loadVideo(video);
      },
      { once: true },
    );
  });
}

function setupPressReadMore() {
  const moreItems = document.querySelectorAll(".press-more");
  const lessButtons = document.querySelectorAll(".press-less");

  moreItems.forEach((item) => {
    if (item.dataset.pressMoreBound === "true") {
      return;
    }

    item.dataset.pressMoreBound = "true";
    item.addEventListener("toggle", () => {
      window.requestAnimationFrame(postIframeHeight);
    });
  });

  lessButtons.forEach((button) => {
    if (button.dataset.pressLessBound === "true") {
      return;
    }

    button.dataset.pressLessBound = "true";
    button.addEventListener("click", () => {
      const details = button.closest("details");

      if (!details) {
        return;
      }

      details.open = false;
      window.requestAnimationFrame(postIframeHeight);
    });
  });
}

function setupLogoMarquee() {
  const track = document.querySelector(".logo-track");

  if (
    !track ||
    track.dataset.marqueeReady === "true" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return;
  }

  const logos = [...track.children];
  const cloneSet = document.createDocumentFragment();

  logos.forEach((logo) => {
    const clone = logo.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    clone.tabIndex = -1;
    cloneSet.appendChild(clone);
  });

  track.appendChild(cloneSet);
  track.dataset.marqueeReady = "true";
}

window.addEventListener("scroll", handleScroll, { passive: true });
window.addEventListener("load", () => {
  handleScroll();
  setupAnchorLinks();
  window.requestIdleCallback?.(setupLogoMarquee) ?? window.setTimeout(setupLogoMarquee, 300);
  setupDeferredVideos();
  setupManualVideos();
  setupPressReadMore();
});
handleScroll();
setupAnchorLinks();
setupDeferredVideos();
setupManualVideos();
setupPressReadMore();

function getDocumentHeight() {
  return Math.ceil(
    Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight,
    ),
  );
}

let iframeHeightFrame = null;

function postIframeHeightNow() {
  if (window.parent === window) {
    return;
  }

  window.parent.postMessage(
    {
      source: "ciq-use-case",
      type: "resize",
      height: getDocumentHeight(),
    },
    "*",
  );
}

function postIframeHeight() {
  if (iframeHeightFrame) {
    return;
  }

  iframeHeightFrame = window.requestAnimationFrame(() => {
    iframeHeightFrame = null;
    postIframeHeightNow();
  });
}

window.addEventListener("load", postIframeHeight);
window.addEventListener("resize", postIframeHeight);
window.addEventListener("scroll", loadVideosInViewport, { passive: true });

window.addEventListener("message", (event) => {
  if (!event.data || event.data.source !== "ciq-wix-parent" || event.data.type !== "viewport") {
    return;
  }

  window.ciqParentViewport = {
    iframeViewportTop: Number(event.data.iframeViewportTop) || 0,
    parentViewportHeight: Number(event.data.parentViewportHeight) || window.innerHeight,
  };

  loadVideosInViewport();
});

window.setTimeout(() => {
  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver(postIframeHeight);
    resizeObserver.observe(document.body);
  }
}, 250);

postIframeHeight();
