const phonemeToViseme = {
  // AEI group
  AE: "AEI", AH: "AEI", AY: "AEI", EH: "AEI", EY: "AEI",

  // Ee
  IY: "Ee",

  // O / rounded
  AO: "O", OW: "O",

  // U
  UW: "U", UH: "U",

  // W, Q, Oo
  W: "QWOO", Q: "QWOO",

  // R
  R: "R", ER: "R",

  // L
  L: "L",

  // M, B, P
  M: "BMP", B: "BMP", P: "BMP",

  // F, V
  F: "FV", V: "FV",

  // TH sounds
  TH: "TH", DH: "TH",

  // Ch, J, Sh
  CH: "ChSh", JH: "ChSh", SH: "ChSh",

  // C, D, G, K, N, S, T, X, Y, Z
  C: "CDGKNSTXYZ", D: "CDGKNSTXYZ", G: "CDGKNSTXYZ", K: "CDGKNSTXYZ",
  N: "CDGKNSTXYZ", S: "CDGKNSTXYZ", T: "CDGKNSTXYZ", X: "CDGKNSTXYZ",
  Y: "CDGKNSTXYZ", Z: "CDGKNSTXYZ",

  // Default (fallback)
  "": "Neutral"
};

export default phonemeToViseme;
