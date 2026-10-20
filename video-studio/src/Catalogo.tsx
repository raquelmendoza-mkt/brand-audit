import { Audio, Video } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  Easing,
  Img,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { poppins } from "./fonts";

// "Si fuera asesor inmobiliario…" — video hablado con subtítulos ya incluidos.
// Se le añaden íconos y tarjetas animadas que aparecen con palabras clave
// (franja superior y columna derecha, lejos de la cara y de los subtítulos),
// zooms suaves en cada paso y efectos de sonido sincronizados.

const FPS = 30;
const DURATION = 46.86;
const PURPLE = "#7B3FF2";
const RED = "#FF3B5C";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.bezier(0.16, 1, 0.3, 1);
const s = (sec: number) => Math.round(sec * FPS);

// ---------- Íconos (vector, sin emojis) ----------
const Icon: React.FC<{
  readonly name: string;
  readonly size: number;
  readonly color?: string;
}> = ({ name, size, color = PURPLE }) => {
  const p = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "casa":
      return (
        <svg {...p}>
          <path d="M3 11l9-7 9 7" />
          <path d="M5 10v10h14V10" />
          <path d="M10 20v-6h4v6" />
        </svg>
      );
    case "camara":
      return (
        <svg {...p}>
          <rect x="2" y="6" width="15" height="12" rx="3" />
          <path d="M17 10l5-3v10l-5-3z" />
        </svg>
      );
    case "persona":
      return (
        <svg {...p}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
        </svg>
      );
    case "corazon":
      return (
        <svg {...p} fill={color} stroke="none">
          <path d="M12 21s-7.5-4.6-9.5-9.2C1 8.4 3.2 5 6.6 5c2 0 3.6 1.1 5.4 3 1.8-1.9 3.4-3 5.4-3 3.4 0 5.6 3.4 4.1 6.8C19.5 16.4 12 21 12 21z" />
        </svg>
      );
    case "alerta":
      return (
        <svg {...p}>
          <path d="M12 3l10 18H2z" />
          <path d="M12 10v5" />
          <circle cx="12" cy="18" r="0.6" fill={color} />
        </svg>
      );
    case "documento":
      return (
        <svg {...p}>
          <path d="M6 2h9l5 5v15H6z" />
          <path d="M15 2v5h5" />
          <path d="M9 13h8M9 17h6" />
        </svg>
      );
    case "pin":
      return (
        <svg {...p}>
          <path d="M12 22s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      );
    case "precio":
      return (
        <svg {...p}>
          <path d="M3 12V3h9l9 9-9 9z" />
          <circle cx="7.5" cy="7.5" r="1.5" />
        </svg>
      );
    case "chat":
      return (
        <svg {...p}>
          <path d="M4 5h16v11H9l-5 4z" />
          <path d="M8 10h8" />
        </svg>
      );
    case "gema":
      return (
        <svg {...p}>
          <path d="M6 3h12l4 6-10 12L2 9z" />
          <path d="M2 9h20M9 3l3 18 3-18" />
        </svg>
      );
    case "grafica":
      return (
        <svg {...p}>
          <path d="M3 20h18" />
          <path d="M4 16l5-5 4 3 7-8" />
          <path d="M15 6h5v5" />
        </svg>
      );
    case "guardar":
      return (
        <svg {...p}>
          <path d="M6 3h12v18l-6-4-6 4z" />
        </svg>
      );
    case "check":
      return (
        <svg {...p} strokeWidth={3}>
          <path d="M5 12.5l4.5 4.5L19 7" />
        </svg>
      );
    case "x":
      return (
        <svg {...p} strokeWidth={3.2}>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      );
    default:
      return null;
  }
};

