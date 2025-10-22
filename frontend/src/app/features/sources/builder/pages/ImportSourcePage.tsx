import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import CustomToolTip from "@/components/customToolTip";
import { Box, Typography } from "@mui/material";
import type { FC } from "react";
import { sourceTypes } from "../../../../(client)/sources/builder/components/types";
import { SourceTypeCard } from "../../../../(client)/sources/builder/components/SourceTypeCard";
import { CsvFieldMapperBlock } from "../components/CsvFieldMapperBlock";
import type { HintStateMap } from "@/utils/hintsUtils";
import type { BuilderKey } from "@/app/(client)/sources/context/hintsCardsContent";

export type Props = {
	loading: boolean;
	showGetStarted: boolean;
	hasNotification: boolean;
	smallIconSrc?: string;
	changeSourceBuilderHint: (hint: string) => void;
	sourceType: string;
	handleChangeSourceType: (sourceType: string) => void;
	blockRefs: ImportSourceBlockRefs;
	brandName?: string;
};

type ImportSourceBlockRefs = {
	block1: React.RefObject<HTMLDivElement | null>;
};

export const ImportSourcePageView: FC<Props> = ({
	loading,
	showGetStarted: isGetStartedPage,
	hasNotification,
	brandName = "Allsource",
	changeSourceBuilderHint,
	smallIconSrc: smallLogoSrc,
	sourceType,
	handleChangeSourceType,
	blockRefs,
}) => {
	const block1Ref = blockRefs.block1;

	return (
		<>
			{loading && <CustomizedProgressBar />}
			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					height: isGetStartedPage ? "100%" : "calc(100vh - 4.25rem)",
					overflow: "auto",
					"@media (max-width: 1024px)": {
						pr: 2,
					},
				}}
			>
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
					}}
				>
					<Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
						{!isGetStartedPage && (
							<Box
								sx={{
									display: "flex",
									alignItems: "center",
									marginTop: hasNotification ? "1rem" : 4,
									flexWrap: "wrap",
									gap: "15px",
									"@media (max-width: 900px)": {
										marginTop: hasNotification ? "3rem" : "1rem",
									},
								}}
							>
								<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
									<Typography className="first-sub-title">
										Import Source
									</Typography>
									<CustomToolTip
										title={"Here you can upload new ones to expand your data."}
										linkText="Learn more"
										linkUrl="https://allsourceio.zohodesk.com/portal/en/kb/allsource"
									/>
								</Box>
							</Box>
						)}
						<Box
							sx={{
								flex: 1,
								gap: 2,
								display: "flex",
								flexDirection: "column",
								maxWidth: "100%",
								pl: 0,
								pr: 0,
								pt: "16px",
								pb: "20px",
							}}
						>
							<Box
								ref={block1Ref}
								sx={{
									display: "flex",
									flexDirection: "column",
									gap: 2,
									flexWrap: "wrap",
									border: "1px solid rgba(228, 228, 228, 1)",
									borderRadius: "6px",
									padding: "20px",
								}}
							>
								<Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
									<Typography
										sx={{
											fontFamily: "var(--font-nunito)",
											fontSize: "16px",
											fontWeight: 500,
										}}
									>
										Choose your data source
									</Typography>
									<Typography
										sx={{
											fontFamily: "var(--font-roboto)",
											fontSize: "12px",
											color: "rgba(95, 99, 104, 1)",
										}}
									>
										Choose your data source, and let {brandName} AI Audience
										Algorithm identify high-intent leads and create lookalike
										audiences to slash your acquisition costs.
									</Typography>
								</Box>
								<Box
									sx={{
										display: "flex",
										gap: 2,
										"@media (max-width: 420px)": {
											display: "grid",
											gridTemplateColumns: "1fr",
										},
									}}
								>
									<Box display="flex" gap="16px" sx={{ position: "relative" }}>
										{sourceTypes.map((el, index) => (
											<SourceTypeCard
												key={el.title}
												onSelect={handleChangeSourceType}
												selectedSourceType={sourceType}
												sourceTypeSchema={el}
											/>
										))}
										{/* {sourcesBuilderHints["sourceType"].show && (
											<HintCard
												card={builderHintCards["sourceType"]}
												positionLeft={220}
												positionTop={-50}
												isOpenBody={sourcesBuilderHints["sourceType"].showBody}
												toggleClick={() =>
													changeSourcesBuilderHint(
														"sourceType",
														"showBody",
														"toggle",
													)
												}
												closeClick={() =>
													changeSourcesBuilderHint(
														"sourceType",
														"showBody",
														"close",
													)
												}
											/>
										)} */}
									</Box>
								</Box>
							</Box>
						</Box>
						<CsvFieldMapperBlock
							block3Ref={{ current: null }}
							smallLogoSrc={smallLogoSrc ?? ""}
							file={new File([], "")}
							isChatGPTProcessing={false}
							hintsProps={{
								changeHint: () => {},
								hints: {
									dataMaping: {
										show: false,
										showBody: false,
									},
								} as HintStateMap<BuilderKey>,
								resetHints: () => {},
							}}
							isContinuePressed={false}
							sourceType={"Customer Conversions"}
							csvHeaders={["csv header"]}
							headingsNotSubstitution={{
								abc: true,
							}}
							mappingRows={[
								{
									id: 0,
									type: " ",
									value: "",
									canDelete: false,
									isHidden: false,
								},
							]}
							handleDelete={() => {}}
							handleAdd={() => {}}
							handleMapListChange={() => {}}
						/>
					</Box>
				</Box>
				{/* <PixelDomainSelector
					block4Ref={{
						current: null,
					}}
					pixelInstalled={false}
					isDomainSearchProcessing={false}
					selectedDomain={""}
					skeletons={{}}
					domains={[]}
					renderSkeleton={() => null}
					handleChangeDomain={() => {}}
					handlePixelInstall={() => {}}
					hintProps={{
						changeHint: () => {},
						hints: {
							pixelDomain: {},
						},
						resetHints: () => {},
					}}
				/> */}
			</Box>
		</>
	);
};
