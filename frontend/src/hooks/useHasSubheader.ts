import { usePathname } from "next/navigation";

export const useHasSubheader = (): boolean => {
	const pathname = usePathname();

	const pixelPages = [
		"/analytics",
		"/leads",
		"/company",
		"/suppressions",
		"/pixel-sync",
	];

	const excludedSubheaderPaths = ["/management/add-domain"];

	const hasSubheader =
		(!excludedSubheaderPaths.includes(pathname) &&
			pathname.startsWith("/management") &&
			pathname !== "/management") ||
		pixelPages.includes(pathname);

	return hasSubheader;
};
