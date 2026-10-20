import { Audio, Video } from "@remotion/media";
import {
  linearTiming,
  TransitionSeries,
  type TransitionPresentation,
} from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import {
  AbsoluteFill,
  Composition,
  Easing,
  Img,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  type CalculateMetadataFunction,
} from "remotion";
import { helvetica, poppins } from "./fonts";

// Roomtour inmobiliario vertical: cada escena es una foto con movimiento de
// cámara o un tramo de video, con su texto encima; transiciones con whoosh,
// música y cierre elegante en negro con el nombre del asesor.

type Motion =
  | "zoomIn"
  | "zoomOut"
  | "panLeft"
  | "panRight"
  | "tiltUp"
  | "tiltDown";

type SceneText = {
  readonly kicker?: string; // línea pequeña en Helvetica
  readonly title?: string; // línea grande en Poppins
  readonly sub?: string; // línea de apoyo en Helvetica
  readonly list?: string[]; // viñetas que aparecen una a una
  readonly big?: string; // palabra o cifra gigante (precio, palabra clave)
  readonly position: "arriba" | "centro" | "abajo";
};

type Scene = {
  readonly src: string; // ruta en public/
  readonly kind: "foto" | "video";
  readonly seconds: number;
  readonly motion: Motion;
  readonly trimStart?: number; // segundos, solo video
  readonly speed?: number; // solo video
  readonly label?: string; // etiqueta discreta (p. ej. "Ambientación virtual")
  readonly text?: SceneText;
};

export type RoomTourProps = {
  readonly scenes: Scene[];
  readonly transitionSeconds: number;
  readonly music: string | null;
  readonly musicVolume: number;
  readonly agentName: string;
  readonly agentCompany: string;
  readonly endSeconds: number;
  readonly accent: string;
};

const FPS = 30;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.bezier(0.16, 1, 0.3, 1);

const totalSeconds = (p: RoomTourProps) =>
  p.scenes.reduce((a, s) => a + s.seconds, 0) +
  p.endSeconds -
  p.scenes.length * p.transitionSeconds;

const calculateMetadata: CalculateMetadataFunction<RoomTourProps> = ({
  props,
}) => ({
  fps: FPS,
  durationInFrames: Math.round(totalSeconds(props) * FPS),
});

// Movimiento de cámara sobre cada toma
const useMotion = (motion: Motion) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const p = interpolate(frame, [0, durationInFrames], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.33, 0, 0.67, 1),
  });
  const m: Record<Motion, { scale: number; x: number; y: number }> = {
    zoomIn: { scale: 1.08 + 0.14 * p, x: 0, y: 0 },
    zoomOut: { scale: 1.22 - 0.14 * p, x: 0, y: 0 },
    panLeft: { scale: 1.2, x: 60 - 120 * p, y: 0 },
    panRight: { scale: 1.2, x: -60 + 120 * p, y: 0 },
    tiltUp: { scale: 1.2, x: 0, y: -80 + 160 * p },
    tiltDown: { scale: 1.2, x: 0, y: 80 - 160 * p },
  };
  return m[motion];
};

const Shot: React.FC<{ readonly scene: Scene }> = ({ scene }) => {
  const { fps } = useVideoConfig();
  const mv = useMotion(scene.motion);
  const style: React.CSSProperties = {
    position: "absolute",
    width: "100%",
    height: "100%",
    objectFit: "cover",
    scale: String(mv.scale),
    translate: `${mv.x}px ${mv.y}px`,
    // Etalonaje suave: más contraste y calidez, aspecto de foto profesional
    filter: "contrast(1.06) saturate(1.08) brightness(1.03)",
  };
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      {scene.kind === "foto" ? (
        <Img src={staticFile(scene.src)} style={style} />
      ) : (
        <Video
          src={staticFile(scene.src)}
          trimBefore={Math.round((scene.trimStart ?? 0) * fps)}
          playbackRate={scene.speed ?? 1}
          muted
          objectFit="cover"
          style={style}
        />
      )}
    </AbsoluteFill>
  );
};

const enter = (frame: number, at: number) => ({
  opacity: interpolate(frame, [at, at + 8], [0, 1], clamp),
  translate: interpolate(frame, [at, at + 14], ["0px 36px", "0px 0px"], {
    ...clamp,
    easing: ease,
  }),
  filter: `blur(${interpolate(frame, [at, at + 9], [8, 0], clamp)}px)`,
});

