import type { Dossier } from "./types";

// Hand-drawn share cards on <canvas> for crispness. Styled as a mini operative
// ID card: orange classification bar, code name, ID field cells, silhouette,
// one killer psychological line, TOP SECRET stamp. Device fonts (Arial Narrow /
// Courier New / Georgia) so it renders identically on iOS Safari and Android.

export type ShareFormat = "9:16" | "1:1";

const C = {
  paper: "#e9e2d0",
  paperDark: "#d7cbb0",
  ink: "#14120e",
  inkSoft: "#3a3327",
  signal: "#c25a24",
  teal: "#2c6e68",
  classified: "#a5312c",
  olive: "#6b6a4f",
};

const DIMS: Record<ShareFormat, { w: number; h: number }> = {
  "9:16": { w: 1080, h: 1920 },
  "1:1": { w: 1080, h: 1080 },
};

// Most screenshot-worthy line. Never a privacy-hazard noun — those don't leave
// the device. A psychological read or a typology take.
export function defaultExcerpt(d: Dossier): string {
  return (
    d.psychWeakness?.[0]?.claim?.trim() ||
    d.typology?.[0]?.take?.trim() ||
    d.misc?.[0]?.claim?.trim() ||
    ""
  );
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawSpaced(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number,
): number {
  let cx = x;
  for (const ch of text) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + spacing;
  }
  return cx - spacing;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawGrain(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.save();
  const count = Math.floor((w * h) / 1500);
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = `rgba(26,23,18,${Math.random() * 0.05})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
  ctx.restore();
}

function drawSilhouette(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  ctx.save();
  // hatch fill
  ctx.fillStyle = "rgba(20,18,14,0.06)";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "rgba(20,18,14,0.5)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.strokeStyle = "rgba(20,18,14,0.10)";
  ctx.lineWidth = 3;
  for (let d = -h; d < w; d += 16) {
    ctx.beginPath();
    ctx.moveTo(x + d, y);
    ctx.lineTo(x + d + h, y + h);
    ctx.stroke();
  }
  // silhouette head + shoulders
  ctx.fillStyle = "rgba(20,18,14,0.22)";
  const cx = x + w / 2;
  const hr = w * 0.16;
  ctx.beginPath();
  ctx.arc(cx, y + h * 0.4, hr, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + w * 0.2, y + h);
  ctx.quadraticCurveTo(cx, y + h * 0.55, x + w * 0.8, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.fillStyle = "rgba(20,18,14,0.5)";
  ctx.font = "700 20px 'Arial Narrow','Helvetica Neue',sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("NO VISUAL ON RECORD", x + w / 2, y + h - 14);
  ctx.restore();
}

function drawCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
): void {
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "rgba(20,18,14,0.5)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  ctx.textAlign = "left";
  ctx.fillStyle = C.teal;
  ctx.font = "700 20px 'Arial Narrow','Helvetica Neue',sans-serif";
  drawSpaced(ctx, label.toUpperCase(), x + 14, y + 30, 2);
  ctx.fillStyle = C.ink;
  ctx.font = "28px 'Courier New',monospace";
  const val =
    value.trim().toUpperCase() === "REDACTED" ? "░░░░" : value;
  // Truncate to fit
  let v = val;
  while (ctx.measureText(v).width > w - 28 && v.length > 4) {
    v = v.slice(0, -2);
  }
  if (v !== val) v = v.slice(0, -1) + "…";
  ctx.fillText(v, x + 14, y + h - 18);
  ctx.restore();
}

function drawStamp(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  text: string,
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((-9 * Math.PI) / 180);
  ctx.globalAlpha = 0.82;
  ctx.font = "700 46px 'Arial Narrow','Helvetica Neue',sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const spacing = 6;
  let tw = 0;
  for (const ch of text) tw += ctx.measureText(ch).width + spacing;
  tw -= spacing;
  const boxW = tw + 52;
  const boxH = 78;
  ctx.strokeStyle = C.classified;
  ctx.lineWidth = 5;
  roundRect(ctx, -boxW / 2, -boxH / 2, boxW, boxH, 6);
  ctx.stroke();
  ctx.fillStyle = C.classified;
  ctx.textAlign = "left";
  drawSpaced(ctx, text, -tw / 2, 2, spacing);
  ctx.restore();
}

export function renderShareCard(
  dossier: Dossier,
  format: ShareFormat,
  excerpt: string,
): Promise<Blob> {
  const { w, h } = DIMS[format];
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.reject(new Error("Canvas unsupported."));
  ctx.textBaseline = "alphabetic";

  // Background
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, C.paper);
  grad.addColorStop(1, C.paperDark);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  drawGrain(ctx, w, h);

  const M = 70;
  const contentW = w - M * 2;

  // Orange classification bar
  const barH = 78;
  ctx.fillStyle = C.signal;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(w, 0);
  ctx.lineTo(w - 22, barH);
  ctx.lineTo(0, barH);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#17130d";
  ctx.textAlign = "left";
  ctx.font = "700 30px 'Arial Narrow','Helvetica Neue',sans-serif";
  drawSpaced(ctx, "TOP SECRET · THE AGENCY", M, 51, 4);
  ctx.textAlign = "right";
  ctx.font = "700 22px 'Arial Narrow','Helvetica Neue',sans-serif";
  ctx.fillText("DO NOT COPY", w - M, 49);

  // Frame
  ctx.strokeStyle = "rgba(20,18,14,0.5)";
  ctx.lineWidth = 3;
  ctx.strokeRect(30, barH + 24, w - 60, h - barH - 54);

  let y = barH + 92;

  // Title
  ctx.textAlign = "left";
  ctx.fillStyle = C.ink;
  ctx.font = "700 34px 'Arial Narrow','Helvetica Neue',sans-serif";
  drawSpaced(ctx, "OPERATIVE PROFILE", M, y, 5);
  y += 20;
  ctx.strokeStyle = C.teal;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(M, y);
  ctx.lineTo(w - M, y);
  ctx.stroke();
  y += 46;

  // Code name
  ctx.fillStyle = C.teal;
  ctx.font = "700 22px 'Arial Narrow','Helvetica Neue',sans-serif";
  drawSpaced(ctx, "CODE NAME", M, y, 3);
  y += 44;
  ctx.fillStyle = C.ink;
  ctx.font = "700 64px 'Arial Narrow','Helvetica Neue',sans-serif";
  const codeLines = wrapText(ctx, dossier.codeName.toUpperCase(), contentW);
  for (const cl of codeLines) {
    drawSpaced(ctx, cl, M, y, 3);
    y += 66;
  }

  // Typology line — MBTI · Archetype (very shareable)
  const mbti = dossier.typology.find((t) => /person|myers|mbti/i.test(t.system))
    ?.value;
  const arch = dossier.typology.find((t) => /archetype/i.test(t.system))?.value;
  const typeLine = [mbti, arch].filter(Boolean).join("   ·   ").toUpperCase();
  if (typeLine) {
    ctx.fillStyle = C.teal;
    ctx.font = "700 26px 'Arial Narrow','Helvetica Neue',sans-serif";
    drawSpaced(ctx, typeLine, M, y, 2);
    y += 30;
  }
  y += 12;

  // ID block: silhouette + cells
  const b = dossier.basicInfo;
  const silW = 230;
  const silH = format === "9:16" ? 300 : 250;
  drawSilhouette(ctx, M, y, silW, silH);

  const cellsX = M + silW + 20;
  const cellsW = w - M - cellsX;
  const cellH = format === "9:16" ? 88 : 74;
  const gap = 14;
  const cellW = (cellsW - gap) / 2;
  const cells: [string, string][] = [
    ["Name", b.name.value],
    ["Born", b.birthday.value],
    ["Location", b.location.value],
    ["Occupation", b.occupation.value],
  ];
  cells.forEach(([label, val], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    drawCell(
      ctx,
      cellsX + col * (cellW + gap),
      y + row * (cellH + gap),
      cellW,
      cellH,
      label,
      val,
    );
  });
  // Threat level full-width cell under silhouette on 9:16
  y += silH + 24;

  // Psychological read excerpt
  ctx.fillStyle = C.teal;
  ctx.font = "700 24px 'Arial Narrow','Helvetica Neue',sans-serif";
  drawSpaced(ctx, "— PSYCHOLOGICAL READ —", M, y, 4);
  y += 44;

  ctx.fillStyle = C.ink;
  const bodySize = format === "9:16" ? 38 : 32;
  ctx.font = `${bodySize}px 'Courier New',monospace`;
  const clean = excerpt.replace(/\s+/g, " ").trim();
  const maxLines = format === "9:16" ? 11 : 6;
  let lines = wrapText(ctx, clean, contentW);
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    lines[lines.length - 1] =
      lines[lines.length - 1].replace(/[.,;:]*$/, "") + " …";
  }
  const lineH = bodySize * 1.5;
  for (const ln of lines) {
    ctx.fillText(ln, M, y);
    y += lineH;
  }

  // Stamp + footer
  drawStamp(ctx, w / 2, h - 230, "CLASSIFIED");
  ctx.textAlign = "center";
  ctx.fillStyle = C.inkSoft;
  ctx.font = "28px 'Courier New',monospace";
  ctx.fillText("dossier.app", w / 2, h - 132);
  ctx.fillStyle = C.olive;
  ctx.font = "22px 'Courier New',monospace";
  ctx.fillText("find out what AI thinks of you", w / 2, h - 98);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Export failed."))),
      "image/png",
    );
  });
}

// ---- Web Share API with graceful fallbacks ----

// Feature-probe rather than UA-sniff: Safari and Chrome disagree about
// which share targets accept files, and the probe is the only honest answer.
function canShareFiles(): boolean {
  return (
    typeof navigator !== "undefined" &&
    !!navigator.canShare &&
    (() => {
      try {
        const f = new File([new Blob()], "probe.png", { type: "image/png" });
        return navigator.canShare({ files: [f] });
      } catch {
        return false;
      }
    })()
  );
}

type ShareResult = "shared" | "downloaded" | "cancelled" | "failed";

export async function shareOrDownload(
  blob: Blob,
  codeName: string,
): Promise<ShareResult> {
  const filename = `dossier-${codeName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.png`;
  const file = new File([blob], filename, { type: "image/png" });

  if (canShareFiles()) {
    try {
      await navigator.share({
        files: [file],
        title: "My Dossier",
        text: `"${codeName}" — find out what AI thinks of you. dossier.app`,
      });
      return "shared";
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return "cancelled";
    }
  }

  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return "downloaded";
  } catch {
    return "failed";
  }
}
