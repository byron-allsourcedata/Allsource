import React from "react";
import { LinearProgress, Box, Skeleton } from "@mui/material";

type Progress = {
	total: number;
	processed: number;
	matched?: number;
};

interface ProgressBarProps {
	progress: Progress;
}

const ProgressBar = ({ progress }: ProgressBarProps) => {
	const percentage =
		progress && progress.total > 0
			? (progress.processed / progress.total) * 100
			: 0;

	const showSkeleton = !progress || progress.total === 0 || percentage === 0;

	return (
		<Box sx={{ width: "100%" }}>
			{showSkeleton ? (
				<Skeleton
					variant="rectangular"
					animation="wave"
					height={8}
					sx={{
						width: "100%",
						borderRadius: "54px",
						bgcolor: "rgba(217, 217, 217, 1)",
					}}
				/>
			) : (
				<LinearProgress
					variant="determinate"
					value={Math.min(percentage, 100)}
					sx={{
						width: "100%",
						borderRadius: "54px",
						height: "8px",
						backgroundColor: "rgba(217, 217, 217, 1)",
						"& .MuiLinearProgress-bar": {
							backgroundColor: "rgba(110, 193, 37, 1)",
						},
					}}
				/>
			)}
		</Box>
	);
};

export default ProgressBar;
