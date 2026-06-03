/**
 * Figma BG Elements (1:66) in Stem Player (1:58).
 * Bounding boxes from MCP metadata; transforms + glyph boxes from design export.
 * Fills: Color/star-pink-* and Color/star-green-* (Star Pink / Star Green gradients).
 */
export const BG_ELEMENTS_FRAME = {
  left: 0,
  top: -79,
  width: 1950.6673583984375,
  height: 1207.1031494140625,
} as const;

/** Figma ALL-STAR size on “Background text” layers */
export const BG_DECOR_FONT_SIZE = 700;

export type BgDecorStarColor = "pink" | "green";

export type BgDecorStar = {
  nodeId: string;
  character: string;
  /** Bounding box in BG Elements (1:66) space */
  left: number;
  top: number;
  width: number;
  height: number;
  color: BgDecorStarColor;
  /** Inner transform wrapper (Figma export) */
  transform?: string;
  /** Text box inside transform (Figma export, px) */
  glyphWidth: number;
  glyphHeight: number;
};

/**
 * Paint order = Figma layer order (1:67 bottom → 1:73 top).
 * Colors matched to Mock-up 2 composition (see reference frame 1:58).
 */
export const BG_DECOR_STARS: readonly BgDecorStar[] = [
  {
    nodeId: "1:67",
    character: "?",
    left: 1253.1580818722477,
    top: 918.2625732421875,
    width: 554.158084458576,
    height: 447.1032127734743,
    color: "green",
    transform: "rotate(-108.4deg) skewX(5.42deg) scaleY(-1)",
    glyphWidth: 250.045,
    glyphHeight: 519.5,
  },
  {
    nodeId: "1:68",
    character: "!",
    left: 666.0000008175602,
    top: 196.24325561523438,
    width: 522.2844123094171,
    height: 231.57412097109045,
    color: "pink",
    transform: "rotate(-83.07deg) skewX(-2.24deg)",
    glyphWidth: 151.349,
    glyphHeight: 510.54,
  },
  {
    nodeId: "1:69",
    character: "!",
    left: 1425.0000008175602,
    top: 938.4527587890625,
    width: 525.6673420516854,
    height: 299.47226617039814,
    color: "pink",
    transform: "rotate(-76.8deg) skewX(-4.09deg)",
    glyphWidth: 150.43,
    glyphHeight: 514.582,
  },
  {
    nodeId: "1:70",
    character: "?",
    left: 1652.8416756222477,
    top: 181.49322509765625,
    width: 220.54049682617188,
    height: 586.3626708984375,
    color: "green",
    glyphWidth: 220.54,
    glyphHeight: 586.363,
  },
  {
    nodeId: "1:71",
    character: "?",
    left: 114.55747304656416,
    top: -79,
    width: 281.4256060197531,
    height: 613.1483361592875,
    color: "green",
    transform: "rotate(8.12deg) skewX(1.99deg)",
    glyphWidth: 221.085,
    glyphHeight: 585.269,
  },
  {
    nodeId: "1:72",
    character: "?",
    left: 1024.2687996456852,
    top: 510.7574462890625,
    width: 553.2688367540686,
    height: 496.1372760392951,
    color: "pink",
    transform: "rotate(114.32deg) scaleY(0.99) skewX(-6.64deg)",
    glyphWidth: 247.319,
    glyphHeight: 526.404,
  },
  {
    nodeId: "1:73",
    character: "?",
    left: 33.506745202325874,
    top: 753,
    width: 536.5382024599339,
    height: 340.2269434397622,
    color: "pink",
    transform: "rotate(97.6deg) skewX(-2.44deg) scaleY(-1)",
    glyphWidth: 253.366,
    glyphHeight: 510.859,
  },
] as const;