const SceneTextLayer: React.FC<{
  readonly text: SceneText;
  readonly accent: string;
}> = ({ text, accent }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t0 = 8;
  const out = interpolate(
    frame,
    [durationInFrames - 10, durationInFrames - 3],
    [1, 0],
    clamp,
  );
  const just =
    text.position === "arriba"
      ? "flex-start"
      : text.position === "centro"
        ? "center"
        : "flex-end";
  const pad =
    text.position === "arriba"
      ? "250px 80px 0"
      : text.position === "centro"
        ? "0 80px"
        : "0 80px 420px";
  const shadow = "0 4px 24px rgba(0,0,0,0.55), 0 1px 4px rgba(0,0,0,0.45)";
  const gradient =
    text.position === "arriba"
      ? "linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.25) 30%, rgba(0,0,0,0) 50%)"
      : text.position === "abajo"
        ? "linear-gradient(0deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.3) 32%, rgba(0,0,0,0) 52%)"
        : "radial-gradient(ellipse at center, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0) 75%)";
  let step = 0;
  const next = () => t0 + 6 * step++;
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <AbsoluteFill
        style={{
          background: gradient,
          opacity: interpolate(frame, [0, 10], [0, 1], clamp),
        }}
      />
      <AbsoluteFill
        style={{
          justifyContent: just,
          alignItems: "center",
          padding: pad,
          textAlign: "center",
          textShadow: shadow,
          color: "#FFF",
        }}
      >
        {text.kicker ? (
          <div
            style={{
              ...enter(frame, next()),
              fontFamily: helvetica,
              fontSize: 44,
              letterSpacing: 7,
              textTransform: "uppercase",
            }}
          >
            {text.kicker}
          </div>
        ) : null}
        {text.kicker && (text.title || text.big) ? (
          <div
            style={{
              height: 3,
              background: accent,
              margin: "22px 0 18px",
              width: interpolate(frame, [t0 + 4, t0 + 20], [0, 140], {
                ...clamp,
                easing: ease,
              }),
            }}
          />
        ) : null}
        {text.title ? (
          <div
            style={{
              ...enter(frame, next()),
              fontFamily: poppins,
              fontWeight: 700,
              fontSize: text.position === "centro" ? 104 : 96,
              lineHeight: 1.04,
            }}
          >
            {text.title}
          </div>
        ) : null}
        {text.big ? (
          <div
            style={{
              ...enter(frame, next()),
              fontFamily: poppins,
              fontWeight: 800,
              fontSize: 170,
              lineHeight: 1,
              letterSpacing: 2,
              scale: String(
                interpolate(frame, [t0 + 6, t0 + 20], [1.15, 1], {
                  ...clamp,
                  easing: ease,
                }),
              ),
            }}
          >
            {text.big}
          </div>
        ) : null}
        {text.sub ? (
          <div
            style={{
              ...enter(frame, next()),
              fontFamily: helvetica,
              fontSize: 50,
              marginTop: 16,
              lineHeight: 1.2,
            }}
          >
            {text.sub}
          </div>
        ) : null}
        {text.list ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 26,
              marginTop: 12,
              alignItems: "flex-start",
            }}
          >
            {text.list.map((item, i) => (
              <div
                key={item}
                style={{
                  ...enter(frame, t0 + 12 + i * 16),
                  display: "flex",
                  alignItems: "center",
                  gap: 22,
                  fontFamily: poppins,
                  fontWeight: 600,
                  fontSize: 48,
                  whiteSpace: "nowrap",
                  textAlign: "left",
                }}
              >
                <svg
                  width="52"
                  height="52"
                  viewBox="0 0 24 24"
                  style={{ flexShrink: 0 }}
                >
                  <circle cx="12" cy="12" r="11" fill={accent} />
                  <path
                    d="M7 12.5l3.2 3.2L17 9"
                    stroke="#111"
                    strokeWidth="2.4"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {item}
              </div>
            ))}
          </div>
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Label: React.FC<{ readonly text: string }> = ({ text }) => (
  <div
    style={{
      position: "absolute",
      top: 130,
      right: 60,
      padding: "10px 22px",
      borderRadius: 999,
      background: "rgba(0,0,0,0.45)",
      border: "1px solid rgba(255,255,255,0.5)",
      color: "#FFF",
      fontFamily: helvetica,
      fontSize: 28,
      letterSpacing: 2,
    }}
  >
    {text}
  </div>
);

