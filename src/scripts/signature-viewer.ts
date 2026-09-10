import type { SignatureCarHandle } from "./signature-car";

const zoneData: Record<
  string,
  { label: string; title: string; price: string; detail: string; priceIds: string[] }
> = {
  optics: {
    label: "Оптика",
    title: "Bi-LED линзы и полировка фар",
    price: "от 12 000 ₽",
    detail: "Bi-LED от 12 000 ₽ · полировка фар от 3 500 ₽",
    priceIds: ["price-biled", "price-headlights"],
  },
  ppf: {
    label: "Защита",
    title: "Оклейка бронеплёнкой",
    price: "от 12 000 ₽",
    detail: "Капот, бампер, крылья, зоны риска сколов",
    priceIds: ["price-ppf"],
  },
  paint: {
    label: "Кузов",
    title: "Полировка кузова",
    price: "от 14 000 ₽",
    detail: "Лёгкая и глубокая — глубина цвета и блеск ЛКП",
    priceIds: ["price-polish"],
  },
  ceramic: {
    label: "Керамика",
    title: "Керамика и жидкое стекло",
    price: "от 18 900 ₽",
    detail: "Керамика от 18 900 ₽ · жидкое стекло от 5 000 ₽",
    priceIds: ["price-ceramic", "price-glasscoat"],
  },
  interior: {
    label: "Салон",
    title: "Химчистка салона",
    price: "уточняйте",
    detail: "Глубокая чистка — объём после осмотра",
    priceIds: ["price-interior"],
  },
  sound: {
    label: "Звук",
    title: "Автозвук / магнитола",
    price: "от 6 000 ₽",
    detail: "От замены магнитолы до соревновательного уровня",
    priceIds: ["price-audio"],
  },
  noise: {
    label: "Шумоизоляция",
    title: "Шумоизоляция",
    price: "от 6 000 ₽",
    detail: "Двери, пол, арки — тише в салоне",
    priceIds: ["price-noise"],
  },
  rear: {
    label: "Антикор",
    title: "Антикор",
    price: "от 20 000 ₽",
    detail: "Обработка днища и скрытых полостей",
    priceIds: ["price-anticor"],
  },
};

export function initSignatureViewer(root: HTMLElement) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const modelUrl = root.dataset.modelUrl;
  const stage = root.querySelector("[data-sig-stage]");
  const canvas = root.querySelector("[data-sig-canvas]");
  const priceList = root.querySelector("[data-sig-price-list]");
  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-sig-hot]"));
  const priceRows = Array.from(root.querySelectorAll<HTMLElement>("[data-sig-price-row]"));

  if (!modelUrl) return;

  let ready = false;
  let carViewer: SignatureCarHandle | null = null;
  let loading = false;

  const clearPriceHighlight = () => {
    priceRows.forEach((el) => el.classList.remove("is-lit"));
  };

  const setHotActive = (id: string | null) => {
    buttons.forEach((btn) => {
      const on = id !== null && btn.getAttribute("data-sig-hot") === id;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-expanded", String(on));
      const li = btn.closest(".signature__hot");
      if (li) li.classList.toggle("is-active", on);
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
    const data = zoneData[id];
    if (!data) return;
    setHotActive(id);
    clearPriceHighlight();
    data.priceIds.forEach((pid) => {
      document.getElementById(pid)?.classList.add("is-lit");
    });
    if (opts.scrollPrices !== false) scrollPriceTo(data.priceIds);
  };

  const activateFromPrice = (priceId: string) => {
    const row = document.getElementById(priceId);
    const zoneId = row?.getAttribute("data-zone");
    clearPriceHighlight();
    if (row) row.classList.add("is-lit");
    if (zoneId && zoneData[zoneId]) {
      zoneData[zoneId].priceIds.forEach((pid) => {
        document.getElementById(pid)?.classList.add("is-lit");
      });
      setHotActive(zoneId);
    } else {
      setHotActive(null);
    }
  };

  const markReady = () => {
    if (ready) return;
    ready = true;
    root.classList.add("is-ready");
    if (reduceMotion) root.classList.add("is-instant");
  };

  const disposeCar = () => {
    if (carViewer) {
      carViewer.dispose();
      carViewer = null;
    }
  };

  const mountCar = async () => {
    if (carViewer || loading || !(canvas instanceof HTMLCanvasElement)) return;
    loading = true;
    try {
      const { initSignatureCar } = await import("./signature-car");
      carViewer = await initSignatureCar({
        canvas,
        modelUrl,
        reduceMotion,
        onReady: markReady,
      });
    } catch (err) {
      if (err instanceof Error && err.message === "disposed") return;
      console.error("[signature-car]", err);
      markReady();
    } finally {
      loading = false;
    }
  };

  if (reduceMotion) markReady();

  if ("IntersectionObserver" in window && stage) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) mountCar();
          else disposeCar();
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -5% 0px" },
    );
    io.observe(stage);
  } else {
    mountCar();
  }

  const onHotEnter = (id: string) => {
    if (!ready) markReady();
    activate(id, { scrollPrices: true });
  };

  buttons.forEach((btn) => {
    btn.addEventListener("mouseenter", () => {
      const id = btn.getAttribute("data-sig-hot");
      if (id) onHotEnter(id);
    });
    btn.addEventListener("focus", () => {
      const id = btn.getAttribute("data-sig-hot");
      if (id) onHotEnter(id);
    });
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-sig-hot");
      if (id) onHotEnter(id);
    });
  });

  priceRows.forEach((row) => {
    const priceId = row.getAttribute("data-sig-price-row");
    if (!priceId) return;
    const highlight = () => {
      if (!ready) markReady();
      activateFromPrice(priceId);
    };
    row.addEventListener("mouseenter", highlight);
    row.addEventListener("focus", highlight);
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
      const next = buttons[(idx + 1) % buttons.length];
      next?.focus();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const prev = buttons[(idx - 1 + buttons.length) % buttons.length];
      prev?.focus();
    }
  });
}
