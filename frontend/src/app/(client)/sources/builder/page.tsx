"use client";
import React, { useState, useEffect, Suspense, RefObject } from "react";
import { Box, Typography, Skeleton } from "@mui/material";
import { useSearchParams, usePathname } from "next/navigation";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import CustomToolTip from "@/components/customToolTip";
import { useNotification } from "@/context/NotificationContext";
import ProgressBar from "@/components/ProgressBar";
import { useSourcesHints } from "../context/SourcesHintsContext";
import { useSourcesBuilder } from "../context/SourceBuilderContext";
import { BuilderKey } from "../context/hintsCardsContent";
import PixelDomainSelectorBox from "./components/PixelDomainSelectorBox";
import scrollToBlock from "@/utils/autoscroll";
import ChooseDomainContactTypeBox from "./components/ChooseDomainContactTypeBox";
import SelectTargetTypeBox from "./components/SelectTargetTypeBox";
import CreateSourceFormBox from "./components/CreateSourceFormBox";
import DataMapingBox from "./components/DataMappingBox";
import UploadCSVFileBox from "./components/UploadCSVFileBox";
import ChooseSourceTypeBox from "./components/ChooseSourceTypeBox";
import { DomainsLeads, SourceType } from "./components/types";
import { SourceBuilderProvider } from "../context/SourceBuilderContext";

const SourcesImport: React.FC = () => {
	const {
		changeSourcesBuilderHint,
		sourcesBuilderHints,
		resetSourcesBuilderHints,
	} = useSourcesHints();
	const [isDomainSearchProcessing, setIsDomainSearchProcessing] =
		useState(false);
	const [loading, setLoading] = useState(false);
	const { hasNotification } = useNotification();

	const searchParams = useSearchParams();
	const typeFromSearchParams = searchParams.get("type");
	const pathname = usePathname();
	const isGetStartedPage = pathname.includes("get-started");

	const {
		block4Ref,
		skeletons,
		setDomains,
		showTargetStep,
		setShowTargetStep,
		setDomainsWithoutPixel,
		pixelNotInstalled,
		setPixelNotInstalled,
		selectedDomainId,
		closeSkeleton,
		openDotHintClick,
		closeDotHintClick,
		targetAudience,
		sourceMethod,
		setSourceMethod,
		sourceType,
		setSourceType,
		file,
	} = useSourcesBuilder();

	useEffect(() => {
		resetSourcesBuilderHints();
	}, []);

	useEffect(() => {
		setShowTargetStep(false);
		if (typeFromSearchParams) {
			closeDotHintClick("sourceType");
			let newType = "";
			if (typeFromSearchParams === "pixel") {
				newType = "Website - Pixel";
				setTimeout(() => {
					scrollToBlock(block4Ref as RefObject<HTMLDivElement>);
				}, 0);
				fetchDomainsAndLeads();
				closeSkeleton("pixelDomain");
				setSourceMethod(2);
				openDotHintClick("pixelDomain");
			} else {
				// openDotHintClick("sourceFile");
				// setMappingRows([...defaultMapping, ...mappingRowsSourceType[newType as keyof InterfaceMappingRowsSourceType]]);
				// setSourceMethod(1);
				// setTimeout(() => {
				//   scrollToBlock(block2Ref);
				// }, 0);
				// closeSkeleton("sourceFile")
			}

			setSourceType(newType as SourceType);
		}
	}, [typeFromSearchParams]);

	// Formatting and Sending

	const convertToDBFormat = (sourceType: string) => {
		return sourceType.split(" ").join("_").toLowerCase();
	};

	// Pixel

	const fetchDomainsAndLeads = async () => {
		setIsDomainSearchProcessing(true);
		try {
			const response = await axiosInstance.get(
				`/audience-sources/domains-with-leads`,
			);
			if (response.status === 200) {
				const domains = response.data;
				setDomains(
					domains.filter((domain: DomainsLeads) => domain.pixel_installed),
				);
				setDomainsWithoutPixel(
					domains.filter((domain: DomainsLeads) => !domain.pixel_installed),
				);
				setPixelNotInstalled(
					domains.length === 0 ||
						domains.some((domain: DomainsLeads) => !domain.pixel_installed),
				);
			}
		} catch {
		} finally {
			setIsDomainSearchProcessing(false);
		}
	};

	const renderSkeleton = (arg: BuilderKey, height: string = "20vh") => {
		if (!skeletons[arg]) return null;
		return (
			<Skeleton
				key={arg}
				variant="rectangular"
				animation="wave"
				width="100%"
				height={height}
				sx={{ borderRadius: "4px" }}
			/>
		);
	};

	return (
		<>
			{loading && <CustomizedProgressBar />}
			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					height: isGetStartedPage ? "100%" : "calc(100vh - 4.25rem)",
					overflow: "auto",
					pb: 4.5,
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
							<ChooseSourceTypeBox
								fetchDomainsAndLeads={fetchDomainsAndLeads}
								closeDotHintClick={closeDotHintClick}
								openDotHintClick={openDotHintClick}
								closeSkeleton={closeSkeleton}
							/>

							{sourceMethod === 1 && sourceType !== "" && !file && (
								<UploadCSVFileBox
									renderSkeleton={renderSkeleton}
									setLoading={setLoading}
									convertToDBFormat={convertToDBFormat}
								/>
							)}

							{sourceMethod === 1 && (
								<DataMapingBox
									renderSkeleton={renderSkeleton}
									closeDotHintClick={closeDotHintClick}
									openDotHintClick={openDotHintClick}
									closeSkeleton={closeSkeleton}
								/>
							)}

							{sourceMethod === 2 && (
								<PixelDomainSelectorBox
									pixelInstalled={!pixelNotInstalled}
									isDomainSearchProcessing={isDomainSearchProcessing}
									renderSkeleton={renderSkeleton}
									setLoading={setLoading}
									hintProps={{
										changeHint: changeSourcesBuilderHint,
										hints: sourcesBuilderHints,
										resetHints: resetSourcesBuilderHints,
									}}
								/>
							)}

							{sourceMethod === 2 && selectedDomainId ? (
								<ChooseDomainContactTypeBox
									renderSkeleton={renderSkeleton}
									closeDotHintClick={closeDotHintClick}
									openDotHintClick={openDotHintClick}
									closeSkeleton={closeSkeleton}
								/>
							) : null}

							{showTargetStep &&
								sourceMethod !== 0 &&
								(selectedDomainId || file) && (
									<SelectTargetTypeBox
										renderSkeleton={renderSkeleton}
										closeDotHintClick={closeDotHintClick}
										openDotHintClick={openDotHintClick}
										closeSkeleton={closeSkeleton}
									/>
								)}

							{sourceMethod !== 0 &&
							targetAudience !== "" &&
							(file || selectedDomainId) ? (
								<>
									<CreateSourceFormBox
										renderSkeleton={renderSkeleton}
										setLoading={setLoading}
										convertToDBFormat={convertToDBFormat}
									/>
								</>
							) : null}
						</Box>
					</Box>
				</Box>
			</Box>
		</>
	);
};

const SourceBuilder: React.FC = () => {
	return (
		<Suspense fallback={<ProgressBar />}>
			<SourceBuilderProvider>
				<SourcesImport />
			</SourceBuilderProvider>
		</Suspense>
	);
};

export default SourceBuilder;
