type ImpersonationLevel = {
	type: "admin" | "masterPartner" | "partner" | "account";
	token: string;
	domain?: string;
};

export const getImpersonationStack = (): ImpersonationLevel[] => {
	const stack = localStorage.getItem("impersonationStack");
	return stack ? JSON.parse(stack) : [];
};

export const pushToImpersonationStack = (level: ImpersonationLevel) => {
	const stack = getImpersonationStack();
	stack.push(level);
	localStorage.setItem("impersonationStack", JSON.stringify(stack));
};

export const popFromImpersonationStack = (): ImpersonationLevel | null => {
	const stack = getImpersonationStack();
	if (stack.length === 0) return null;
	const level = stack.pop();
	localStorage.setItem("impersonationStack", JSON.stringify(stack));
	return level || null;
};

export const clearImpersonationStack = () => {
	localStorage.removeItem("impersonationStack");
};

export const getCurrentImpersonationLevel = (): ImpersonationLevel | null => {
	const stack = getImpersonationStack();
	return stack.length > 0 ? stack[stack.length - 1] : null;
};
