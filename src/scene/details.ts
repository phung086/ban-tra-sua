import {hanoiFrontage} from './hanoiFrontage';
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

export function streetFronts(w:Workshop,root:T.Group){return hanoiFrontage(w,root);}
