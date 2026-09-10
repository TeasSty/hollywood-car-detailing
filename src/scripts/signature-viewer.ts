const zonePriceIds: Record<string, string[]> = {
  optics: ["price-biled", "price-headlights"],
  ppf: ["price-ppf"],
  paint: ["price-polish"],
  interior: ["price-interior"],
  ceramic: ["price-ceramic", "price-glasscoat"],
  audio: ["price-audio"],
  anticor: ["price-anticor"],
};

export function initSignatureViewer(root: HTMLElement) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const stage = root.querySelector("[data-sig-stage]");
  const priceList = root.querySelector("[data-sig-price-list]");
  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-sig-hot]"));
  const priceRows = Array.from(root.querySelectorAll<HTMLElement>("[data-sig-price-row]"));
  const lines = Array.from(root.querySelectorAll<SVGPathElement>("[data-sig-line]"));
  const wraps = Array.from(root.querySelectorAll<HTMLElement>("[data-sig-hot-wrap]"));
  const labels = Array.from(root.querySelectorAll<HTMLElement>("[data-sig-label]"));
  const carStrokes = Array.from(root.querySelectorAll<SVGPathElement | SVGCircleElement | SVGEllipseElement | SVGRectElement>(".signature__stroke-draw"));

  let activeId: string | null = null;
  let ready = false;

  const markReady = () => {
    if (ready) return;
    ready = true;
    root.classList.add("is-ready");
    if (reduceMotion) root.classList.add("is-instant");
  };

  const clearPriceHighlight = () => {
    priceRows.forEach((el) => el.classList.remove("is-lit"));
  };

  const setActive = (id: string | null) => {
    activeId = id;
    const hasActive = id !== null;
    root.classList.toggle("is-focused", hasActive);

    buttons.forEach((btn) => {
      const on = id !== null && btn.getAttribute("data-sig-hot") === id;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", String(on));
    });

    wraps.forEach((wrap) => {
      const wid = wrap.getAttribute("data-sig-hot-wrap");
      const on = id !== null && wid === id;
      wrap.classList.toggle("is-active", on);
      wrap.classList.toggle("is-dim", hasActive && !on);
    });

    labels.forEach((label) => {
      const lid = label.getAttribute("data-sig-label");
      const on = id !== null && lid === id;
      label.classList.toggle("is-active", on);
      label.classList.toggle("is-dim", hasActive && !on);
    });

    lines.forEach((line) => {
      const lid = line.getAttribute("data-sig-line");
      const on = id !== null && lid === id;
      line.classList.toggle("is-active", on);
      line.classList.toggle("is-dim", hasActive && !on);
    });
  };

  const scrollPriceTo = (priceIds: string[]) => {
    const primary = priceIds[0];
    if (!primary) return;
    const first = document.getElementById(primary);
    if (!(first instanceof HTMLElement)) return;

    if (priceList instanceof HTMLElement && priceList.scrollHeight > priceList.clientHeight + 8) {
      const rowRect = first.getBoundingClientRect();
      const listRect = priceList.getBoundingClientRect();
      const delta =
        rowRect.top - listRect.top - priceList.clientHeight / 2 + rowRect.height / 2;
      priceList.scrollBy({
        top: delta,
        behavior: reduceMotion ? "auto" : "smooth",
      });
    } else {
      first.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "nearest",
        inline: "nearest",
      });
    }
  };

  const activate = (id: string, opts: { scrollPrices?: boolean } = {}) => {
    const priceIds = zonePriceIds[id];
    if (!priceIds) return;
    markReady();
    setActive(id);
    clearPriceHighlight();
    priceIds.forEach((pid) => {
      document.getElementById(pid)?.classList.add("is-lit");
    });
    if (opts.scrollPrices !== false) scrollPriceTo(priceIds);
  };

  const activateFromPrice = (priceId: string) => {
    const row = document.getElementById(priceId);
    const zoneId = row?.getAttribute("data-zone");
    markReady();
    clearPriceHighlight();
    if (row) row.classList.add("is-lit");
    if (zoneId && zonePriceIds[zoneId]) {
      zonePriceIds[zoneId].forEach((pid) => {
        document.getElementById(pid)?.classList.add("is-lit");
      });
      setActive(zoneId);
    } else {
      setActive(null);
      if (row) row.classList.add("is-lit");
    }
  };

  const runStrokeDraw = () => {
    if (reduceMotion) {
      markReady();
      return;
    }
    carStrokes.forEach((el, i) => {
      try {
        const len = el.getTotalLength();
        el.style.setProperty("--sig-len", String(len));
        el.style.strokeDasharray = String(len);
        el.style.strokeDashoffset = String(len);
        el.style.animationDelay = `${Math.min(i * 0.018, 0.55)}s`;
        el.classList.add("is-drawing");
      } catch {
        /* getTotalLength unsupported on some shapes — skip */
      }
    });
    lines.forEach((line, i) => {
      try {
        const len = line.getTotalLength();
        line.style.setProperty("--sig-len", String(len));
        line.style.strokeDasharray = String(len);
        line.style.strokeDashoffset = String(len);
        line.style.animationDelay = `${0.45 + i * 0.06}s`;
        line.classList.add("is-drawing");
      } catch {
        /* skip */
      }
    });
    markReady();
  };

  if ("IntersectionObserver" in window && stage) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            runStrokeDraw();
            io.disconnect();
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(stage);
  } else {
    runStrokeDraw();
  }

  buttons.forEach((btn) => {
    const id = () => btn.getAttribute("data-sig-hot");
    btn.addEventListener("mouseenter", () => {
      const z = id();
      if (z) activate(z, { scrollPrices: true });
    });
    btn.addEventListener("focus", () => {
      const z = id();
      if (z) activate(z, { scrollPrices: true });
    });
    btn.addEventListener("click", () => {
      const z = id();
      if (!z) return;
      if (activeId === z) {
        /* keep lit on second click — sticky selection for touch */
        activate(z, { scrollPrices: true });
      } else {
        activate(z, { scrollPrices: true });
      }
    });
  });

  priceRows.forEach((row) => {
    const priceId = row.getAttribute("data-sig-price-row");
    if (!priceId) return;
    const highlight = () => activateFromPrice(priceId);
    row.addEventListener("mouseenter", highlight);
    row.addEventListener("focus", highlight);
    row.addEventListener("click", highlight);
  });

  root.addEventListener("keydown", (e) => {
    if (!(e.target instanceof HTMLElement)) return;
    if (!e.target.matches("[data-sig-hot]")) return;
    const ids = buttons.map((b) => b.getAttribute("data-sig-hot")).filter(Boolean) as string[];
    const cur = e.target.getAttribute("data-sig-hot");
    if (!cur) return;
    const idx = ids.indexOf(cur);
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      buttons[(idx + 1) % buttons.length]?.focus();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      buttons[(idx - 1 + buttons.length) % buttons.length]?.focus();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setActive(null);
      clearPriceHighlight();
    }
  });
}
