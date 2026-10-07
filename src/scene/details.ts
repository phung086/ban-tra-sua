import * as T from "three";
import { Workshop } from "./models";

export function teaVessels(w: Workshop, root: T.Group) {
  const steel = "#b9bec5",
    rose = "#ce91a2",
    ceramic = "#ece3da";
  const urn = new T.Group();
  urn.position.set(-1.8, 1.3, 4.35);
  root.add(urn);
  w.cylinder(urn, steel, [0, 0.44, 0], 0.27, 0.76, 0.85);
  w.cylinder(urn, rose, [0, 0.06, 0], 0.3, 0.09);
  w.cylinder(urn, steel, [0, 0.86, 0], 0.3, 0.045, 0.85);
  w.ball(urn, "#5d4653", [0, 0.92, 0], [0.067, 0.04, 0.067]);
  [-1, 1].forEach((side) =>
    w.line(
      urn,
      "#69505e",
      [
        [side * 0.27, 0.68, 0],
        [side * 0.38, 0.65, 0],
        [side * 0.38, 0.49, 0],
        [side * 0.27, 0.46, 0],
      ],
      0.027,
    ),
  );
  w.line(
    urn,
    steel,
    [
      [0, 0.18, -0.28],
      [0, 0.18, -0.4],
      [0, 0.1, -0.4],
    ],
    0.025,
  );
  w.box(urn, "#4e4049", [0, 0.235, -0.34], [0.07, 0.04, 0.16]);
  w.label(
    urn,
    "TRÀ ĐEN\nỦ NÓNG",
    [0, 0.49, -0.275],
    0.33,
    0.26,
    "#f1dedf",
    "#71495b",
    82,
  ).rotation.y = Math.PI;

  const glass = new T.Group();
  glass.position.set(-0.74, 1.32, 4.35);
  root.add(glass);
  w.mesh(
    glass,
    w.geometry(
      "peach-jar",
      () => new T.CylinderGeometry(0.26, 0.24, 0.66, 32, 1, true),
    ),
    "#e9dce0",
    [0, 0.41, 0],
    undefined,
    0,
    0.21,
  );
  w.cylinder(glass, "#dc9a4f", [0, 0.3, 0], 0.235, 0.49);
  w.cylinder(glass, rose, [0, 0.065, 0], 0.28, 0.08);
  w.cylinder(glass, ceramic, [0, 0.78, 0], 0.285, 0.08);
  w.ball(glass, rose, [0, 0.87, 0], [0.045, 0.045, 0.045]);
  for (let i = 0; i < 4; i++) {
    const peach = w.mesh(
      glass,
      w.geometry(
        "peach",
        () => new T.TorusGeometry(0.125, 0.037, 7, 12, Math.PI),
      ),
      "#f5c578",
      [Math.sin(i * 3) * 0.09, 0.19 + i * 0.095, -0.19],
    );
    peach.rotation.z = i * 1.3;
  }
  w.line(
    glass,
    steel,
    [
      [0, 0.12, -0.24],
      [0, 0.12, -0.39],
      [0, 0.06, -0.39],
    ],
    0.021,
  );
  w.box(glass, rose, [0, 0.17, -0.31], [0.055, 0.05, 0.1]);
  w.label(
    glass,
    "TRÀ ĐÀO",
    [0, 0.66, -0.257],
    0.31,
    0.13,
    "#e5b994",
    "#714d41",
    105,
  ).rotation.y = Math.PI;

  const matcha = new T.Group();
  matcha.position.set(0.33, 1.3, 4.33);
  root.add(matcha);
  w.mesh(
    matcha,
    w.geometry(
      "matcha-pot",
      () =>
        new T.LatheGeometry(
          [
            new T.Vector2(0.18, 0),
            new T.Vector2(0.25, 0.06),
            new T.Vector2(0.28, 0.3),
            new T.Vector2(0.24, 0.6),
            new T.Vector2(0.2, 0.65),
          ],
          32,
        ),
    ),
    "#bbcba8",
    [0, 0, 0],
  );
  w.cylinder(matcha, "#eee5d3", [0, 0.66, 0], 0.23, 0.05);
  w.ball(matcha, "#968269", [0, 0.72, 0], [0.055, 0.045, 0.055]);
  w.line(
    matcha,
    "#8d9271",
    [
      [-0.23, 0.51, 0],
      [-0.39, 0.51, 0],
      [-0.4, 0.26, 0],
      [-0.24, 0.24, 0],
    ],
    0.025,
  );
  w.label(
    matcha,
    "MATCHA",
    [0, 0.34, -0.278],
    0.3,
    0.15,
    "#dbe3c3",
    "#61714e",
    104,
  ).rotation.y = Math.PI;
  const whisk = w.cylinder(matcha, "#c6a875", [0.33, 0.2, -0.12], 0.025, 0.4);
  whisk.rotation.z = -0.23;
  for (let i = 0; i < 6; i++)
    w.line(
      matcha,
      "#c6a875",
      [
        [0.31, 0.32, -0.12],
        [0.31 + Math.sin(i) * 0.065, 0.47, -0.12 + Math.cos(i) * 0.065],
      ],
      0.005,
    );

  const kettle = new T.Group();
  kettle.position.set(1.34, 1.31, 4.35);
  root.add(kettle);
  w.ball(kettle, "#ead5df", [0, 0.23, 0], [0.29, 0.24, 0.25]);
  w.cylinder(kettle, "#9e687d", [0, 0.46, 0], 0.18, 0.035);
  w.ball(kettle, "#9e687d", [0, 0.51, 0], [0.052, 0.032, 0.052]);
  w.line(
    kettle,
    "#ead5df",
    [
      [-0.19, 0.3, 0],
      [-0.39, 0.29, 0],
      [-0.41, 0.09, 0],
      [-0.22, 0.09, 0],
    ],
    0.034,
  );
  w.line(
    kettle,
    "#ead5df",
    [
      [0.21, 0.17, 0],
      [0.36, 0.26, 0],
      [0.42, 0.43, 0],
    ],
    0.047,
  );
  w.label(
    kettle,
    "Ô LONG",
    [0, 0.24, -0.252],
    0.26,
    0.12,
    "#ead5df",
    "#80576a",
    125,
  ).rotation.y = Math.PI;
}