// Íconos de redes simplificados (formas propias, no logos oficiales)
const Social: React.FC<{
  readonly kind: "ig" | "tt" | "fb";
  readonly size: number;
}> = ({ kind, size }) => {
  if (kind === "ig")
    return (
      <svg width={size} height={size} viewBox="0 0 24 24">
        <defs>
          <linearGradient id="igg" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#FEC053" />
            <stop offset="0.5" stopColor="#F2203E" />
            <stop offset="1" stopColor="#5258CF" />
          </linearGradient>
        </defs>
        <rect x="1" y="1" width="22" height="22" rx="6.5" fill="url(#igg)" />
        <rect
          x="6"
          y="6"
          width="12"
          height="12"
          rx="4"
          fill="none"
          stroke="#FFF"
          strokeWidth="2"
        />
        <circle
          cx="12"
          cy="12"
          r="3"
          fill="none"
          stroke="#FFF"
          strokeWidth="2"
        />
        <circle cx="17.3" cy="6.7" r="1" fill="#FFF" />
      </svg>
    );
  if (kind === "tt")
    return (
      <svg width={size} height={size} viewBox="0 0 24 24">
        <rect x="1" y="1" width="22" height="22" rx="6.5" fill="#111" />
        <path
          d="M13.5 5v9.3a2.8 2.8 0 11-2.8-2.8"
          fill="none"
          stroke="#25F4EE"
          strokeWidth="2.2"
          transform="translate(-0.6 0.4)"
        />
        <path
          d="M13.5 5v9.3a2.8 2.8 0 11-2.8-2.8M13.5 5c.4 2 1.8 3.4 3.8 3.6"
          fill="none"
          stroke="#FFF"
          strokeWidth="2.2"
        />
      </svg>
    );
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <rect x="1" y="1" width="22" height="22" rx="6.5" fill="#1877F2" />
      <path
        d="M13.2 20v-6.5h2.3l.4-2.7h-2.7V9.2c0-.8.3-1.3 1.4-1.3h1.4V5.5c-.3 0-1.1-.1-2.1-.1-2.1 0-3.4 1.2-3.4 3.5v1.9H8.2v2.7h2.3V20z"
        fill="#FFF"
      />
    </svg>
  );
};

// ---------- Animación base: aparece con resorte y se va con fundido ----------
const usePop = (from: number, to: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inP = spring({
    frame: frame - from,
    fps,
    config: { damping: 13, stiffness: 160 },
  });
  const out = interpolate(frame, [to - 6, to], [1, 0], clamp);
  return { visible: frame >= from && frame < to, inP, out, frame };
};

const Card: React.FC<{
  readonly children: React.ReactNode;
  readonly style?: React.CSSProperties;
}> = ({ children, style }) => (
  <div
    style={{
      background: "rgba(255,255,255,0.94)",
      borderRadius: 30,
      boxShadow: "0 18px 50px rgba(40,0,90,0.35), 0 2px 6px rgba(0,0,0,0.15)",
      padding: "18px 28px",
      display: "flex",
      alignItems: "center",
      gap: 16,
      fontFamily: poppins,
      fontWeight: 700,
      color: "#1B1030",
      ...style,
    }}
  >
    {children}
  </div>
);

// Tarjeta centrada en la franja superior
const TopCard: React.FC<{
  readonly from: number;
  readonly to: number;
  readonly top?: number;
  readonly children: React.ReactNode;
  readonly shake?: boolean;
}> = ({ from, to, top = 180, children, shake }) => {
  const { visible, inP, out, frame } = usePop(from, to);
  if (!visible) return null;
  const sh = shake
    ? Math.sin((frame - from) * 1.9) *
      interpolate(frame - from, [0, 14], [10, 0], clamp)
    : 0;
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: top }}>
      <div
        style={{
          opacity: Math.min(inP * 1.5, 1) * out,
          scale: String(0.6 + 0.4 * inP),
          translate: `${sh}px ${(1 - inP) * -40}px`,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

// ---------- Elementos concretos ----------
const StepChip: React.FC<{
  readonly n: number;
  readonly from: number;
  readonly to: number;
}> = ({ n, from, to }) => {
  const { visible, inP, out } = usePop(from, to);
  if (!visible) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 48,
        top: 92,
        opacity: out,
        translate: `${(1 - inP) * -260}px 0px`,
      }}
    >
      <Card
        style={{
          padding: "12px 24px",
          background: PURPLE,
          color: "#FFF",
          gap: 14,
        }}
      >
        <span style={{ fontSize: 34, letterSpacing: 2 }}>PASO {n}</span>
        <span style={{ display: "flex", gap: 7 }}>
          {[1, 2, 3].map((k) => (
            <span
              key={k}
              style={{
                width: 13,
                height: 13,
                borderRadius: 7,
                background: k <= n ? "#FFF" : "rgba(255,255,255,0.35)",
              }}
            />
          ))}
        </span>
      </Card>
    </div>
  );
};

