export {};

declare global {
	interface Window {
		$zoho?: {
			salesiq?: {
				ready?: (info?: any) => void;
				afterReady?: (info?: any) => void;
				widget?: {
					show?: () => void;
					hide?: () => void;
				};
				chatbutton?: {
					visible?: (state: "show" | "hide") => void;
				};
				floatbutton?: {
					visible?: (state: "show" | "hide") => void;
				};
				visitor?: {
					getGeoDetails?: () => void;
				};
			};
		};
	}
}
