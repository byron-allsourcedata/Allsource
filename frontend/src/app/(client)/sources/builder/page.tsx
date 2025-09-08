"use client";
import React, {
	ChangeEvent,
	useState,
	useEffect,
	useRef,
	Suspense,
	FC,
	RefObject,
	ReactNode,
} from "react";
import {
	Box,
	Grid,
	Typography,
	TextField,
	Button,
	FormControl,
	MenuItem,
	Select,
	LinearProgress,
	SelectChangeEvent,
	IconButton,
	ToggleButton,
	Skeleton,
	CardContent,
	Card,
	CardMedia,
	CardActionArea,
} from "@mui/material";
import Image from "next/image";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import { sourcesStyles } from "../sourcesStyles";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import { showErrorToast, showToast } from "@/components/ToastNotification";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import { styled } from "@mui/material/styles";
import CustomToolTip from "@/components/customToolTip";
import { useNotification } from "@/context/NotificationContext";
import Papa, { ParseResult } from "papaparse";
import ProgressBar from "@/components/ProgressBar";
import HintCard from "../../components/HintCard";
import { useSourcesHints } from "../context/SourcesHintsContext";
import { builderHintCards } from "../context/hintsCardsContent";
import { fetchUserData } from "@/services/meService";
import { useSidebar } from "@/context/SidebarContext";
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
import {
	PixelDomainSelector,
	type SkeletonState,
} from "@/app/features/sources/builder/components/PixelDomainSelector";
import { useWhitelabel } from "@/app/features/whitelabel/contexts/WhitelabelContext";
import { LogoSmall } from "@/components/ui/Logo";
import { T } from "@/components/ui/T";

interface Row {
	id: number;
	type: string;
	value: string;
	canDelete: boolean;
	isHidden: boolean;
}

interface EventTypeInterface {
	id: number;
	name: string;
	title: string;
}

interface InterfaceMappingRowsSourceType {
	"Failed Leads": Row[];
	Interest: Row[];
	"Customer Conversions": Row[];
}

interface NewSource {
	target_schema: string;
	source_type: string;
	source_origin: string;
	source_name: string;
	file_url?: string;
	rows?: { type: string; value: string }[];
	domain_id?: number;
}

export interface DomainsLeads {
	id: number;
	name: string;
	pixel_installed: boolean;
	converted_sales_count: number;
	viewed_product_count: number;
	visitor_count: number;
	abandoned_cart_count: number;
	total_count: number;
}

