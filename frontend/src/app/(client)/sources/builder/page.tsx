"use client";
import React, {
	ChangeEvent,
	useState,
	useEffect,
	Suspense,
	RefObject,
} from "react";
import {
	Box,
	Grid,
	Typography,
	TextField,
	FormControl,
	MenuItem,
	Select,
	LinearProgress,
	IconButton,
	Skeleton,
} from "@mui/material";
import { FileUploadOutlinedIcon, DeleteOutlinedIcon } from "@/icon";
import Image from "next/image";
import { useSearchParams, usePathname } from "next/navigation";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import { sourcesStyles } from "../sourcesStyles";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import { showErrorToast } from "@/components/ToastNotification";
import { styled } from "@mui/material/styles";
import CustomToolTip from "@/components/customToolTip";
import { useNotification } from "@/context/NotificationContext";
import Papa, { ParseResult } from "papaparse";
import ProgressBar from "@/components/ProgressBar";
import HintCard from "../../components/HintCard";
import { useSourcesHints } from "../context/SourcesHintsContext";
import { builderHintCards } from "../context/hintsCardsContent";
import { useSourcesBuilder } from "../context/SourceBuilderContext";
import { BuilderKey } from "../context/hintsCardsContent";
import HintBanner from "./components/HintBanner";
import { SourceTypeCard } from "@/app/features/sources/builder/SourceTypeCard";
import { sourceTypes } from "@/app/features/sources/builder/schemas";
import {
	HintAction,
	HintCardInterface,
	HintStateMap,
} from "@/utils/hintsUtils";
import { BorderLinearProgress } from "@/components/ui/progress-bars/BorderLinearProgress";
import { PixelDomainSelector } from "@/app/(client)/sources/builder/components/PixelDomainSelector";
import { useWhitelabel } from "@/app/features/whitelabel/contexts/WhitelabelContext";
import { LogoSmall } from "@/components/ui/Logo";
import { T } from "@/components/ui/T";
import scrollToBlock from "@/utils/autoscroll";
import { CustomButton } from "@/components/ui";
import ChooseDomainContactType from "./components/ChooseDomainContactType";
import SelectTargetType from "./components/SelectTargetType";
import CreateSourceForm from "./components/CreateSourceForm";
import {
	DomainsLeads,
	SourceType,
	InterfaceMappingRowsSourceType,
	Row,
} from "./components/types";