const GRID = ["f01", "f02", "f05", "f04", "f07", "f09", "f06", "f08", "f10"];

// Perfil "catálogo": celular con una cuadrícula llena de fotos de propiedades
const CatalogPhone: React.FC<{
  readonly from: number;
  readonly to: number;
  readonly crossAt: number;
}> = ({ from, to, crossAt }) => {
  const { visible, inP, out, frame } = usePop(from, to);
  const { fps } = useVideoConfig();
  if (!visible) return null;
  const cross = spring({
    frame: frame - crossAt,
    fps,
    config: { damping: 9, stiffness: 180 },
  });
  return (
    <div
      style={{
        position: "absolute",
        left: 762,
        top: 340,
        width: 296,
        opacity: out,
        translate: `${(1 - inP) * 360}px 0px`,
        rotate: `${(1 - inP) * 8 + 3}deg`,
      }}
    >
      <div
        style={{
          background: "#FFF",
          borderRadius: 34,
          padding: "16px 10px 12px",
          boxShadow: "0 22px 60px rgba(40,0,90,0.45)",
          border: "5px solid #111",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "0 6px 10px",
            fontFamily: poppins,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              background: "linear-gradient(135deg,#FEC053,#F2203E,#5258CF)",
              padding: 3,
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 20,
                background: "#DDD",
                border: "2px solid #FFF",
              }}
            />
          </div>
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontWeight: 700, fontSize: 17, color: "#111" }}>
              @asesor.ventas
            </div>
            <div style={{ fontSize: 14, color: "#777" }}>96 publicaciones</div>
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 3,
          }}
        >
          {GRID.map((g, i) => (
            <Img
              key={g}
              src={staticFile(`work/bosque/${g}.jpg`)}
              style={{
                width: "100%",
                aspectRatio: "1",
                objectFit: "cover",
                opacity: interpolate(
                  frame,
                  [from + 6 + i * 2, from + 10 + i * 2],
                  [0, 1],
                  clamp,
                ),
              }}
            />
          ))}
        </div>
      </div>
      {frame >= crossAt ? (
        <>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              scale: String(0.3 + 0.7 * cross),
              opacity: Math.min(cross * 2, 1),
            }}
          >
            <div
              style={{
                width: 170,
                height: 170,
                borderRadius: 85,
                background: RED,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 10px 40px rgba(255,59,92,0.6)",
              }}
            >
              <Icon name="x" size={110} color="#FFF" />
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: -48,
              display: "flex",
              justifyContent: "center",
              opacity: Math.min(cross * 2, 1),
            }}
          >
            <Card
              style={{
                background: RED,
                color: "#FFF",
                padding: "10px 20px",
                fontSize: 24,
                letterSpacing: 1,
                whiteSpace: "nowrap",
              }}
            >
              PERFIL CATÁLOGO
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
};

