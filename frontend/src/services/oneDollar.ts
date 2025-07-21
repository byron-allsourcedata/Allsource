type Listener = () => void;

let flag = false;
const listeners = new Set<Listener>();

export const flagStore = {
	get: () => flag,
	set: (value: boolean) => {
		flag = value;
		listeners.forEach((listener) => listener());
	},
	subscribe: (listener: Listener) => {
		listeners.add(listener);
		return () => listeners.delete(listener);
	},
};
