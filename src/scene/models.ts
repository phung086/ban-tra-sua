import * as T from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import type { Customer, DrinkDraft } from "../game/types";

export class Workshop {
  geometries = new Map<string, T.BufferGeometry>();
  materials = new Map<string, T.MeshStandardMaterial>();
  textures: T.Texture[] = [];
  surface(kind: "wood" | "stone" | "fabric", color: string) {
    const key = `surface:${kind}:${color}`;
    if (this.materials.has(key)) return this.materials.get(key)!;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 550; i++) {
      const x = (i * 137.508) % 256,
        y = (i * 71.73) % 256;
      ctx.fillStyle = i % 2 ? "#ffffff16" : "#392b3d12";
      if (kind === "wood") ctx.fillRect(x, y, 1 + (i % 2), 9 + (i % 41));
      else if (kind === "stone") {
        ctx.beginPath();
        ctx.ellipse(x, y, 1 + (i % 3), 1 + (i % 4) / 2, i, 0, Math.PI * 2);
        ctx.fill();
      } else ctx.fillRect(x, y, 1, 4);
    }
    const texture = new T.CanvasTexture(canvas);
    texture.colorSpace = T.SRGBColorSpace;
    texture.wrapS = texture.wrapT = T.RepeatWrapping;
    texture.repeat.set(kind === "fabric" ? 3 : 1, 1);
    texture.anisotropy = 4;
    this.textures.push(texture);
    const mat = new T.MeshStandardMaterial({
      map: texture,
      roughness: kind === "stone" ? 0.46 : 0.85,
    });
    this.materials.set(key, mat);
    return mat;
  }
  capsule(
    parent: T.Object3D,
    color: string,
    position: number[],
    scale: number[],
  ) {
    return this.mesh(
      parent,
      this.geometry("capsule", () => new T.CapsuleGeometry(1, 1, 6, 14)),
      color,
      position,
      scale,
    );
  }
  material(color: string, metal = 0, opacity = 1) {
    const key = `${color}:${metal}:${opacity}`;
    if (!this.materials.has(key))
      this.materials.set(
        key,
        new T.MeshStandardMaterial({
          color,
          roughness: metal ? 0.32 : 0.76,
          metalness: metal,
          transparent: opacity < 1,
          opacity,
          depthWrite: opacity === 1,
        }),
      );
    return this.materials.get(key)!;
  }
  geometry(key: string, factory: () => T.BufferGeometry) {
    if (!this.geometries.has(key)) this.geometries.set(key, factory());
    return this.geometries.get(key)!;
  }
  mesh(
    parent: T.Object3D,
    geometry: T.BufferGeometry,
    color: string,
    position: number[],
    scale?: number[],
    metal = 0,
    opacity = 1,
  ) {
    const mesh = new T.Mesh(geometry, this.material(color, metal, opacity));
    mesh.position.set(position[0], position[1], position[2]);
    if (scale) mesh.scale.set(scale[0], scale[1], scale[2]);
    mesh.castShadow = opacity === 1;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  box(
    parent: T.Object3D,
    color: string,
    position: number[],
    scale: number[],
    metal = 0,
  ) {
    return this.mesh(
      parent,
      this.geometry("box", () => new RoundedBoxGeometry(1, 1, 1, 2, 0.065)),
      color,
      position,
      scale,
      metal,
    );
  }
  ball(parent: T.Object3D, color: string, position: number[], scale: number[]) {
    return this.mesh(
      parent,
      this.geometry("ball", () => new T.SphereGeometry(1, 16, 12)),
      color,
      position,
      scale,
    );
  }
  cylinder(
    parent: T.Object3D,
    color: string,
    position: number[],
    radius: number,
    height: number,
    metal = 0,
    opacity = 1,
  ) {
    return this.mesh(
      parent,
      this.geometry("cylinder", () => new T.CylinderGeometry(1, 1, 1, 24)),
      color,
      position,
      [radius, height, radius],
      metal,
      opacity,
    );
  }
  line(parent: T.Object3D, color: string, points: number[][], radius = 0.012) {
    const key = `line:${radius}:${JSON.stringify(points)}`;
    return this.mesh(
      parent,
      this.geometry(
        key,
        () =>
          new T.TubeGeometry(
            new T.CatmullRomCurve3(points.map((p) => new T.Vector3(...p))),
            12,
            radius,
            5,
            false,
          ),
      ),
      color,
      [0, 0, 0],
    );
  }
  label(
    parent: T.Object3D,
    text: string,
    position: number[],
    width: number,
    height: number,
    background = "#fff9e9",
    ink = "#31594b",
    size = 48,
  ) {
    const key = `label:${text}:${width}:${height}:${background}:${ink}:${size}`;
    const existing = this.materials.get(key);
    if (existing) {
      const mesh = new T.Mesh(
        this.geometry(
          `label:${width}:${height}`,
          () => new T.PlaneGeometry(width, height),
        ),
        existing,
      );
      mesh.position.set(...(position as [number, number, number]));
      parent.add(mesh);
      return mesh;
    }
    const canvas = document.createElement("canvas");
    canvas.width = 768;
    canvas.height = Math.round((768 * height) / width);
    const context = canvas.getContext("2d")!;
    context.fillStyle = background;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = ink;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = `600 ${size}px 'Be Vietnam Pro', 'Segoe UI', sans-serif`;
    const lines = text.split("\n");
    lines.forEach((line, i) =>
      context.fillText(
        line,
        canvas.width / 2,
        canvas.height / 2 + (i - (lines.length - 1) / 2) * size * 1.45,
        canvas.width - 40,
      ),
    );
    const texture = new T.CanvasTexture(canvas);
    texture.colorSpace = T.SRGBColorSpace;
    texture.anisotropy = 4;
    this.textures.push(texture);
    const material = new T.MeshStandardMaterial({
      map: texture,
      roughness: 0.85,
    });
    this.materials.set(key, material);
    const mesh = new T.Mesh(
      this.geometry(
        `label:${width}:${height}`,
        () => new T.PlaneGeometry(width, height),
      ),
      material,
    );
    mesh.position.set(...(position as [number, number, number]));
    parent.add(mesh);
    return mesh;
  }
  dispose() {
    this.geometries.forEach((g) => g.dispose());
    this.materials.forEach((m) => m.dispose());
    this.textures.forEach((t) => t.dispose());
  }
}