const EndCard: React.FC<{
  readonly name: string;
  readonly company: string;
  readonly accent: string;
}> = ({ name, company, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const line = interpolate(frame, [0.5 * fps, 1.3 * fps], [0, 300], {
    ...clamp,
    easing: ease,
  });
  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse at center, #1a1a1a 0%, #050505 70%)",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{ height: 2, width: line, background: accent, marginBottom: 46 }}
      />
      <div
        style={{
          fontFamily: poppins,
          fontWeight: 600,
          fontSize: 92,
          letterSpacing: 10,
          color: "#FFF",
          textAlign: "center",
          lineHeight: 1.15,
          opacity: interpolate(frame, [0.25 * fps, 1.0 * fps], [0, 1], clamp),
          scale: String(
            interpolate(frame, [0, 3 * fps], [1.06, 1], {
              ...clamp,
              easing: ease,
            }),
          ),
          filter: `blur(${interpolate(frame, [0.25 * fps, 0.9 * fps], [10, 0], clamp)}px)`,
        }}
      >
        {name
          .toUpperCase()
          .split(" ")
          .map((w) => (
            <div key={w}>{w}</div>
          ))}
      </div>
      <div
        style={{ height: 2, width: line, background: accent, marginTop: 46 }}
      />
      <div
        style={{
          fontFamily: helvetica,
          fontSize: 38,
          letterSpacing: 14,
          color: accent,
          marginTop: 40,
          textTransform: "uppercase",
          opacity: interpolate(frame, [1.0 * fps, 1.6 * fps], [0, 1], clamp),
        }}
      >
        {company}
      </div>
    </AbsoluteFill>
  );
};

type AnyPresentation = TransitionPresentation<Record<string, unknown>>;
const PRESENTATIONS: (() => AnyPresentation)[] = [
  () => slide({ direction: "from-right" }) as AnyPresentation,
  () => fade() as AnyPresentation,
  () => wipe({ direction: "from-left" }) as AnyPresentation,
  () => slide({ direction: "from-bottom" }) as AnyPresentation,
];

export const RoomTourComponent: React.FC<RoomTourProps> = (props) => {
  const { fps, durationInFrames } = useVideoConfig();
  const tf = Math.round(props.transitionSeconds * fps);
  // Momentos de cada transición para los whooshes
  const cuts: number[] = [];
  let acc = 0;
  props.scenes.forEach((s) => {
    acc += Math.round(s.seconds * fps) - tf;
    cuts.push(acc);
  });

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <TransitionSeries name="Roomtour">
        {props.scenes.flatMap((s, i) => [
          <TransitionSeries.Sequence
            key={`s${i}`}
            name={s.text?.title ?? s.text?.big ?? s.text?.kicker ?? s.src}
            durationInFrames={Math.round(s.seconds * fps)}
            premountFor={fps}
          >
            <Shot scene={s} />
            {s.label ? <Label text={s.label} /> : null}
            {s.text ? (
              <SceneTextLayer text={s.text} accent={props.accent} />
            ) : null}
          </TransitionSeries.Sequence>,
          <TransitionSeries.Transition
            key={`t${i}`}
            presentation={
              i === props.scenes.length - 1
                ? (fade() as AnyPresentation)
                : PRESENTATIONS[i % PRESENTATIONS.length]()
            }
            timing={linearTiming({ durationInFrames: tf })}
          />,
        ])}
        <TransitionSeries.Sequence
          name="Cierre"
          durationInFrames={Math.round(props.endSeconds * fps)}
          premountFor={fps}
        >
          <EndCard
            name={props.agentName}
            company={props.agentCompany}
            accent={props.accent}
          />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      {cuts.map((c, i) => (
        <Sequence
          key={`w${c}`}
          from={Math.max(0, c - 6)}
          durationInFrames={2 * fps}
          name="whoosh"
        >
          <Audio
            src={staticFile(i % 2 ? "sfx/whoosh-corto.wav" : "sfx/whoosh.wav")}
            volume={0.3}
          />
        </Sequence>
      ))}
      {props.music ? (
        <Audio
          src={staticFile(props.music)}
          volume={(f) =>
            props.musicVolume *
            interpolate(
              f,
              [0, 10, durationInFrames - 2.2 * fps, durationInFrames],
              [0, 1, 1, 0],
              clamp,
            )
          }
        />
      ) : null}
    </AbsoluteFill>
  );
};

