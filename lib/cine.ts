export type Cine = {
  camera: string; lens: number; fstop: number; iso: number; time: string; move?: string;
};
export const cineToTokens = (c: Cine) =>
  [
    `shot on ${c.camera}` ,
    `${c.lens}mm prime` ,
    c.fstop <= 1.8 ? "extremely shallow depth of field, prominent bokeh" : "moderate depth of field",
    `${c.time} lighting` ,
    c.move ? `${c.move} camera`  : "",
    `ISO ${c.iso}` ,
    "cinematic film grain", "high dynamic range",
  ].filter(Boolean).join(", ");
