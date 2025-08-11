import {
	CardActionArea,
	CardContent,
	CardMedia,
	type SxProps,
	Typography,
} from "@mui/material";
import type { FC } from "react";
import Image from "next/image";
import type { SourceTypeSchema } from "./schemas";

type Props = {
	selectedSourceType: string;
	sourceTypeSchema: SourceTypeSchema;
	onSelect: (sourceType: string) => void;
};

export const SourceTypeCard: FC<Props> = ({
	selectedSourceType,
	sourceTypeSchema,
	onSelect,
}) => {
	const sourceType = selectedSourceType;
	const el = sourceTypeSchema;
	const handleChangeSourceType = onSelect;
	return (
		<CardActionArea
			onClick={() => handleChangeSourceType(el.title)}
			sx={{
				...cardSourceType,
				backgroundColor:
					sourceType === el.title
						? "rgba(240, 242, 245, 1)"
						: "rgba(255, 255, 255, 1)",
				borderColor:
					sourceType === el.title
						? "rgba(56, 152, 252, 1)"
						: "rgba(228, 228, 228, 1)",
			}}
		>
			<CardMedia>
				<Image src={el.src} alt="website_pixel-icon" width={32} height={32} />
			</CardMedia>
			<CardContent
				sx={{
					display: "flex",
					flexDirection: "column",
					gap: 0.5,
					p: 0,
					"&:last-child": { pb: "0" },
				}}
			>
				<Typography className="seventh-sub-title" style={{ color: "#4A4A4A" }}>
					{el.title}
				</Typography>
				<Typography
					className="third-sub-title"
					style={{
						color: "#4A4A4A",
						whiteSpace: "normal",
						wordBreak: "break-word",
					}}
				>
					{el.description}
				</Typography>
			</CardContent>
		</CardActionArea>
	);
};

const cardSourceType: SxProps = {
	borderWidth: "1px",
	borderStyle: "solid",
	display: "flex",
	flexDirection: "column",
	justifyContent: "start",
	flex: "1 1 0",
	boxShadow: "0 2px 10px rgba(0, 0, 0, 0.08)",
	cursor: "pointer",
	p: "14px",
	alignItems: "self-start",
	gap: 1,
	borderRadius: "4px",
	"&:hover": { borderColor: "rgba(56, 152, 252, 1)" },
};
