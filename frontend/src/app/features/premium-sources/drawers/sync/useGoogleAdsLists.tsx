import { useState } from "react";
import type { ChannelList } from "../GoogleAdsGenericSync";

export function useGoogleAdsLists() {
	const [lists, setLists] = useState<ChannelList[] | null>(null);
	const [newList, setNewList] = useState<ChannelList | null>(null);
	const [selectedList, setSelectedList] = useState<ChannelList | null>(null);

	return {
		lists: combineLists(lists, newList),
		fetchedLists: lists,
		setLists,
		newList,
		setNewList,
		selectedList,
		setSelectedList,
	};
}

function combineLists(
	lists: ChannelList[] | null,
	newList: ChannelList | null,
): ChannelList[] | null {
	if (lists == null) {
		return null;
	}

	const newLists = [...lists];

	if (newList != null) {
		newLists.push(newList);
	}

	return newLists;
}