const SourcesImport: React.FC = () => {
	const {
		changeSourcesBuilderHint,
		sourcesBuilderHints,
		resetSourcesBuilderHints,
	} = useSourcesHints();
	const { setIsGetStartedPage, setInstalledResources } = useSidebar();
	const router = useRouter();
	const [isChatGPTProcessing, setIsChatGPTProcessing] = useState(false);
	const [isDomainSearchProcessing, setIsDomainSearchProcessing] =
		useState(false);
	const [file, setFile] = useState<File | null>(null);
	const [loading, setLoading] = useState(false);
	const [isContinuePressed, setIsContinuePressed] = useState(false);
	const [sourceType, setSourceType] = useState<string>("");
	const [selectedDomain, setSelectedDomain] = useState<string>("");
	const [sourceName, setSourceName] = useState<string>("");
	const [fileSizeStr, setFileSizeStr] = useState<string>("");
	const [fileName, setFileName] = useState<string>("");
	const [fileUrl, setFileUrl] = useState<string>("");
	const [sourceMethod, setSourceMethod] = useState<number>(0);
	const [selectedDomainId, setSelectedDomainId] = useState<number>(0);
	const [dragActive, setDragActive] = useState(false);
	const [pixelNotInstalled, setPixelNotInstalled] = useState(false);
	const [uploadProgress, setUploadProgress] = useState<number | null>(null);
	const [headersinCSV, setHeadersinCSV] = useState<string[]>([]);
	const { hasNotification } = useNotification();
	const [targetAudience, setTargetAudience] = useState<string>("");

	const [eventType, setEventType] = useState<number[]>([]);
	const [domains, setDomains] = useState<DomainsLeads[]>([]);
	const [domainsWithoutPixel, setDomainsWithoutPixel] = useState<
		DomainsLeads[]
	>([]);
	const [showTargetStep, setShowTargetStep] = useState(false);

	const { whitelabel } = useWhitelabel();

	const defautlHeadingSubstitution = {
		Email: false,
		"Phone number": false,
		"Last Name": false,
		"First Name": false,
	};

	const customerConversionHeadingSubstitution = {
		"Transaction Date": false,
		"Order Amount": false,
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

	const [headingsNotSubstitution, setHeadingsNotSubstitution] = useState<
		Record<string, boolean>
	>(defautlHeadingSubstitution);

	const initialSkeletons: SkeletonState = {
		sourceType: false,
		pixelDomain: true,
		dataSource: true,
		sourceFile: true,
		dataMaping: true,
		targetType: true,
		name: true,
	};

	const [skeletons, setSkeletons] = useState<SkeletonState>(initialSkeletons);

	const [totalLeads, setTotalLeads] = useState(0);
	const [matchedLeads, setMatchedLeads] = useState(0);

	const searchParams = useSearchParams();
	const typeFromSearchParams = searchParams.get("type");
	const pathname = usePathname();
	const isGetStartedPage = pathname.includes("get-started");

	const block1Ref = useRef<HTMLDivElement | null>(null);
	const block2Ref = useRef<HTMLDivElement | null>(null);
	const block3Ref = useRef<HTMLDivElement | null>(null);
	const block4Ref = useRef<HTMLDivElement | null>(null);
	const block5Ref = useRef<HTMLDivElement | null>(null);
	const block6Ref = useRef<HTMLDivElement | null>(null);

	const eventTypes: EventTypeInterface[] = [
		{ id: 1, name: "visitor_count", title: "visitor" },
		{ id: 2, name: "viewed_product_count", title: "viewed_product" },
		{ id: 3, name: "abandoned_cart_count", title: "abandoned_cart" },
		{ id: 4, name: "converted_sales_count", title: "converted_sales" },
	];

	const sourceTypeDescriptions: Record<string, string> = {
		"Customer Conversions":
			"Please upload a CSV file containing the list of customers who have successfully completed an order on your website.",
		"Failed Leads":
			"Please upload a CSV file containing leads who did not complete a purchase or dropped off during the signup process.",
		Interest:
			"Please upload a CSV file of users who showed interest in your product or service, such as newsletter subscribers or ebook downloaders.",
	};

	const closeDotHintClick = (key: BuilderKey) => {
		changeSourcesBuilderHint(key, "show", "close");
	};

	const openDotHintClick = (key: BuilderKey) => {
		changeSourcesBuilderHint(key, "show", "open");
	};

	const defaultMapping: Row[] = [
		{ id: 1, type: "Email", value: "", canDelete: false, isHidden: false },
		{
			id: 2,
			type: "Phone number",
			value: "",
			canDelete: true,
			isHidden: false,
		},
		{ id: 3, type: "Last Name", value: "", canDelete: false, isHidden: false },
		{ id: 4, type: "First Name", value: "", canDelete: false, isHidden: false },
	];

	const customerConversionsMapping: Row[] = [
		{
			id: 6,
			type: "Transaction Date",
			value: "",
			canDelete: true,
			isHidden: false,
		},
		{
			id: 5,
			type: "Order Amount",
			value: "",
			canDelete: false,
			isHidden: false,
		},
	];

	const failedLeadsMapping: Row[] = [
		{
			id: 5,
			type: "Lead Date",
			value: "",
			canDelete: true,
			isHidden: false,
		},
	];

	const interestMapping: Row[] = [
		{
			id: 5,
			type: "Interest Date",
			value: "",
			canDelete: true,
			isHidden: false,
		},
	];

	const mappingRowsSourceType: InterfaceMappingRowsSourceType = {
		Interest: interestMapping,
		"Failed Leads": failedLeadsMapping,
		"Customer Conversions": customerConversionsMapping,
	};

	const [mappingRows, setMappingRows] = useState<Row[]>([]);

	const scrollToBlock = (blockRef: React.RefObject<HTMLDivElement>) => {
		if (blockRef.current) {
			blockRef.current.scrollIntoView({ behavior: "smooth" });
		}
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

	const handlePixelInstall = () => {
		const meRaw = sessionStorage.getItem("me");

		if (!meRaw) {
			router.push("/dashboard");
			return;
		}

		try {
			const me = JSON.parse(meRaw);
			const isPixelInstalled = me?.get_started?.is_pixel_installed;

			if (domainsWithoutPixel.length > 0) {
				sessionStorage.setItem("current_domain", domainsWithoutPixel[0].name);
			}

			if (isPixelInstalled === false) {
				router.push("/get-started?pixel=true");
			} else {
				router.push("/management/");
			}
		} catch (err) {
			console.error("Error parsing `me` from sessionStorage:", err);
		}
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
					scrollToBlock(block4Ref);
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

			setSourceType(newType);
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

	const closeSkeleton = (key: BuilderKey) => {
		setTimeout(() => {
			setSkeletons((prev) => ({
				...prev,
				[key]: false,
			}));
		}, 1000);
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
				scrollToBlock(block4Ref);
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
				scrollToBlock(block2Ref);
			}, 0);
		}

		setSelectedDomain("");
		setSourceType(newSourceType);
	};

	const handleTargetAudienceChange = (value: string) => {
		setTargetAudience(value);
		setTimeout(() => {
			scrollToBlock(block6Ref);
		}, 0);
		closeSkeleton("name");
		closeDotHintClick("dataSource");
		closeDotHintClick("targetType");
		if (targetAudience === "") {
			openDotHintClick("name");
		}
	};

	// Uploading

	const handleDeleteFile = () => {
		setFile(null);
		setFileName("");
		setHeadingsNotSubstitution(defautlHeadingSubstitution);
		setMappingRows(defaultMapping);
	};

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

	const convertToDBFormat2 = (eventTypesArr: number[]) => {
		return eventTypesArr
			.map((id) => {
				const eventType = eventTypes.find((event) => event.id === id);
				return eventType?.title;
			})
			.filter((name) => name)
			.join(",");
	};

	const toSnakeCase = (str: string) => {
		return str
			.replace(/\s+/g, "_")
			.replace(/([a-z])([A-Z])/g, "$1_$2")
			.toLowerCase();
	};

	const handleSumbit = async () => {
		setLoading(true);

		const rowsToSubmit = mappingRows.map(
			({ id, canDelete, isHidden, ...rest }) => rest,
		);

		const newSource: NewSource = {
			target_schema: toSnakeCase(targetAudience),
			source_type:
				sourceMethod === 1
					? convertToDBFormat(sourceType)
					: convertToDBFormat2(eventType),
			source_origin: sourceMethod === 1 ? "csv" : "pixel",
			source_name: sourceName,
		};

		if (sourceMethod === 1) {
			newSource.file_url = fileUrl;
			newSource.rows = rowsToSubmit;
		}

		if (sourceMethod === 2) {
			newSource.domain_id = selectedDomainId;
		}

		try {
			const response = await axiosInstance.post(
				`/audience-sources/create`,
				newSource,
				{
					headers: { "Content-Type": "application/json" },
				},
			);
			if (response.status === 200) {
				await fetchUserData(setIsGetStartedPage, setInstalledResources);
				const dataString = encodeURIComponent(JSON.stringify(response.data));
				router.push(`/sources/created-source?data=${dataString}`);
			}
		} catch {
		} finally {
			setLoading(false);
		}
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

			const newHeadings = await smartSubstitutionHeaders(formatterHeaders);

			type HeadingSubstitution = Record<string, boolean>;
			const typeHeadings = mappingHeadingSubstitution[sourceType];

			const updatedHeadingSubstitution: HeadingSubstitution = {};
			const headingKeys = [
				...Object.keys(defautlHeadingSubstitution),
				...Object.keys(typeHeadings),
			];

			headingKeys.forEach((key, index) => {
				updatedHeadingSubstitution[key] = newHeadings[index] === "None";
			});

			setHeadingsNotSubstitution({
				Email: updatedHeadingSubstitution.Email || false,
				"Last Name": updatedHeadingSubstitution["Last Name"] || false,
				"First Name": updatedHeadingSubstitution["First Name"] || false,
				"Phone number": updatedHeadingSubstitution["Phone number"] || false,
				"Transaction Date":
					updatedHeadingSubstitution["Transaction Date"] || false,
				"Lead Date": updatedHeadingSubstitution["Lead Date"] || false,
				"Order Amount": updatedHeadingSubstitution["Order Amount"] || false,
				"Interest Date": updatedHeadingSubstitution["Interest Date"] || false,
			});

			const updatedRows = mappingRows.map((row, index) => ({
				...row,
				value: newHeadings[index] === "None" ? "" : newHeadings[index],
			}));

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
	const toggleEventType = (id: number) => {
		if (isAllSelected) {
			setIsAllSelected(false);
			setMatchedLeads(0);
		}

		const isActive = eventType.includes(id);
		const newEventTypes = isActive
			? eventType.filter((e) => e !== id)
			: [...eventType, id];

		if (newEventTypes.length === 0) {
			setIsAllSelected(true);
			setEventType([]);
			setMatchedLeads(totalLeads);
			return;
		}

		setEventType(newEventTypes);

		const sum = newEventTypes.reduce((acc, evId) => {
			const field = eventTypes.find((e) => e.id === evId)!
				.name as keyof DomainsLeads;
			const cnt = domains.find((d) => d.name === selectedDomain)?.[field] || 0;
			return acc + Number(cnt);
		}, 0);
		setMatchedLeads(sum);
	};

	const handleChangeDomain = (event: SelectChangeEvent<string>) => {
		const domainName = event.target.value;
		closeDotHintClick("pixelDomain");
		closeSkeleton("dataSource");
		if (selectedDomain === "") {
			openDotHintClick("dataSource");
		}
		setSelectedDomain(domainName);

		const selectedDomainData = domains.find(
			(domain: DomainsLeads) => domain.name === domainName,
		);
		if (selectedDomainData) {
			setTotalLeads(selectedDomainData.total_count || 0);
			setSelectedDomainId(selectedDomainData.id);
			setPixelNotInstalled(!selectedDomainData.pixel_installed);
			setMatchedLeads(0);
			setEventType([]);
		}
		setTimeout(() => {
			scrollToBlock(block5Ref);
		}, 0);
	};

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

	const [isAllSelected, setIsAllSelected] = useState(true);
	const allSelected = isAllSelected;
	const handleToggleAll = () => {
		setIsAllSelected(true);
		setEventType([]);
		setMatchedLeads(totalLeads);
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

	const hasUnsubstitutedHeadings = () => {
		return Object.entries(headingsNotSubstitution).some(
			([key, value]) => key !== "Phone number" && value,
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
											{sourceType !== "" && file && (
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

											{sourceType !== "" && (
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
																{row.type !== "Phone number" &&
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
											<Button
												disabled={
													isChatGPTProcessing || hasUnsubstitutedHeadings()
												}
												variant="contained"
												onClick={() => {
													setShowTargetStep(true);
													setTimeout(() => {
														scrollToBlock(block4Ref);
													}, 0);
													closeDotHintClick("sourceFile");
													openDotHintClick("targetType");
													closeSkeleton("targetType");
													setIsContinuePressed(true);
												}}
												sx={{
													backgroundColor: "rgba(56, 152, 252, 1)",
													width: "120px",
													height: "40px",
													":hover": {
														backgroundColor: "rgba(30, 136, 229, 1)",
													},
													":active": {
														backgroundColor: "rgba(56, 152, 252, 1)",
													},
													":disabled": {
														backgroundColor: "rgba(56, 152, 252, 1)",
														opacity: 0.6,
													},
												}}
											>
												<Typography
													sx={{
														textAlign: "center",
														color: "rgba(255, 255, 255, 1)",
														fontFamily: "var(--font-nunito)",
														textTransform: "none",
														fontWeight: "600",
														fontSize: "14px",
														lineHeight: "19.6px",
													}}
												>
													Continue
												</Typography>
											</Button>
										</Box>
									)}
								</Box>
							)}

							{sourceMethod === 2 && (
								<PixelDomainSelector
									block4Ref={block4Ref}
									pixelInstalled={!pixelNotInstalled}
									isDomainSearchProcessing={isDomainSearchProcessing}
									selectedDomain={selectedDomain}
									skeletons={skeletons}
									domains={domains}
									renderSkeleton={renderSkeleton}
									handleChangeDomain={handleChangeDomain}
									handlePixelInstall={handlePixelInstall}
									hintProps={{
										changeHint: changeSourcesBuilderHint,
										hints: sourcesBuilderHints,
										resetHints: resetSourcesBuilderHints,
									}}
								/>
							)}

							{sourceMethod === 2 && selectedDomainId ? (
								<>
									<Box
										ref={block5Ref}
										sx={{
											display: "flex",
											flexDirection: "column",
										}}
									>
										{!skeletons["dataSource"] && (
											<Box
												sx={{
													display: "flex",
													flexDirection: "column",
													position: "relative",
													gap: 2,
													flexWrap: "wrap",
													border: "1px solid rgba(228, 228, 228, 1)",
													borderRadius: "6px",
													padding: "20px",
												}}
											>
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
														Choose your data source
													</Typography>
													<Typography
														sx={{
															fontFamily: "var(--font-roboto)",
															fontSize: "12px",
															color: "rgba(95, 99, 104, 1)",
														}}
													>
														Please select your event type.
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
													<Button
														variant="outlined"
														onClick={handleToggleAll}
														sx={{
															fontFamily: "var(--font-nunito)",
															border: "1px solid rgba(208, 213, 221, 1)",
															borderRadius: "4px",
															textTransform: "none",
															fontSize: "14px",
															padding: "8px 12px",
															backgroundColor: allSelected
																? "rgba(246, 248, 250, 1)"
																: "rgba(255, 255, 255, 1)",
															borderColor: allSelected
																? "rgba(117, 168, 218, 1)"
																: "rgba(208, 213, 221, 1)",
															color: allSelected
																? "rgba(32, 33, 36, 1)"
																: "rgba(32, 33, 36, 1)",
															":hover": {
																borderColor: "rgba(208, 213, 221, 1)",
																backgroundColor: "rgba(236, 238, 241, 1)",
															},
														}}
													>
														All
													</Button>
													{eventTypes.map((ev) => {
														const active =
															!isAllSelected && eventType.includes(ev.id);
														return (
															<Button
																key={ev.id}
																variant="outlined"
																onClick={() => toggleEventType(ev.id)}
																sx={{
																	fontFamily: "var(--font-nunito)",
																	border: "1px solid rgba(208, 213, 221, 1)",
																	borderRadius: "4px",
																	color: "rgba(32, 33, 36, 1)",
																	textTransform: "none",
																	fontSize: "14px",
																	padding: "8px 12px",
																	backgroundColor: active
																		? "rgba(246, 248, 250, 1)"
																		: "rgba(255, 255, 255, 1)",
																	borderColor: active
																		? "rgba(117, 168, 218, 1)"
																		: "rgba(208, 213, 221, 1)",
																	":hover": {
																		borderColor: "rgba(208, 213, 221, 1)",
																		backgroundColor: "rgba(236, 238, 241, 1)",
																	},
																}}
															>
																{ev.title.charAt(0).toUpperCase() +
																	ev.title.slice(1).replace("_", " ")}
															</Button>
														);
													})}
													{sourcesBuilderHints["dataSource"].show && (
														<HintCard
															card={builderHintCards["dataSource"]}
															positionLeft={650}
															positionTop={100}
															isOpenBody={
																sourcesBuilderHints["dataSource"].showBody
															}
															toggleClick={() =>
																changeSourcesBuilderHint(
																	"dataSource",
																	"showBody",
																	"toggle",
																)
															}
															closeClick={() =>
																changeSourcesBuilderHint(
																	"dataSource",
																	"showBody",
																	"close",
																)
															}
														/>
													)}
												</Box>
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
															color: "rgba(32, 33, 36, 1)",
														}}
													>
														{eventType.some((id) => [1, 2, 3, 4].includes(id))
															? matchedLeads
															: totalLeads}
													</Typography>
												</Box>

												{!showTargetStep && (
													<Box
														sx={{ display: "flex", justifyContent: "right" }}
													>
														<Button
															variant="contained"
															onClick={() => {
																setShowTargetStep(true);
																closeDotHintClick("dataSource");
																openDotHintClick("targetType");
																closeSkeleton("targetType");
																setTimeout(() => {
																	scrollToBlock(block4Ref);
																}, 0);
															}}
															sx={{
																backgroundColor: "rgba(56, 152, 252, 1)",
																width: "120px",
																height: "40px",
																":hover": {
																	backgroundColor: "rgba(30, 136, 229, 1)",
																},
																":active": {
																	backgroundColor: "rgba(56, 152, 252, 1)",
																},
																":disabled": {
																	backgroundColor: "rgba(56, 152, 252, 1)",
																	opacity: 0.6,
																},
															}}
														>
															<Typography
																sx={{
																	textAlign: "center",
																	color: "rgba(255, 255, 255, 1)",
																	fontFamily: "var(--font-nunito)",
																	textTransform: "none",
																	fontWeight: "600",
																	fontSize: "14px",
																	lineHeight: "19.6px",
																}}
															>
																Continue
															</Typography>
														</Button>
													</Box>
												)}
											</Box>
										)}
										{renderSkeleton("dataSource")}
									</Box>
								</>
							) : null}

							{showTargetStep &&
								sourceMethod !== 0 &&
								(selectedDomainId || file) && (
									<Box
										ref={block4Ref}
										sx={{
											display: "flex",
											flexDirection: "column",
										}}
									>
										{!skeletons["targetType"] && (
											<Box
												sx={{
													display: "flex",
													flexDirection: "column",
													gap: 2,
													minWidth: "100%",
													flexGrow: 1,
													position: "relative",
													flexWrap: "wrap",
													border: "1px solid rgba(228, 228, 228, 1)",
													borderRadius: "6px",
													padding: "20px",
												}}
											>
												<Box
													sx={{
														display: "flex",
														width: "100%",
														flexDirection: "row",
														justifyContent: "space-between",
														gap: 1,
													}}
												>
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
															Select your target type
														</Typography>
														<Typography
															sx={{
																fontFamily: "var(--font-roboto)",
																fontSize: "12px",
																color: "rgba(95, 99, 104, 1)",
															}}
														>
															Choose what you would like to use it for.
														</Typography>
													</Box>
												</Box>
												<Box
													sx={{
														display: "flex",
														position: "relative",
														flexDirection: "row",
														gap: 2,
													}}
												>
													{["B2B", "B2C"].map((option) => (
														<ToggleButton
															key={option}
															value={option}
															selected={targetAudience === option}
															className="form-input-label"
															onClick={() => handleTargetAudienceChange(option)}
															sx={{
																"&.MuiToggleButton-root.Mui-selected": {
																	backgroundColor: "rgba(246, 248, 250, 1)",
																	":hover": {
																		borderColor: "rgba(208, 213, 221, 1)",
																		backgroundColor: "rgba(236, 238, 241, 1)",
																	},
																},
																"&.MuiToggleButton-root": {
																	":hover": {
																		borderColor: "rgba(208, 213, 221, 1)",
																		backgroundColor: "rgba(236, 238, 241, 1)",
																	},
																},
																textTransform: "none",
																border:
																	targetAudience === option
																		? "1px solid rgba(117, 168, 218, 1)"
																		: "1px solid #ccc",
																color: "rgba(32, 33, 36, 1)",
																borderRadius: "4px",
																padding: "8px 12px",
															}}
														>
															{option}
														</ToggleButton>
													))}
													{sourcesBuilderHints["targetType"].show && (
														<HintCard
															card={builderHintCards["targetType"]}
															positionLeft={140}
															isOpenBody={
																sourcesBuilderHints["targetType"].showBody
															}
															toggleClick={() =>
																changeSourcesBuilderHint(
																	"targetType",
																	"showBody",
																	"toggle",
																)
															}
															closeClick={() =>
																changeSourcesBuilderHint(
																	"targetType",
																	"showBody",
																	"close",
																)
															}
														/>
													)}
												</Box>
											</Box>
										)}
										{renderSkeleton("targetType", "146px")}
									</Box>
								)}

							{sourceMethod !== 0 &&
							targetAudience !== "" &&
							(file || selectedDomainId) ? (
								<>
									<Box
										ref={block6Ref}
										sx={{
											display: "flex",
											flexDirection: "column",
										}}
									>
										{!skeletons["name"] && (
											<Box
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
												<Box
													sx={{
														display: "flex",
														alignItems: "center",
														position: "relative",
														gap: 2,
														"@media (max-width: 400px)": {
															justifyContent: "space-between",
														},
													}}
												>
													<Typography
														sx={{
															fontFamily: "var(--font-nunito)",
															fontSize: "16px",
															fontWeight: 500,
														}}
													>
														Create Name
													</Typography>
													<TextField
														id="outlined"
														label="Name"
														InputLabelProps={{
															sx: {
																color: "rgba(17, 17, 19, 0.6)",
																fontFamily: "var(--font-nunito)",
																fontWeight: 400,
																fontSize: "15px",
																padding: 0,
																top: "-1px",
																margin: 0,
															},
														}}
														sx={{
															width: "250px",
															"@media (max-width: 400px)": { width: "150px" },
															"& .MuiInputLabel-root.Mui-focused": {
																color: "rgba(17, 17, 19, 0.6)",
															},
															"& .MuiInputLabel-root[data-shrink='false']": {
																transform: "translate(16px, 50%) scale(1)",
															},
															"& .MuiOutlinedInput-root": {
																maxHeight: "40px",
															},
														}}
														InputProps={{
															className: "form-input",
														}}
														value={sourceName}
														onChange={(e) => {
															if (e.target.value.length < 128) {
																setSourceName(e.target.value);
															} else {
																showErrorToast("Your name is too long!");
															}
														}}
													/>
													{sourcesBuilderHints["name"].show && (
														<HintCard
															card={builderHintCards["name"]}
															positionLeft={380}
															isOpenBody={sourcesBuilderHints["name"].showBody}
															toggleClick={() =>
																changeSourcesBuilderHint(
																	"name",
																	"showBody",
																	"toggle",
																)
															}
															closeClick={() =>
																changeSourcesBuilderHint(
																	"name",
																	"showBody",
																	"close",
																)
															}
														/>
													)}
												</Box>
											</Box>
										)}
										{renderSkeleton("name", "82px")}
									</Box>
									<Box
										sx={{
											display: "flex",
											gap: 2,
											flexWrap: "wrap",
											justifyContent: "flex-end",
											borderRadius: "6px",
										}}
									>
										<Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
											<Button
												variant="outlined"
												onClick={() => {
													setSourceMethod(0);
													handleDeleteFile();
													setSourceName("");
													setSourceType("");
													router.push("/sources");
												}}
												sx={{
													borderColor: "rgba(56, 152, 252, 1)",
													width: "92px",
													height: "40px",
													":hover": {
														borderColor: "rgba(30, 136, 229, 1)",
													},
													":active": {
														borderColor: "rgba(56, 152, 252, 1)",
													},
													":disabled": {
														borderColor: "rgba(56, 152, 252, 1)",
														opacity: 0.4,
													},
												}}
											>
												<Typography
													sx={{
														textAlign: "center",
														color: "rgba(56, 152, 252, 1)",
														textTransform: "none",
														fontFamily: "var(--font-nunito)",
														fontWeight: "600",
														fontSize: "14px",
														lineHeight: "19.6px",
													}}
												>
													Cancel
												</Typography>
											</Button>
											<Button
												variant="contained"
												onClick={handleSumbit}
												disabled={
													sourceName.trim() === "" ||
													hasUnsubstitutedHeadings() ||
													pixelNotInstalled
												}
												sx={{
													backgroundColor: "rgba(56, 152, 252, 1)",
													width: "120px",
													height: "40px",
													":hover": {
														backgroundColor: "rgba(30, 136, 229, 1)",
													},
													":active": {
														backgroundColor: "rgba(116, 183, 253, 1)",
													},
													":disabled": {
														backgroundColor: "rgba(56, 152, 252, 1)",
														opacity: 0.6,
													},
												}}
											>
												<Typography
													sx={{
														textAlign: "center",
														color: "rgba(255, 255, 255, 1)",
														fontFamily: "var(--font-nunito)",
														textTransform: "none",
														fontWeight: "600",
														fontSize: "14px",
														lineHeight: "19.6px",
													}}
												>
													Create
												</Typography>
											</Button>
										</Box>
									</Box>
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
