import * as T from "three";
import { Workshop } from "./models";
import type { InventoryKey } from "../game/types";
import { streetFronts, teaVessels } from "./details";
import { batchStatic } from "./batching";

export function buildShop(w: Workshop) {
  const root = new T.Group();
  const green = "#b67793",
    cream = "#f2e2e5",
    wood = "#b18a70",
    metal = "#b9bec5";
  w.box(root, "#a0a294", [0, -0.24, 0], [10.2, 0.4, 10]);
  // Individual tiles, grout and a raised pavement establish physical scale.
  const tileGeometry = w.geometry(
    "tile",
    () => new T.BoxGeometry(0.985, 0.055, 0.985),
  );
  const tiles = new T.InstancedMesh(tileGeometry, w.material("#e9d8dc"), 100);
  const dummy = new T.Object3D();
  for (let i = 0; i < 100; i++) {
    dummy.position.set((i % 10) - 4.5, -0.018, Math.floor(i / 10) - 4.5);
    dummy.updateMatrix();
    tiles.setMatrixAt(i, dummy.matrix);
    tiles.setColorAt(i, new T.Color(i % 3 ? "#f3e4e3" : "#e6cbd4"));
  }
  tiles.receiveShadow = true;
  root.add(tiles);
  w.box(root, cream, [0, 1.7, 4.9], [10.1, 3.5, 0.16]);
  w.box(root, green, [0, 0.47, 4.79], [10, 0.92, 0.04]);
  for (const side of [-1, 1]) {
    w.box(root, cream, [side * 4.95, 0.73, 0.2], [0.16, 1.5, 9.5]);
    [1.9, -2.8].forEach((z) =>
      w.box(root, green, [side * 4.95, 1.85, z], [0.18, 3.7, 0.18]),
    );
    w.box(root, green, [side * 4.95, 3.45, -0.45], [0.19, 0.2, 9]);
    for (let i = 0; i < 5; i++)
      w.box(
        root,
        "#ead1dc",
        [side * 4.91, 2.45, -2.4 + i * 0.7],
        [0.07, 1.05, 0.63],
      );
  }
  // Front awning, sign and open doorway.
  w.box(root, wood, [0, 3.35, -4.75], [10.1, 0.3, 0.27]);
  w.box(root, "#c584a0", [0, 3.15, -4.72], [4.2, 0.76, 0.13]);
  w.label(
    root,
    "TIỆM TRÀ • PHỐ NHỎ",
    [0, 3.15, -4.64],
    3.9,
    0.59,
    "#c584a0",
    "#fff4ef",
    60,
  );
  for (let i = 0; i < 14; i++)
    w.box(
      root,
      i % 2 ? "#f2dde6" : green,
      [-4.7 + i * 0.72, 3.38, -5.35],
      [0.7, 0.07, 1.3],
    ).rotation.x = -0.14;
  // Counter: visible panels, edge bevel, stainless sink, preparation board.
  w.box(root, wood, [0, 0.57, 1], [5.65, 1.12, 1.16]);
  for (let i = 0; i < 12; i++)
    w.box(
      root,
      i % 2 ? "#e3acbd" : "#d59bad",
      [-2.63 + i * 0.47, 0.6, 0.403],
      [0.44, 0.93, 0.028],
    );
  w.box(root, "#f1e4dc", [0, 1.17, 1], [5.85, 0.15, 1.35]).material = w.surface(
    "stone",
    "#f2e4e8",
  );
  const fascia = w.box(root, wood, [0, 1.05, 1.67], [5.62, 0.055, 0.03]);
  fascia.material = w.surface("wood", "#b88e78");
  w.box(root, green, [0, 0.1, 0.4], [5.65, 0.12, 0.035]);
  w.label(
    root,
    "NHẬN ĐỒ MANG ĐI",
    [0, 0.67, 0.385],
    1.52,
    0.36,
    "#ebdec2",
    "#4a6653",
    86,
  ).rotation.y = Math.PI;
  w.box(root, "#cd95ad", [0.3, 1.27, 1.2], [1.15, 0.035, 0.62]);
  w.box(root, metal, [-1.75, 1.265, 1.15], [0.76, 0.06, 0.55], 0.75);
  w.box(root, "#525f59", [-1.75, 1.285, 1.15], [0.59, 0.03, 0.39]);
  w.line(
    root,
    metal,
    [
      [-1.95, 1.3, 1.4],
      [-1.95, 1.75, 1.4],
      [-1.95, 1.81, 1.3],
      [-1.95, 1.81, 1.15],
      [-1.95, 1.69, 1.12],
    ],
    0.025,
  );
  // Tea urns on the rear shelf, with labels, lids, handles and taps.
  w.box(root, wood, [0, 1.21, 4.38], [8.4, 0.15, 0.8]);
  teaVessels(w, root);
  const brewer = new T.Group();
  root.add(brewer);
  w.box(brewer, "#a4afa9", [-2.7, 1.72, 4.3], [0.78, 0.91, 0.67], 0.7);
  w.box(brewer, "#36473e", [-2.7, 1.82, 3.94], [0.54, 0.38, 0.025]);
  w.label(
    brewer,
    "92°C  •  04:00",
    [-2.7, 1.84, 3.914],
    0.4,
    0.14,
    "#3c3040",
    "#e8cfda",
    99,
  ).rotation.y = Math.PI;
  [-1, 1].forEach(
    (side) =>
      (w.cylinder(
        brewer,
        "#977385",
        [-2.7 + side * 0.28, 1.63, 3.9],
        0.032,
        0.016,
      ).rotation.x = Math.PI / 2),
  );
  w.line(
    brewer,
    metal,
    [
      [-2.7, 1.57, 3.92],
      [-2.7, 1.5, 3.87],
    ],
    0.028,
  );
  w.cylinder(brewer, "#c8c9b5", [-2.7, 1.43, 4.01], 0.15, 0.13, 0.5);
  const sealer = new T.Group();
  root.add(sealer);
  w.box(sealer, green, [2.04, 1.58, 1.03], [0.64, 0.59, 0.48]);
  w.box(sealer, "#c1c6ba", [2.04, 1.3, 1.23], [0.7, 0.09, 0.7], 0.6);
  w.cylinder(sealer, "#e8d9b5", [2.04, 1.9, 1.04], 0.18, 0.38).rotation.z =
    Math.PI / 2;
  w.label(
    sealer,
    "DẬP NẮP",
    [2.04, 1.59, 1.28],
    0.41,
    0.19,
    "#a06583",
    "#fff6df",
    110,
  );
  w.box(sealer, "#6c4b60", [2.04, 1.39, 1.285], [0.38, 0.1, 0.025]);
  w.line(
    sealer,
    metal,
    [
      [1.77, 1.52, 1.08],
      [1.63, 1.63, 1.2],
      [1.63, 1.79, 1.2],
    ],
    0.023,
  );
  w.box(sealer, "#97627b", [1.63, 1.81, 1.2], [0.08, 0.15, 0.08]);
  w.cylinder(sealer, "#f0bfd6", [2.04, 1.34, 1.36], 0.16, 0.025);
  const shaker = new T.Group();
  root.add(shaker);
  w.box(shaker, "#d4c9b2", [1.22, 1.3, 1.11], [0.38, 0.09, 0.38]);
  w.cylinder(shaker, "#bcc4bd", [1.22, 1.56, 1.11], 0.15, 0.49, 0.8);
  w.cylinder(shaker, "#687366", [1.22, 1.83, 1.11], 0.12, 0.06);
  w.cylinder(shaker, "#d6a7bc", [1.22, 1.53, 1.11], 0.154, 0.1);
  for (let i = 0; i < 4; i++)
    w.box(
      shaker,
      "#687366",
      [1.371, 1.43 + i * 0.08, 1.11],
      [0.012, 0.01, 0.065],
    );
  // Topping tubs, syrup pumps, folded cloth and cup stacks.
  for (let i = 0; i < 3; i++) {
    const x = -0.92 + i * 0.33;
    w.box(root, metal, [x, 1.32, 0.72], [0.3, 0.14, 0.28], 0.6);
    w.box(
      root,
      ["#45382b", "#d9b452", "#b7c099"][i],
      [x, 1.394, 0.72],
      [0.25, 0.016, 0.22],
    );
    w.line(
      root,
      metal,
      [
        [x, 1.42, 0.75],
        [x + 0.03, 1.52, 0.85],
      ],
      0.016,
    );
  }
  for (let i = 0; i < 2; i++) {
    w.cylinder(
      root,
      i ? "#dde1d0" : "#bc9765",
      [-1.08 + i * 0.43, 1.46, 1.35],
      0.12,
      0.4,
      0,
      0.8,
    );
    w.box(root, "#e5d9bf", [-1.08 + i * 0.43, 1.69, 1.32], [0.19, 0.06, 0.23]);
  }
  for (let i = 0; i < 5; i++)
    w.cylinder(
      root,
      "#ede7d8",
      [2.48, 1.3 + i * 0.032, 0.75],
      0.13 + i * 0.007,
      0.13,
      0,
      0.8,
    );
  w.box(root, "#b49a81", [-2.4, 1.29, 0.7], [0.4, 0.04, 0.3]);
  // Tables, bent tube chairs and familiar red pavement stools.
  const tables = new T.Group();
  root.add(tables);
  for (const x of [-2.8, 2.8]) {
    w.cylinder(tables, "#f1dce4", [x, 0.84, -2.55], 0.65, 0.085).material =
      w.surface("stone", "#f3e5e6");
    w.cylinder(tables, "#536553", [x, 0.4, -2.55], 0.075, 0.8, 0.6);
    w.cylinder(tables, "#4a5b4d", [x, 0.05, -2.55], 0.36, 0.07);
    w.cylinder(tables, "#ebe3cd", [x + 0.2, 0.96, -2.55], 0.075, 0.16);
    for (const z of [-3.45]) {
      w.box(tables, green, [x, 0.52, z], [0.52, 0.08, 0.48]);
      for (const dx of [-0.2, 0.2])
        for (const dz of [-0.18, 0.18])
          w.cylinder(
            tables,
            "#637360",
            [x + dx, 0.25, z + dz],
            0.027,
            0.51,
            0.5,
          );
      w.box(
        tables,
        green,
        [x, 0.86, z + (z < -2 ? -0.23 : 0.23)],
        [0.51, 0.45, 0.065],
      );
    }
    w.label(
      tables,
      x < 0 ? "01" : "02",
      [x, 1.06, -2.64],
      0.16,
      0.2,
      "#f0dfbf",
      "#6a563e",
      160,
    );
  }
  // Stock shelves: bins have volume and show the actual inventory level.
  const pantry = new T.Group();
  pantry.position.set(4.27, 0, 2.8);
  pantry.rotation.y = -Math.PI / 2;
  root.add(pantry);
  w.box(pantry, "#a57c53", [0, 1.3, 0], [2.6, 2.6, 0.13]);
  for (let y = 0.3; y < 2.6; y += 0.72)
    w.box(pantry, wood, [0, y, 0.23], [2.7, 0.09, 0.64]);
  const jars: T.Mesh[] = [];
  const jarKeys: InventoryKey[] = [
    "classicMilkTea",
    "sugar",
    "ice",
    "peachTea",
    "blackPearl",
    "cupsM",
    "matchaLatte",
    "pudding",
    "cupsL",
  ];
  for (let i = 0; i < 9; i++) {
    const x = ((i % 3) - 1) * 0.8,
      y = 0.57 + Math.floor(i / 3) * 0.72;
    const cupStack = jarKeys[i] === "cupsM" || jarKeys[i] === "cupsL";
    const iceBox = jarKeys[i] === "ice";
    if (iceBox) {
      w.box(pantry, "#d6e8ec", [x, y, 0.08], [0.48, 0.44, 0.03]);
      [-1, 1].forEach((side) =>
        w.box(
          pantry,
          "#c2dbe3",
          [x + side * 0.225, y, 0.2],
          [0.025, 0.44, 0.28],
        ),
      );
    } else if (!cupStack) {
      w.cylinder(pantry, "#faf2f6", [x, y, 0.2], 0.21, 0.44, 0, 0.18);
      w.cylinder(pantry, green, [x, y + 0.24, 0.2], 0.22, 0.045);
    }
    const colors = [
      "#ae7744",
      "#f5eee2",
      "#9fc5db",
      "#de9439",
      "#38272e",
      "#f8eef4",
      "#718c46",
      "#e5b850",
      "#f8eef4",
    ];
    const fill = cupStack
      ? w.mesh(
          pantry,
          w.geometry(
            "stacked-cups",
            () => new T.CylinderGeometry(0.17, 0.125, 1, 24),
          ),
          colors[i],
          [x, y, 0.2],
        )
      : iceBox
        ? w.box(pantry, colors[i], [x, y, 0.2], [0.4, 1, 0.25])
        : w.cylinder(pantry, colors[i], [x, y - 0.06, 0.2], 0.19, 1);
    fill.userData.baseY = y - 0.21;
    jars.push(fill);
    w.label(
      pantry,
      [
        "TRÀ ĐEN",
        "ĐƯỜNG",
        "ĐÁ",
        "TRÀ ĐÀO",
        "TRÂN CHÂU",
        "LY M",
        "MATCHA",
        "PUDDING",
        "LY L",
      ][i],
      [x, y + 0.04, 0.419],
      0.25,
      0.15,
      "#efe4c9",
      "#53634c",
      120,
    );
  }
  // Fridge, menu, neighborhood bulletin board, plant pots and pendant lamps.
  w.box(root, "#cad1bf", [-4.23, 1.01, 3.9], [1.05, 2.04, 0.84]);
  w.box(root, metal, [-4.23, 1.01, 3.45], [0.93, 1.94, 0.03], 0.6);
  w.box(root, "#4b6052", [-3.89, 1.22, 3.41], [0.045, 0.4, 0.065]);
  const board = w.label(
    root,
    "PHỐ NHỎ\nTRÀ SỮA • TRÀ ĐÀO • MATCHA\nPha từng ly, chờ một chút nhé",
    [0, 2.85, 4.79],
    3.25,
    0.92,
    "#9a617d",
    "#fff0f5",
    53,
  );
  board.rotation.y = Math.PI;
  const notices = w.label(
    root,
    "CHUYỆN TRONG XÓM\nHôm nay bạn uống gì?\nMời ngồi • Cảm ơn đã ghé",
    [-3.6, 2.78, 4.78],
    1.63,
    1,
    "#b78e60",
    "#fff2d7",
    62,
  );
  notices.rotation.y = Math.PI;
  for (const x of [-4.4, 4.4]) {
    w.cylinder(root, "#aa7552", [x, 0.22, -4.1], 0.3, 0.42);
    for (let i = 0; i < 7; i++) {
      const leaf = w.ball(
        root,
        i % 2 ? "#4e7550" : "#79906a",
        [
          x + Math.sin(i * 2) * 0.24,
          0.55 + (i % 3) * 0.2,
          -4.1 + Math.cos(i * 2) * 0.2,
        ],
        [0.13, 0.28, 0.09],
      );
      leaf.rotation.z = Math.sin(i) * 0.8;
    }
  }
  for (const side of [-1, 1]) {
    const door = new T.Group();
    door.position.set(side * 1.62, 0, -4.72);
    door.rotation.y = side * 0.88;
    root.add(door);
    const center = -side * 0.69;
    for (const x of [0, -side * 1.38])
      w.box(door, "#b77c99", [x, 1.32, 0], [0.055, 2.64, 0.055]);
    for (const y of [0.05, 2.61])
      w.box(door, "#b77c99", [center, y, 0], [1.42, 0.055, 0.055]);
    w.mesh(
      door,
      w.geometry("door-glass", () => new T.BoxGeometry(1.33, 2.48, 0.018)),
      "#e3d9e5",
      [center, 1.32, 0],
      undefined,
      0,
      0.15,
    );
    w.line(
      door,
      "#c5a59f",
      [
        [-side * 1.13, 0.92, 0.06],
        [-side * 1.13, 1.44, 0.06],
      ],
      0.016,
    );
    w.label(
      door,
      side === 1 ? "MỜI VÀO" : "CẢM ƠN",
      [center, 1.57, 0.033],
      0.46,
      0.18,
      "#f7d8e7",
      "#9c587b",
      99,
    );
  }
  w.box(root, "#b37c97", [-3.4, 0.23, 2.22], [0.33, 0.44, 0.32]);
  w.cylinder(root, "#cda5b7", [-3.4, 0.46, 2.22], 0.17, 0.045);
  w.box(root, "#e6b5cb", [0.88, 1.315, 0.64], [0.24, 0.13, 0.16]);
  for (let i = 0; i < 3; i++)
    w.box(
      root,
      "#fff4ed",
      [0.88 + i * 0.02, 1.42, 0.64],
      [0.13, 0.08, 0.005],
    ).rotation.z = 0.12;
  w.label(
    root,
    "Pha từng ly\nChờ một chút nhé",
    [1.34, 1.51, 0.75],
    0.36,
    0.38,
    "#f5d4e5",
    "#955675",
    95,
  ).rotation.y = Math.PI;
  for (const x of [-2.3, 2.3]) {
    w.cylinder(root, "#504b3d", [x, 3.5, -0.1], 0.014, 0.7);
    w.mesh(
      root,
      w.geometry("shade", () => new T.ConeGeometry(0.37, 0.22, 24, 1, true)),
      "#b88c57",
      [x, 3.13, -0.1],
    );
    const bulb = w.ball(root, "#fff0cc", [x, 3.1, -0.1], [0.1, 0.05, 0.1]);
    (bulb.material as T.MeshStandardMaterial).emissive.set("#ffcc7c");
  }
  // A sidewalk and lived-in neighboring façades beyond the open storefront.
  w.box(root, "#aaa99d", [0, -0.12, -6.2], [25, 0.26, 2.8]);
  w.box(root, "#626d69", [0, -0.22, -8.65], [35, 0.08, 2.2]);
  streetFronts(w, root);
  const bike = new T.Group();
  bike.position.set(-3.4, 0, -6.4);
  bike.rotation.y = -0.4;
  root.add(bike);
  for (const z of [-0.6, 0.6]) {
    const wheel = w.mesh(
      bike,
      w.geometry("wheel", () => new T.TorusGeometry(0.28, 0.066, 8, 20)),
      "#383d38",
      [0, 0.31, z],
    );
    wheel.rotation.y = Math.PI / 2;
    w.cylinder(bike, metal, [0, 0.31, z], 0.18, 0.075, 0.6).rotation.z =
      Math.PI / 2;
  }
  w.box(bike, "#83968c", [0, 0.63, 0], [0.39, 0.42, 0.87]);
  w.box(bike, "#3a413b", [0, 0.83, -0.18], [0.34, 0.14, 0.72]);
  w.box(bike, "#778b80", [0, 0.85, 0.48], [0.34, 0.67, 0.13]).rotation.x = -0.2;
  w.line(
    bike,
    metal,
    [
      [-0.27, 1.18, 0.55],
      [0, 1.18, 0.55],
      [0.27, 1.18, 0.55],
    ],
    0.025,
  );
  w.box(bike, "#e9ddbd", [0, 1.04, 0.6], [0.19, 0.12, 0.07]);
  for (let i = 0; i < 3; i++) {
    const x = 2.8 + i * 0.8;
    w.box(root, "#a65b44", [x, 0.37, -6.1], [0.42, 0.065, 0.42]);
    for (const dx of [-0.15, 0.15])
      for (const dz of [-0.15, 0.15])
        w.box(root, "#a65b44", [x + dx, 0.18, -6.1 + dz], [0.055, 0.34, 0.055]);
  }
  const decor = new T.Group();
  root.add(decor);
  const ids = [
    "sakura-lantern",
    "bunny-sign",
    "flower-wall",
    "neon-heart",
    "lucky-cat",
    "moon-window",
  ];
  ids.forEach((id, i) => {
    const ornament = new T.Group();
    decor.add(ornament);
    ornament.name = id;
    ornament.position.set(2.35, 2.77, 4.45);
    if (i === 0) {
      w.cylinder(ornament, "#ba765c", [0, 0, 0], 0.23, 0.4);
      for (let j = 0; j < 7; j++)
        w.cylinder(ornament, "#75563c", [0, -0.2 + j * 0.065, 0], 0.233, 0.01);
      w.line(
        ornament,
        green,
        [
          [0, 0.2, 0],
          [0, 0.48, 0],
        ],
        0.009,
      );
    } else if (i === 1) {
      w.ball(ornament, "#e7d7b3", [0, 0, 0], [0.24, 0.19, 0.07]);
      [-1, 1].forEach((side) => {
        w.ball(
          ornament,
          "#e7d7b3",
          [side * 0.095, 0.24, 0],
          [0.06, 0.19, 0.055],
        );
        w.ball(
          ornament,
          green,
          [side * 0.07, 0.01, -0.07],
          [0.016, 0.02, 0.009],
        );
      });
    } else if (i === 2) {
      for (let j = 0; j < 12; j++) {
        w.ball(
          ornament,
          "#b98574",
          [Math.sin(j * 8) * 0.32, Math.cos(j * 8) * 0.25, -0.02],
          [0.09, 0.09, 0.03],
        );
      }
    } else if (i === 3) {
      const heart = w.line(
        ornament,
        "#bd7d65",
        [
          [0, -0.25, 0],
          [-0.26, 0.07, 0],
          [-0.15, 0.23, 0],
          [0, 0.12, 0],
          [0.15, 0.23, 0],
          [0.26, 0.07, 0],
          [0, -0.25, 0],
        ],
        0.023,
      );
      (heart.material as T.MeshStandardMaterial).emissive.set("#9e4b31");
    } else if (i === 4) {
      w.ball(ornament, "#e8dabb", [0, -0.06, 0], [0.17, 0.23, 0.12]);
      w.ball(ornament, "#e8dabb", [0, 0.2, 0], [0.16, 0.13, 0.12]);
      [-1, 1].forEach((side) =>
        w.ball(ornament, "#bb8167", [side * 0.1, 0.33, 0], [0.06, 0.09, 0.07]),
      );
      w.ball(ornament, "#e8dabb", [-0.2, 0.1, 0], [0.055, 0.16, 0.065]);
    } else {
      const moon = w.mesh(
        ornament,
        w.geometry(
          "moon",
          () => new T.TorusGeometry(0.22, 0.045, 8, 28, Math.PI * 1.5),
        ),
        "#e5cb8d",
        [0, 0, 0],
      );
      moon.rotation.z = 0.8;
    }
  });
  const indicators = [brewer, shaker, sealer].map((machine, i) => {
    const group = new T.Group();
    group.position.set(
      i === 0 ? -2.7 : i === 1 ? 1.22 : 2.04,
      i === 0 ? 1.64 : 1.5,
      i === 0 ? 3.91 : 1.3,
    );
    for (let j = 0; j < 5; j++)
      w.ball(group, "#75a578", [(j - 2) * 0.055, 0, 0], [0.016, 0.016, 0.008]);
    machine.add(group);
    return group;
  });
  const batches = batchStatic(root, [brewer, sealer, shaker, decor, ...jars]);
  root.updateMatrixWorld(true);
  root.traverse((object) => {
    if (object instanceof T.Mesh && object.parent !== decor) {
      object.updateMatrix();
      object.matrixAutoUpdate = false;
    }
  });
  // Jar transforms reflect live inventory, so they remain dynamic.
  jars.forEach((jar) => {
    jar.matrixAutoUpdate = true;
  });
  return {
    root,
    shaker,
    sealer,
    brewer,
    decor,
    jars,
    jarKeys,
    indicators,
    batches,
  };
}
