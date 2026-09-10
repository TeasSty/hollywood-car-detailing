import type {
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  Group,
  Object3D,
  Mesh,
  LineSegments,
  Vector3,
} from "three";

export type SigZone3D = {
  id: string;
  title: string;
  subtitle: string;
  price: string;
  priceId: string;
  /**
   * Normalized position inside the fitted car AABB (0..1 each axis).
   * x: 0 left → 1 right, y: 0 bottom → 1 top, z: 0 rear → 1 front
   * (in model local space BEFORE yaw; yaw is applied on the car root)
   */
  uvw: [number, number, number];
  side: "left" | "right" | "top" | "bottom";
  labelBias: [number, number];
};

type ThreeMod = typeof import("three");

const GOLD_BRIGHT = 0xe4c06a;
const EDGE = 0xd8d4cc;

function clamp(n: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, n));
}

function elbowPath(ax: number, ay: number, lx: number, ly: number, side: string): string {
  const mx =
    side === "left"
      ? Math.min(ax, lx) + Math.abs(ax - lx) * 0.35
      : Math.max(ax, lx) - Math.abs(ax - lx) * 0.35;
  const my =
    side === "top" ? Math.min(ay, ly) + 4 : side === "bottom" ? Math.max(ay, ly) - 4 : (ay + ly) / 2;
  if (side === "top" || side === "bottom") {
    return `M ${ax} ${ay} L ${ax} ${my} L ${lx} ${my} L ${lx} ${ly}`;
  }
  return `M ${ax} ${ay} L ${mx} ${ay} L ${mx} ${ly} L ${lx} ${ly}`;
}