type Look = {
  height: number;
  build: number;
  skin: string;
  shirt: string;
  pants: string;
  hair: string;
  style: "bob" | "short" | "bun" | "long" | "bald";
  accessory?: "glasses" | "helmet" | "cap";
  old?: boolean;
  beard?: boolean;
  pattern?: "stripe" | "floral" | "pocket";
  skirt?: boolean;
};
export const LOOKS: Record<string, Look> = {
  miu: {
    height: 1.88,
    build: 0.91,
    skin: "#d6ab88",
    shirt: "#bb816b",
    pants: "#555948",
    hair: "#322f2a",
    style: "bob",
    skirt: true,
  },
  bo: {
    height: 2.12,
    build: 1.1,
    skin: "#b98c63",
    shirt: "#b89545",
    pants: "#3c4853",
    hair: "#292b26",
    style: "short",
    accessory: "cap",
    pattern: "pocket",
  },
  nana: {
    height: 1.96,
    build: 0.88,
    skin: "#cb9a74",
    shirt: "#82788c",
    pants: "#3f4551",
    hair: "#222623",
    style: "bun",
    accessory: "glasses",
  },
  sunny: {
    height: 2.05,
    build: 1.01,
    skin: "#ae7c56",
    shirt: "#809687",
    pants: "#c0a37c",
    hair: "#35342b",
    style: "short",
    pattern: "stripe",
  },
  chi: {
    height: 1.82,
    build: 1.12,
    skin: "#d2a27d",
    shirt: "#ac7878",
    pants: "#5b493c",
    hair: "#382a23",
    style: "long",
    skirt: true,
  },
  khanh: {
    height: 2.2,
    build: 0.93,
    skin: "#bb8f67",
    shirt: "#7595a3",
    pants: "#414853",
    hair: "#282824",
    style: "short",
    pattern: "pocket",
  },
  lyly: {
    height: 2.02,
    build: 0.95,
    skin: "#c9a483",
    shirt: "#f1e4cf",
    pants: "#6e897f",
    hair: "#4d392a",
    style: "bob",
    pattern: "stripe",
  },
  duc: {
    height: 2.08,
    build: 1.2,
    skin: "#b18461",
    shirt: "#6e745b",
    pants: "#3b3d37",
    hair: "#292a27",
    style: "short",
    beard: true,
    accessory: "glasses",
  },
  hanh: {
    height: 1.86,
    build: 1.27,
    skin: "#ba855e",
    shirt: "#906c89",
    pants: "#443e43",
    hair: "#35342e",
    style: "bun",
    old: true,
    pattern: "floral",
  },
  tu: {
    height: 2,
    build: 1.08,
    skin: "#a77b59",
    shirt: "#68736a",
    pants: "#423e34",
    hair: "#797369",
    style: "bald",
    old: true,
    beard: true,
    pattern: "pocket",
  },
  minh: {
    height: 2.14,
    build: 0.95,
    skin: "#b5845c",
    shirt: "#488259",
    pants: "#373b38",
    hair: "#272a25",
    style: "short",
    accessory: "helmet",
    pattern: "stripe",
  },
  lan: {
    height: 2,
    build: 0.85,
    skin: "#c99873",
    shirt: "#ebdfcb",
    pants: "#414c45",
    hair: "#292722",
    style: "long",
    accessory: "glasses",
    skirt: true,
  },
  phuc: {
    height: 2.22,
    build: 0.87,
    skin: "#d5a57b",
    shirt: "#a66d42",
    pants: "#607284",
    hair: "#2e2b26",
    style: "short",
    accessory: "cap",
    pattern: "pocket",
  },
  mai: {
    height: 1.78,
    build: 1.08,
    skin: "#bf9676",
    shirt: "#5f7f86",
    pants: "#454450",
    hair: "#a9a397",
    style: "bun",
    accessory: "glasses",
    old: true,
    pattern: "floral",
  },
  thao: {
    height: 1.97,
    build: 0.93,
    skin: "#d3a27a",
    shirt: "#9db4b9",
    pants: "#394c52",
    hair: "#242d28",
    style: "bun",
    pattern: "pocket",
  },
  hai: {
    height: 2.16,
    build: 1.18,
    skin: "#a8774f",
    shirt: "#477187",
    pants: "#645645",
    hair: "#332f29",
    style: "short",
    beard: true,
    pattern: "pocket",
  },
};

