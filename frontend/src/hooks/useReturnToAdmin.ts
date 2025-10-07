import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { fetchUserData } from "@/services/meService";
import { useSidebar } from "@/context/SidebarContext";

type ReturnToAdminOptions = {
	onBeforeRedirect?: () => void;
	onAfterUserData?: () => void;
	updateHeader?: (hasMoreLevels: boolean, nextLevelType: string | null) => void;
};

export const useReturnToAdmin = () => {
	const router = useRouter();
	const { setIsGetStartedPage, setInstalledResources } = useSidebar();

	const returnToAdmin = useCallback(
		async (options?: ReturnToAdminOptions) => {
			const stack = JSON.parse(
				localStorage.getItem("impersonationStack") || "[]",
			);
			if (stack.length === 0) {
				router.push("/login");
				return;
			}

			const previousLevel = stack.pop();
			localStorage.setItem("impersonationStack", JSON.stringify(stack));

			const hasMoreLevels = stack.length > 0;
			const nextLevelType = hasMoreLevels ? stack[stack.length - 1].type : null;

			await new Promise<void>(async (resolve) => {
				sessionStorage.clear();
				localStorage.setItem("token", previousLevel.token);
				if (previousLevel.domain) {
					sessionStorage.setItem("current_domain", previousLevel.domain);
				}

				await fetchUserData(setIsGetStartedPage, setInstalledResources);
				options?.onAfterUserData?.();
				setTimeout(() => resolve(), 0);
			});

			options?.onBeforeRedirect?.();

			options?.updateHeader?.(hasMoreLevels, nextLevelType);

			switch (previousLevel.type) {
				case "admin":
					sessionStorage.setItem("admin", "true");
					router.push("/admin");
					break;
				case "masterPartner":
					router.push("/partners");
				case "partner":
					router.push("/partners");
					break;
				default:
					router.push("/dashboard");
			}

			router.refresh();
		},
		[router],
	);

	return returnToAdmin;
};
