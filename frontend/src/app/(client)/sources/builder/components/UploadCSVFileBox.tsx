import React, { ChangeEvent, ReactNode, useState } from "react";
import {
	Box,
	IconButton,
	LinearProgress,
	styled,
	Typography,
} from "@mui/material";
import HintCard from "../../../components/HintCard";
import { useSourcesHints } from "../../context/SourcesHintsContext";
import { useSourcesBuilder } from "../../context/SourceBuilderContext";
import { builderHintCards } from "../../context/hintsCardsContent";
import { BuilderKey } from "../../context/hintsCardsContent";
import { FileUploadOutlinedIcon, DeleteOutlinedIcon } from "@/icon";
import { sourcesStyles } from "../../sourcesStyles";
import { showErrorToast } from "@/components/ToastNotification";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import Papa, { ParseResult } from "papaparse";

interface ChooseDomainContactTypeProps {
	renderSkeleton: (key: BuilderKey, height: string) => ReactNode;
	setLoading: (state: boolean) => void;
	convertToDBFormat: (sourceType: string) => string;
}

const sourceTypeDescriptions: Record<string, string> = {
	"Customer Conversions":
		"Please upload a CSV file containing the list of customers who have successfully completed an order on your website.",
	"Failed Leads":
		"Please upload a CSV file containing leads who did not complete a purchase or dropped off during the signup process.",
	Interest:
		"Please upload a CSV file of users who showed interest in your product or service, such as newsletter subscribers or ebook downloaders.",
};

const UploadCSVFileBox: React.FC<ChooseDomainContactTypeProps> = ({
	renderSkeleton,
	setLoading,
	convertToDBFormat,
}) => {
	const {
		changeSourcesBuilderHint,
		sourcesBuilderHints,
		resetSourcesBuilderHints,
	} = useSourcesHints();

	const [dragActive, setDragActive] = useState(false);
	const [uploadProgress, setUploadProgress] = useState<number | null>(null);
	const [fileSizeStr, setFileSizeStr] = useState<string>("");

	const {
		block2Ref,
		skeletons,
		file,
		sourceType,
		fileName,
		mappingRows,
		handleDeleteFile,
		setHeadingsNotSubstitution,
		setFile,
		setFileUrl,
		setMappingRows,
		setHeadersinCSV,
		setIsChatGPTProcessing,
		setFileName,
		defautlHeadingSubstitution,
		mappingHeadingSubstitution,
	} = useSourcesBuilder();

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

			let updatedHeadingSubstitution: Record<string, boolean> = {};
			headingKeys.forEach((key) => {
				updatedHeadingSubstitution[key] = newHeadingsMap[key] === "None";
			});

			headingKeys.forEach((key, index) => {
				updatedHeadingSubstitution[key] = newHeadings[index] === "None";
			});

			headingKeys.forEach((key, i) => {
				newHeadingsMap[key] = newHeadings[i]; // тут индекс совпадает
			});

			if (updatedHeadingSubstitution["ASID"] === false) {
				updatedHeadingSubstitution = Object.fromEntries(
					Object.entries(updatedHeadingSubstitution).filter(([heading]) => {
						const row = mappingRows.find(
							(r) => r.type === heading || r.value === heading,
						);
						return row && row.isRequiredForAsidMatching;
					}),
				) as Record<string, boolean>;
			}

			setHeadingsNotSubstitution(updatedHeadingSubstitution);

			setMappingRows((prev) => {
				const updated = prev.map((row) => {
					const mapped = newHeadingsMap[row.type];
					return {
						...row,
						value: mapped === "None" ? "" : mapped,
					};
				});

				if (newHeadingsMap["ASID"] !== "None") {
					return updated
						.filter((row) => row.isRequiredForAsidMatching)
						.map((row) => {
							if (row.type === "ASID") {
								return { ...row, canDelete: false };
							} else {
								return { ...row };
							}
						});
				} else {
					return updated.filter((row) => row.type !== "ASID");
				}
			});
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

	return (
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
							transition: "background-color 0.3s, border-color 0.3s",
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
						onClick={() => document.getElementById("fileInput")?.click()}
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
							isOpenBody={sourcesBuilderHints["sourceFile"].showBody}
							toggleClick={() =>
								changeSourcesBuilderHint("sourceFile", "showBody", "toggle")
							}
							closeClick={() =>
								changeSourcesBuilderHint("sourceFile", "showBody", "close")
							}
						/>
					)}
				</Box>
			)}
			{renderSkeleton("sourceFile", "231px")}
		</Box>
	);
};

export default UploadCSVFileBox;

const TightNumber = styled(Typography)`
letter-spacing: -0.7px;
display: inline;
font-family: var(--font-nunito);
font-size: 14px;
font-weight: 500;
color: rgba(32, 33, 36, 1);
`;
