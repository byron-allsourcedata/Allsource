import React, {
	createContext,
	useState,
	useRef,
	ReactNode,
	RefObject,
	useContext,
	Dispatch,
	SetStateAction,
} from "react";
import {
	DomainsLeads,
	EventTypeInterface,
	SourceType,
	InterfaceMappingRowsSourceType,
	Row,
	InterfaceMappingHeadingSubstitution,
} from "../builder/components/types";
import { type SkeletonState } from "@/app/(client)/sources/builder/components/PixelDomainSelectorBox";
import { BuilderKey } from "../context/hintsCardsContent";
import { useSourcesHints } from "../context/SourcesHintsContext";

interface SourceBuilderContextType {
	block1Ref: RefObject<HTMLDivElement | null>;
	block2Ref: RefObject<HTMLDivElement | null>;
	block3Ref: RefObject<HTMLDivElement | null>;
	block4Ref: RefObject<HTMLDivElement | null>;
	block5Ref: RefObject<HTMLDivElement | null>;
	block6Ref: RefObject<HTMLDivElement | null>;
	skeletons: SkeletonState;
	setSkeletons: Dispatch<SetStateAction<SkeletonState>>;
	domains: DomainsLeads[];
	setDomains: Dispatch<SetStateAction<DomainsLeads[]>>;
	eventTypes: EventTypeInterface[];
	eventType: number[];
	setEventType: Dispatch<SetStateAction<number[]>>;
	showTargetStep: boolean;
	setMatchedLeads: Dispatch<SetStateAction<number>>;
	matchedLeads: number;
	selectedDomain: string;
	setSelectedDomain: Dispatch<SetStateAction<string>>;
	totalLeads: number;
	setTotalLeads: Dispatch<SetStateAction<number>>;
	setShowTargetStep: Dispatch<SetStateAction<boolean>>;
	domainsWithoutPixel: DomainsLeads[];
	setDomainsWithoutPixel: Dispatch<SetStateAction<DomainsLeads[]>>;
	pixelNotInstalled: boolean;
	setPixelNotInstalled: Dispatch<SetStateAction<boolean>>;
	selectedDomainId: number;
	setSelectedDomainId: Dispatch<SetStateAction<number>>;
	closeSkeleton: (state: BuilderKey) => void;
	openDotHintClick: (state: BuilderKey) => void;
	closeDotHintClick: (state: BuilderKey) => void;
	targetAudience: string;
	setTargetAudience: Dispatch<SetStateAction<string>>;
	sourceMethod: number;
	setSourceMethod: Dispatch<SetStateAction<number>>;
	sourceType: SourceType;
	setSourceType: Dispatch<SetStateAction<SourceType>>;
	hasUnsubstitutedHeadings: () => boolean;
	headingsNotSubstitution: Record<string, boolean>;
	setHeadingsNotSubstitution: Dispatch<SetStateAction<Record<string, boolean>>>;
	defautlHeadingSubstitution: Record<string, boolean>;
	defaultMapping: Row[];
	mappingRowsSourceType: InterfaceMappingRowsSourceType;
	fileUrl: string;
	setFileUrl: Dispatch<SetStateAction<string>>;
	handleDeleteFile: () => void;
	mappingRows: Row[];
	setMappingRows: Dispatch<SetStateAction<Row[]>>;
	fileName: string;
	setFileName: Dispatch<SetStateAction<string>>;
	file: File | null;
	setFile: Dispatch<SetStateAction<File | null>>;
	isChatGPTProcessing: boolean;
	setIsChatGPTProcessing: Dispatch<SetStateAction<boolean>>;
	isContinuePressed: boolean;
	setIsContinuePressed: Dispatch<SetStateAction<boolean>>;
	headersinCSV: string[];
	setHeadersinCSV: Dispatch<SetStateAction<string[]>>;
	mappingHeadingSubstitution: InterfaceMappingHeadingSubstitution;
}

interface SourceBuilderProviderProps {
	children: ReactNode;
}

const SourcesBuilderContext = createContext<
	SourceBuilderContextType | undefined
>(undefined);

