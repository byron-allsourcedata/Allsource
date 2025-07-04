import ProgressBar from "./ProgressLoader";

const renderPogress = (
	status: string,
	totalDB: number,
	matchedDB: number,
	processedDB: number,
	totalSSE: number | undefined,
	matchedSSE: number | undefined,
	processedSSE: number | undefined,
) => {
	const totalSseVal = totalSSE ?? 0;
	const matchedSseVal = matchedSSE ?? 0;
	const processedSseVal = processedSSE ?? 0;

	if (status === "complete" && totalDB === 0) return "0";

	const allProcessed =
		(processedSseVal && processedSseVal === totalDB) ||
		(processedDB === totalDB && processedDB !== 0);

	if (allProcessed) {
		const matched = Math.max(matchedDB, matchedSseVal);
		return matched.toLocaleString("en-US");
	}

	if (processedDB !== 0) {
		return (
			<ProgressBar
				progress={{
					total: totalDB,
					processed: processedDB,
					matched: matchedDB,
				}}
			/>
		);
	}

	return (
		<ProgressBar
			progress={{
				total: totalSseVal,
				processed: processedSseVal,
				matched: matchedSseVal,
			}}
		/>
	);
};

export default renderPogress;
