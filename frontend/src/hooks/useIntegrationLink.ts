import { useEffect, useState } from "react";

const INTEGRATION_LINKS: { [key: string]: string } = {
	klaviyo:
		"https://allsourceio.zohodesk.com/portal/en/kb/articles/unable-to-add-contact-to-klaviyo-list-missing-integration-permissions",
	hubspot:
		"https://allsourceio.zohodesk.com/portal/en/kb/articles/unable-to-add-contact-to-hubspot-list-missing-integration-permissions",
};

export const useIntegrationLink = (message: string | null): string => {
	const [link, setLink] = useState("");

	useEffect(() => {
		if (!message) {
			setLink("");
			return;
		}

		const lowerMessage = message.toLowerCase();
		const matchedKey = Object.keys(INTEGRATION_LINKS).find((key) =>
			lowerMessage.includes(key.toLowerCase()),
		);

		if (matchedKey) {
			setLink(INTEGRATION_LINKS[matchedKey]);
		} else {
			setLink("");
		}
	}, [message]);

	return link;
};
