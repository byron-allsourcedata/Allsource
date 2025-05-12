import React, { useState } from 'react';
import { Box, Typography, IconButton, Collapse, FormGroup, FormControlLabel, Checkbox, SxProps, Theme } from '@mui/material';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface ExpandableCheckboxFilterProps {
  selectedOptions: string[];
  allowedOptions: string[];
  onOptionToggle: (option: string) => void;
  placeholder?: string;
  sx?: SxProps<Theme>;
}

/**
 * ExpandableCheckboxFilter Component
 *
 * A collapsible filter component that displays a list of checkboxes inside a dropdown.
 * Users can toggle options and the selected values will be displayed in the dropdown header.
 *
 * @component
 * @param {ExpandableCheckboxFilterProps} props - The properties that define the behavior and appearance of the component.
 *
 * @property {string[]} selectedOptions - 
 * An array of currently selected options. Used to determine which checkboxes are checked.
 *
 * @property {string[]} allowedOptions - 
 * An array of available options that can be selected.
 *
 * @property {(option: string) => void} onOptionToggle - 
 * A callback function triggered when a checkbox is clicked. 
 * Receives the selected option as an argument.
 *
 * @property {string} [placeholder="Select Option"] - 
 * A placeholder text displayed when no options are selected.
 * Defaults to `"Select Option"`.
 *
 * @property {SxProps<Theme>} [sx={}] - 
 * Optional styling prop that allows overriding the default styles of the component.
 * Accepts Material-UI's `SxProps<Theme>` type.
 */
const ExpandableCheckboxFilter: React.FC<ExpandableCheckboxFilterProps> = ({
  selectedOptions,
  allowedOptions,
  onOptionToggle,
  placeholder = "Select Option",
  sx = {},
}) => {
  const [isFieldOpen, setIsFieldOpen] = useState(false);

  return (
    <Box sx={sx}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          border: "1px solid rgba(220, 220, 239, 1)",
          borderRadius: "4px",
          padding: "5px 10px",
          cursor: "pointer",
          backgroundColor: "#fff",
        }}
        onClick={() => setIsFieldOpen(!isFieldOpen)}
      >
        <Typography
          sx={{
            fontFamily: "Roboto",
            fontSize: "14px",
            fontWeight: 400,
            lineHeight: "19.6px",
            textAlign: "left",
            color: selectedOptions.length ? "rgba(220, 220, 239, 1)" : "#5F6368",
          }}
        >
          {selectedOptions.length > 0
            ? selectedOptions.join(", ")
            : placeholder}
        </Typography>
        <IconButton size="small">
          {isFieldOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>
      <Collapse in={isFieldOpen}>
        <Box sx={{ pt: "2px" }}>
          <FormGroup
            sx={{
              border: "1px solid rgba(220, 220, 239, 1)",
              borderRadius: "4px",
              pl: 2,
            }}
          >
            {allowedOptions.map((option) => (
              <FormControlLabel
                sx={{
                  
                }}
                key={option}
                control={
                  <Checkbox
                    checked={selectedOptions.includes(option)}
                    onChange={() => onOptionToggle(option)}
                    size="small"
                    sx={{
                      fontSize: '12px',
                      "&.Mui-checked": {
                        color: "rgba(56, 152, 252, 1)",
                      },
                    }}
                  />
                }
                label={
                  <Typography
                    sx={{
                      fontSize: '12px',
                      color: selectedOptions.includes(option)
                        ? "rgba(56, 152, 252, 1) !important"
                        : "rgba(74, 74, 74, 1)",
                    }}
                  >
                    {option}
                  </Typography>
                }
              />
            ))}
          </FormGroup>
        </Box>
      </Collapse>
    </Box>
  );
};

export default ExpandableCheckboxFilter;
