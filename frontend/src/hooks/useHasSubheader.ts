import { usePathname } from "next/navigation";

export const useHasSubheader = (): boolean => {
	const pathname = usePathname();

	const pixelPages = [
		"/analytics",
		"/leads",
		"/company",
		"/suppressions",
		"/data-sync-pixel",
	];

	const hasSubheader =
		(pathname.startsWith("/management") && pathname !== "/management") ||
		pixelPages.includes(pathname);

	return hasSubheader;
};
