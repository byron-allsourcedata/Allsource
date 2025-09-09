import { Skeleton, type SkeletonProps } from "@mui/material";
import type { FC, ReactNode } from "react";

type TextSkeletonProps = {
	loading: boolean;
	text: ReactNode;
	skeleton?: SkeletonProps;
};

export const TextLoader: FC<TextSkeletonProps> = ({
	loading,
	text,
	skeleton: skeletonProps,
}) => {
	const mergedSx = {
		transform: "scale(1, 1)",
		...skeletonProps?.sx,
	};

	return (
		<>
			{loading && <Skeleton {...skeletonProps} sx={mergedSx} />}
			{!loading && text}
		</>
	);
};
