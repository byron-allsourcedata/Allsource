import { Box, List, ListItem, Typography } from "@mui/material";
import Image from "next/image";

export interface InstructionInstallInterface {
	id: string;
	text: string;
}

type IntegrationInstructionProps = {
	serviceName: string;
	instructions: InstructionInstallInterface[];
};

type HighlightConfig = {
	[keyword: string]: { color?: string; fontWeight?: string };
};

export const IntegrationInstruction = ({
	serviceName,
	instructions,
}: IntegrationInstructionProps) => {
	const highlightConfig: HighlightConfig = {
		Klaviyo: { color: "rgba(56, 152, 252, 1)", fontWeight: "500" },
		Settings: { color: "#707071", fontWeight: "500" },
		"Create Private API Key": { color: "#707071", fontWeight: "500" },
		Lists: { color: "#707071", fontWeight: "500" },
		Profiles: { color: "#707071", fontWeight: "500" },
		Metrics: { color: "#707071", fontWeight: "500" },
		Events: { color: "#707071", fontWeight: "500" },
		Templates: { color: "#707071", fontWeight: "500" },
		Create: { color: "#707071", fontWeight: "500" },
		"API Key": { color: "#707071", fontWeight: "500" },
		Connect: { color: "#707071", fontWeight: "500" },
		Export: { color: "#707071", fontWeight: "500" },
	};

	const highlightText = (text: string, highlightConfig: HighlightConfig) => {
		let parts: (string | JSX.Element)[] = [text];

		Object.keys(highlightConfig).forEach((keyword, keywordIndex) => {
			const { color, fontWeight } = highlightConfig[keyword];
			parts = parts.flatMap((part, partIndex) =>
				typeof part === "string" && part.includes(keyword)
					? part.split(keyword).flatMap((segment, index, array) =>
							index < array.length - 1
								? [
										segment,
										<span
											style={{
												color: color || "inherit",
												fontWeight: fontWeight || "normal",
											}}
											key={`highlight-${keywordIndex}-${partIndex}-${index}`}
										>
											{keyword}
										</span>,
									]
								: [segment],
						)
					: [part],
			);
		});

		return <>{parts}</>;
	};

	return (
		<>
			{instructions.length > 0 && (
				<Box
					sx={{
						background: "#f0f0f0",
						border: "1px solid #efefef",
						borderRadius: "4px",
						p: 2,
					}}
				>
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							gap: "8px",
							mb: 2,
						}}
					>
						<Image
							src="/info-circle.svg"
							alt="info-circle"
							height={20}
							width={20}
						/>
						<Typography
							variant="subtitle1"
							sx={{
								fontFamily: "var(--font-nunito)",
								fontSize: "16px",
								fontWeight: "600",
								color: "#202124",
								lineHeight: "normal",
							}}
						>
							How to integrate {serviceName}
						</Typography>
					</Box>
					<List dense sx={{ p: 0 }}>
						{instructions.map((instruction, index) => (
							<ListItem
								key={instruction.id}
								sx={{ p: 0, alignItems: "flex-start" }}
							>
								<Typography
									variant="body1"
									sx={{
										display: "inline-block",
										marginRight: "4px",
										fontFamily: "var(--font-roboto)",
										fontSize: "12px",
										fontWeight: "400",
										color: "#808080",
										lineHeight: "24px",
									}}
								>
									{index + 1}.
								</Typography>
								<Typography
									variant="body1"
									sx={{
										display: "inline",
										fontFamily: "var(--font-roboto)",
										fontSize: "12px",
										fontWeight: "400",
										color: "#808080",
										lineHeight: "24px",
									}}
								>
									{highlightText(instruction.text, highlightConfig)}
								</Typography>
							</ListItem>
						))}
					</List>
				</Box>
			)}
		</>
	);
};