const Checklist: React.FC<{
  readonly from: number;
  readonly to: number;
  readonly items: { at: number; icon: string; label: string }[];
}> = ({ from, to, items }) => {
  const { visible, inP, out, frame } = usePop(from, to);
  const { fps } = useVideoConfig();
  if (!visible) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 776,
        top: 400,
        width: 286,
        opacity: out,
        translate: `${(1 - inP) * 340}px 0px`,
      }}
    >
      <Card
        style={{
          flexDirection: "column",
          alignItems: "stretch",
          gap: 14,
          padding: "20px 20px",
        }}
      >
        <div style={{ fontSize: 22, color: PURPLE, letterSpacing: 2 }}>
          CONTENIDO DE VALOR
        </div>
        {items.map((it) => {
          const p = spring({
            frame: frame - s(it.at),
            fps,
            config: { damping: 12, stiffness: 170 },
          });
          const on = frame >= s(it.at);
          return (
            <div
              key={it.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                opacity: on ? 1 : 0.28,
                scale: String(on ? 0.85 + 0.15 * p : 0.95),
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  background: on ? PURPLE : "#E6E0F5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon
                  name={on ? "check" : it.icon}
                  size={30}
                  color={on ? "#FFF" : PURPLE}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 27,
                  whiteSpace: "nowrap",
                }}
              >
                {it.label}
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
};

const GrowthCard: React.FC<{ readonly from: number; readonly to: number }> = ({
  from,
  to,
}) => {
  const { visible, inP, out, frame } = usePop(from, to);
  if (!visible) return null;
  const draw = interpolate(frame, [from + 4, from + 26], [0, 1], {
    ...clamp,
    easing: ease,
  });
  return (
    <div
      style={{
        position: "absolute",
        left: 790,
        top: 420,
        width: 262,
        opacity: out,
        translate: `${(1 - inP) * 340}px 0px`,
      }}
    >
      <Card
        style={{
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 6,
          padding: "18px 20px",
        }}
      >
        <div style={{ fontSize: 22, color: PURPLE, letterSpacing: 2 }}>
          ALCANCE
        </div>
        <svg width="222" height="130" viewBox="0 0 222 130">
          <path
            d="M8 118 L60 92 L104 100 L150 58 L210 14"
            fill="none"
            stroke="#E6E0F5"
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 118 L60 92 L104 100 L150 58 L210 14"
            fill="none"
            stroke={PURPLE}
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="300"
            strokeDashoffset={300 * (1 - draw)}
          />
          <circle cx="210" cy="14" r={9 * draw} fill={PURPLE} />
        </svg>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 30,
          }}
        >
          <Icon name="persona" size={30} />
          Más personas
        </div>
      </Card>
    </div>
  );
};

const FollowButton: React.FC<{
  readonly from: number;
  readonly to: number;
  readonly pressAt: number;
}> = ({ from, to, pressAt }) => {
  const { visible, inP, out, frame } = usePop(from, to);
  const { fps } = useVideoConfig();
  if (!visible) return null;
  const pressed = frame >= pressAt;
  const press = spring({
    frame: frame - pressAt,
    fps,
    config: { damping: 10, stiffness: 220 },
  });
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 200 }}>
      <div
        style={{
          display: "flex",
          gap: 18,
          opacity: out,
          scale: String(0.6 + 0.4 * inP),
        }}
      >
        <Card style={{ padding: "16px 22px" }}>
          <Icon name="guardar" size={46} color={PURPLE} />
        </Card>
        <div
          style={{
            fontFamily: poppins,
            fontWeight: 700,
            fontSize: 40,
            padding: "18px 44px",
            borderRadius: 22,
            color: pressed ? "#1B1030" : "#FFF",
            background: pressed ? "#FFF" : PURPLE,
            boxShadow: "0 18px 50px rgba(40,0,90,0.35)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            scale: String(pressed ? 0.92 + 0.08 * press : 1),
          }}
        >
          {pressed ? <Icon name="check" size={36} color={PURPLE} /> : null}
          {pressed ? "Siguiendo" : "Seguir"}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Zoom suave al inicio de cada paso y en el momento fuerte ("nunca")
