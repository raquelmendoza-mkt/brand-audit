import { Audio, Video } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  Easing,
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

const EndCard: React.FC<{
  readonly name: string;
  readonly top: string;
  readonly bottom: string;
}> = ({ name, top, bottom }) => {
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
      <div
        style={{
          fontFamily: poppins,
          fontWeight: 700,
          fontSize: 112,
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
      <Sequence name="Cierre" from={videoFrames} premountFor={fps}>
        <EndCard
          name={props.brandName}
          top={props.endColorTop}
          bottom={props.endColorBottom}
        />
      </Sequence>
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
