import allStates from "../data/allstates.json";

export const defaultColor = "rgba(199, 228, 255, 1)";

export const getColorFromPercentage = (percentage: number): string => {
	if (percentage >= 50) return "#1E5FE0";
	if (percentage >= 30) return "#438AF8";
	if (percentage >= 15) return "#73A6F9";
	if (percentage >= 10) return "#8FB7FA";
	if (percentage >= 5) return "#A4C3FB";
	if (percentage >= 3) return "#BED4FC";
	return defaultColor;
};

function getStateAbbreviationByAbbr(abbr: string): string | null {
	const entry = allStates.find(
		(s) => s.id.toLowerCase() === abbr.toLowerCase().trim(),
	);
	return entry?.id || null;
}

export type JobLocationRaw = Record<string, number>;

export interface AggregatedCity {
	name: string;
	percent: number;
}

export interface RegionData {
	label: string;
	percentage: number;
	fillColor: string;
	state: string;
	cities?: AggregatedCity[];
}

export const aggregateByState = (jobLocation: JobLocationRaw): RegionData[] => {
	const stateMap: Record<
		string,
		{ total: number; cities: { name: string; percent: number }[] }
	> = {};

	for (const [cityState, percent] of Object.entries(jobLocation)) {
		const [cityRaw, stateRaw] = cityState.split(",").map((s) => s.trim());

		if (!stateRaw || !cityRaw) continue;

		const stateAbbr = getStateAbbreviationByAbbr(stateRaw);
		if (!stateAbbr) continue;

		if (!stateMap[stateAbbr]) {
			stateMap[stateAbbr] = {
				total: 0,
				cities: [],
			};
		}

		stateMap[stateAbbr].total += percent;
		stateMap[stateAbbr].cities.push({ name: cityRaw, percent });
	}

	return Object.entries(stateMap)
		.map(([state, data]) => ({
			label: state,
			percentage: parseFloat(data.total.toFixed(2)),
			fillColor: getColorFromPercentage(data.total),
			state,
			cities: data.cities.sort((a, b) => b.percent - a.percent).slice(0, 5),
		}))
		.sort((a, b) => b.percentage - a.percentage);
};
