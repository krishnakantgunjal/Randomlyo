/**
 * Geometry for the Dice Roller's 3D cube.
 *
 * The cube is assembled from six absolutely-positioned faces inside a
 * `transform-style: preserve-3d` container. `FACE_LAYOUT` is the transform that
 * builds each face onto the cube; `FACE_REST_ROTATION` is the opposite
 * operation — the cube rotation that turns a given face toward the viewer.
 *
 * Landing correctness rests on one property: adding a multiple of 360° to any
 * axis of a rotation leaves the resulting orientation unchanged. That is what
 * lets a roll tumble through several full turns on three axes, look chaotic,
 * and still stop exactly on the face the random result asked for. Because the
 * extra turns are always whole revolutions, the resting orientation is a pure
 * function of `FACE_REST_ROTATION` — never of the animation.
 *
 * This module is deliberately DOM-free so the geometry can be tested directly
 * (see the roll-verification script that exercises `facingFace`). Everything
 * here is plain erasable TypeScript.
 */

export type DieFace = 1 | 2 | 3 | 4 | 5 | 6;

/** How many dice the 3D stage can show at once. */
export const MAX_DICE = 6;

export const DIE_FACES: readonly DieFace[] = [1, 2, 3, 4, 5, 6];

export const CUBE_SIDES = 6;

/**
 * Outward normal of each face in the cube's local space, using CSS axes
 * (+x right, +y down, +z toward the viewer). Opposite faces sum to 7, so the
 * six normals are the three axis pairs.
 */
export const FACE_NORMALS: Record<DieFace, readonly [number, number, number]> = {
  1: [0, 0, 1],
  2: [0, -1, 0],
  3: [1, 0, 0],
  4: [-1, 0, 0],
  5: [0, 1, 0],
  6: [0, 0, -1],
};

/**
 * Assembles face `n` onto the cube surface. `--die-half` is half the die's edge
 * length, so every face starts centred on the container and is pushed out along
 * its own normal to form the shell.
 */
export const FACE_LAYOUT: Record<DieFace, string> = {
  1: 'translateZ(var(--die-half))',
  2: 'rotateX(90deg) translateZ(var(--die-half))',
  3: 'rotateY(90deg) translateZ(var(--die-half))',
  4: 'rotateY(-90deg) translateZ(var(--die-half))',
  5: 'rotateX(-90deg) translateZ(var(--die-half))',
  6: 'rotateY(180deg) translateZ(var(--die-half))',
};

/**
 * Cube rotation, in degrees, that brings face `n` to the front. Each entry is a
 * rotation about a single axis, which keeps the mapping trivially invertible.
 * Z is left at zero here so the tumble can use it freely.
 */
export const FACE_REST_ROTATION: Record<DieFace, { x: number; y: number }> = {
  1: { x: 0, y: 0 },
  2: { x: -90, y: 0 },
  3: { x: 0, y: -90 },
  4: { x: 0, y: 90 },
  5: { x: 90, y: 0 },
  6: { x: 0, y: 180 },
};

/**
 * Which of the 9 cells of a 3x3 grid carry a pip, per face. Cells are numbered
 * row-major from the top-left (1) to the bottom-right (9).
 */
export const PIP_LAYOUT: Record<DieFace, readonly number[]> = {
  1: [5],
  2: [1, 9],
  3: [1, 5, 9],
  4: [1, 3, 7, 9],
  5: [1, 3, 5, 7, 9],
  6: [1, 3, 4, 6, 7, 9],
};

export interface Spin {
  x: number;
  y: number;
  z: number;
}

export interface TurnCounts {
  x: number;
  y: number;
  z: number;
}

/** Grid row (1-3) for a pip cell. */
export function pipRow(cell: number): number {
  return Math.floor((cell - 1) / 3) + 1;
}

/** Grid column (1-3) for a pip cell. */
export function pipColumn(cell: number): number {
  return ((cell - 1) % 3) + 1;
}

