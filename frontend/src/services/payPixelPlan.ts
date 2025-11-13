type Listener = () => void;

let flag = false;
let isCanClose = true;
const listeners = new Set<Listener>();

let snapshot = { flag, isCanClose };

export const flagPixelPlan = {
	get: () => snapshot,
	set: (flagValue: boolean, isCanCloseValue: boolean) => {
		if (flag === flagValue && isCanClose === isCanCloseValue) return;

		flag = flagValue;
		isCanClose = isCanCloseValue;

		snapshot = { flag, isCanClose };

		listeners.forEach((listener) => listener());
	},
	subscribe: (listener: Listener) => {
		listeners.add(listener);
		return () => listeners.delete(listener);
	},
};
