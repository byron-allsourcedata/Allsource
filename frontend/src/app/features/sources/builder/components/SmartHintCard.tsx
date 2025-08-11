import HintCard from "@/app/(client)/components/HintCard";
import type {
	HintAction,
	HintCardInterface,
	HintStateMap,
} from "@/utils/hintsUtils";

type SmartHintCardProps<K extends string> = {
	hints: HintStateMap<K>;
	hintKey: K;
	hintCards: Record<K, HintCardInterface>;
	position: {
		left?: number;
	};
	changeHint: (hintKey: K, action: "showBody", key: HintAction) => void;
};
export const SmartHintCard = <K extends string>({
	hints,
	hintKey,
	hintCards,
	changeHint,
	position: { left },
}: SmartHintCardProps<K>) => {
	const hint = hints[hintKey];
	const hintCard = hintCards[hintKey];

	if (hint.show) {
		return (
			<HintCard
				card={hintCard}
				positionLeft={left}
				isOpenBody={hint.showBody}
				toggleClick={() => changeHint(hintKey, "showBody", "toggle")}
				closeClick={() => changeHint(hintKey, "showBody", "close")}
			/>
		);
	}

	return null;
};
