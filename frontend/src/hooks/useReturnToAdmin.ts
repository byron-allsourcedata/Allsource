import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { fetchUserData } from "@/services/meService";

type ReturnToAdminOptions = {
	onBeforeRedirect?: () => void;
	onAfterUserData?: () => void;
};

export const useReturnToAdmin = () => {
	const router = useRouter();

	const returnToAdmin = useCallback(
		async (options?: ReturnToAdminOptions) => {
			const parent_token = localStorage.getItem("parent_token");
			const parent_domain = sessionStorage.getItem("parent_domain");
			const parent_account_type = localStorage.getItem("parent_account_type");

			if (parent_token) {
				await new Promise<void>(async (resolve) => {
					sessionStorage.clear();
					if (parent_account_type !== "partner") {
						sessionStorage.setItem("admin", "true");
					}

					localStorage.removeItem("parent_token");
					sessionStorage.removeItem("parent_domain");
					localStorage.removeItem("parent_account_type");

					localStorage.setItem("token", parent_token);
					sessionStorage.setItem("current_domain", parent_domain || "");

					await fetchUserData();

					options?.onAfterUserData?.();

					setTimeout(() => resolve(), 0);
				});
			}

			options?.onBeforeRedirect?.();

			if (parent_account_type === "partner") {
				router.push("/partners");
			} else {
				router.push("/admin");
			}
			router.refresh();
		},
		[router],
	);

	return returnToAdmin;
};