const PUNCHES: [number, number][] = [
  [4.54, 1.05],
  [11.58, 1.05],
  [19.98, 1.08],
  [22.78, 1.05],
  [34.78, 1.04],
];
const usePunch = () => {
  const frame = useCurrentFrame();
  let sc = 1;
  for (const [t, amt] of PUNCHES) {
    const f0 = s(t);
    if (frame >= f0 && frame < f0 + 50) {
      sc = interpolate(frame, [f0, f0 + 6, f0 + 50], [1, amt, 1], {
        ...clamp,
        easing: Easing.bezier(0.33, 0, 0.2, 1),
      });
    }
  }
  return sc;
};

type Fx = { at: number; src: string; vol: number };
const SFX: Fx[] = [
  { at: 0.3, src: "sfx/pop.wav", vol: 0.35 },
  { at: 3.12, src: "sfx/pop.wav", vol: 0.28 },
  { at: 3.27, src: "sfx/pop.wav", vol: 0.28 },
  { at: 3.42, src: "sfx/pop.wav", vol: 0.28 },
  { at: 4.42, src: "sfx/whoosh-corto.wav", vol: 0.32 },
  { at: 4.54, src: "sfx/impacto.wav", vol: 0.22 },
  { at: 5.2, src: "sfx/swipe.wav", vol: 0.35 },
  { at: 7.12, src: "sfx/error.wav", vol: 0.32 },
  { at: 11.46, src: "sfx/whoosh-corto.wav", vol: 0.32 },
  { at: 11.58, src: "sfx/impacto.wav", vol: 0.22 },
  { at: 13.94, src: "sfx/remotion/shutter-modern.wav", vol: 0.4 },
  { at: 14.85, src: "sfx/pop.wav", vol: 0.3 },
  { at: 15.98, src: "sfx/ding.wav", vol: 0.22 },
  { at: 16.62, src: "sfx/error.wav", vol: 0.3 },
  { at: 19.96, src: "sfx/impacto.wav", vol: 0.4 },
  { at: 22.66, src: "sfx/whoosh-corto.wav", vol: 0.32 },
  { at: 22.78, src: "sfx/impacto.wav", vol: 0.22 },
  { at: 25.4, src: "sfx/swipe.wav", vol: 0.32 },
  { at: 26.24, src: "sfx/remotion/mouse-click.wav", vol: 0.45 },
  { at: 28.9, src: "sfx/remotion/mouse-click.wav", vol: 0.45 },
  { at: 29.7, src: "sfx/remotion/mouse-click.wav", vol: 0.45 },
  { at: 30.48, src: "sfx/remotion/mouse-click.wav", vol: 0.45 },
  { at: 34.7, src: "sfx/sparkle.wav", vol: 0.3 },
  { at: 42.8, src: "sfx/whoosh.wav", vol: 0.3 },
  { at: 43.3, src: "sfx/ping.wav", vol: 0.22 },
  { at: 44.36, src: "sfx/remotion/mouse-click.wav", vol: 0.45 },
  { at: 45.08, src: "sfx/remotion/mouse-click.wav", vol: 0.45 },
  { at: 45.3, src: "sfx/ding.wav", vol: 0.22 },
];

