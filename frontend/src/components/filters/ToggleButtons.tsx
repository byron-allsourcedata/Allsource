import React from 'react';
import { Box, Button, SxProps, Theme } from '@mui/material';



interface ToggleButtonsProps {
    buttonNames?: string[];
    buttonMapping: Record<string, string>;
    selectedButton: string[];
    handleButtonButtonClick: (label: string) => void;
    sx?: SxProps<Theme>;
}
/**
 * ToggleButtons Component
 * 
 * A reusable button group component that allows users to toggle between different options.
 * Each button represents a mapped value and updates the selection state when clicked.
 * 
 * @component
 * @param {ToggleButtonsProps} props - The properties that define the behavior and appearance of the component.
 * 
 * @property {string[]} [buttonNames=["Exaple1", "Exaple2", "Exaple3"]] - 
 * Optional array of button labels. Defaults to `["Exaple1", "Exaple2", "Exaple3"]`.
 * 
 * @property {Record<string, string>} buttonMapping - 
 * An object mapping button labels to their corresponding values. 
 * Each button name must have an associated mapped value.
 * 
 * @property {string[]} selectedButton - 
 * An array of selected button values. Used to determine which buttons are active.
 * 
 * @property {(label: string) => void} handleButtonButtonClick - 
 * A callback function triggered when a button is clicked.
 * Receives the button's label as an argument.
 * 
 * @property {SxProps<Theme>} [sx={}] - 
 * Optional styling prop that allows overriding the default styles of the component.
 * Accepts Material-UI's `SxProps<Theme>` type.
 */
const ToggleButtons: React.FC<ToggleButtonsProps> = ({
    buttonNames = ["Exaple1", "Exaple2", "Exaple3"],
    buttonMapping,
    selectedButton,
    handleButtonButtonClick,
    sx = {},
  }) => {
  return (
      <Box
      sx={sx}
      >
        {buttonNames.map((label) => {
          const mappedSource = buttonMapping[label];
          const isSelected = selectedButton.includes(mappedSource);
          return (
            <Button
              key={label}
              onClick={() => handleButtonButtonClick(label)}
              className="second-sub-title"
              sx={{
                width: "calc(25% - 5px)",
                height: "2em",
                textTransform: "none",
                textWrap: "nowrap",
                padding: "5px 0px",
                gap: "10px",
                textAlign: "center",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: isSelected
                  ? "1px solid rgba(80, 82, 178, 1)"
                  : "1px solid rgba(220, 220, 239, 1)",
                color: isSelected
                  ? "rgba(80, 82, 178, 1) !important"
                  : "#5F6368 !important",
                backgroundColor: isSelected
                  ? "rgba(237, 237, 247, 1)"
                  : "rgba(255, 255, 255, 1)",
                lineHeight: "20px !important",
              }}
            >
              {label}
            </Button>
          );
        })}
      </Box>
  );
};

export default ToggleButtons;