const SourcesImport: React.FC = () => {
	const {
		changeSourcesBuilderHint,
		sourcesBuilderHints,
		resetSourcesBuilderHints,
	} = useSourcesHints();
	const [isChatGPTProcessing, setIsChatGPTProcessing] = useState(false);
	const [isDomainSearchProcessing, setIsDomainSearchProcessing] =
		useState(false);
	const [loading, setLoading] = useState(false);
	const [isContinuePressed, setIsContinuePressed] = useState(false);
	const [fileSizeStr, setFileSizeStr] = useState<string>("");
	const [dragActive, setDragActive] = useState(false);
	const [uploadProgress, setUploadProgress] = useState<number | null>(null);
	const [headersinCSV, setHeadersinCSV] = useState<string[]>([]);
	const { hasNotification } = useNotification();

	const { whitelabel } = useWhitelabel();

	const customerConversionHeadingSubstitution = {
		"Transaction Date": false,
		"Order Amount": false,
		"Order Count": false,
	};

	const failedLeadsHeadingSubstitution = {
		"Lead Date": false,
	};

	const interestHeadingSubstitution = {
		"Interest Date": false,
	};

	interface InterfaceMappingHeadingSubstitution {
		[key: string]: Record<string, boolean>;
	}

	const mappingHeadingSubstitution: InterfaceMappingHeadingSubstitution = {
		Interest: interestHeadingSubstitution,
		"Failed Leads": failedLeadsHeadingSubstitution,
		"Customer Conversions": customerConversionHeadingSubstitution,
	};

	const searchParams = useSearchParams();
	const typeFromSearchParams = searchParams.get("type");
	const pathname = usePathname();
	const isGetStartedPage = pathname.includes("get-started");

	const {
		block1Ref,
		block2Ref,
		block3Ref,
		block4Ref,
		skeletons,
		setDomains,
		showTargetStep,
		selectedDomain,
		setSelectedDomain,
		setShowTargetStep,
		setDomainsWithoutPixel,
		pixelNotInstalled,
		setPixelNotInstalled,
		selectedDomainId,
		setSelectedDomainId,
		closeSkeleton,
		openDotHintClick,
		closeDotHintClick,
		setTargetAudience,
		targetAudience,
		sourceMethod,
		setSourceMethod,
		sourceType,
		setSourceType,
		setHeadingsNotSubstitution,
		defautlHeadingSubstitution,
		defaultMapping,
		headingsNotSubstitution,
		mappingRowsSourceType,
		hasUnsubstitutedHeadings,
		setFileUrl,
		handleDeleteFile,
		mappingRows,
		setMappingRows,
		file,
		setFile,
		fileName,
		setFileName,
	} = useSourcesBuilder();

	const sourceTypeDescriptions: Record<string, string> = {
		"Customer Conversions":
			"Please upload a CSV file containing the list of customers who have successfully completed an order on your website.",
		"Failed Leads":
			"Please upload a CSV file containing leads who did not complete a purchase or dropped off during the signup process.",
		Interest:
			"Please upload a CSV file of users who showed interest in your product or service, such as newsletter subscribers or ebook downloaders.",
	};

	// Mapping

	const handleMapListChange = (id: number, value: string, rowValue: string) => {
		setMappingRows(
			mappingRows.map((row) => (row.id === id ? { ...row, value } : row)),
		);

		setHeadingsNotSubstitution((prev) => ({
			...prev,
			[rowValue]: false,
		}));
	};

	const handleDelete = (id: number) => {
		setMappingRows(
			mappingRows.map((row) =>
				row.id === id ? { ...row, isHidden: true } : row,
			),
		);
	};

	const handleAdd = () => {
		const hiddenRowIndex = mappingRows.findIndex((row) => row.isHidden);
		if (hiddenRowIndex !== -1) {
			const updatedRows = [...mappingRows];
			updatedRows[hiddenRowIndex].isHidden = false;
			setMappingRows(updatedRows);
		}
	};

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

	const smartSubstitutionHeaders = async (headings: string[]) => {
		setIsChatGPTProcessing(true);
		try {
			const response = await axiosInstance.post(
				`/audience-sources/heading-substitution`,
				{ source_type: sourceType, headings },
				{
					headers: { "Content-Type": "application/json" },
				},
			);
			if (response.status === 200) {
				const updateEmployee = response.data;
				return updateEmployee;
			}
		} catch {
		} finally {
			setIsChatGPTProcessing(false);
		}
	};

	// Switching

	const handleChangeSourceType = (newSourceType: string) => {
		handleDeleteFile();
		setTargetAudience("");
		setSelectedDomainId(0);
		setShowTargetStep(false);
		setIsContinuePressed(false);

		closeDotHintClick("sourceType");
		if (newSourceType === "Website - Pixel") {
			setSourceMethod(2);
			closeSkeleton("pixelDomain");
			if (selectedDomain === "") {
				openDotHintClick("pixelDomain");
			}
			setTimeout(() => {
				scrollToBlock(block4Ref as RefObject<HTMLDivElement>);
			}, 0);
			fetchDomainsAndLeads();
		} else {
			setMappingRows([
				...defaultMapping,
				...mappingRowsSourceType[
					newSourceType as keyof InterfaceMappingRowsSourceType
				],
			]);
			setHeadingsNotSubstitution({
				...defautlHeadingSubstitution,
				...mappingHeadingSubstitution[
					newSourceType as keyof InterfaceMappingHeadingSubstitution
				],
			});
			setSourceMethod(1);
			closeSkeleton("sourceFile");
			if (sourceType === "") {
				openDotHintClick("sourceFile");
			}
			setPixelNotInstalled(false);
			setTimeout(() => {
				scrollToBlock(block2Ref as RefObject<HTMLDivElement>);
			}, 0);
		}

		setSelectedDomain("");
		setSourceType(newSourceType as SourceType);
	};

	// Uploading

	const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		setDragActive(true);
	};

	const handleDragLeave = () => {
		setDragActive(false);
	};

	const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		setDragActive(false);

		const uploadedFile = event.dataTransfer.files[0];
		if (uploadedFile) {
			handleFileUpload(uploadedFile);
		}
	};

	const validateFileSize = (file: File, maxSizeMB: number): boolean => {
		const fileSize = parseFloat((file.size / (1024 * 1024)).toFixed(2));
		if (fileSize > maxSizeMB) {
			handleDeleteFile();
			showErrorToast(
				"The uploaded CSV file exceeds the 500MB limit. Please reduce the file size and try again.",
			);
			return false;
		}
		setFileSizeStr(fileSize + " MB");
		setFileName(file.name);
		return true;
	};

	const validateRowCount = async (file: File): Promise<boolean> => {
		try {
			const maxRows = 200000;
			const text = await file.text();
			const lines = text.split(/\r\n|\n|\r/);

			const dataRowCount = lines.length - 1;

			if (dataRowCount > maxRows) {
				handleDeleteFile();
				showErrorToast(
					`The uploaded CSV file exceeds the limit of ${maxRows} rows (excluding header).`,
				);
				return false;
			}
			return true;
		} catch (e) {
			showErrorToast("Failed to validate row count.");
			return false;
		}
	};

	// Formatting and Sending

	const convertToDBFormat = (sourceType: string) => {
		return sourceType.split(" ").join("_").toLowerCase();
	};

	// Sample

	const downloadSampleFile = async () => {
		try {
			setLoading(true);
			if (sourceType !== "") {
				const response = await axiosInstance.get(
					`/audience-sources/sample-customers-list?&source_type=${convertToDBFormat(
						sourceType,
					)}`,
					{
						responseType: "blob",
					},
				);
				const url = window.URL.createObjectURL(new Blob([response.data]));
				const link = document.createElement("a");
				link.href = url;
				link.setAttribute("download", "sample-customers-list.csv");
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
			} else {
				showErrorToast("Please select source type");
			}
		} catch (error) {
			showErrorToast("Error downloading the file.");
		} finally {
			setLoading(false);
		}
	};

	// File Processing

	const getFileUploadUrl = async (fileType: string): Promise<string> => {
		try {
			const response = await fetch("/api/upload", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ fileType }),
			});

			const { url } = await response.json();

			if (!url) {
				throw new Error("Storage access error!");
			}

			setFileUrl(url);
			return url;
		} catch (error: unknown) {
			throw error;
		}
	};

	const uploadFile = (
		file: File,
		url: string,
		onProgress: (progress: number) => void,
	): Promise<void> => {
		return new Promise((resolve, reject) => {
			const xhr = new XMLHttpRequest();
			xhr.open("PUT", url);

			xhr.upload.onprogress = (event) => {
				if (event.lengthComputable) {
					const percentCompleted = Math.round(
						(event.loaded * 100) / event.total,
					);
					onProgress(percentCompleted);
				}
			};

			xhr.onload = () => resolve();
			xhr.onerror = () =>
				reject(
					new Error("Failed to upload file. Please contact our Support team"),
				);

			xhr.setRequestHeader("Content-Type", file.type);
			xhr.send(file);
		});
	};

	const processFileContent = async (
		parsedData: ParseResult<string[]>,
	): Promise<void> => {
		try {
			const { data } = parsedData;
			if (data.length < 501) {
				throw new Error("The uploaded Csv file is too small!");
			}

			const headers = data[0];
			const formatterHeaders = headers.map((el) => el.trim());
			setHeadersinCSV(formatterHeaders);

			if (
				formatterHeaders.length === 0 ||
				formatterHeaders.every((header: string) => header === "")
			) {
				throw new Error("CSV file doesn't contain headers!");
			}

			const newHeadings: string[] =
				await smartSubstitutionHeaders(formatterHeaders);

			type HeadingSubstitution = Record<string, boolean>;
			const typeHeadings = mappingHeadingSubstitution[sourceType];

			const newHeadingsMap: Record<string, string> = {};
			const headingKeys = [
				...Object.keys(defautlHeadingSubstitution),
				...Object.keys(mappingHeadingSubstitution[sourceType]),
			];

			const updatedHeadingSubstitution: Record<string, boolean> = {};
			headingKeys.forEach((key) => {
				updatedHeadingSubstitution[key] = newHeadingsMap[key] === "None";
			});

			headingKeys.forEach((key, index) => {
				updatedHeadingSubstitution[key] = newHeadings[index] === "None";
			});

			headingKeys.forEach((key, i) => {
				newHeadingsMap[key] = newHeadings[i]; // тут индекс совпадает
			});

			setHeadingsNotSubstitution(updatedHeadingSubstitution);

			const updatedRows = mappingRows.map((row) => {
				const mapped = newHeadingsMap[row.type];
				return {
					...row,
					value: mapped === "None" ? "" : mapped,
				};
			});

			setMappingRows(updatedRows);
		} catch (error: unknown) {
			throw error;
		}
	};

	const readFileContent = (file: File): Promise<ParseResult<string[]>> => {
		return new Promise((resolve, reject) => {
			Papa.parse<string[]>(file, {
				complete: (result: any) => {
					if (result.data && result.data.length > 0) {
						resolve(result);
					} else {
						reject(new Error("CSV file is empty or couldn't be parsed."));
					}
				},
				error: () => {
					reject(new Error(`Error parsing CSV file`));
				},
				skipEmptyLines: true,
			});
		});
	};

	const handleFileUpload = async (file: File) => {
		try {
			if (!file) return;

			if (!validateFileSize(file, 500)) return;

			if (!(await validateRowCount(file))) return;

			const url = await getFileUploadUrl(file.type);

			await uploadFile(file, url, setUploadProgress);
			setUploadProgress(null);

			setFile(file);

			const content = await readFileContent(file);
			await processFileContent(content);
			// setShowTargetStep(true)
		} catch (error: unknown) {
			if (error instanceof Error) {
				showErrorToast(error.message);
				handleDeleteFile();
			} else {
				showErrorToast("An unexpected error occurred during file upload.");
			}
			setUploadProgress(null);
		}
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
										Choose your data source, and let {whitelabel.brand_name} AI
										Audience Algorithm identify high-intent leads and create
										lookalike audiences to slash your acquisition costs.
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
												key={index}
												onSelect={handleChangeSourceType}
												selectedSourceType={sourceType}
												sourceTypeSchema={el}
											/>
										))}
										{sourcesBuilderHints["sourceType"].show && (
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
										)}
									</Box>
								</Box>
							</Box>

							{sourceMethod === 1 && sourceType !== "" && !file && (
								<Box
									ref={block2Ref}
									sx={{
										display: "flex",
										flexDirection: "column",
									}}
								>
									{!skeletons["sourceFile"] && (
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
											{uploadProgress !== null && (
												<Box
													sx={{
														width: "100%",
														position: "absolute",
														top: 0,
														left: 0,
														zIndex: 1200,
													}}
												>
													<LinearProgress
														variant="determinate"
														value={uploadProgress}
														sx={{
															borderRadius: "6px",
															backgroundColor: "#c6dafc",
															"& .MuiLinearProgress-bar": {
																borderRadius: 5,
																backgroundColor: "#4285f4",
															},
														}}
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
													Select your source file
												</Typography>
												<Typography
													sx={{
														fontFamily: "var(--font-roboto)",
														fontSize: "12px",
														color: "rgba(95, 99, 104, 1)",
													}}
												>
													{sourceTypeDescriptions[sourceType] ?? ""}
												</Typography>
											</Box>
											<Box
												sx={{
													display: "flex",
													alignItems: "center",
													width: "346px",
													border: dragActive
														? "2px dashed rgba(56, 152, 252, 1)"
														: "1px dashed rgba(56, 152, 252, 1)",
													borderRadius: "4px",
													padding: "8px 16px",
													height: "80px",
													gap: "16px",
													cursor: "pointer",
													backgroundColor: dragActive
														? "rgba(80, 82, 178, 0.1)"
														: "rgba(246, 248, 250, 1)",
													transition:
														"background-color 0.3s, border-color 0.3s",
													"@media (max-width: 390px)": {
														width: "calc(100vw - 74px)",
													},
													"&:hover": {
														backgroundColor: "#E1F0FF",
													},
												}}
												onDragOver={handleDragOver}
												onDragLeave={handleDragLeave}
												onDrop={handleDrop}
												onClick={() =>
													document.getElementById("fileInput")?.click()
												}
											>
												<IconButton
													sx={{
														width: "40px",
														height: "40px",
														borderRadius: "4px",
														backgroundColor: "rgba(56, 152, 252, 0.2)",
														"&:hover": {
															backgroundColor: "rgba(56, 152, 252, 0.2)",
														},
													}}
												>
													<FileUploadOutlinedIcon
														sx={{
															color: "rgba(56, 152, 252, 1)",
														}}
													/>
												</IconButton>
												<Box sx={{ flexGrow: 1 }}>
													<Typography
														sx={{
															fontFamily: "var(--font-nunito)",
															fontSize: "16px",
															fontWeight: "600",
															color: "rgba(56, 152, 252, 1)",
														}}
													>
														Upload a file
													</Typography>
													<Typography
														sx={{
															fontFamily: "var(--font-nunito)",
															fontSize: "14px",
															fontWeight: "500",
															color: "rgba(32, 33, 36, 1)",
														}}
													>
														CSV, Max 500MB, <TightNumber>500</TightNumber> to{" "}
														<TightNumber>200,000</TightNumber> Rows
													</Typography>
												</Box>
												<input
													id="fileInput"
													type="file"
													hidden
													accept=".csv"
													onChange={(event: ChangeEvent<HTMLInputElement>) => {
														const file = event.target.files?.[0];
														if (file) {
															handleFileUpload(file);
														}
														event.target.value = "";
													}}
												/>
											</Box>
											{sourceType && file && (
												<Box
													sx={{
														display: "flex",
														alignItems: "center",
														width: "316px",
														border: "1px solid rgba(228, 228, 228, 1)",
														borderRadius: "4px",
														padding: "8px 16px",
														height: "80px",
														backgroundColor: "rgba(246, 248, 250, 1)",
														gap: "16px",
														"@media (max-width: 390px)": {
															width: "calc(100vw - 74px)",
														},
													}}
												>
													<Box sx={{ flexGrow: 1 }}>
														<Typography
															sx={{
																fontFamily: "var(--font-nunito)",
																fontSize: "16px",
																fontWeight: "600",
																color: "rgba(32, 33, 36, 1)",
																maxWidth: "13.75rem",
																overflow: "hidden",
																textWrap: "wrap",
																textOverflow: "ellipsis",
															}}
														>
															{fileName}
														</Typography>
														<Typography
															sx={{
																fontFamily: "var(--font-nunito)",
																fontSize: "12px",
																fontWeight: "600",
																color: "rgba(74, 74, 74, 1)",
															}}
														>
															{fileSizeStr}
														</Typography>
													</Box>
													<IconButton onClick={handleDeleteFile}>
														<DeleteOutlinedIcon />
													</IconButton>
												</Box>
											)}

											{sourceType && (
												<Typography
													className="main-text"
													component="div"
													sx={{
														...sourcesStyles.text,
														gap: 0.25,
														pt: 1,
														fontSize: "12px",
														"@media (max-width: 700px)": { mb: 1 },
													}}
												>
													Sample doc:{" "}
													<Typography
														onClick={downloadSampleFile}
														component="span"
														sx={{
															...sourcesStyles.text,
															color: "rgba(56, 152, 252, 1)",
															cursor: "pointer",
															fontWeight: 400,
														}}
													>
														sample recent customers-list.csv
													</Typography>
												</Typography>
											)}

											{sourcesBuilderHints["sourceFile"].show && (
												<HintCard
													card={builderHintCards["sourceFile"]}
													positionLeft={360}
													positionTop={100}
													isOpenBody={
														sourcesBuilderHints["sourceFile"].showBody
													}
													toggleClick={() =>
														changeSourcesBuilderHint(
															"sourceFile",
															"showBody",
															"toggle",
														)
													}
													closeClick={() =>
														changeSourcesBuilderHint(
															"sourceFile",
															"showBody",
															"close",
														)
													}
												/>
											)}
										</Box>
									)}
									{renderSkeleton("sourceFile", "231px")}
								</Box>
							)}

							{sourceMethod === 1 && (
								<Box
									ref={block3Ref}
									sx={{
										display: file ? "flex" : "none",
										flexDirection: "column",
										position: "relative",
										gap: 2,
										flexWrap: "wrap",
										border: "1px solid rgba(228, 228, 228, 1)",
										borderRadius: "6px",
										padding: "20px",
									}}
								>
									{isChatGPTProcessing && (
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
										sx={{ display: "flex", flexDirection: "column", gap: 1 }}
									>
										<Typography
											sx={{
												fontFamily: "var(--font-nunito)",
												fontSize: "16px",
												fontWeight: 500,
											}}
										>
											Data Maping
										</Typography>
										<Typography
											sx={{
												fontFamily: "var(--font-roboto)",
												fontSize: "12px",
												color: "rgba(95, 99, 104, 1)",
											}}
										>
											Map your Field from your Source to the destination data
											base.
										</Typography>
										{!isContinuePressed && (
											<HintBanner sourceType={sourceType} />
										)}
									</Box>

									<Box
										sx={{
											position: "relative",
											display: "flex",
											flexDirection: "column",
											gap: 1,
										}}
									>
										<Grid
											container
											alignItems="center"
											sx={{ flexWrap: { xs: "nowrap", sm: "wrap" } }}
										>
											<Grid item xs={5} sm={3} sx={{ textAlign: "center" }}>
												<LogoSmall alt="logo" height={22} width={34} />
											</Grid>
											<Grid item xs={1} sm={0.5}>
												&nbsp;
											</Grid>
											<Grid item xs={5} sm={3} sx={{ textAlign: "center" }}>
												<Image
													src="/csv-icon.svg"
													alt="scv"
													height={22}
													width={34}
												/>
											</Grid>
										</Grid>
										{mappingRows
											?.filter((row) => !row.isHidden)
											.sort((a, b) => {
												if (a.type === "Phone number") return 1;
												if (b.type === "Phone number") return -1;
												return 0;
											})
											.map((row, index) => (
												<Box
													key={index}
													sx={{
														mb: headingsNotSubstitution[row.type] ? "10px" : 0,
													}}
												>
													<Grid
														container
														spacing={2}
														alignItems="center"
														sx={{ flexWrap: { xs: "nowrap", sm: "wrap" } }}
													>
														{/* Left Input Field */}
														<Grid item xs={5} sm={3}>
															<TextField
																fullWidth
																variant="outlined"
																value={row.type}
																disabled={true}
																InputLabelProps={{
																	sx: {
																		fontFamily: "var(--font-nunito)",
																		fontSize: "12px",
																		lineHeight: "16px",
																		color: "rgba(17, 17, 19, 0.60)",
																		top: "-5px",
																		"&.Mui-focused": {
																			color: "rgba(56, 152, 252, 1)",
																			top: 0,
																		},
																		"&.MuiInputLabel-shrink": {
																			top: 0,
																		},
																	},
																}}
																InputProps={{
																	sx: {
																		"&.MuiOutlinedInput-root": {
																			height: "36px",
																			"& .MuiOutlinedInput-input": {
																				padding: "6.5px 8px",
																				fontFamily: "var(--font-roboto)",
																				color: "#202124",
																				fontSize: "12px",
																				fontWeight: "400",
																				lineHeight: "20px",
																			},
																			"& .MuiOutlinedInput-notchedOutline": {
																				borderColor: "#A3B0C2",
																			},
																			"&:hover .MuiOutlinedInput-notchedOutline":
																				{
																					borderColor: "#A3B0C2",
																				},
																			"&.Mui-focused .MuiOutlinedInput-notchedOutline":
																				{
																					borderColor: "rgba(56, 152, 252, 1)",
																				},
																		},
																		"&+.MuiFormHelperText-root": {
																			marginLeft: "0",
																		},
																	},
																}}
															/>
														</Grid>

														{/* Middle Icon Toggle (Right Arrow or Close Icon) */}
														<Grid
															item
															xs={1}
															sm={0.5}
															container
															justifyContent="center"
														>
															<Image
																src="/chevron-right-purple.svg"
																alt="chevron-right-purple"
																height={18}
																width={18}
															/>
														</Grid>

														<Grid item xs={5} sm={3}>
															<FormControl fullWidth sx={{ height: "36px" }}>
																<Select
																	value={row.value || ""}
																	onChange={(e) =>
																		handleMapListChange(
																			row.id,
																			e.target.value,
																			row.type,
																		)
																	}
																	displayEmpty
																	inputProps={{
																		sx: {
																			height: "36px",
																			padding: "6.5px 8px",
																			fontFamily: "var(--font-roboto)",
																			fontSize: "12px",
																			fontWeight: "400",
																			color: "#202124",
																			lineHeight: "20px",
																		},
																	}}
																	sx={{
																		"&.MuiOutlinedInput-root": {
																			height: "36px",
																			"& .MuiOutlinedInput-notchedOutline": {
																				borderColor: "#A3B0C2",
																			},
																			"&:hover .MuiOutlinedInput-notchedOutline":
																				{
																					borderColor: "#A3B0C2",
																				},
																			"&.Mui-focused .MuiOutlinedInput-notchedOutline":
																				{
																					borderColor: "rgba(56, 152, 252, 1)",
																				},
																		},
																	}}
																>
																	{headersinCSV.map(
																		(item: string, index: number) => (
																			<MenuItem key={index} value={item}>
																				{item}
																			</MenuItem>
																		),
																	)}
																</Select>
																{!row.canDelete &&
																	headingsNotSubstitution[row.type] &&
																	headingsNotSubstitution[row.type] && (
																		<Typography
																			sx={{
																				fontFamily: "var(--font-nunito)",
																				fontSize: "12px",
																				color: "rgba(224, 49, 48, 1)",
																			}}
																		>
																			Please match
																		</Typography>
																	)}
															</FormControl>
														</Grid>

														{/* Delete Icon */}
														<Grid
															item
															xs={1}
															sm={0.5}
															container
															justifyContent="center"
														>
															{row.canDelete && (
																<>
																	<IconButton
																		onClick={() => handleDelete(row.id)}
																	>
																		<Image
																			src="/trash-icon-filled.svg"
																			alt="trash-icon-filled"
																			height={18}
																			width={18}
																		/>
																	</IconButton>
																</>
															)}
														</Grid>
													</Grid>
												</Box>
											))}
										{mappingRows.some((row) => row.isHidden) && (
											<Box
												sx={{ display: "flex", justifyContent: "flex-start" }}
												onClick={handleAdd}
											>
												<Typography
													sx={{
														fontFamily: "var(--font-nunito)",
														lineHeight: "22.4px",
														fontSize: "14px",
														fontWeight: "600",
														color: "rgba(56, 152, 252, 1)",
														cursor: "pointer",
													}}
												>
													+ Add more
												</Typography>
											</Box>
										)}
										{sourcesBuilderHints["dataMaping"].show && (
											<HintCard
												card={builderHintCards["dataMaping"]}
												positionLeft={460}
												isOpenBody={sourcesBuilderHints["dataMaping"].showBody}
												toggleClick={() =>
													changeSourcesBuilderHint(
														"dataMaping",
														"showBody",
														"toggle",
													)
												}
												closeClick={() =>
													changeSourcesBuilderHint(
														"dataMaping",
														"showBody",
														"close",
													)
												}
											/>
										)}
									</Box>

									{!showTargetStep && (
										<Box sx={{ display: "flex", justifyContent: "right" }}>
											<CustomButton
												disabled={
													isChatGPTProcessing || hasUnsubstitutedHeadings()
												}
												variant="contained"
												onClick={() => {
													setShowTargetStep(true);
													setTimeout(() => {
														scrollToBlock(
															block4Ref as RefObject<HTMLDivElement>,
														);
													}, 0);
													closeDotHintClick("sourceFile");
													openDotHintClick("targetType");
													closeSkeleton("targetType");
													setIsContinuePressed(true);
												}}
												sx={{
													width: "120px",
													height: "40px",
												}}
											>
												Continue
											</CustomButton>
										</Box>
									)}
								</Box>
							)}

							{sourceMethod === 2 && (
								<PixelDomainSelector
									pixelInstalled={!pixelNotInstalled}
									isDomainSearchProcessing={isDomainSearchProcessing}
									renderSkeleton={renderSkeleton}
									hintProps={{
										changeHint: changeSourcesBuilderHint,
										hints: sourcesBuilderHints,
										resetHints: resetSourcesBuilderHints,
									}}
								/>
							)}

							{sourceMethod === 2 && selectedDomainId ? (
								<ChooseDomainContactType
									renderSkeleton={renderSkeleton}
									closeDotHintClick={closeDotHintClick}
									openDotHintClick={openDotHintClick}
									closeSkeleton={closeSkeleton}
								/>
							) : null}

							{showTargetStep &&
								sourceMethod !== 0 &&
								(selectedDomainId || file) && (
									<SelectTargetType
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
									<CreateSourceForm
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
			<SourcesImport />
		</Suspense>
	);
};

export default SourceBuilder;

const TightNumber = styled(T)`
letter-spacing: -0.7px;
display: inline;
font-family: var(--font-nunito);
font-size: 14px;
font-weight: 500;
color: rgba(32, 33, 36, 1);
`;