export function initSignature3D(root: HTMLElement, zones: SigZone3D[], modelUrl: string) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const stage = root.querySelector<HTMLElement>("[data-sig-stage]");
  const canvasHost = root.querySelector<HTMLElement>("[data-sig-canvas]");
  const calloutsSvg = root.querySelector<SVGSVGElement>("[data-sig-callouts]");
  const hotspotsUl = root.querySelector<HTMLElement>("[data-sig-hotspots]");
  const labelsUl = root.querySelector<HTMLElement>("[data-sig-labels]");
  const priceList = root.querySelector("[data-sig-price-list]");
  const priceRows = Array.from(root.querySelectorAll<HTMLElement>("[data-sig-price-row]"));

  if (!stage || !canvasHost || !calloutsSvg || !hotspotsUl || !labelsUl) return () => {};

  let THREE: ThreeMod | null = null;
  let renderer: WebGLRenderer | null = null;
  let scene: Scene | null = null;
  let camera: PerspectiveCamera | null = null;
  let carRoot: Group | null = null;
  let edgeGroup: Group | null = null;
  let markerRoot: Group | null = null;
  let alive = false;
  let disposed = false;
  let ready = false;
  let boxSize: Vector3 | null = null;
  let boxMin: Vector3 | null = null;

  const zoneByPrice: Record<string, string> = {};
  for (const z of zones) zoneByPrice[z.priceId] = z.id;

  const markReady = () => {
    if (ready) return;
    ready = true;
    root.classList.add("is-ready");
    if (reduceMotion) root.classList.add("is-instant");
  };

  const setActive = (id: string | null) => {
    const has = id !== null;
    root.classList.toggle("is-focused", has);

    root.querySelectorAll<HTMLElement>("[data-sig-hot]").forEach((btn) => {
      const on = id !== null && btn.getAttribute("data-sig-hot") === id;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", String(on));
    });
    root.querySelectorAll<HTMLElement>("[data-sig-hot-wrap]").forEach((wrap) => {
      const wid = wrap.getAttribute("data-sig-hot-wrap");
      const on = id !== null && wid === id;
      wrap.classList.toggle("is-active", on);
      wrap.classList.toggle("is-dim", has && !on);
    });
    root.querySelectorAll<HTMLElement>("[data-sig-label]").forEach((label) => {
      const lid = label.getAttribute("data-sig-label");
      const on = id !== null && lid === id;
      label.classList.toggle("is-active", on);
      label.classList.toggle("is-dim", has && !on);
    });
    root.querySelectorAll<SVGPathElement>("[data-sig-line]").forEach((line) => {
      const lid = line.getAttribute("data-sig-line");
      const on = id !== null && lid === id;
      line.classList.toggle("is-active", on);
      line.classList.toggle("is-dim", has && !on);
    });

    if (edgeGroup && THREE) {
      edgeGroup.traverse((o: Object3D) => {
        const ls = o as LineSegments;
        if (!(ls as LineSegments).isLineSegments) return;
        const mat = ls.material as { color?: { setHex: (n: number) => void }; opacity?: number };
        if (!mat?.color) return;
        if (!has) {
          mat.color.setHex(EDGE);
          mat.opacity = 0.85;
        } else {
          mat.color.setHex(GOLD_BRIGHT);
          mat.opacity = 0.35;
        }
      });
    }
  };

  const clearPriceHighlight = () => {
    priceRows.forEach((el) => el.classList.remove("is-lit"));
  };

  const scrollPriceTo = (priceId: string) => {
    const first = document.getElementById(priceId);
    if (!(first instanceof HTMLElement)) return;
    if (priceList instanceof HTMLElement && priceList.scrollHeight > priceList.clientHeight + 8) {
      const rowRect = first.getBoundingClientRect();
      const listRect = priceList.getBoundingClientRect();
      const delta = rowRect.top - listRect.top - priceList.clientHeight / 2 + rowRect.height / 2;
      priceList.scrollBy({ top: delta, behavior: reduceMotion ? "auto" : "smooth" });
    } else {
      first.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "nearest",
        inline: "nearest",
      });
    }
  };

  const activate = (id: string, opts: { scrollPrices?: boolean } = {}) => {
    const z = zones.find((x) => x.id === id);
    if (!z) return;
    markReady();
    setActive(id);
    clearPriceHighlight();
    document.getElementById(z.priceId)?.classList.add("is-lit");
    if (opts.scrollPrices !== false) scrollPriceTo(z.priceId);
  };

  const activateFromPrice = (priceId: string) => {
    const zoneId = zoneByPrice[priceId];
    markReady();
    clearPriceHighlight();
    document.getElementById(priceId)?.classList.add("is-lit");
    if (zoneId) setActive(zoneId);
    else setActive(null);
  };

  /** Map normalized uvw → carRoot-local point using fitted AABB (snaps to body, not float-high guesses). */
  const uvwToLocal = (uvw: [number, number, number], THREE: ThreeMod) => {
    if (!boxMin || !boxSize) return new THREE.Vector3();
    const [u, v, w] = uvw;
    return new THREE.Vector3(
      boxMin.x + boxSize.x * clamp(u),
      boxMin.y + boxSize.y * clamp(v),
      boxMin.z + boxSize.z * clamp(w),
    );
  };

  const projectZone = (z: SigZone3D, THREE: ThreeMod) => {
    if (!camera || !carRoot || !renderer) return null;
    // Prefer live marker Object3D if present (follows car transform exactly)
    const marker = markerRoot?.getObjectByName(`sig-mark-${z.id}`);
    const v = marker
      ? new THREE.Vector3().setFromMatrixPosition(marker.matrixWorld)
      : (() => {
          const p = uvwToLocal(z.uvw, THREE);
          carRoot!.localToWorld(p);
          return p;
        })();
    v.project(camera);
    if (v.z > 1) return null;
    const ax = ((v.x + 1) / 2) * 100;
    const ay = ((1 - v.y) / 2) * 100;
    const lx = clamp(ax + z.labelBias[0], 2, 98);
    const ly = clamp(ay + z.labelBias[1], 3, 96);
    return { ax, ay, lx, ly, side: z.side };
  };

  const syncOverlays = () => {
    if (!THREE || !ready) return;
    for (const z of zones) {
      const p = projectZone(z, THREE);
      if (!p) continue;
      const wrap = root.querySelector<HTMLElement>(`[data-sig-hot-wrap="${z.id}"]`);
      const label = root.querySelector<HTMLElement>(`[data-sig-label="${z.id}"]`);
      const line = root.querySelector<SVGPathElement>(`[data-sig-line="${z.id}"]`);
      if (wrap) {
        wrap.style.left = `${p.ax}%`;
        wrap.style.top = `${p.ay}%`;
      }
      if (label) {
        label.style.left = `${p.lx}%`;
        label.style.top = `${p.ly}%`;
      }
      if (line) {
        line.setAttribute("d", elbowPath(p.ax, p.ay, p.lx, p.ly, p.side));
      }
    }
  };

  const fitCar = (object: Object3D, THREE: ThreeMod) => {
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    object.position.sub(center);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = 2.45 / maxDim;
    object.scale.setScalar(scale);
    // Stronger ¾ yaw so the nose faces the viewer clearly
    object.rotation.y = Math.PI * 0.32;
    object.updateMatrixWorld(true);
  };

  const stylizeAsTechnical = (source: Object3D, THREE: ThreeMod) => {
    const fillMat = new THREE.MeshStandardMaterial({
      color: 0x121214,
      metalness: 0.55,
      roughness: 0.45,
      transparent: true,
      opacity: 0.55,
      flatShading: true,
    });
    const lineMat = new THREE.LineBasicMaterial({
      color: EDGE,
      transparent: true,
      opacity: 0.88,
      depthWrite: false,
    });
    const linesRoot = new THREE.Group();
    source.traverse((child: Object3D) => {
      const mesh = child as Mesh;
      if (!mesh.isMesh || !mesh.geometry) return;
      mesh.material = fillMat;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      const edges = new THREE.EdgesGeometry(mesh.geometry, 22);
      const lines = new THREE.LineSegments(edges, lineMat);
      linesRoot.add(lines);
      mesh.updateWorldMatrix(true, false);
      const m = mesh.matrixWorld.clone();
      const inv = source.matrixWorld.clone().invert();
      m.premultiply(inv);
      lines.matrix.copy(m);
      lines.matrixAutoUpdate = false;
    });
    return linesRoot;
  };

  const paint = () => {
    if (!renderer || !scene || !camera) return;
    renderer.render(scene, camera);
    syncOverlays();
  };

  const resize = () => {
    if (!renderer || !camera || !canvasHost) return;
    const w = canvasHost.clientWidth || 1;
    const h = canvasHost.clientHeight || 1;
    const dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.25 : 1.75);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    paint();
  };

  const disposeScene = () => {
    alive = false;
    if (renderer) {
      renderer.dispose();
      renderer.forceContextLoss?.();
      if (renderer.domElement.parentElement === canvasHost) {
        canvasHost.removeChild(renderer.domElement);
      }
    }
    renderer = null;
    scene = null;
    camera = null;
    carRoot = null;
    edgeGroup = null;
    markerRoot = null;
    boxSize = null;
    boxMin = null;
    THREE = null;
  };

  const mount = async () => {
    if (disposed || alive) return;
    const [three, { GLTFLoader }] = await Promise.all([
      import("three"),
      import("three/examples/jsm/loaders/GLTFLoader.js"),
    ]);
    if (disposed) return;
    THREE = three;

    const scn = new three.Scene();
    scn.background = new three.Color(0x050506);
    scn.fog = new three.Fog(0x050506, 7, 16);
    scene = scn;

    // Fixed ¾ front camera — no orbit, no fly-to
    const cam = new three.PerspectiveCamera(34, 1, 0.1, 40);
    cam.position.set(2.55, 1.05, 3.55);
    cam.lookAt(0, 0.02, 0);
    camera = cam;

    const rend = new three.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    rend.setClearColor(0x050506, 1);
    rend.domElement.className = "signature__canvas";
    rend.domElement.setAttribute("aria-hidden", "true");
    canvasHost.appendChild(rend.domElement);
    renderer = rend;

    const hemi = new three.HemisphereLight(0xf0ece4, 0x1a1a1c, 0.85);
    scn.add(hemi);
    const key = new three.DirectionalLight(0xfff2d6, 1.15);
    key.position.set(3.2, 4.5, 2.2);
    scn.add(key);
    const rim = new three.DirectionalLight(0xc9a24a, 0.35);
    rim.position.set(-2.5, 1.2, -3);
    scn.add(rim);

    const floor = new three.Mesh(
      new three.CircleGeometry(3.2, 48),
      new three.MeshBasicMaterial({ color: 0x0a0a0c, transparent: true, opacity: 0.9 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.78;
    scn.add(floor);

    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(modelUrl);
    if (disposed) return;

    const rootGroup = new three.Group();
    const model = gltf.scene;
    fitCar(model, three);
    model.updateMatrixWorld(true);
    const edges = stylizeAsTechnical(model, three);
    model.add(edges);
    rootGroup.add(model);
    scn.add(rootGroup);
    carRoot = rootGroup;
    edgeGroup = edges;

    // Measure AABB in car-aligned axes (yaw temporarily zeroed), then restore ¾ pose.
    // Markers live in model-local space so they rotate with the car.
    const savedYaw = model.rotation.y;
    model.rotation.y = 0;
    model.updateMatrixWorld(true);
    const aligned = new three.Box3().setFromObject(model);
    const invModel = model.matrixWorld.clone().invert();
    const localMin = aligned.min.clone().applyMatrix4(invModel);
    const localMax = aligned.max.clone().applyMatrix4(invModel);
    boxMin = new three.Vector3(
      Math.min(localMin.x, localMax.x),
      Math.min(localMin.y, localMax.y),
      Math.min(localMin.z, localMax.z),
    );
    boxSize = new three.Vector3(
      Math.abs(localMax.x - localMin.x),
      Math.abs(localMax.y - localMin.y),
      Math.abs(localMax.z - localMin.z),
    );
    model.rotation.y = savedYaw;
    model.updateMatrixWorld(true);

    markerRoot = new three.Group();
    model.add(markerRoot);
    for (const z of zones) {
      const mark = new three.Object3D();
      mark.name = `sig-mark-${z.id}`;
      // uvw → model-local (car axes): u left→right, v bottom→top, w rear→front
      mark.position.set(
        boxMin.x + boxSize.x * clamp(z.uvw[0]),
        boxMin.y + boxSize.y * clamp(z.uvw[1]),
        boxMin.z + boxSize.z * clamp(z.uvw[2]),
      );
      markerRoot.add(mark);
    }

    calloutsSvg.innerHTML = "";
    hotspotsUl.innerHTML = "";
    labelsUl.innerHTML = "";
    for (const z of zones) {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.classList.add("signature__line");
      path.setAttribute("data-sig-line", z.id);
      path.setAttribute("fill", "none");
      path.setAttribute("vector-effect", "non-scaling-stroke");
      calloutsSvg.appendChild(path);

      const li = document.createElement("li");
      li.className = "signature__hot";
      li.setAttribute("data-sig-hot-wrap", z.id);
      li.innerHTML = `<button type="button" class="signature__dot" data-sig-hot="${z.id}" data-price-id="${z.priceId}" aria-label="${z.title}, ${z.price}. ${z.subtitle}" aria-controls="prices" aria-pressed="false"><span class="signature__dot-core" aria-hidden="true"></span><span class="signature__dot-ring" aria-hidden="true"></span></button>`;
      hotspotsUl.appendChild(li);

      const lab = document.createElement("li");
      lab.className = `signature__label signature__label--${z.side}`;
      lab.setAttribute("data-sig-label", z.id);
      lab.innerHTML = `<span class="signature__label-title">${z.title}</span><span class="signature__label-sub">${z.subtitle}</span><span class="signature__label-price">${z.price}</span>`;
      labelsUl.appendChild(lab);
    }

    root.querySelectorAll<HTMLButtonElement>("[data-sig-hot]").forEach((btn) => {
      const id = () => btn.getAttribute("data-sig-hot");
      btn.addEventListener("mouseenter", () => {
        const z = id();
        if (z) activate(z);
      });
      btn.addEventListener("focus", () => {
        const z = id();
        if (z) activate(z);
      });
      btn.addEventListener("click", () => {
        const z = id();
        if (z) activate(z);
      });
    });

    alive = true;
    resize();
    markReady();
    root.querySelectorAll<SVGPathElement>("[data-sig-line]").forEach((line, i) => {
      try {
        const len = Math.max(line.getTotalLength(), 1);
        line.style.setProperty("--sig-len", String(len));
        line.style.strokeDasharray = String(len);
        line.style.strokeDashoffset = String(len);
        line.style.animationDelay = `${0.04 + i * 0.04}s`;
        line.classList.add("is-drawing");
      } catch {
        /* skip */
      }
    });
    paint();
  };

  priceRows.forEach((row) => {
    const priceId = row.getAttribute("data-sig-price-row");
    if (!priceId) return;
    const highlight = () => activateFromPrice(priceId);
    row.addEventListener("mouseenter", highlight);
    row.addEventListener("focus", highlight);
    row.addEventListener("click", highlight);
  });

  root.addEventListener("keydown", (e) => {
    if (!(e.target instanceof HTMLElement) || !e.target.matches("[data-sig-hot]")) return;
    const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-sig-hot]"));
    const ids = buttons.map((b) => b.getAttribute("data-sig-hot")).filter(Boolean) as string[];
    const cur = e.target.getAttribute("data-sig-hot");
    if (!cur) return;
    const i = ids.indexOf(cur);
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      buttons[(i + 1) % buttons.length]?.focus();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      buttons[(i - 1 + buttons.length) % buttons.length]?.focus();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setActive(null);
      clearPriceHighlight();
    }
  });

  const io = new IntersectionObserver(
    (entries) => {
      const on = entries.some((e) => e.isIntersecting);
      if (on) {
        void mount().catch((err) => {
          console.error("[signature-3d]", err);
          root.classList.add("is-3d-fallback");
          markReady();
        });
      } else if (alive) {
        disposeScene();
      }
    },
    { rootMargin: "120px 0px", threshold: 0.05 },
  );
  io.observe(stage);

  window.addEventListener("resize", resize, { passive: true });

  return () => {
    disposed = true;
    io.disconnect();
    window.removeEventListener("resize", resize);
    disposeScene();
  };
}
