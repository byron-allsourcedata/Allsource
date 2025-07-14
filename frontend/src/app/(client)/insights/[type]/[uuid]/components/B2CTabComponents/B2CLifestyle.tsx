import { Box } from "@mui/material";
import { IconFillIndicator } from "../CustomChart";
import _ from "lodash";
import { FieldRankMap, LifestyleData } from "@/types/insights";

interface B2CLifestyleProps {
	data: LifestyleData;
	fieldRanks: FieldRankMap;
}

const lifestyleMap: {
	key: keyof LifestyleData;
	fieldRank: string;
	title: string;
	imageSrc: string;
	color?: string;
	backgroundColor?: string;
}[] = [
	{
		key: "own_pets",
		fieldRank: "pets",
		title: "Own Pets",
		imageSrc: "/pets.svg",
		color: "rgba(98, 178, 253, 1)",
		backgroundColor: "rgba(193, 228, 255, 1)",
	},
	{
		key: "online_purchaser",
		fieldRank: "online_purchaser",
		title: "Online Purchaser",
		imageSrc: "/online-purchaser.svg",
		color: "rgba(249, 217, 103, 1)",
		backgroundColor: "rgba(255, 243, 189, 1)",
	},
	{
		key: "travel_interest",
		fieldRank: "travel",
		title: "Travel Interest",
		imageSrc: "/plains.svg",
		color: "rgba(240, 129, 140, 1)",
		backgroundColor: "rgba(252, 212, 215, 1)",
	},
	// {
	// 	key: "mail_order_buyer",
	// 	title: "Mail-Order Buyer",
	// 	imageSrc: "/mail-order.svg",
	// 	color: "rgba(249, 217, 103, 1)",
	// 	backgroundColor: "rgba(255, 243, 189, 1)",
	// },
	{
		key: "outdoor_interest",
		fieldRank: "outdoor_enthusiast",
		title: "Outdoor Interest",
		imageSrc: "/outdoor.svg",
		color: "rgba(240, 129, 140, 1)",
		backgroundColor: "rgba(252, 212, 215, 1)",
	},
	{
		key: "cooking_interest",
		fieldRank: "cooking_enthusiast",
		title: "Cooking Interest",
		imageSrc: "/cook.svg",
		color: "rgba(98, 178, 253, 1)",
		backgroundColor: "rgba(193, 228, 255, 1)",
	},
	{
		key: "diy_interest",
		fieldRank: "diy",
		title: "DIY Interest",
		imageSrc: "/garden.svg",
		color: "rgba(98, 178, 253, 1)",
		backgroundColor: "rgba(193, 228, 255, 1)",
	},
	{
		key: "health_and_beauty_interest",
		fieldRank: "health_and_beauty",
		title: "Health And Beauty Interest",
		imageSrc: "/health_and_beauty.svg",
		color: "rgba(114, 201, 157, 1)",
		backgroundColor: "rgba(227, 242, 227, 1)",
	},
	{
		key: "book_reader",
		fieldRank: "book_reader",
		title: "Book Reader",
		imageSrc: "/bookreader.svg",
		color: "rgba(249, 217, 103, 1)",
		backgroundColor: "rgba(255, 243, 189, 1)",
	},
	{
		key: "fitness_interest",
		fieldRank: "fitness_enthusiast",
		title: "Fitness Interest",
		imageSrc: "/fitness.svg",
		color: "rgba(114, 201, 157, 1)",
		backgroundColor: "rgba(227, 242, 227, 1)",
	},
	// { key: "tech_interest", title: "Tech Interest", imageSrc: "/tech.svg", color: "rgba(249, 217, 103, 1)", backgroundColor: "rgba(255, 243, 189, 1)" },
	{
		key: "golf_enthusiast",
		fieldRank: "golf_enthusiast",
		title: "Golf Interest",
		imageSrc: "/golf.svg",
		color: "rgba(240, 129, 140, 1)",
		backgroundColor: "rgba(252, 212, 215, 1)",
	},
	// { key: "automotive_interest", title: "Automotive", imageSrc: "/car.svg", color: "rgba(240, 129, 140, 1)", backgroundColor: "rgba(252, 212, 215, 1)" },
	{
		key: "smoker",
		fieldRank: "smoker",
		title: "Smoker",
		imageSrc: "/sigarette.svg",
		color: "rgba(114, 201, 157, 1)",
		backgroundColor: "rgba(227, 242, 227, 1)",
	},
	// {
	// 	key: "gardening_interest",
	// 	title: "Gardening Interest",
	// 	imageSrc: "/garden.svg",
	// 	color: "rgba(98, 178, 253, 1)",
	// 	backgroundColor: "rgba(193, 228, 255, 1)",
	// },
	// {
	// 	key: "beauty_cosmetic_interest",
	// 	title: "Beauty/Cosmetic Interest",
	// 	imageSrc: "/cosmetics.svg",
	// 	color: "rgba(114, 201, 157, 1)",
	// 	backgroundColor: "rgba(227, 242, 227, 1)",
	// },
];

const B2CLifestyle = ({ data, fieldRanks }: B2CLifestyleProps) => {
	return (
		<Box
			sx={{
				padding: "1.5rem 6.25rem 1.5rem 1.5rem",
				width: "100%",
				display: "flex",
				flexDirection: "column",
				gap: 3,
			}}
		>
			{_.chunk(lifestyleMap, 3).map((row, rowIndex) => (
				<Box key={rowIndex} sx={{ display: "flex", width: "100%", gap: 3 }}>
					{row.map(
						({ key, title, imageSrc, color, backgroundColor, fieldRank }) => {
							const item = data[key];
							const trueVal = item?.true || 0;
							const falseVal = item?.false || 0;
							const total = trueVal + falseVal;
							const percentage =
								total > 0 ? Math.round((trueVal / total) * 100) : 0;

							return (
								<Box key={key} sx={{ display: "flex", width: "33%" }}>
									<IconFillIndicator
										imageSrc={imageSrc}
										title={title}
										percentage={percentage}
										labels={["Yes", "No"]}
										rank={fieldRanks[`${fieldRank}`]}
										color={color}
										backgroundColor={backgroundColor}
									/>
								</Box>
							);
						},
					)}
				</Box>
			))}
		</Box>
	);
};

export default B2CLifestyle;
