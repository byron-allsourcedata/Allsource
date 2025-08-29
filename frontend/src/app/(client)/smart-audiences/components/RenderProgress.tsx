import ProgressBar from "../../sources/components/ProgressLoader";
import Image from "next/image";
import { Box, Typography } from "@mui/material";
import ThreeDotsLoader from "../../sources/components/ThreeDotsLoader";
import { useEffect, useState } from "react";
import { formatEta } from "@/utils/format";

type StepProgress = {
	completed_steps: number;
	total_steps: number;
	current_step_index: number;
	current_step_key: string | null;
	current_step_name: string | null;
	eta_seconds: number | null;
	time_progress: number | null;
};

function LoadingDots() {
	const [dots, setDots] = useState("");

	useEffect(() => {
		const interval = setInterval(() => {
			setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
		}, 500);
		return () => clearInterval(interval);
	}, []);

	return (
		<Typography
			component="span"
			sx={{
				width: "10px",
				height: "1px",
				padding: 0,
				margin: 0,
				fontSize: "14px",
			}}
		>
			{dots || "\u00A0"}
		</Typography>
	);
}

const renderActiveSegmentProgress = (
	activeSegmentTotal: number,
	processedDB: number,
	processedSSE: number | undefined,
) => {
	const sseProcessed = processedSSE ?? 0;

	const allProcessed =
		(sseProcessed && sseProcessed === activeSegmentTotal) ||
		(processedDB === activeSegmentTotal && processedDB !== 0);

	if (allProcessed) {
		return activeSegmentTotal.toLocaleString("en-US");
	}

	if (processedDB > sseProcessed) {
		return (
			<ProgressBar
				progress={{
					total: activeSegmentTotal,
					processed: processedDB,
				}}
			/>
		);
	}

	return (
		<ProgressBar
			progress={{
				total: activeSegmentTotal,
				processed: sseProcessed,
			}}
		/>
	);
};

const renderValidatedStatusIcon = (
	status: string,
	isNA: boolean,
	validatedRecords: number,
	progressValidationTotal?: number,
	progressValidation?: StepProgress | null,
) => {
	if (status === "unvalidated") {
		return (
			<Image src="/danger_yellow.svg" alt="danger" width={20} height={20} />
		);
	}

	if (status === "n_a" || isNA) {
		return <Box textAlign="center">N/A</Box>;
	}

	if (status === "validating" && progressValidation) {
		return (
			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "space-between",
					minWidth: "120px",
				}}
			>
				<Box sx={{ width: "100%", alignItems: "center", display: "flex" }}>
					<ProgressBar
						progress={{
							total: 100,
							processed: progressValidation.time_progress
								? progressValidation.time_progress * 100
								: 0,
						}}
					/>
				</Box>
				<Box
					sx={{
						fontSize: "12px",
						marginTop: "4px",
						color: "gray",
						display: "flex",
						justifyContent: "space-between",
						width: "100%",
					}}
				>
					<span>
						{progressValidation.current_step_index}/
						{progressValidation.total_steps}{" "}
						{progressValidation.current_step_name
							? `(${progressValidation.current_step_name})`
							: ""}
					</span>
					<Typography
						sx={{ display: "flex", alignItems: "center", gap: 0.5, p: 0 }}
						className="paragraph"
					>
						{typeof progressValidation.eta_seconds === "number" ? (
							`~${formatEta(Math.max(0, Math.round(progressValidation.eta_seconds)))}`
						) : (
							<ThreeDotsLoader />
						)}
					</Typography>
				</Box>
			</Box>
		);
	}

	if (
		validatedRecords === 0 &&
		status === "validating" &&
		!progressValidationTotal
	) {
		return (
			<Box
				sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
			>
				<ThreeDotsLoader />
			</Box>
		);
	}

	return null;
};

const renderValidatedCountOrLink = (
	status: string,
	isNA: boolean,
	validatedRecords: number,
	progressValidationTotal: number | undefined,
	onClick: () => void,
) => {
	if (
		status === "unvalidated" ||
		status === "n_a" ||
		isNA ||
		(validatedRecords === 0 &&
			status === "validating" &&
			!progressValidationTotal)
	) {
		return null;
	}

	const value = Math.max(
		validatedRecords,
		progressValidationTotal ?? 0,
	).toLocaleString("en-US");

	return (
		<Box
			sx={{ cursor: "pointer", color: "rgba(56, 152, 252, 1)" }}
			onClick={onClick}
		>
			{value}
		</Box>
	);
};

export {
	renderActiveSegmentProgress,
	renderValidatedCountOrLink,
	renderValidatedStatusIcon,
};
