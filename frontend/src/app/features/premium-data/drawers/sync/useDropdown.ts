import { useState } from "react";

type UseDropdown = {
	isDropdownOpen: boolean;
	toggleDropdown: () => void;
	open: () => void;
	close: () => void;
};

export function useDropdown() {
	const [isDropdownOpen, setDropdownOpen] = useState(false);

	const toggle = () => {
		setDropdownOpen((dropdownOpen) => !dropdownOpen);
	};

	const open = () => {
		setDropdownOpen(true);
	};

	const close = () => {
		setDropdownOpen(false);
	};

	return { isDropdownOpen, toggle, open, close };
}
