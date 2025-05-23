import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import React, { useState } from "react";
import { UpgradePlanPopup } from "../../components/UpgradePlanPopup";
import CloseIcon from "@mui/icons-material/Close";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import { AxiosError } from "axios";
import { showToast } from "@/components/ToastNotification";

interface Domain {
  id: number;
  user_id: number;
  domain: string;
  data_provider_id: number;
  is_pixel_installed: boolean;
  enable: boolean;
}

interface SimpleDomainSelectorProps {
  domains: Domain[];
  selectedDomain: Domain | null;
  onChange: (domain: Domain) => void;
}

interface AddDomainProps {
  open: boolean;
  handleClose: () => void;
  handleSave: (domain: Domain) => void;
}

const AddDomainPopup = ({ open, handleClose, handleSave }: AddDomainProps) => {
  const [domain, setDomain] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [errors, setErrors] = useState({ domain: "" });
  const [upgradePlanPopup, setUpgradePlanPopup] = useState(false);
  const [showSlider, setShowSlider] = useState(false);
  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);
  const validateField = (value: string, type: "domain"): string => {
    const sanitizedValue = value.replace(/^www\./, "");
    const websiteRe =
      /^(https?:\/\/)?([\da-z.-]+)\.([a-z]{2,20})([/\w .-]*)*\/?$/i;
    return websiteRe.test(sanitizedValue) ? "" : "Invalid website URL";
  };
  const handleSubmit = async () => {
    const newErrors = { domain: validateField(domain, "domain") };
    setErrors(newErrors);
    if (newErrors.domain) return;

    try {
      const response = await axiosInstance.post("domains/", { domain });
      if (response.status === 201) {
        handleClose();
        handleSave(response.data);
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 403) {
          if (error.response.data.status === "NEED_UPGRADE_PLAN") {
            setUpgradePlanPopup(true);
          } else if (error.response.data.status === "NEED_BOOK_CALL") {
            sessionStorage.setItem("is_slider_opened", "true");
            setShowSlider(true);
          } else {
            sessionStorage.setItem("is_slider_opened", "false");
            setShowSlider(false);
          }
        }
      }
    }
  };

  const handleWebsiteLink = (event: { target: { value: string } }) => {
    let input = event.target.value.trim();

    const hasWWW = input.startsWith("www.");

    const sanitizedInput = hasWWW ? input.replace(/^www\./, "") : input;

    const domainPattern = /^[\w-]+\.[a-z]{2,}$/i;
    const isValidDomain = domainPattern.test(sanitizedInput);

    let finalInput = input;

    if (isValidDomain) {
      finalInput = hasWWW
        ? `https://www.${sanitizedInput}`
        : `https://${sanitizedInput}`;
    }

    setDomain(finalInput);

    const websiteError = validateField(input, "domain");
    setErrors((prevErrors) => ({
      domain: websiteError,
    }));
  };

  if (!open) return null;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        padding: "1rem",
        width: "100%",
      }}
    >
      <TextField
        onKeyDown={(e) => e.stopPropagation()}
        fullWidth
        label="Enter domain link"
        variant="outlined"
        sx={{
          marginBottom: "1.5em",
          maxHeight: "56px",
          "& .MuiOutlinedInput-root": {
            maxHeight: "48px",
            "& fieldset": {
              borderColor: "rgba(107, 107, 107, 1)",
            },
            "&:hover fieldset": {
              borderColor: "rgba(107, 107, 107, 1)",
            },
            "&.Mui-focused fieldset": {
              borderColor: "rgba(107, 107, 107, 1)",
            },
            paddingTop: "13px",
            paddingBottom: "13px",
          },
          "& .MuiInputLabel-root": {
            top: "-5px",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(107, 107, 107, 1)",
          },
        }}
        placeholder={isFocused ? "example.com" : ""}
        value={
          isFocused
            ? domain.replace(/^https?:\/\//, "")
            : `https://${domain.replace(/^https?:\/\//, "")}`
        }
        onChange={handleWebsiteLink}
        onFocus={handleFocus}
        onBlur={handleBlur}
        error={!!errors.domain}
        helperText={errors.domain}
        InputProps={{
          startAdornment: isFocused && (
            <InputAdornment
              position="start"
              disablePointerEvents
              sx={{ marginRight: 0 }}
            >
              https://
            </InputAdornment>
          ),
          endAdornment: (
            <IconButton
              aria-label="close"
              edge="end"
              sx={{ color: "text.secondary" }}
              onClick={handleClose}
            >
              <CloseIcon />
            </IconButton>
          ),
        }}
      />
      <Box sx={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>
        <Button
          className="hyperlink-red"
          onClick={handleSubmit}
          sx={{
            borderRadius: "4px",
            border: "1px solid rgba(56, 152, 252, 1)",
            boxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.25)",
            color: "rgba(56, 152, 252, 1) !important",
            textTransform: "none",
            padding: "6px 24px",
          }}
        >
          Save
        </Button>
      </Box>
      <UpgradePlanPopup
        open={upgradePlanPopup}
        limitName={"domain"}
        handleClose={() => setUpgradePlanPopup(false)}
      />
    </Box>
  );
};

