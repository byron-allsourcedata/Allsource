import {
	type DomainsLeads,
	SmartHintCard,
} from "@/app/(client)/sources/builder/page";
import {
	builderHintCards,
	type BuilderKey,
} from "@/app/(client)/sources/context/hintsCardsContent";
import { sourcesStyles } from "@/app/(client)/sources/sourcesStyles";
import { BorderLinearProgress } from "@/components/ui/progress-bars/BorderLinearProgress";
import type { HintAction, HintStateMap } from "@/utils/hintsUtils";
import {
	Box,
	FormControl,
	MenuItem,
	Select,
	type SelectChangeEvent,
	Typography,
} from "@mui/material";
import type { FC, ReactNode, RefObject } from "react";

type SkeletonState = Record<BuilderKey, boolean>;

type PixelDomainSelectBlockProps = {
	block4Ref: RefObject<HTMLDivElement | null>;
	totalLeads?: number;
	pixelInstalled: boolean;
	isDomainSearchProcessing: boolean;
	selectedDomain: string;
	skeletons: SkeletonState;
	domains: DomainsLeads[];
	renderSkeleton: (key: BuilderKey) => ReactNode;
	handleChangeDomain: (e: SelectChangeEvent<string>) => void;
	handlePixelInstall: () => void;
	hintProps: HintsProps<BuilderKey>;
};

export type HintsProps<T extends string> = {
	changeHint: (key: T, action: "showBody", hintAction: HintAction) => void;
	hints: HintStateMap<T>;
	resetHints: () => void;
};

export const PixelDomainSelector: FC<PixelDomainSelectBlockProps> = ({
	block4Ref,
	pixelInstalled,
	isDomainSearchProcessing,
	selectedDomain,
	skeletons,
	domains,
	totalLeads,
	renderSkeleton,
	handleChangeDomain,
	handlePixelInstall,
	hintProps,
}) => {
	const { changeHint, hints, resetHints } = hintProps;

	return (
		<Box
			ref={block4Ref}
			sx={{
				display: "flex",
				flexDirection: "column",
			}}
		>
			{!skeletons.pixelDomain && (
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						gap: 2,
						position: "relative",
						flexWrap: "wrap",
						border: "1px solid rgba(228, 228, 228, 1)",
						borderRadius: "6px",
						padding: "20px",
					}}
				>
					{isDomainSearchProcessing && (
						<Box
							sx={{
								width: "100%",
								position: "absolute",
								top: 0,
								left: 0,
								zIndex: 1200,
							}}
						>
							<BorderLinearProgress
								variant="indeterminate"
								sx={{ borderRadius: "6px" }}
							/>
						</Box>
					)}
					<Box
						sx={{
							display: "flex",
							flexDirection: "column",
							gap: 1,
						}}
					>
						<Typography
							sx={{
								fontFamily: "var(--font-nunito)",
								fontSize: "16px",
								fontWeight: 500,
							}}
						>
							Select your domain
						</Typography>
						<Typography
							sx={{
								fontFamily: "var(--font-roboto)",
								fontSize: "12px",
								color: "rgba(95, 99, 104, 1)",
							}}
						>
							Please select your domain.
						</Typography>
					</Box>
					<FormControl variant="outlined">
						<Select
							value={selectedDomain}
							onChange={handleChangeDomain}
							displayEmpty
							MenuProps={{
								MenuListProps: {
									sx: {
										pb: 0,
										pt: pixelInstalled ? "inherit" : 0,
									},
								},
							}}
							sx={{
								...sourcesStyles.text,
								width: "316px",
								borderRadius: "4px",
								fontFamily: "var(--font-roboto)",
								fontSize: "14px",
								color:
									selectedDomain === ""
										? "rgba(112, 112, 113, 1)"
										: "rgba(32, 33, 36, 1)",
								"@media (max-width: 390px)": {
									width: "calc(100vw - 74px)",
								},
							}}
						>
							<MenuItem
								value=""
								disabled
								sx={{
									display: "none",
								}}
							>
								Select domain
							</MenuItem>
							{!pixelInstalled && (
								<MenuItem
									sx={{
										p: 0,
										display: "flex",
										justifyContent: "center",
										width: "100%",
										backgroundColor: "#ffffff !important",
										"&:hover": {
											backgroundColor: "#ffffff !important",
										},
									}}
								>
									<Box
										sx={{
											width: "100%",
											display: "flex",
											justifyContent: "center",
											padding: "6px 16px",
											borderBottom: "1px solid rgba(228, 228, 228, 1)",
											cursor: "pointer",
										}}
										onClick={(e) => {
											e.stopPropagation();
											handlePixelInstall();
										}}
									>
										<Typography
											sx={{
												fontFamily: "var(--font-nunito)",
												lineHeight: "22.4px",
												textDecoration: "underline",
												fontSize: "14px",
												fontWeight: "600",
												color: "rgba(56, 152, 252, 1)",
											}}
										>
											+ Add a new pixel to domain
										</Typography>
									</Box>
								</MenuItem>
							)}
							{domains.map((item: DomainsLeads, index) => (
								<MenuItem
									sx={{
										fontFamily: "var(--font-roboto)",
										fontWeight: 400,
										fontSize: "14px",
										borderBottom: "1px solid rgba(228, 228, 228, 1)",
									}}
									key={item.name}
									value={item.name}
								>
									{item.name}
								</MenuItem>
							))}
						</Select>
						<SmartHintCard
							hints={hints}
							hintKey="pixelDomain"
							hintCards={builderHintCards}
							changeHint={changeHint}
							position={{ left: 340 }}
						/>
					</FormControl>
					{selectedDomain && (
						<Box
							sx={{
								display: "flex",
								flexDirection: "column",
								gap: 1,
							}}
						>
							<Typography
								sx={{
									fontFamily: "var(--font-roboto)",
									fontSize: "14px",
									color: "rgba(32, 33, 36, 1)",
								}}
							>
								Total Leads
							</Typography>
							<Typography
								className="second-sub-title"
								sx={{
									fontFamily: "Nunino Sans",
									fontWeight: 600,
									fontSize: "16px",
									color: "rgba(33, 33, 33, 1))",
								}}
							>
								{totalLeads}
							</Typography>
						</Box>
					)}
				</Box>
			)}
			{renderSkeleton("pixelDomain")}
		</Box>
	);
};