export const SourceBuilderProvider: React.FC<SourceBuilderProviderProps> = ({
	children,
}) => {
	const block1Ref = useRef<HTMLDivElement | null>(null);
	const block2Ref = useRef<HTMLDivElement | null>(null);
	const block3Ref = useRef<HTMLDivElement | null>(null);
	const block4Ref = useRef<HTMLDivElement | null>(null);
	const block5Ref = useRef<HTMLDivElement | null>(null);
	const block6Ref = useRef<HTMLDivElement | null>(null);

	const [domains, setDomains] = useState<DomainsLeads[]>([]);

	const { changeSourcesBuilderHint } = useSourcesHints();

	const [isChatGPTProcessing, setIsChatGPTProcessing] = useState(false);

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

	const closeSkeleton = (key: BuilderKey) => {
		setTimeout(() => {
			setSkeletons((prev) => ({
				...prev,
				[key]: false,
			}));
		}, 1000);
	};

	const eventTypes: EventTypeInterface[] = [
		{ id: 1, name: "visitor_count", title: "visitor" },
		{ id: 2, name: "viewed_product_count", title: "viewed_product" },
		{ id: 3, name: "abandoned_cart_count", title: "abandoned_cart" },
		{ id: 4, name: "converted_sales_count", title: "converted_sales" },
	];

	const [eventType, setEventType] = useState<number[]>([]);

	const [showTargetStep, setShowTargetStep] = useState(false);
	const [matchedLeads, setMatchedLeads] = useState(0);
	const [totalLeads, setTotalLeads] = useState(0);
	const [selectedDomain, setSelectedDomain] = useState<string>("");
	const [pixelNotInstalled, setPixelNotInstalled] = useState(false);
	const [selectedDomainId, setSelectedDomainId] = useState<number>(0);
	const [sourceMethod, setSourceMethod] = useState<number>(0);
	const [sourceType, setSourceType] = useState<SourceType>("");

	const [domainsWithoutPixel, setDomainsWithoutPixel] = useState<
		DomainsLeads[]
	>([]);
	const [targetAudience, setTargetAudience] = useState<string>("");

	const closeDotHintClick = (key: BuilderKey) => {
		changeSourcesBuilderHint(key, "show", "close");
	};

	const openDotHintClick = (key: BuilderKey) => {
		changeSourcesBuilderHint(key, "show", "open");
	};

	const defautlHeadingSubstitution = {
		Email: false,
		ASID: false,
		"Phone number": false,
		"Last Name": false,
		"First Name": false,
	};

	const [headingsNotSubstitution, setHeadingsNotSubstitution] = useState<
		Record<string, boolean>
	>(defautlHeadingSubstitution);

	const [fileUrl, setFileUrl] = useState<string>("");
	const [file, setFile] = useState<File | null>(null);
	const [fileName, setFileName] = useState<string>("");

	const hasUnsubstitutedHeadings = () => {
		let mappingRowsSelectType =
			sourceType in mappingRowsSourceType
				? [
						...defaultMapping,
						...mappingRowsSourceType[
							sourceType as keyof InterfaceMappingRowsSourceType
						],
					]
				: defaultMapping;

		let headingsNot = headingsNotSubstitution;

		if (!headingsNotSubstitution["ASID"]) {
			//asid matching
			mappingRowsSelectType = mappingRowsSelectType.filter(
				(el) => el.isRequiredForAsidMatching,
			);
		} else {
			const { ASID, ...rest } = headingsNotSubstitution;
			headingsNot = rest as Record<string, boolean>;
		}

		const deletableKeys = new Set(
			mappingRows.filter((row) => row.canDelete).map((row) => row.type),
		);

		return Object.entries(headingsNot).some(
			([key, value]) => !deletableKeys.has(key) && value,
		);
	};

	const defaultMapping: Row[] = [
		{
			id: 1,
			type: "Email",
			value: "",
			canDelete: false,
			isHidden: false,
			isRequiredForAsidMatching: false,
		},
		{
			id: 2,
			type: "ASID",
			value: "",
			canDelete: true,
			isHidden: false,
			isRequiredForAsidMatching: true,
		},
		{
			id: 3,
			type: "Phone number",
			value: "",
			canDelete: true,
			isHidden: false,
			isRequiredForAsidMatching: false,
		},
		{
			id: 4,
			type: "Last Name",
			value: "",
			canDelete: false,
			isHidden: false,
			isRequiredForAsidMatching: false,
		},
		{
			id: 5,
			type: "First Name",
			value: "",
			canDelete: false,
			isHidden: false,
			isRequiredForAsidMatching: false,
		},
	];

	const customerConversionsMapping: Row[] = [
		{
			id: 6,
			type: "Order Amount",
			value: "",
			canDelete: false,
			isHidden: false,
			isRequiredForAsidMatching: true,
		},
		{
			id: 7,
			type: "Transaction Date",
			value: "",
			canDelete: true,
			isHidden: false,
			isRequiredForAsidMatching: false,
		},
		{
			id: 8,
			type: "Order Count",
			value: "",
			canDelete: true,
			isHidden: false,
			isRequiredForAsidMatching: true,
		},
	];

	const failedLeadsMapping: Row[] = [
		{
			id: 6,
			type: "Lead Date",
			value: "",
			canDelete: false,
			isHidden: false,
			isRequiredForAsidMatching: true,
		},
	];

	const interestMapping: Row[] = [
		{
			id: 6,
			type: "Interest Date",
			value: "",
			canDelete: false,
			isHidden: false,
			isRequiredForAsidMatching: true,
		},
	];

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

	const mappingHeadingSubstitution: InterfaceMappingHeadingSubstitution = {
		Interest: interestHeadingSubstitution,
		"Failed Leads": failedLeadsHeadingSubstitution,
		"Customer Conversions": customerConversionHeadingSubstitution,
	};

	const mappingRowsSourceType: InterfaceMappingRowsSourceType = {
		Interest: interestMapping,
		"Failed Leads": failedLeadsMapping,
		"Customer Conversions": customerConversionsMapping,
	};

	const handleDeleteFile = () => {
		setFile(null);
		setFileName("");
		setHeadingsNotSubstitution(defautlHeadingSubstitution);
		setMappingRows(defaultMapping);
	};

	const [mappingRows, setMappingRows] = useState<Row[]>([]);

	const [isContinuePressed, setIsContinuePressed] = useState(false);
	const [headersinCSV, setHeadersinCSV] = useState<string[]>([]);

	return (
		<SourcesBuilderContext.Provider
			value={{
				block1Ref,
				block2Ref,
				block3Ref,
				block4Ref,
				block5Ref,
				block6Ref,
				skeletons,
				setSkeletons,
				domains,
				setDomains,
				eventTypes,
				eventType,
				setEventType,
				showTargetStep,
				setMatchedLeads,
				matchedLeads,
				selectedDomain,
				setSelectedDomain,
				totalLeads,
				setTotalLeads,
				setShowTargetStep,
				domainsWithoutPixel,
				setDomainsWithoutPixel,
				pixelNotInstalled,
				setPixelNotInstalled,
				selectedDomainId,
				setSelectedDomainId,
				closeSkeleton,
				openDotHintClick,
				closeDotHintClick,
				targetAudience,
				setTargetAudience,
				sourceMethod,
				setSourceMethod,
				sourceType,
				setSourceType,
				hasUnsubstitutedHeadings,
				headingsNotSubstitution,
				setHeadingsNotSubstitution,
				defautlHeadingSubstitution,
				defaultMapping,
				mappingRowsSourceType,
				fileUrl,
				setFileUrl,
				handleDeleteFile,
				mappingRows,
				setMappingRows,
				file,
				setFile,
				fileName,
				setFileName,
				isChatGPTProcessing,
				setIsChatGPTProcessing,
				isContinuePressed,
				setIsContinuePressed,
				headersinCSV,
				setHeadersinCSV,
				mappingHeadingSubstitution,
			}}
		>
			{children}
		</SourcesBuilderContext.Provider>
	);
};

export const useSourcesBuilder = () => {
	const context = useContext(SourcesBuilderContext);
	if (context === undefined) {
		throw new Error(
			"useSourcesBuilder must be used within a SourceBuilderProvider",
		);
	}
	return context;
};