export const CatalogoComponent: React.FC = () => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const scale = usePunch();
  const t = frame / fps;

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ scale: String(scale) }}>
        <Video
          src={staticFile("work/catalogo/video.mp4")}
          premountFor={fps}
          style={{ position: "absolute", width: "100%", height: "100%" }}
        />
      </AbsoluteFill>

      {/* Gancho: asesor inmobiliario + redes sociales */}
      <TopCard from={s(0.3)} to={s(2.95)}>
        <Card style={{ fontSize: 34 }}>
          <Icon name="casa" size={44} />
          ASESOR INMOBILIARIO
        </Card>
      </TopCard>
      <TopCard from={s(3.05)} to={s(4.4)}>
        <div style={{ display: "flex", gap: 22 }}>
          {(["ig", "tt", "fb"] as const).map((k, i) => (
            <div
              key={k}
              style={{
                opacity: interpolate(
                  t,
                  [3.1 + i * 0.15, 3.2 + i * 0.15],
                  [0, 1],
                  clamp,
                ),
                scale: String(
                  interpolate(t, [3.1 + i * 0.15, 3.3 + i * 0.15], [0.4, 1], {
                    ...clamp,
                    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
                  }),
                ),
              }}
            >
              <div
                style={{
                  borderRadius: 30,
                  boxShadow: "0 14px 40px rgba(40,0,90,0.4)",
                }}
              >
                <Social kind={k} size={112} />
              </div>
            </div>
          ))}
        </div>
      </TopCard>

      {/* Indicador de paso */}
      <StepChip n={1} from={s(4.54)} to={s(11.4)} />
      <StepChip n={2} from={s(11.58)} to={s(22.6)} />
      <StepChip n={3} from={s(22.78)} to={s(32.2)} />

      {/* Paso 1: el perfil catálogo */}
      <CatalogPhone from={s(5.25)} to={s(10.6)} crossAt={s(7.12)} />

      {/* Paso 2: detrás de cámara + conectar con personas */}
      <TopCard from={s(13.85)} to={s(14.8)}>
        <Card style={{ fontSize: 34 }}>
          <Icon name="camara" size={46} />
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: RED,
            }}
          >
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                background: RED,
                opacity: Math.floor(frame / 8) % 2 ? 0.3 : 1,
              }}
            />
            REC
          </span>
        </Card>
      </TopCard>
      <TopCard from={s(14.85)} to={s(16.5)}>
        <Card style={{ gap: 10, padding: "16px 26px" }}>
          <Icon name="persona" size={52} />
          <div
            style={{
              scale: String(
                interpolate(t, [15.98, 16.1, 16.3], [1, 1.35, 1], clamp),
              ),
            }}
          >
            <Icon name="corazon" size={44} color={RED} />
          </div>
          <Icon name="persona" size={52} />
        </Card>
      </TopCard>
      <CatalogPhone from={s(16.55)} to={s(18.5)} crossAt={s(16.62)} />
      <TopCard from={s(19.96)} to={s(21.7)} shake>
        <Card style={{ background: RED, color: "#FFF", fontSize: 36, gap: 12 }}>
          <Icon name="alerta" size={46} color="#FFF" />
          NUNCA
        </Card>
      </TopCard>

      {/* Paso 3: contenido de valor para el comprador */}
      <Checklist
        from={s(25.4)}
        to={s(32.0)}
        items={[
          { at: 26.24, icon: "documento", label: "Documentos" },
          { at: 28.9, icon: "pin", label: "Zonas" },
          { at: 29.7, icon: "precio", label: "Precios" },
          { at: 30.48, icon: "chat", label: "Asesoría" },
        ]}
      />
      <TopCard from={s(34.7)} to={s(36.6)}>
        <Card style={{ fontSize: 34 }}>
          <div
            style={{
              rotate: `${interpolate(t, [34.7, 35.3], [-20, 0], clamp)}deg`,
            }}
          >
            <Icon name="gema" size={46} />
          </div>
          VALIOSO
        </Card>
      </TopCard>

      {/* Cierre */}
      <GrowthCard from={s(42.85)} to={s(44.3)} />
      <FollowButton from={s(44.3)} to={s(DURATION)} pressAt={s(45.08)} />

      {SFX.map((x) => (
        <Sequence
          key={`${x.src}-${x.at}`}
          from={s(x.at)}
          durationInFrames={s(2)}
          name={x.src}
        >
          <Audio src={staticFile(x.src)} volume={x.vol} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export const CatalogoComposition: React.FC = () => {
  return (
    <Composition
      id="PerfilCatalogo"
      component={CatalogoComponent}
      durationInFrames={s(DURATION)}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