export const SimpleDomainSelector: React.FC<SimpleDomainSelectorProps> = ({
  domains,
  selectedDomain,
  onChange,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const [localDomains, setLocalDomains] = useState<Domain[]>(domains);
  const [showDomainPopup, setDomainPopup] = useState(false);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSave = (domain: Domain) => {
    setLocalDomains((prev) => [...prev, domain]);

    sessionStorage.setItem("current_domain", domain.domain);

    const meRaw = sessionStorage.getItem("me");
    const me = meRaw ? JSON.parse(meRaw) : {};

    const currentDomains: Domain[] = Array.isArray(me.domains)
      ? me.domains
      : [];
    const updatedDomains = [...currentDomains, domain];
    const updatedMe = { ...me, domains: updatedDomains };

    sessionStorage.setItem("me", JSON.stringify(updatedMe));

    onChange(domain);
    showToast("Successfully added domain");
    setDomainPopup(false);
    handleClose();
  };

  const handleSelect = (domain: Domain) => {
    onChange(domain);
    sessionStorage.setItem("current_domain", domain.domain);
    handleClose();
  };

  return (
    <>
      <Button
        aria-controls={open ? "domain-menu" : undefined}
        aria-haspopup="true"
        onClick={handleClick}
        sx={{
          textTransform: "none",
          color: "rgba(98, 98, 98, 1)",
          border: "1px solid rgba(184, 184, 184, 1)",
          borderRadius: "4px",
          padding: "6px 12px",
          width: "50%",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="body2">
          {selectedDomain?.domain || "Select domain"}
        </Typography>
        <ExpandMoreIcon />
      </Button>
      <Menu
        id="account-dropdown"
        variant="menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        sx={{ "& .MuiMenu-list": { padding: "2px", pr: 0, pl: 0, pb: 0 } }}
      >
        <Box>
          <MenuItem
            onClick={() => setDomainPopup(true)}
            sx={{ borderBottom: "0.5px solid #CDCDCD" }}
          >
            <Typography
              className="second-sub-title"
              sx={{
                color: "rgba(56, 152, 252, 1) ",
                textAlign: "center",
                width: "100%",
              }}
            >
              {" "}
              + Add new domain
            </Typography>
          </MenuItem>
          <AddDomainPopup
            open={showDomainPopup}
            handleClose={() => setDomainPopup(false)}
            handleSave={handleSave}
          />
        </Box>

        {localDomains.map((domain) => (
          <MenuItem
            key={domain.id}
            onClick={() => handleSelect(domain)}
            sx={{
              "&:hover .delete-icon": {
                opacity: 1,
              },
              borderTop: "0.5px solid #CDCDCD",
              borderBottom: "0.5px solid #CDCDCD",
              "& .delete-icon": {
                opacity: 0,
                transition: "opacity 0.3s ease",
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: domain.enable ? "pointer" : "not-allowed",
                width: "20rem",
                // color: domain.enable ? 'inherit' : 'rgba(32,  33, 36, 0.3) !important'
              }}
            >
              <Typography
                className="second-sub-title"
                sx={{
                  color: domain.enable
                    ? "inherit"
                    : "rgba(32, 33, 36, 0.3) !important",
                }}
              >
                {domain.domain.replace("https://", "")}
              </Typography>
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
