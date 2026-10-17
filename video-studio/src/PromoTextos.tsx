import { Audio, Video } from "@remotion/media";
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

// Video ya montado + un texto por segmento + cierre con el nombre de la marca
// sobre un fondo de color + música. Cada texto tiene una línea pequeña
// (Helvetica) y una línea grande (Poppins).

type Segment = {
  readonly from: number; // segundos
  readonly to: number;
  readonly small: string; // línea pequeña, puede ir vacía
  readonly big: string;
  readonly position: "arriba" | "abajo";
};

export type PromoTextosProps = {
  readonly video: string; // ruta dentro de public/
  readonly videoSeconds: number;
  readonly music: string | null;
  readonly musicVolume: number;
  readonly videoVolume: number;
  readonly segments: Segment[];
  readonly brandName: string;
  readonly endColorTop: string;
  readonly endColorBottom: string;
  readonly endSeconds: number;
  // Opcionales: ícono animado sobre el nombre en el cierre y efectos de sonido
  readonly endIcon?: "regalo" | null;
  // Imagen (último fotograma) que queda congelada detrás de la transición al cierre
  readonly holdImage?: string | null;
  readonly sfx?: {
    readonly at: number;
    readonly src: string;
    readonly volume: number;
  }[];
};

const calculateMetadata: CalculateMetadataFunction<PromoTextosProps> = ({
  props,
}) => {
  const fps = 30;
  return {
    fps,
    durationInFrames: Math.round((props.videoSeconds + props.endSeconds) * fps),
  };
};

