import { Popover, Box, Typography, Button, styled } from "@mui/material";

import type { FC } from "react";

type Props = {
	deleteOpen: boolean;
	deleteId: string | undefined;
	deleteAnchorEl: HTMLElement | null;
	handleDelete: () => void;
	handleDeleteClose: () => void;
};

export const MetaDeletePopover: FC<Props> = ({
	deleteOpen,
	deleteId,
	deleteAnchorEl: anchorEl,
	handleDelete: onDelete,
	handleDeleteClose: onClose,
}) => {
	return (
		<Popover
			id={deleteId}
			open={deleteOpen}
			anchorEl={anchorEl}
			onClose={onClose}
			anchorOrigin={{
				vertical: "bottom",
				horizontal: "center",
			}}
			transformOrigin={{
				vertical: "top",
				horizontal: "right",
			}}
		>
			<Box
				sx={{
					minWidth: "254px",
					borderRadius: "4px",
					border: "0.2px solid #afafaf",
					background: "#fff",
					boxShadow: "0px 4px 4px 0px rgba(0, 0, 0, 0.12)",
					padding: "16px 21px 16px 16px",
				}}
			>
				<Typography
					variant="body1"
					className="first-sub-title"
					sx={{
						paddingBottom: "12px",
					}}
				>
					Confirm Deletion
				</Typography>
				<Typography
					variant="body2"
					sx={{
						color: "#5f6368",
						fontFamily: "var(--font-roboto)",
						fontSize: "12px",
						fontWeight: "400",
						lineHeight: "16px",
						paddingBottom: "26px",
					}}
				>
					Are you sure you want to delete this <br /> map data?
				</Typography>
				<Box display="flex" justifyContent="flex-end" mt={2}>
					<ClearButton onClick={onClose}>Clear</ClearButton>
					<DeleteButton onClick={onDelete}>Delete</DeleteButton>
				</Box>
			</Box>
		</Popover>
	);
};

const blueShade = "rgba(56, 152, 252, 1)";

const ClearButton = styled(Button)`
border-radius: 4px;
border: 1px solid ${blueShade};
box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.25);
color: ${blueShade};
font-family: var(--font-nunito);
font-size: 14px;
font-weight: 600;
line-height: 20px;
text-transform: none;

&:hover {
  color: ${blueShade};
}
`;

const DeleteButton = styled(Button)`
background-color: ${blueShade};
border-radius: 4px;
border: 1px solid ${blueShade};
box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.25);
color: #fff;
font-family: var(--font-nunito);
font-size: 14px;
font-weight: 600;
line-height: 20px;
text-transform: none;

&:hover {
  color: ${blueShade};
}
`;
