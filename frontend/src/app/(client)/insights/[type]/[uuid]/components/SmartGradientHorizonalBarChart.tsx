import { GradientBarChartView } from "./GradientHorizontalBarChartView";
import type { BarData } from "./schemas";
import { useStatsRowContext } from "./StatsRowContext";

type Props = {
	title: string;
	data: BarData[];
	gradientColor?: string;
	sortByPercent?: boolean;
	rank?: number;
	textPadding?: boolean;
	hidePercent?: boolean;
};

export const SmartGradientBarChart: React.FC<Props> = ({
	title,
	data,
	gradientColor = "98, 178, 253",
	sortByPercent = true,
	rank,
	textPadding,
	hidePercent = false,
}) => {
	const { expanded, toggle } = useStatsRowContext();

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
