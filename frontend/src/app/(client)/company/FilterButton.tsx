import { FilterListIcon } from "@/icon";
import { Box, Button } from "@mui/material";
import { SelectedFilter } from "./schemas";

export type Props = {
    dropdownOpen: boolean;
    handleFilterPopupOpen: () => void;
    selectedFilters: SelectedFilter[];
    status: string | null;
};

export const FilterButton: React.FC<Props> = (props: Props) => {
    const { dropdownOpen, handleFilterPopupOpen, selectedFilters, status } = props;

  return (
    <Button
      onClick={handleFilterPopupOpen}
      disabled={status === "PIXEL_INSTALLATION_NEEDED"}
      aria-controls={dropdownOpen ? "account-dropdown" : undefined}
      aria-haspopup="true"
      aria-expanded={dropdownOpen ? "true" : undefined}
      sx={{
        textTransform: "none",
        color:
          selectedFilters.length > 0
            ? "rgba(56, 152, 252, 1)"
            : "rgba(128, 128, 128, 1)",
        border:
          selectedFilters.length > 0
            ? "1px solid rgba(56, 152, 252, 1)"
            : "1px solid rgba(184, 184, 184, 1)",
        borderRadius: "4px",
        padding: "8px",
        opacity: status === "PIXEL_INSTALLATION_NEEDED" ? "0.5" : "1",
        minWidth: "auto",
        position: "relative",
        "@media (max-width: 900px)": {
          border: "none",
          padding: 0,
        },
        "&:hover": {
          backgroundColor: "transparent",
          border: "1px solid rgba(56, 152, 252, 1)",
          color: "rgba(56, 152, 252, 1)",
          "& .MuiSvgIcon-root": {
            color: "rgba(56, 152, 252, 1)",
          },
        },
      }}
    >
      <FilterListIcon
        fontSize="medium"
        sx={{
          color:
            selectedFilters.length > 0
              ? "rgba(56, 152, 252, 1)"
              : "rgba(128, 128, 128, 1)",
        }}
      />

      {selectedFilters.length > 0 && (
        <Box
          sx={{
            position: "absolute",
            top: 6,
            right: 8,
            width: "10px",
            height: "10px",
            backgroundColor: "red",
            borderRadius: "50%",
            "@media (max-width: 900px)": {
              top: -1,
              right: 1,
            },
          }}
        />
      )}
    </Button>
  );
};
