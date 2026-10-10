import * as T from "three";
import { neighborGreeting, INITIAL_GREETING } from "./neighborGreeting";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import type { Customer, DrinkDraft } from "../game/types";
import { mergeRigid } from './batching';
import {makeSurface,type SurfaceKind} from './materials';
import {continuousTorso,continuousHips,continuousLimb,faceGeometry} from './actorGeometry';

export class Workshop {
  geometries = new Map<string, T.BufferGeometry>();
  materials = new Map<string, T.MeshStandardMaterial>();
  textures: T.Texture[] = [];
  skeletons=new Set<T.Skeleton>();
  surface(kind: SurfaceKind, color: string) {
    const key = `surface:${kind}:${color}`;
    if (!this.materials.has(key)) this.materials.set(key,makeSurface(kind,color,this.textures));
    return this.materials.get(key)!;
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
    const simple = Math.max(...scale)>=8 || Math.min(...scale)<0.075;
    return this.mesh(
      parent,
      this.geometry(simple?'plain-box':"box", () => simple?new T.BoxGeometry(1,1,1):new RoundedBoxGeometry(1, 1, 1, 2, 0.065)),
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
            points.length===2?1:8,
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
  releaseSkeletons(root:T.Object3D){
    root.traverse(object=>{if(object instanceof T.SkinnedMesh&&this.skeletons.delete(object.skeleton))object.skeleton.dispose();});
  }
  dispose() {
    this.geometries.forEach((g) => g.dispose());
    this.materials.forEach((m) => m.dispose());
    this.textures.forEach((t) => t.dispose());
    this.skeletons.forEach(s=>s.dispose());
    this.skeletons.clear();
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
  eyes: T.Mesh[];
  knees: T.Bone[];
  elbows:T.Bone[];
}

export function makePerson(w: Workshop, customer: Customer): Person {
  const l = LOOKS[customer.id] ?? LOOKS.khanh;
  const root = new T.Group();
  root.scale.set(l.build, l.height / 2.1, 1);
  const body = new T.Group();
  const eyes: T.Mesh[] = [], knees:T.Bone[]=[],elbows:T.Bone[]=[];
  root.add(body);
  continuousTorso(w,body,l.shirt,l.skin);
  if(!l.skirt)continuousHips(w,body,l.pants);
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
  // Belt, hem stitching and small creases belong to clothing, rather than skin.
  w.line(body, l.pants, [[-0.24, 0.91, 0.14], [0, 0.9, 0.183], [0.24, 0.91, 0.14]], 0.012);
  if (!l.skirt) {
    w.box(body, '#8b7967', [0, 0.88, 0.177], [0.07, 0.05, 0.018], 0.5);
    for (const side of [-1, 1]) w.line(body, '#ffffff', [[side*0.14,0.87,0.14],[side*0.22,0.79,0.11]], 0.003);
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
  head.scale.setScalar(.92);
  body.add(head);
  w.mesh(head,w.geometry('continuous-face',faceGeometry),l.skin,[0,0,0]);
  [-1, 1].forEach((side) => {
    w.ball(head, l.skin, [side * 0.231, -0.018, 0], [0.049, 0.074, 0.038]);
    const white = w.ball(
      head,
      "#efe1d4",
      [side * 0.086, 0.022 + (side === 1 ? 0.008 : 0), 0.203],
      [0.025, 0.016, 0.009],
    );
    const pupil = w.ball(
      head,
      "#332e28",
      [side * 0.086, 0.022 + (side === 1 ? 0.008 : 0), 0.211],
      [0.014, 0.014, 0.008],
    );
    eyes.push(white, pupil);
    white.userData.blinkHeight = 0.016; pupil.userData.blinkHeight = 0.014;
    w.ball(head, '#ffffff', [side * 0.086 - 0.004, 0.028 + (side === 1 ? 0.008 : 0), 0.218], [0.004, 0.004, 0.002]);
    w.line(head, '#8b6650', [[side*0.055,0.042,0.204],[side*0.086,0.05,0.206],[side*0.115,0.039,0.198]],0.0035);
    w.ball(head, '#ad7962', [side * 0.235, -0.018, 0.023], [0.023, 0.04, 0.018]);
    w.ball(head, '#997058', [side * 0.022, -0.081, 0.258], [0.009, 0.006, 0.003]);
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
    w.ball(head,l.hair,[0,l.style==='long'?-.16:-.08,-.12],[.224,l.style==='long'?.35:.23,.125]);
    for(const side of [-1,1])w.ball(head,l.hair,[side*.18,-.08,-.015],[.054,.22,.12]);
  }
  if (l.style === "bun")
    w.ball(head, l.hair, [0, 0.12, -0.245], [0.12, 0.12, 0.105]);
  if (l.style === 'bun') w.cylinder(head, '#a1768b', [0, 0.1, -0.245], 0.107, 0.035).rotation.x = Math.PI / 2;
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
    if (l.accessory === 'helmet') w.line(head, '#4a4941', [[-0.23,-0.02,0.01],[-0.13,-0.24,0.07],[0,-0.27,0.08],[0.13,-0.24,0.07],[0.23,-0.02,0.01]],0.011);
  }
  const arm = (side: number) => {
    const pivot = new T.Group();
    pivot.position.set(side * 0.32, 1.42, 0);
    body.add(pivot);
    const limb=continuousLimb(w,pivot,'arm',l.shirt,l.skin,side);elbows.push(limb.joint);
    const forearm=new T.Group();forearm.position.y=.30;limb.joint.add(forearm);
    w.ball(forearm, l.skin, [side * 0.04, -0.6, 0.04], [0.074, 0.09, 0.05]);
    w.ball(forearm, l.skin, [side * 0.002, -0.57, 0.074], [0.029, 0.045, 0.023]);
    for (let finger=0;finger<3;finger++) w.line(forearm,'#a77d61',[[side*0.04-0.035+finger*0.025,-0.6,0.086],[side*0.04-0.035+finger*0.025,-0.65,0.075]],0.0025);
    if (side===-1 && !l.old) {
      w.cylinder(forearm, '#4d5450', [side*0.04,-0.48,0.025],0.066,0.035);
      w.box(forearm,'#bcc3bb',[side*0.04,-0.48,0.088],[0.046,0.032,0.012],0.6);
    }
    return pivot;
  };
  const leg = (side: number) => {
    const pivot = new T.Group();
    pivot.position.set(side * 0.14, 0.83, 0);
    root.add(pivot);
    const limb=continuousLimb(w,pivot,'leg',l.pants,l.skirt?l.skin:l.pants,side);
    const knee=limb.joint;knees.push(knee);
    w.box(
      knee,
      l.old ? "#6f553f" : "#dedacc",
      [0, -0.34, 0.075],
      [0.19, 0.12, 0.3],
    );
    if (l.old) {
      w.box(knee, l.skin, [0, -0.285, 0.07], [0.14, 0.027, 0.19]);
      w.line(
        knee,
        "#684c38",
        [
          [-0.073, -0.27, 0.11],
          [0, -0.25, 0.14],
          [0.073, -0.27, 0.11],
        ],
        0.014,
      );
    } else {
      w.box(knee, "#b3b2a8", [0, -0.395, 0.075], [0.19, 0.02, 0.29]);
      for (let i = 0; i < 3; i++)
        w.line(
          knee,
          "#716e64",
          [
            [-0.04, -0.273, 0.1 + i * 0.035],
            [0.04, -0.273, 0.1 + i * 0.035],
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
  hand.position.set(0.018, -0.27, 0.11);
  elbows[1].add(hand);
  if (l.old) body.rotation.x = 0.09;
  // Hair strands, skin folds and woven garments read at conversation distance.
  if(l.style!=='bald')for(let i=0;i<20;i++){
    const x=(i/19-.5)*.38;
    w.line(head,i%3===0?'#635346':l.hair,[[x,.25,.08],[x*.94,.3,-.05],[x*.9,.19,-.19]],.0025);
  }
  root.traverse(object=>{if(object instanceof T.Mesh&&!Array.isArray(object.material)){
    if(object.material===w.material(l.shirt))object.material=w.surface('fabric',l.shirt);
    else if(object.material===w.material(l.pants))object.material=w.surface('fabric',l.pants);
  }});
  const register=(key:string,factory:()=>T.BufferGeometry)=>w.geometry(key,factory);
  const parts=[body,head,leftArm,rightArm,leftLeg,rightLeg];
  parts.forEach((part,i)=>mergeRigid(part,[head,leftArm,rightArm,...knees,...elbows,...eyes].filter(p=>p!==part),register,`person:${customer.id}:${i}`));
  return { root, body, head, leftArm, rightArm, leftLeg, rightLeg, hand, eyes, knees,elbows };
}

export function pose(
  person: Person,
  time: number,
  walking: boolean,
  gesture: number,
  sitting: boolean,
  motion: boolean,
  gaitPhase=time*7,
  greeting=0,
) {
  const swing = motion && walking ? Math.sin(gaitPhase) * 0.34 : 0;
  person.leftLeg.rotation.x = sitting ? -1.35 : swing;
  person.rightLeg.rotation.x = sitting ? -1.35 : -swing;
  person.knees.forEach((knee,i) => { knee.rotation.x = sitting ? 1.35 : motion && walking ? Math.max(0, Math.sin(gaitPhase + i*Math.PI))*0.38 : 0; });
  const blinking = motion && (time + person.root.scale.y*3) % 4.7 > 4.55;
  person.eyes.forEach(eye => { eye.scale.y = blinking ? 0.002 : eye.userData.blinkHeight; });
  person.elbows.forEach((elbow,i)=>{elbow.rotation.x=gesture&&i===1?-Math.min(.75,gesture*.6):-.12-(motion&&walking?Math.max(0,Math.sin(gaitPhase+i*Math.PI))*.12:0);});
  person.leftArm.rotation.x = -swing * 0.55;
  person.rightArm.rotation.x = gesture ? -gesture : swing * 0.55;
  person.body.position.y =
    motion && walking ? Math.abs(Math.sin(gaitPhase)) * 0.014 : motion ? Math.sin(time*1.8)*0.006 : 0;
  person.head.rotation.y =
    motion && !walking ? Math.sin(time * 0.65) * 0.075 : 0;
  // Welcome gesture is procedural: no additional geometry or textures.
  const hello = motion ? T.MathUtils.clamp(greeting, 0, 1) : 0;
  person.rightArm.rotation.z = -hello * 0.16;
  person.hand.rotation.z = hello * Math.sin(time * 8) * 0.24;
  person.head.rotation.z = hello * 0.07;
  person.head.rotation.x = hello * (0.04 + Math.sin(time * 3) * 0.015);
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