export const RoomTourBosqueComposition: React.FC = () => {
  return (
    <Composition
      id="RoomTourBosque"
      component={RoomTourComponent}
      durationInFrames={900}
      fps={30}
      width={1080}
      height={1920}
      calculateMetadata={calculateMetadata}
      defaultProps={{
        transitionSeconds: 0.4,
        music: "work/bosque/musica.wav",
        musicVolume: 0.8,
        agentName: "Yoramis Medina",
        agentCompany: "Dorata Realty",
        endSeconds: 3.4,
        accent: "#C9A45C",
        scenes: [
          {
            src: "work/bosque/f03.jpg",
            kind: "foto",
            seconds: 3.2,
            motion: "tiltDown",
            text: {
              kicker: "¿Apartamento en Valencia?",
              title: "ESTE ES PARA TI.",
              position: "centro",
            },
          },
          {
            src: "work/bosque/f09.jpg",
            kind: "foto",
            seconds: 3.2,
            motion: "panRight",
            text: {
              kicker: "Ubicado en El Bosque",
              big: "60 m²",
              position: "abajo",
            },
          },
          {
            src: "work/bosque/v1.mp4",
            kind: "video",
            seconds: 2.6,
            motion: "zoomIn",
            trimStart: 10.7,
            text: {
              kicker: "Te espera",
              title: "Amoblado y equipado",
              position: "abajo",
            },
          },
          {
            src: "work/bosque/v3.mp4",
            kind: "video",
            seconds: 3.0,
            motion: "zoomIn",
            label: "Ambientación virtual",
          },
          {
            src: "work/bosque/v2.mp4",
            kind: "video",
            seconds: 3.0,
            motion: "zoomOut",
            text: {
              kicker: "Disfruta de",
              title: "Cocina abierta",
              position: "abajo",
            },
          },
          {
            src: "work/bosque/v1.mp4",
            kind: "video",
            seconds: 2.6,
            motion: "zoomIn",
            trimStart: 8.1,
            text: { title: "Una habitación privada", position: "abajo" },
          },
          {
            src: "work/bosque/f06.jpg",
            kind: "foto",
            seconds: 2.5,
            motion: "zoomIn",
            text: { title: "Baño moderno", position: "abajo" },
          },
          {
            src: "work/bosque/f10.jpg",
            kind: "foto",
            seconds: 2.5,
            motion: "tiltDown",
            text: { title: "Área de lavado", position: "abajo" },
          },
          {
            src: "work/bosque/v1.mp4",
            kind: "video",
            seconds: 4.05,
            motion: "zoomIn",
            trimStart: 19.55,
            text: {
              kicker: "Además",
              list: [
                "3 puestos de estacionamiento",
                "Planta eléctrica al 100 %",
                "Pozo de agua propio",
              ],
              position: "centro",
            },
          },
          {
            src: "work/bosque/v1.mp4",
            kind: "video",
            seconds: 2.6,
            motion: "zoomIn",
            trimStart: 15.8,
            speed: 0.6,
            text: {
              kicker: "Todo en un piso alto",
              title: "con vista a las montañas",
              position: "abajo",
            },
          },
          {
            src: "work/bosque/f05.jpg",
            kind: "foto",
            seconds: 3.0,
            motion: "zoomOut",
            text: { kicker: "Precio", big: "$75,000", position: "centro" },
          },
          {
            src: "work/bosque/f08.jpg",
            kind: "foto",
            seconds: 3.6,
            motion: "panLeft",
            text: {
              kicker: "¡Comenta la palabra",
              big: "BOSQUE",
              sub: "y te comparto toda la info!",
              position: "centro",
            },
          },
        ],
      }}
    />
  );
};
