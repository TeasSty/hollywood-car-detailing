import {
  AmbientLight,
  Box3,
  Color,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  PointLight,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
  type Material,
} from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export type SignatureCarHandle = {
  dispose: () => void;
  resize: () => void;
};

type InitOptions = {
  canvas: HTMLCanvasElement;
  modelUrl: string;
  reduceMotion: boolean;
  onReady?: () => void;
};

const STUDIO_BG = 0x0b0b0c;
const PAINT = new Color(0x1a1a20);
const METAL = { metalness: 0.92, roughness: 0.18 };

function isMobileViewport() {
  return window.matchMedia("(max-width: 700px)").matches;
}

function disposeMaterial(material: Material | Material[]) {
  if (Array.isArray(material)) material.forEach((m) => m.dispose());
  else material.dispose();
}

function applyPremiumPaint(root: Object3D) {
  root.traverse((obj: Object3D) => {
    if (!(obj instanceof Mesh) || !obj.material) return;
    const name = (obj.name || "").toLowerCase();
    const isGlass = name.includes("glass") || name.includes("window");
    const isWheel = name.includes("wheel") || name.includes("tire");
    const isLight = name.includes("light") || name.includes("lamp");

    if (isGlass) {
      obj.material = new MeshStandardMaterial({
        color: 0x8899aa,
        metalness: 0.85,
        roughness: 0.08,
        transparent: true,
        opacity: 0.55,
      });
      return;
    }

    if (isWheel) {
      obj.material = new MeshStandardMaterial({
        color: 0x111114,
        metalness: 0.4,
        roughness: 0.75,
      });
      return;
    }

    if (isLight) {
      obj.material = new MeshStandardMaterial({
        color: 0xf4f1ea,
        emissive: 0x443322,
        emissiveIntensity: 0.35,
        metalness: 0.2,
        roughness: 0.4,
      });
      return;
    }

    obj.material = new MeshStandardMaterial({
      color: PAINT,
      ...METAL,
    });
  });
}

export async function initSignatureCar(opts: InitOptions): Promise<SignatureCarHandle> {
  const { canvas, modelUrl, reduceMotion, onReady } = opts;

  const scene = new Scene();
  scene.background = new Color(STUDIO_BG);

  const camera = new PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(4.2, 1.35, 5.8);

  const renderer = new WebGLRenderer({
    canvas,
    antialias: !isMobileViewport(),
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setClearColor(STUDIO_BG, 1);

  const hemi = new HemisphereLight(0x3a3a48, 0x080808, 0.35);
  scene.add(hemi);

  const ambient = new AmbientLight(0xffffff, 0.12);
  scene.add(ambient);

  const key = new DirectionalLight(0xfff4e8, 1.35);
  key.position.set(6, 8, 4);
  scene.add(key);

  const fill = new DirectionalLight(0xc8d0e0, 0.45);
  fill.position.set(-5, 3, 2);
  scene.add(fill);

  const rim = new DirectionalLight(0xffffff, 0.55);
  rim.position.set(-2, 4, -6);
  scene.add(rim);

  const accent = new PointLight(0xc8102e, 0.85, 18);
  accent.position.set(0, 0.4, 3);
  scene.add(accent);

  let carRoot: Object3D | null = null;
  let raf = 0;
  let disposed = false;
  let yaw = -0.42;

  const resize = () => {
    const parent = canvas.parentElement;
    if (!parent) return;
    const w = Math.max(parent.clientWidth, 1);
    const h = Math.max(parent.clientHeight, 1);
    const dpr = isMobileViewport()
      ? Math.min(window.devicePixelRatio, 1.25)
      : Math.min(window.devicePixelRatio, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };

  const lookAtCar = () => {
    if (!carRoot) return;
    const box = new Box3().setFromObject(carRoot);
    const center = box.getCenter(new Vector3());
    camera.lookAt(center.x, center.y + 0.15, center.z);
  };

  const renderFrame = () => {
    if (disposed) return;
    if (carRoot && !reduceMotion) {
      yaw += 0.0018;
      carRoot.rotation.y = yaw;
    }
    lookAtCar();
    renderer.render(scene, camera);
  };

  const tick = () => {
    if (disposed) return;
    renderFrame();
    if (!reduceMotion) raf = requestAnimationFrame(tick);
  };

  resize();
  window.addEventListener("resize", resize, { passive: true });

  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(modelUrl);
  if (disposed) {
    gltf.scene.traverse((obj: Object3D) => {
      if (obj instanceof Mesh) {
        obj.geometry?.dispose();
        if (obj.material) disposeMaterial(obj.material);
      }
    });
    throw new Error("disposed");
  }

  carRoot = gltf.scene;
  applyPremiumPaint(carRoot);

  const box = new Box3().setFromObject(carRoot);
  const size = box.getSize(new Vector3());
  const center = box.getCenter(new Vector3());
  carRoot.position.sub(center);
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = 2.4 / maxDim;
  carRoot.scale.setScalar(scale);
  carRoot.rotation.y = yaw;

  scene.add(carRoot);
  lookAtCar();
  renderFrame();
  if (!reduceMotion) tick();
  onReady?.();

  return {
    resize,
    dispose: () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      scene.traverse((obj: Object3D) => {
        if (obj instanceof Mesh) {
          obj.geometry?.dispose();
          if (obj.material) disposeMaterial(obj.material);
        }
      });
      renderer.dispose();
    },
  };
}