export function formatTransform(spin: Spin): string {
  return `rotateX(${spin.x}deg) rotateY(${spin.y}deg) rotateZ(${spin.z}deg)`;
}

/**
 * Smallest angle at or beyond `current + 360 * turns` that is congruent to
 * `base` modulo 360.
 *
 * The modulus is what makes the landing deterministic: rotating the cube to
 * `base` shows face `n`, and rotating it to `base + 360k` shows the same face
 * from the same orientation. Anchoring on the next multiple past `current`
 * keeps every roll spinning forwards rather than unwinding to zero.
 */
function advanceAngle(current: number, base: number, turns: number): number {
  const normalized = ((base % 360) + 360) % 360;
  let next = Math.floor(current / 360) * 360 + normalized;
  while (next < current + 360 * turns) next += 360;
  return next;
}

/**
 * Absolute cube angles that land on `face`, having spun at least `turns` full
 * revolutions past `current` on each axis.
 */
export function spinToFace(face: DieFace, current: Spin, turns: TurnCounts): Spin {
  const rest = FACE_REST_ROTATION[face];
  return {
    x: advanceAngle(current.x, rest.x, turns.x),
    y: advanceAngle(current.y, rest.y, turns.y),
    z: advanceAngle(current.z, 0, turns.z),
  };
}

type Matrix3 = number[][];

const DEG = Math.PI / 180;

/**
 * Rotation matrix for a spin, composed as `Rx * Ry * Rz` to match the order
 * CSS applies `rotateX() rotateY() rotateZ()`.
 */
export function rotationMatrix(spin: Spin): Matrix3 {
  const cx = Math.cos(spin.x * DEG);
  const sx = Math.sin(spin.x * DEG);
  const cy = Math.cos(spin.y * DEG);
  const sy = Math.sin(spin.y * DEG);
  const cz = Math.cos(spin.z * DEG);
  const sz = Math.sin(spin.z * DEG);

  return [
    [cy * cz, -cy * sz, sy],
    [cx * sz + sx * sy * cz, cx * cz - sx * sy * sz, -sx * cy],
    [sx * sz - cx * sy * cz, sx * cz + cx * sy * sz, cx * cy],
  ];
}

function multiply(matrix: Matrix3, vector: readonly [number, number, number]): [number, number, number] {
  return [
    matrix[0][0] * vector[0] + matrix[0][1] * vector[1] + matrix[0][2] * vector[2],
    matrix[1][0] * vector[0] + matrix[1][1] * vector[1] + matrix[1][2] * vector[2],
    matrix[2][0] * vector[0] + matrix[2][1] * vector[1] + matrix[2][2] * vector[2],
  ];
}

/** Depth of each face along the viewing axis for a given spin. */
export function faceDepths(spin: Spin): Record<DieFace, number> {
  const matrix = rotationMatrix(spin);
  const depths = {} as Record<DieFace, number>;
  for (const face of DIE_FACES) {
    depths[face] = multiply(matrix, FACE_NORMALS[face])[2];
  }
  return depths;
}

/**
 * The face pointing at the viewer for a given cube rotation — the value a
 * player reads off the die. Callers that need to prove *only* that face is
 * front-facing should inspect `faceDepths` instead.
 */
export function facingFace(spin: Spin): DieFace {
  const depths = faceDepths(spin);
  let best: DieFace = 1;
  for (const face of DIE_FACES) {
    if (depths[face] > depths[best]) best = face;
  }
  return best;
}

/** Parse a `rotateX(..) rotateY(..) rotateZ(..)` transform back into angles. */
export function parseTransform(transform: string): Spin {
  const read = (axis: 'X' | 'Y' | 'Z'): number => {
    const match = transform.match(new RegExp(`rotate${axis}\\((-?[0-9.]+)deg\\)`));
    return match ? parseFloat(match[1]) : 0;
  };
  return { x: read('X'), y: read('Y'), z: read('Z') };
}
