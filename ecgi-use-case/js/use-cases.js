const navLinks = document.querySelectorAll("a[href^='#']");

function setupAnchorLinks() {
  navLinks.forEach((link) => {
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
          source: "ciq-ecc-ccc",
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

function postIframeHeight() {
  if (window.parent === window) {
    return;
  }

  window.parent.postMessage(
    {
      source: "ciq-ecc-ccc",
      type: "resize",
      height: getDocumentHeight(),
    },
    "*",
  );
}

function setupReadMoreButtons() {
  document.querySelectorAll(".read-more-button").forEach((button) => {
    const targetId = button.getAttribute("aria-controls");
    const target = targetId ? document.getElementById(targetId) : null;

    if (!target || button.dataset.readMoreBound === "true") {
      return;
    }

    button.dataset.readMoreBound = "true";
    button.addEventListener("click", () => {
      const isExpanded = button.getAttribute("aria-expanded") === "true";

      button.setAttribute("aria-expanded", String(!isExpanded));
      button.textContent = isExpanded ? "Read more" : "Show less";
      target.hidden = isExpanded;
      postIframeHeight();
    });
  });
}

window.addEventListener("load", postIframeHeight);
window.addEventListener("resize", postIframeHeight);

if ("ResizeObserver" in window) {
  const resizeObserver = new ResizeObserver(postIframeHeight);
  resizeObserver.observe(document.body);
}

setupAnchorLinks();
setupReadMoreButtons();
postIframeHeight();
