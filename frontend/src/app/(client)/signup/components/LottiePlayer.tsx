import React from "react";
import Box from "@mui/material/Box";

type Props = {
  src?: string;
  animationData?: any;
  loop?: boolean | number;
  autoplay?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

export default function LottiePlayer({
  src,
  animationData,
  loop = true,
  autoplay = true,
  style,
}: Props) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const animRef = React.useRef<any | null>(null);
  const [data, setData] = React.useState<any | null>(animationData ?? null);

  React.useEffect(() => {
    let mounted = true;
    if (!animationData && src) {
      fetch(src)
        .then((r) => r.json())
        .then((json) => {
          if (mounted) setData(json);
        })
        .catch((err) => {
          console.error("Failed to load lottie json:", err);
        });
    }
    return () => {
      mounted = false;
    };
  }, [src, animationData]);

  React.useEffect(() => {
    if (!data || !containerRef.current) return;
    let isCancelled = false;

    (async () => {
      try {
        const lottieModule = await import("lottie-web");
        const lottie = lottieModule.default ?? lottieModule;

        if (animRef.current) {
          try { animRef.current.destroy(); } catch (e) {}
          animRef.current = null;
        }

        animRef.current = lottie.loadAnimation({
          container: containerRef.current!,
          renderer: "svg",
          loop: loop,
          autoplay: autoplay,
          animationData: data,
          rendererSettings: {
            preserveAspectRatio: 'xMidYMid slice'
          },
        });
      } catch (err) {
        console.error("Failed to init lottie-web:", err);
      }
    })();

    return () => {
      isCancelled = true;
      if (animRef.current) {
        try {
          animRef.current.destroy();
        } catch (e) {}
        animRef.current = null;
      }
    };
  }, [data, loop, autoplay]);

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "visible",
      }}
      style={style}
    >
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
        }}
      />
    </Box>
  );
}