export interface Person {
  root: T.Group;
  body: T.Group;
  head: T.Group;
  leftArm: T.Group;
  rightArm: T.Group;
  leftLeg: T.Group;
  rightLeg: T.Group;
  hand: T.Group;
}

export function makePerson(w: Workshop, customer: Customer): Person {
  const l = LOOKS[customer.id] ?? LOOKS.khanh;
  const root = new T.Group();
  root.scale.set(l.build, l.height / 2.1, 1);
  const body = new T.Group();
  root.add(body);
  const torso = w.capsule(body, l.shirt, [0, 1.12, 0], [0.265, 0.225, 0.163]);
  if (typeof document !== "undefined")
    torso.material = w.surface("fabric", l.shirt);
  [-1, 1].forEach((side) => {
    w.line(
      body,
      "#776961",
      [
        [side * 0.19, 0.94, 0.155],
        [side * 0.22, 1.04, 0.157],
        [side * 0.2, 1.16, 0.16],
      ],
      0.004,
    );
    w.ball(body, l.shirt, [side * 0.235, 1.35, 0], [0.12, 0.095, 0.14]);
  });
  w.ball(body, l.shirt, [0, 0.91, 0], [0.29, 0.2, 0.17]);
  w.cylinder(body, l.skin, [0, 1.58, 0], 0.11, 0.19);
  w.line(
    body,
    l.pattern === "pocket" ? "#d6c7b6" : l.pants,
    [
      [-0.12, 1.43, 0.12],
      [0, 1.39, 0.18],
      [0.12, 1.43, 0.12],
    ],
    0.012,
  );
  if (l.pattern === "pocket") {
    for (let i = 0; i < 4; i++)
      w.ball(
        body,
        "#d9cdbc",
        [0, 0.98 + i * 0.105, 0.17],
        [0.009, 0.009, 0.007],
      );
    const collar = w.box(
      body,
      l.shirt,
      [-0.07, 1.44, 0.125],
      [0.11, 0.1, 0.03],
    );
    collar.rotation.z = -0.45;
    w.box(body, l.shirt, [0.07, 1.44, 0.125], [0.11, 0.1, 0.03]).rotation.z =
      0.45;
  }
  if (l.skirt)
    w.mesh(
      body,
      w.geometry("skirt", () => new T.CylinderGeometry(0.27, 0.39, 0.48, 18)),
      l.pants,
      [0, 0.71, 0],
    );
  if (l.pattern === "stripe")
    for (let i = 0; i < 5; i++)
      w.box(
        body,
        "#e3dac7",
        [0, 0.93 + i * 0.105, 0.165],
        [0.51, 0.027, 0.018],
      );
  if (l.pattern === "floral")
    for (let i = 0; i < 9; i++)
      w.ball(
        body,
        "#d8b7a7",
        [Math.sin(i * 11) * 0.23, 0.89 + (i % 4) * 0.13, 0.17],
        [0.03, 0.04, 0.012],
      );
  if (l.pattern === "pocket") {
    w.box(body, l.pants, [-0.15, 1.23, 0.175], [0.14, 0.14, 0.022]);
    w.line(
      body,
      "#ddd2b7",
      [
        [0, 0.86, 0.17],
        [0, 1.4, 0.17],
      ],
      0.008,
    );
  }
  // Natural face proportions: small separate eyes, projecting nose, imperfect smile.
  const head = new T.Group();
  head.position.y = 1.82;
  head.scale.set(0.88, 0.72, 0.88);
  body.add(head);
  w.ball(head, l.skin, [0, 0, 0], [0.235, 0.3, 0.215]);
  w.ball(head, l.skin, [0, -0.163, 0.022], [0.16, 0.115, 0.154]);
  w.ball(head, l.skin, [0, -0.058, 0.216], [0.05, 0.068, 0.058]);
  [-1, 1].forEach((side) => {
    w.ball(head, l.skin, [side * 0.231, -0.018, 0], [0.049, 0.074, 0.038]);
    w.ball(
      head,
      "#efe1d4",
      [side * 0.086, 0.022 + (side === 1 ? 0.008 : 0), 0.203],
      [0.025, 0.016, 0.009],
    );
    w.ball(
      head,
      "#332e28",
      [side * 0.086, 0.022 + (side === 1 ? 0.008 : 0), 0.211],
      [0.014, 0.014, 0.008],
    );
    w.line(
      head,
      l.hair,
      [
        [side * 0.045, 0.092, 0.199],
        [side * 0.085, 0.105, 0.199],
        [side * 0.135, 0.087, 0.183],
      ],
      0.009,
    );
    if (l.old)
      w.line(
        head,
        "#8f6b52",
        [
          [side * 0.07, -0.08, 0.205],
          [side * 0.12, -0.104, 0.191],
          [side * 0.15, -0.135, 0.16],
        ],
        0.005,
      );
  });
  w.line(
    head,
    "#885a47",
    [
      [-0.07, -0.15, 0.173],
      [0, -0.157, 0.186],
      [0.066, -0.135, 0.171],
    ],
    0.008,
  );
  const hair = w.mesh(
    head,
    w.geometry(
      "hair",
      () => new T.SphereGeometry(1, 20, 12, 0, Math.PI * 2, 0, 1.55),
    ),
    l.hair,
    [0, 0.022, -0.019],
    [0.245, 0.305, 0.225],
  );
  hair.rotation.z = -0.09;
  if (l.style === "bald") {
    hair.scale.set(0.247, 0.28, 0.223);
    hair.rotation.x = -0.5;
  }
  if (l.style === "bob" || l.style === "long") {
    w.box(
      head,
      l.hair,
      [0, l.style === "long" ? -0.18 : -0.08, -0.13],
      [0.45, l.style === "long" ? 0.63 : 0.37, 0.2],
    );
    w.ball(head, l.hair, [-0.19, -0.09, 0.025], [0.06, 0.24, 0.13]);
  }
  if (l.style === "bun")
    w.ball(head, l.hair, [0, 0.12, -0.245], [0.12, 0.12, 0.105]);
  if (l.style !== "bald")
    for (let i = 0; i < 5; i++) {
      const lock = w.capsule(
        head,
        l.hair,
        [-0.16 + i * 0.065, 0.18 + Math.sin(i) * 0.025, 0.16],
        [0.033, 0.073, 0.045],
      );
      lock.rotation.z = -0.45 + i * 0.06;
    }
  if (["lan", "lyly", "phuc"].includes(customer.id)) {
    w.line(
      body,
      "#5f5047",
      [
        [-0.22, 1.47, -0.12],
        [0.08, 1.06, 0.2],
        [0.25, 0.8, 0.12],
      ],
      0.018,
    );
    w.box(body, "#9a725a", [0.32, 0.71, 0.02], [0.22, 0.27, 0.13]);
  }
  if (customer.id === "minh") {
    w.box(body, "#527950", [0, 1.1, -0.22], [0.52, 0.54, 0.23]);
    w.line(
      body,
      "#d8e0c9",
      [
        [-0.24, 1.38, -0.34],
        [0.24, 1.38, -0.34],
      ],
      0.014,
    );
  }
  if (l.beard)
    w.line(
      head,
      l.hair,
      [
        [-0.06, -0.098, 0.195],
        [0, -0.09, 0.233],
        [0.06, -0.098, 0.195],
      ],
      0.023,
    );
  if (l.accessory === "glasses") {
    [-1, 1].forEach((side) =>
      w.line(
        head,
        "#534e40",
        [
          [side * 0.04, 0.059, 0.23],
          [side * 0.15, 0.059, 0.21],
          [side * 0.15, -0.028, 0.21],
          [side * 0.04, -0.028, 0.23],
          [side * 0.04, 0.059, 0.23],
        ],
        0.009,
      ),
    );
    w.line(
      head,
      "#534e40",
      [
        [-0.04, 0.035, 0.23],
        [0.04, 0.035, 0.23],
      ],
      0.007,
    );
  }
  if (l.accessory === "helmet" || l.accessory === "cap") {
    w.mesh(
      head,
      w.geometry(
        "helmet",
        () => new T.SphereGeometry(1, 20, 12, 0, Math.PI * 2, 0, 1.3),
      ),
      l.accessory === "helmet" ? "#457e50" : "#5e5a42",
      [0, 0.062, 0],
      [0.269, 0.31, 0.248],
    );
    w.box(
      head,
      l.accessory === "helmet" ? "#d9dbce" : "#5e5a42",
      [0, 0.115, 0.22],
      [0.4, 0.035, 0.22],
    );
  }
  const arm = (side: number) => {
    const pivot = new T.Group();
    pivot.position.set(side * 0.32, 1.42, 0);
    body.add(pivot);
    w.capsule(pivot, l.shirt, [side * 0.02, -0.15, 0], [0.087, 0.113, 0.09]);
    w.capsule(pivot, l.skin, [side * 0.04, -0.43, 0.025], [0.058, 0.096, 0.06]);
    w.ball(pivot, l.skin, [side * 0.04, -0.6, 0.04], [0.074, 0.09, 0.05]);
    w.ball(pivot, l.skin, [side * 0.002, -0.57, 0.074], [0.029, 0.045, 0.023]);
    return pivot;
  };
  const leg = (side: number) => {
    const pivot = new T.Group();
    pivot.position.set(side * 0.14, 0.83, 0);
    root.add(pivot);
    w.capsule(pivot, l.pants, [0, -0.23, 0], [0.095, 0.16, 0.1]);
    w.capsule(
      pivot,
      l.skirt ? l.skin : l.pants,
      [0, -0.58, 0],
      [0.072, 0.108, 0.075],
    );
    w.box(
      pivot,
      l.old ? "#6f553f" : "#dedacc",
      [0, -0.76, 0.075],
      [0.19, 0.12, 0.3],
    );
    if (l.old) {
      w.box(pivot, l.skin, [0, -0.705, 0.07], [0.14, 0.027, 0.19]);
      w.line(
        pivot,
        "#684c38",
        [
          [-0.073, -0.69, 0.11],
          [0, -0.67, 0.14],
          [0.073, -0.69, 0.11],
        ],
        0.014,
      );
    } else {
      w.box(pivot, "#b3b2a8", [0, -0.815, 0.075], [0.19, 0.02, 0.29]);
      for (let i = 0; i < 3; i++)
        w.line(
          pivot,
          "#716e64",
          [
            [-0.04, -0.693, 0.1 + i * 0.035],
            [0.04, -0.693, 0.1 + i * 0.035],
          ],
          0.004,
        );
    }
    return pivot;
  };
  const leftArm = arm(-1),
    rightArm = arm(1),
    leftLeg = leg(-1),
    rightLeg = leg(1);
  const hand = new T.Group();
  hand.position.set(0.04, -0.57, 0.11);
  rightArm.add(hand);
  if (l.old) body.rotation.x = 0.09;
  return { root, body, head, leftArm, rightArm, leftLeg, rightLeg, hand };
}

