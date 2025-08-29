import { useRef, useState } from "react";

export type CardMenuProps = {
	menuOpen: boolean;
	setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
	menuAnchor?: React.MutableRefObject<HTMLElement | null>;
};

export function useCardMenu(): CardMenuProps {
	const [menuOpen, setMenuOpen] = useState(false);
	const menuAnchor = useRef<HTMLElement | null>(null);

	const props: CardMenuProps = {
		menuOpen,
		setMenuOpen,
		menuAnchor,
	};

	return props;
}
