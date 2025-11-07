import React from "react";
import dynamic from "next/dynamic";
import { Box } from "@mui/material";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

type FitMode = "contain" | "cover" | "stretch";

type Props = {
	src?: string;
	animationData?: any;
	loop?: boolean | number;
	autoplay?: boolean;
	width?: number | string;
	height?: number | string;
	style?: React.CSSProperties;
	fit?: FitMode;
};

export default function LottiePlayer({
	src,
	animationData,
	loop = true,
	autoplay = true,
	width = "100%",
	height = "100%",
	style,
}: Props) {
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

	if (!data) {
		return <Box sx={{ width, height }} />;
	}

	const LottieAny = Lottie as any;

	return (
		<Box
			sx={{
				width,
				height,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				position: "relative",
				overflow: "hidden",
			}}
		>
			<LottieAny
				animationData={data}
				loop={loop}
				autoplay={autoplay}
				style={{
					width: "100% ",
					height: "100vh !important",
					objectFit: "contain",
					...style,
				}}
				rendererSettings={{
					preserveAspectRatio: "xMidYMid meet",
				}}
			/>
		</Box>
	);
}