const SegmentText: React.FC<{ readonly segment: Segment }> = ({ segment }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const ease = Easing.bezier(0.16, 1, 0.3, 1);
  const rise = (delay: number) => ({
    opacity: interpolate(frame, [delay, delay + 0.35 * fps], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    translate: interpolate(
      frame,
      [delay, delay + 0.6 * fps],
      ["0px 40px", "0px 0px"],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease },
    ),
    filter: `blur(${interpolate(frame, [delay, delay + 0.4 * fps], [10, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)`,
  });
  const top = segment.position === "arriba";
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 0.3 * fps, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <>
      {/* Degradado oscuro detrás del texto para que se lea sobre fondos claros */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(${top ? "180deg" : "0deg"}, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.35) 25%, rgba(0,0,0,0) 45%)`,
          opacity:
            interpolate(frame, [0, 0.4 * fps], [0, 1], {
              extrapolateRight: "clamp",
            }) * fadeOut,
        }}
      />
      <AbsoluteFill
        style={{
          justifyContent: top ? "flex-start" : "flex-end",
          alignItems: "center",
          padding: top ? "260px 90px 0" : "0 90px 430px",
          textAlign: "center",
          // Sombra suave alrededor del texto para que se lea sobre cualquier toma
          textShadow: "0 4px 24px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.35)",
          opacity: fadeOut,
        }}
      >
        {segment.small ? (
          <div
            style={{
              ...rise(0),
              fontFamily: helvetica,
              fontWeight: 400,
              fontSize: 46,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: "#FFFFFF",
            }}
          >
            {segment.small}
          </div>
        ) : null}
        <div
          style={{
            ...rise(0.18 * fps),
            fontFamily: poppins,
            fontWeight: 700,
            fontSize: 104,
            lineHeight: 1.05,
            color: "#FFFFFF",
            marginTop: segment.small ? 14 : 0,
          }}
        >
          {segment.big}
        </div>
      </AbsoluteFill>
    </>
  );
};

// Regalo en vector: la caja cae con rebote, la tapa salta y salen destellos
const Gift: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t0 = 0.25 * fps;
  const clamp = {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  } as const;
  const lidLift = interpolate(
    frame,
    [t0 + 0.55 * fps, t0 + 0.75 * fps, t0 + 1.0 * fps],
    [0, -26, -8],
    {
      ...clamp,
      easing: Easing.bezier(0.33, 1, 0.68, 1),
    },
  );
  const lidTilt = interpolate(
    frame,
    [t0 + 0.55 * fps, t0 + 0.75 * fps, t0 + 1.0 * fps],
    [0, -10, -4],
    clamp,
  );
  const sparkle = (delay: number) =>
    interpolate(
      frame,
      [t0 + delay * fps, t0 + (delay + 0.25) * fps, t0 + (delay + 0.6) * fps],
      [0, 1, 0],
      clamp,
    );
  return (
    <div
      style={{
        width: 380,
        height: 380,
        marginBottom: 40,
        opacity: interpolate(frame, [t0, t0 + 0.15 * fps], [0, 1], clamp),
        translate: interpolate(
          frame,
          [t0, t0 + 0.55 * fps],
          ["0px -180px", "0px 0px"],
          {
            ...clamp,
            easing: Easing.bezier(0.34, 1.56, 0.64, 1),
          },
        ),
        // Un leve balanceo continuo para que no quede estático
        rotate: `${Math.sin(frame / 9) * 2}deg`,
      }}
    >
      <svg viewBox="0 0 200 200" width={380} height={380}>
        {/* destellos */}
        {[
          [30, 40, 0.75],
          [170, 50, 0.9],
          [160, 150, 1.05],
          [35, 145, 1.15],
        ].map(([x, y, d]) => (
          <path
            key={`${x}-${y}`}
            d={`M${x} ${y - 12} L${x + 3} ${y - 3} L${x + 12} ${y} L${x + 3} ${y + 3} L${x} ${y + 12} L${x - 3} ${y + 3} L${x - 12} ${y} L${x - 3} ${y - 3} Z`}
            fill="#FFFFFF"
            opacity={sparkle(d)}
            transform={`rotate(0 ${x} ${y})`}
          />
        ))}
        {/* caja */}
        <rect x="45" y="92" width="110" height="88" rx="10" fill="#FFFFFF" />
        <rect
          x="45"
          y="92"
          width="110"
          height="88"
          rx="10"
          fill="#E2437E"
          opacity="0.18"
        />
        <rect x="91" y="92" width="18" height="88" fill="#C2185B" />
        {/* tapa con lazo */}
        <g transform={`translate(0 ${lidLift}) rotate(${lidTilt} 100 80)`}>
          <rect x="37" y="68" width="126" height="30" rx="8" fill="#FFFFFF" />
          <rect x="91" y="68" width="18" height="30" fill="#C2185B" />
          <path
            d="M100 68 C 80 40, 52 48, 66 64 C 74 72, 92 70, 100 68 Z"
            fill="#C2185B"
          />
          <path
            d="M100 68 C 120 40, 148 48, 134 64 C 126 72, 108 70, 100 68 Z"
            fill="#C2185B"
          />
          <circle cx="100" cy="66" r="7" fill="#AD1457" />
        </g>
      </svg>
    </div>
  );
};

const EndCard: React.FC<{
  readonly name: string;
  readonly top: string;
  readonly bottom: string;
  readonly icon?: "regalo" | null;
}> = ({ name, top, bottom, icon }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(170deg, ${top} 0%, ${bottom} 100%)`,
        justifyContent: "center",
        alignItems: "center",
        clipPath: `circle(${interpolate(frame, [0, 0.6 * fps], [0, 120], { extrapolateRight: "clamp", easing: Easing.bezier(0.65, 0, 0.35, 1) })}% at 50% 50%)`,
      }}
    >
      {icon === "regalo" ? <Gift /> : null}
      <div
        style={{
          fontFamily: poppins,
          fontWeight: 700,
          fontSize: 112,
          textShadow: "0 6px 30px rgba(120,0,50,0.25)",
          color: "#FFFFFF",
          letterSpacing: -1,
          opacity: interpolate(frame, [0.35 * fps, 0.8 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          scale: interpolate(frame, [0.35 * fps, 2.5 * fps], [0.9, 1.04], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            output: "perceptual-scale",
          }),
        }}
      >
        {name}
      </div>
      <div
        style={{
          height: 4,
          borderRadius: 2,
          background: "rgba(255,255,255,0.85)",
          marginTop: 26,
          width: interpolate(frame, [0.6 * fps, 1.2 * fps], [0, 220], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      />
    </AbsoluteFill>
  );
};

export const PromoTextosComponent: React.FC<PromoTextosProps> = (props) => {
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const videoFrames = Math.round(props.videoSeconds * fps);

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Video
        name="Video"
        src={staticFile(props.video)}
        durationInFrames={videoFrames}
        premountFor={fps}
        volume={props.videoVolume}
        objectFit="cover"
        style={{ position: "absolute", width: "100%", height: "100%" }}
      />
      {props.segments.map((s) => (
        <Sequence
          key={s.from}
          name={s.big}
          from={Math.round(s.from * fps)}
          durationInFrames={Math.round((s.to - s.from) * fps)}
          premountFor={fps}
        >
          <SegmentText segment={s} />
        </Sequence>
      ))}
      {props.holdImage ? (
        <Sequence name="Último fotograma" from={videoFrames} premountFor={fps}>
          <Img
            src={staticFile(props.holdImage)}
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </Sequence>
      ) : null}
      <Sequence name="Cierre" from={videoFrames} premountFor={fps}>
        <EndCard
          name={props.brandName}
          top={props.endColorTop}
          bottom={props.endColorBottom}
          icon={props.endIcon ?? null}
        />
      </Sequence>
      {(props.sfx ?? []).map((x) => (
        <Sequence
          key={`${x.src}-${x.at}`}
          name={x.src}
          from={Math.round(x.at * fps)}
          durationInFrames={3 * fps}
        >
          <Audio src={staticFile(x.src)} volume={x.volume} />
        </Sequence>
      ))}
      {props.music ? (
        <Audio
          name="Música"
          src={staticFile(props.music)}
          premountFor={fps}
          volume={(f) =>
            props.musicVolume *
            interpolate(
              f,
              [0, 0.3 * fps, durationInFrames - 1.2 * fps, durationInFrames],
              [0, 1, 1, 0],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              },
            )
          }
        />
      ) : null}
      {/* Fundido a negro de 4 fotogramas al principio para que el arranque no sea brusco */}
      <AbsoluteFill
        style={{
          background: "#000",
          opacity: interpolate(frame, [0, 4], [1, 0], {
            extrapolateRight: "clamp",
          }),
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};

export const PromoTextosComposition: React.FC = () => {
  return (
    <Composition
      id="PromoTextos"
      component={PromoTextosComponent}
      durationInFrames={345}
      fps={30}
      width={1080}
      height={1920}
      calculateMetadata={calculateMetadata}
      defaultProps={{
        video: "work/torta_andrea/video.mp4",
        videoSeconds: 9.024,
        music: "work/torta_andrea/musica.wav",
        musicVolume: 0.55,
        videoVolume: 0.35,
        segments: [
          {
            from: 0.25,
            to: 4.25,
            small: "Nuestro postre",
            big: "más deseado",
            position: "arriba",
          },
          {
            from: 4.45,
            to: 7.35,
            small: "¿Ya la probaste en",
            big: "nuestra cafetería?",
            position: "abajo",
          },
          {
            from: 7.5,
            to: 9.0,
            small: "",
            big: "Te esperamos",
            position: "abajo",
          },
        ],
        brandName: "Andrea’s Cakes",
        endColorTop: "#6A35A8",
        endColorBottom: "#3B1A6B",
        endSeconds: 2.5,
      }}
    />
  );
};

export const DetallitosDyanComposition: React.FC = () => {
  return (
    <Composition
      id="DetallitosDyan"
      component={PromoTextosComponent}
      durationInFrames={393}
      fps={30}
      width={1080}
      height={1920}
      calculateMetadata={calculateMetadata}
      defaultProps={{
        video: "work/dyan/video.mp4",
        videoSeconds: 10.0,
        music: "work/dyan/musica.wav",
        musicVolume: 0.55,
        videoVolume: 0.3,
        segments: [
          {
            from: 0.25,
            to: 6.3,
            small: "Nuestro producto",
            big: "del momento",
            position: "arriba",
          },
          {
            from: 6.5,
            to: 8.4,
            small: "¿Ya usaste esta",
            big: "nueva sombra?",
            position: "abajo",
          },
          {
            from: 8.55,
            to: 9.95,
            small: "Te esperamos en",
            big: "Detallitos Dyan",
            position: "abajo",
          },
        ],
        brandName: "Detallitos Dyan",
        endColorTop: "#F7A8C8",
        endColorBottom: "#D63384",
        endSeconds: 3.1,
        endIcon: "regalo",
        holdImage: "work/dyan/ultimo.jpg",
        sfx: [
          { at: 6.2, src: "sfx/whoosh.wav", volume: 0.4 },
          { at: 8.38, src: "sfx/whoosh-corto.wav", volume: 0.35 },
          { at: 9.85, src: "sfx/remotion/whip.wav", volume: 0.45 },
          { at: 10.85, src: "sfx/pop.wav", volume: 0.45 },
          { at: 11.05, src: "sfx/remotion/ding.wav", volume: 0.35 },
        ],
      }}
    />
  );
};
