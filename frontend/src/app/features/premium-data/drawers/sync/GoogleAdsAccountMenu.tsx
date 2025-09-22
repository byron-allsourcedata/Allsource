import type { FC } from "react";
import type { Customer } from "./GoogleAdsListPicker";
import { GoogleAdsMenu } from "./GoogleAdsDropdown";
import { ListItemText, MenuItem } from "@mui/material";

type GoogleAdsAccountMenuProps = {
	open: boolean;
	anchor: Element | null;
	accounts: Customer[];
	onSelect: (account: Customer) => void;
	onClose: () => void;
};

export const GoogleAdsAccountMenu: FC<GoogleAdsAccountMenuProps> = ({
	open,
	anchor,
	accounts: customersInfo,
	onSelect,
	onClose,
}) => {
	return (
		<GoogleAdsMenu open={open} anchor={anchor} onClose={onClose}>
			{customersInfo?.map((account) => (
				<MenuItem
					key={account.customer_id}
					onClick={() => onSelect(account)}
					sx={{
						"&:hover": {
							background: "rgba(80, 82, 178, 0.10)",
						},
					}}
				>
					<ListItemText
						primary={account.customer_name}
						primaryTypographyProps={{
							sx: {
								fontFamily: "var(--font-nunito)",
								fontSize: "14px",
								color: "#202124",
								fontWeight: "500",
								lineHeight: "20px",
							},
						}}
					/>
				</MenuItem>
			))}
		</GoogleAdsMenu>
	);
};