export function streetFronts(w: Workshop, root: T.Group) {
  const colors = ["#d7c7a7", "#abc0b5", "#f0cbb6", "#c5b1c6", "#b4c9cd"];
  for (let i = 0; i < 5; i++) {
    const facade = new T.Group();
    facade.position.set((i - 2) * 4.6, 0, -11.3);
    root.add(facade);
    w.box(facade, colors[i], [0, 2.85, 0], [4.5, 5.9, 2]);
    const face = -0 + 1.08;
    // Open grocery shelving; metal repair shutter; glazed bakery; salon double doors; laundry grille.
    if (i === 0) {
      w.box(facade, "#736550", [0, 1.15, face], [2.9, 2.15, 0.05]);
      for (let row = 0; row < 3; row++) {
        w.box(
          facade,
          "#ba996e",
          [0, 0.43 + row * 0.55, face + 0.17],
          [2.85, 0.05, 0.4],
        );
        for (let j = 0; j < 6; j++)
          w.box(
            facade,
            ["#c27862", "#cebd7f", "#90a98b"][j % 3],
            [-1.15 + j * 0.45, 0.61 + row * 0.55, face + 0.1],
            [0.27, 0.3, 0.15],
          );
      }
    } else if (i === 1) {
      w.box(facade, "#657a70", [0, 1.1, face], [2.8, 2.1, 0.07]);
      for (let j = 0; j < 13; j++)
        w.box(
          facade,
          "#91a195",
          [0, 0.15 + j * 0.17, face + 0.05],
          [2.75, 0.026, 0.035],
        );
      w.line(
        facade,
        "#454d49",
        [
          [-1.8, 0.2, face],
          [-1.8, 1.5, face],
        ],
        0.037,
      );
    } else if (i === 2) {
      w.box(facade, "#664e40", [0, 1.1, face], [3.15, 2.1, 0.07]);
      for (const x of [-0.91, 0.15, 1.19]) {
        w.box(facade, "#bccbd0", [x, 1.19, face + 0.06], [0.86, 1.69, 0.035]);
        w.line(
          facade,
          "#fff0d5",
          [
            [x - 0.32, 0.7, face + 0.09],
            [x + 0.19, 1.7, face + 0.09],
          ],
          0.009,
        );
      }
      w.box(facade, "#e4bb87", [-0.1, 0.65, face + 0.22], [2.8, 0.7, 0.48]);
      for (let j = 0; j < 6; j++)
        w.ball(
          facade,
          "#c99756",
          [-1.16 + j * 0.4, 1.05, face + 0.22],
          [0.15, 0.07, 0.075],
        );
    } else if (i === 3) {
      for (const x of [-0.62, 0.62]) {
        w.box(facade, "#77576d", [x, 1.2, face], [1.13, 2.3, 0.07]);
        w.box(facade, "#d5d0d7", [x, 1.46, face + 0.05], [0.88, 1.31, 0.045]);
        w.line(
          facade,
          "#ae9b8f",
          [
            [x - Math.sign(x) * 0.3, 0.85, face + 0.09],
            [x - Math.sign(x) * 0.3, 1.2, face + 0.09],
          ],
          0.016,
        );
      }
      const pole = w.cylinder(
        facade,
        "#ebdfd4",
        [1.65, 1.5, face + 0.25],
        0.09,
        0.8,
      );
      for (let j = 0; j < 6; j++)
        w.cylinder(
          pole,
          j % 2 ? "#8c5867" : "#778da9",
          [0, -0.34 + j * 0.13, 0],
          1.01,
          0.075,
        );
    } else {
      w.box(facade, "#657c7e", [0, 1.1, face], [2.7, 2.1, 0.05]);
      for (let j = 0; j < 9; j++)
        w.box(
          facade,
          "#a8bab8",
          [-1.18 + j * 0.3, 1.1, face + 0.06],
          [0.025, 2.1, 0.045],
        );
      w.line(
        facade,
        "#d3b3ba",
        [
          [-1.75, 2.2, face + 0.3],
          [1.75, 2.2, face + 0.3],
        ],
        0.014,
      );
      for (let j = 0; j < 4; j++)
        w.box(
          facade,
          ["#e9c6cc", "#cdd3bf", "#b5c4d0", "#dcbd9b"][j],
          [-1.17 + j * 0.7, 1.91, face + 0.3],
          [0.4, 0.5, 0.027],
        );
    }
    w.label(
      facade,
      [
        "TẠP HÓA CÔ BA",
        "SỬA XE • CHÚ TƯ",
        "BÁNH MÌ NÓNG",
        "CẮT TÓC",
        "GIẶT ỦI",
      ][i],
      [0, 2.55, face + 0.07],
      3.7,
      0.65,
      ["#92785b", "#577a6b", "#ad784d", "#976f8a", "#5b8390"][i],
      "#fff0de",
      60,
    );
    for (const x of [-1.1, 1.1]) {
      w.box(facade, "#637b72", [x, 4.12, face], [0.87, 1.1, 0.09]);
      if (i % 2)
        for (let j = 0; j < 6; j++)
          w.box(
            facade,
            "#9cac9b",
            [x, 3.69 + j * 0.16, face + 0.06],
            [0.85, 0.04, 0.04],
          );
      else w.box(facade, "#ccd2c5", [x, 4.12, face + 0.06], [0.045, 1.1, 0.04]);
    }
    w.box(facade, "#827361", [0, 3.15, face + 0.18], [3.7, 0.1, 0.46]);
    const aircon = w.box(
      facade,
      "#d7d2c7",
      [1.75, 3.45, face + 0.16],
      [0.48, 0.42, 0.23],
    );
    w.cylinder(aircon, "#828d87", [0, 0, 0.54], 0.24, 0.06).rotation.x =
      Math.PI / 2;
  }
}
