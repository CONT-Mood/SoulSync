import React from "react";

type Props = {
  src: string;
  alt?: string;
  wrapperClassName?: string;
  imgClassName?: string;
  width?: number | string;
  height?: number | string;
};

export default function AnimatedImage({
  src,
  alt = "character",
  wrapperClassName = "",
  imgClassName = "",
  width,
  height,
}: Props) {
  const wrapStyle: React.CSSProperties = {
    width: width ?? "auto",
    height: height ?? "auto",
    display: "inline-block",
    position: "relative",
    willChange: "transform",
  };

  return (
    <div className={`ai-wrap ${wrapperClassName}`} style={wrapStyle}>
      <style>{`
        .ai-wrap { animation: ai_float 3.2s ease-in-out infinite; }
        .ai-img  { 
          animation: ai_tilt 5s ease-in-out infinite, ai_breathe 4.6s ease-in-out infinite;
          transform-origin: 50% 90%;
          will-change: transform;
          user-select:none;
          pointer-events:none;
        }

        @keyframes ai_float {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }

        @keyframes ai_tilt {
          0%,100% { transform: rotate(0deg); }
          25% { transform: rotate(1deg); }
          75% { transform: rotate(-1deg); }
        }

        @keyframes ai_breathe {
          0%,100% { transform: scale(1); }
          50% { transform: scale(1.01); }
        }
      `}</style>

      <img
        src={src}
        alt={alt}
        className={`ai-img ${imgClassName}`}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    </div>
  );
}