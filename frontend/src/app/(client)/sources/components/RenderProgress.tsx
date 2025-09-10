import { Box, Typography } from "@mui/material";
import ProgressBar from "./ProgressLoader";
import { formatEta } from "@/utils/format";

const renderPogress = (
	status: string,
	totalDB: number,
	matchedDB: number,
	processedDB: number,
	totalSSE: number | undefined,
	matchedSSE: number | undefined,
	processedSSE: number | undefined,
	etaSeconds: number | undefined,
) => {
	const totalSseVal = totalSSE ?? 0;
	const matchedSseVal = matchedSSE ?? 0;
	const processedSseVal = processedSSE ?? 0;

	if (status === "complete" && totalDB === 0) return "0";

	const allProcessed =
		(processedSseVal && processedSseVal === totalDB) ||
		(processedDB === totalDB && processedDB !== 0);

	if (status === "complete" && allProcessed) {
		const matched = Math.max(matchedDB, matchedSseVal);
		return matched.toLocaleString("en-US");
	}

	if (allProcessed) {
		return (
			<Box>
				<ProgressBar
					progress={{
						total: totalDB,
						processed: processedDB,
						matched: matchedDB,
					}}
				/>
				{typeof etaSeconds === "number" && etaSeconds > 0 && (
					<Typography
						sx={{
							color: "#202124",
							fontSize: "12px",
							fontFamily: "var(--font-nunito)",
							fontWeight: 500,
							backgroundColor: "white",
							px: 0.5,
							mt: 0.5,
						}}
					>
						{formatEta(etaSeconds)}
					</Typography>
				)}
			</Box>
		);
	}

	if (processedDB !== 0) {
		return (
			<Box>
				<ProgressBar
					progress={{
						total: totalDB,
						processed: processedDB,
						matched: matchedDB,
					}}
				/>
				{typeof etaSeconds === "number" && etaSeconds > 0 && (
					<Typography
						sx={{
							color: "#202124",
							fontSize: "12px",
							fontFamily: "var(--font-nunito)",
							fontWeight: 500,
							textAlign: "center",
						}}
					>
						{formatEta(etaSeconds)}
					</Typography>
				)}
			</Box>
		);
	}

	return (
		<Box>
			<ProgressBar
				progress={{
					total: totalSseVal,
					processed: processedSseVal,
					matched: matchedSseVal,
				}}
			/>
			{typeof etaSeconds === "number" && etaSeconds > 0 && (
				<Typography
					sx={{
						color: "#202124",
						fontSize: "12px",
						fontFamily: "var(--font-nunito)",
						fontWeight: 500,
						backgroundColor: "white",
						px: 0.5,
					}}
				>
					{formatEta(etaSeconds)}
				</Typography>
			)}
		</Box>
	);
};

export default renderPogress;