export function pose(
  person: Person,
  time: number,
  walking: boolean,
  gesture: number,
  sitting: boolean,
  motion: boolean,
) {
  const swing = motion && walking ? Math.sin(time * 9) * 0.45 : 0;
  person.leftLeg.rotation.x = sitting ? -1.35 : swing;
  person.rightLeg.rotation.x = sitting ? -1.35 : -swing;
  person.leftArm.rotation.x = -swing * 0.75;
  person.rightArm.rotation.x = gesture ? -gesture : swing * 0.75;
  person.body.position.y =
    motion && walking ? Math.abs(Math.sin(time * 9)) * 0.035 : 0;
  person.head.rotation.y =
    motion && !walking ? Math.sin(time * 0.65) * 0.075 : 0;
}

export const DRINK_COLORS: Record<DrinkDraft["base"], string> = {
  "classic-milk-tea": "#b38455",
  "peach-tea": "#d69546",
  "matcha-latte": "#829755",
  "oolong-milk-tea": "#a98f68",
  "taro-milk-tea": "#a299bf",
  "strawberry-milk": "#d39891",
  "cocoa-milk": "#745238",
  "lemon-tea": "#d5bc63",
};
export function makeCup(w: Workshop) {
  const root = new T.Group();
  const shell = w.mesh(
    root,
    w.geometry(
      "cup",
      () => new T.CylinderGeometry(0.17, 0.125, 0.48, 32, 1, true),
    ),
    "#faf5f8",
    [0, 0.25, 0],
    undefined,
    0,
    0.18,
  );
  w.cylinder(root, "#eeece3", [0, 0.012, 0], 0.126, 0.018, 0, 0.5);
  const rim = w.mesh(
    root,
    w.geometry("cup-rim", () => new T.TorusGeometry(0.17, 0.005, 6, 32)),
    "#f5f2f4",
    [0, 0.493, 0],
    undefined,
    0,
    0.65,
  );
  rim.rotation.x = Math.PI / 2;
  w.line(
    root,
    "#fff9fb",
    [
      [-0.079, 0.04, 0.1],
      [-0.086, 0.2, 0.118],
      [-0.099, 0.44, 0.139],
    ],
    0.002,
  );
  for (let i = 0; i < 7; i++)
    w.ball(
      root,
      "#e5eaf0",
      [Math.sin(i * 5) * 0.1, 0.095 + (i % 5) * 0.07, 0.136 + (i % 2) * 0.009],
      [0.003, 0.004, 0.003],
    );
  const liquid = w.mesh(
    root,
    w.geometry("liquid", () => new T.CylinderGeometry(0.162, 0.127, 1, 24)),
    "#b38455",
    [0, 0.17, 0],
    [1, 0.3, 1],
  );
  const milk = w.cylinder(root, "#efe1cb", [0, 0.085, 0], 0.131, 0.09);
  const lid = w.cylinder(root, "#edc2d6", [0, 0.505, 0], 0.18, 0.014, 0, 0.82);
  const dome = w.mesh(
    root,
    w.geometry(
      "dome-lid",
      () => new T.SphereGeometry(0.18, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    ),
    "#faf1f7",
    [0, 0.494, 0],
    [1, 0.64, 1],
    0,
    0.25,
  );
  const straw = w.cylinder(root, "#ae668e", [0.047, 0.62, 0], 0.013, 0.32);
  const sealMark = w.label(
    root,
    "PHỐ NHỎ",
    [0, 0.516, 0],
    0.2,
    0.08,
    "#e9c2d8",
    "#904767",
    160,
  );
  sealMark.rotation.x = -Math.PI / 2;
  const ice = new T.Group(),
    topping = new T.Group();
  root.add(ice, topping);
  for (let i = 0; i < 6; i++) {
    const cube = w.box(
      ice,
      "#cee0dd",
      [Math.sin(i * 3) * 0.095, 0.32 + (i % 2) * 0.06, Math.cos(i * 3) * 0.08],
      [0.062, 0.066, 0.067],
    );
    cube.rotation.set(i * 0.3, i, i * 0.5);
  }
  const toppingGroups = new Map<DrinkDraft["topping"], T.Group>();
  for (const id of [
    "black-pearl",
    "pudding",
    "rainbow-jelly",
    "cheese-foam",
    "aloe-vera",
    "mochi",
  ] as const) {
    const group = new T.Group();
    topping.add(group);
    toppingGroups.set(id, group);
    for (
      let i = 0;
      i < (id === "cheese-foam" ? 1 : id === "black-pearl" ? 12 : 7);
      i++
    ) {
      const p = [
        Math.sin(i * 7) * 0.083,
        0.046 + (i % 3) * 0.024,
        Math.cos(i * 7) * 0.083,
      ];
      if (id === "black-pearl")
        w.ball(group, "#392a2e", p, [0.025, 0.025, 0.025]);
      else if (id === "mochi")
        w.ball(group, i % 2 ? "#f2dce8" : "#e6e6ca", p, [0.038, 0.028, 0.032]);
      else if (id === "cheese-foam")
        w.cylinder(group, "#f7edce", [0, 0, 0], 0.16, 0.041);
      else
        w.box(
          group,
          id === "pudding"
            ? "#e5ba55"
            : id === "aloe-vera"
              ? "#c4d3b2"
              : ["#c18bb2", "#c8dba6", "#e6bb79"][i % 3],
          p,
          id === "pudding" ? [0.059, 0.047, 0.04] : [0.04, 0.04, 0.028],
        ).rotation.y = i;
    }
  }
  const fruit = new T.Group();
  root.add(fruit);
  for (let i = 0; i < 3; i++) {
    const slice = w.mesh(
      fruit,
      w.geometry(
        "fruit-slice",
        () => new T.TorusGeometry(0.072, 0.016, 6, 14, Math.PI * 1.4),
      ),
      "#f2c071",
      [0.04, 0.3 + i * 0.046, -0.09],
    );
    slice.rotation.set(0.3, i * 1.7, 0.5);
  }
  w.label(
    root,
    "TIỆM TRÀ\nPHỐ NHỎ",
    [0, 0.255, 0.17],
    0.16,
    0.14,
    "#f3d9e5",
    "#965473",
    98,
  );
  const sizeLabel = w.label(
    root,
    "M",
    [0.09, 0.355, 0.14],
    0.035,
    0.04,
    "#f5e1eb",
    "#965473",
    150,
  );
  let last = "";
  return {
    root,
    update(draft: DrinkDraft) {
      const key = JSON.stringify(draft);
      if (last === key) return;
      last = key;
      root.scale.set(
        (draft.size === "L" ? 1.08 : 1) * 0.6,
        (draft.size === "L" ? 1.25 : 1) * 0.6,
        (draft.size === "L" ? 1.08 : 1) * 0.6,
      );
      sizeLabel.visible = draft.size === "M";
      shell.material = w.material(
        "#faf5f8",
        0,
        draft.base === "peach-tea" || draft.base === "lemon-tea" ? 0.12 : 0.18,
      );
      const height = Math.max(0.018, (draft.fill / 100) * 0.43);
      liquid.scale.y = height;
      liquid.position.y = height / 2 + 0.025;
      liquid.material = w.material(DRINK_COLORS[draft.base]);
      milk.visible =
        ["matcha-latte", "strawberry-milk", "cocoa-milk"].includes(
          draft.base,
        ) &&
        draft.fill > 20 &&
        draft.shake < 55;
      fruit.visible =
        ["peach-tea", "lemon-tea"].includes(draft.base) && draft.fill > 20;
      dome.visible = draft.sealed && draft.topping === "cheese-foam";
      lid.visible = sealMark.visible = draft.sealed && !dome.visible;
      straw.visible = draft.sealed;
      ice.visible = draft.ice > 0 && draft.fill > 10;
      ice.children.forEach((cube, i) => {
        cube.visible = i < Math.ceil(draft.ice / 17);
      });
      ice.position.y = height - 0.4;
      toppingGroups.forEach((group, id) => {
        group.visible = id === draft.topping;
        if (id === "cheese-foam") group.position.y = height + 0.025;
      });
    },
  };
}
