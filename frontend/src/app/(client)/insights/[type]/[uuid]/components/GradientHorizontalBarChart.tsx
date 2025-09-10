import type React from "react";
import { useState } from "react";

import { GradientBarChartView } from "./GradientHorizontalBarChartView";

import type { BarData } from "./schemas";

type GradientBarChartProps = {
	title: string;
	data: BarData[];
	gradientColor?: string;
	sortByPercent?: boolean;
	rank?: number;
	textPadding?: boolean;
	hidePercent?: boolean;
};

export const GradientBarChart: React.FC<GradientBarChartProps> = ({
	title,
	data,
	gradientColor = "98, 178, 253",
	sortByPercent = true,
	rank,
	textPadding,
	hidePercent = false,
}) => {
	const [expanded, setExpanded] = useState(false);
	const toggle = () => setExpanded((prev) => !prev);

	return (
		<GradientBarChartView
			title={title}
			data={data}
			gradientColor={gradientColor}
			sortByPercent={sortByPercent}
			rank={rank}
			textPadding={textPadding}
			hidePercent={hidePercent}
			expanded={expanded}
			onExpandToggle={toggle}
		/>
	);
};
