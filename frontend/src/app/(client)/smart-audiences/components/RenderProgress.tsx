import ProgressBar from "../../sources/components/ProgressLoader";
import Image from "next/image";
import { Box } from "@mui/material";
import ThreeDotsLoader from "../../sources/components/ThreeDotsLoader";

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
) => {
	if (status === "unvalidated") {
		return (
			<Image src="/danger_yellow.svg" alt="danger" width={20} height={20} />
		);
	}

	if (status === "n_a" || isNA) {
		return <Box textAlign="center">N/A</Box>;
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
