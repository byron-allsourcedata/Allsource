import axiosInstance from "@/axios/axiosInterceptorInstance";
import { flagOneDollarPlan } from "./payOneDollarPlan";
import { flagPixelPlan } from "./payPixelPlan";

export const checkPixelInstallationPaid = async () => {
	try {
		const response = await axiosInstance.get("/check-pixel-installation-paid");
		if (response.status !== 200 || response.data.status !== "ok") {
			flagOneDollarPlan.set(false);
			flagPixelPlan.set(true, false);
		}
	} catch {}
};
