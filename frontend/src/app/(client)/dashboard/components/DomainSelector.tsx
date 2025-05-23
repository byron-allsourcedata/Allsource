"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Menu,
  MenuItem,
  IconButton,
  InputAdornment,
} from "@mui/material";
import CustomTooltip from "@/components/customToolTip";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import { SimpleDomainSelector } from "./SimpleDomainSelector";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import { AxiosError } from "axios";

interface Domain {
  id: number;
  user_id: number;
  domain: string;
  data_provider_id: number;
  is_pixel_installed: boolean;
  enable: boolean;
}

interface DomainSelectorProps {
  onDomainSelected: (domain: Domain) => void;
}

const DomainSelector: React.FC<DomainSelectorProps> = ({
  onDomainSelected,
}) => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  const domainRegex = /^(?!:\/\/)([a-zA-Z0-9-_]+\.)+[a-zA-Z]{2,}$/;

  const validateField = (value: string): string => {
    const sanitizedValue = value
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .trim();
    return domainRegex.test(sanitizedValue) ? "" : "Invalid domain format";
  };

  const loadDomainsFromSession = () => {
    const me = sessionStorage.getItem("me");
    const savedDomains: Domain[] = me ? JSON.parse(me).domains || [] : [];
    return savedDomains;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const saved = loadDomainsFromSession();

      const filtered = saved.filter(
        (domain) => domain.is_pixel_installed === false
      );

      setDomains((prev) => {
        if (JSON.stringify(prev) !== JSON.stringify(filtered)) {
          return filtered;
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (domains.length > 0 && !selectedDomain) {
      setSelectedDomain(domains[0]);
      onDomainSelected(domains[0]);
    }
  }, [domains]);

  const validateDomain = (input: string): boolean => {
    const domainPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}$/i;
    return domainPattern.test(input.trim());
  };

  const handleWebsiteLink = (event: React.ChangeEvent<HTMLInputElement>) => {
    const rawInput = event.target.value.trim();
    const sanitizedInput = rawInput
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "");

    const websiteError = validateField(rawInput);

    const finalDomain = !websiteError ? `https://${sanitizedInput}` : rawInput;

    setNewDomain(finalDomain);
    setError(websiteError);
  };

  const handleAddDomain = async () => {
    if (!validateDomain(newDomain)) {
      setError("Invalid domain format");
      return;
    }

    try {
      const response = await axiosInstance.post("/domains/", {
        domain: newDomain.trim(),
      });
      if (response.status === 201) {
        const newDom: Domain = response.data;
        const updatedDomains = [...domains, newDom];
        const me = JSON.parse(sessionStorage.getItem("me") || "{}");
        me.domains = updatedDomains;
        sessionStorage.setItem("me", JSON.stringify(me));
        setDomains(updatedDomains);
        setSelectedDomain(newDom);
        onDomainSelected(newDom);
        setNewDomain("");
        setAddingNew(false);
        setError(null);
      }
    } catch (err) {
      if (
        err instanceof AxiosError &&
        err.response?.data?.status === "NEED_UPGRADE_PLAN"
      ) {
        alert("Upgrade your plan to add more domains.");
      } else {
        setError("Failed to add domain");
      }
    }
  };

  return (
    <Box
      sx={{
        padding: "1rem",
        border: "1px solid #e4e4e4",
        borderRadius: "8px",
        backgroundColor: "rgba(255, 255, 255, 1)",
        boxShadow: "0px 2px 10px rgba(0, 0, 0, 0.08)",
        marginBottom: "2rem",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1,  pb: "4px" }}>
        <Typography
          sx={{
            fontFamily: "Nunito Sans",
            fontWeight: 700,
            fontSize: "16px",
            color: "#1c1c1c",
          }}
        >
          1. Choose your domain
        </Typography>
        <CustomTooltip
          title="Set which domain's user activity will be tracked."
          linkText="Learn more"
          linkUrl="https://allsourceio.zohodesk.com/portal/en/kb/allsource/install-pixel"
        />
      </Box>
      <Typography className="paragraph" sx={{ marginBottom: "1rem" }}>
        Select the domain you want to install pixel on
      </Typography>

      {domains.length === 0 && !addingNew ? (
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAddingNew(true)}
          sx={{
            backgroundColor: "rgba(56, 152, 252, 1)",
            textTransform: "none",
          }}
        >
          Add domain
        </Button>
      ) : addingNew ? (
        <Box display="flex" alignItems="start" gap={2} pt={1}>
          <TextField
            onKeyDown={(e) => e.stopPropagation()}
            fullWidth
            label="Enter domain link"
            variant="outlined"
            sx={{
              maxHeight: "56px",
              maxWidth: "40%",
              "& .MuiOutlinedInput-root": {
                fontSize: "14px",
                maxHeight: "48px",
                "& fieldset": {
                  borderColor: "rgba(56, 152, 252, 1)",
                },
                "&:hover fieldset": {
                  borderColor: "rgba(56, 152, 252, 1)",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "rgba(56, 152, 252, 1)",
                },
                paddingTop: "13px",
                paddingBottom: "13px",
              },
              "& .MuiInputLabel-root": {
                fontSize: "14px",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "rgba(56, 152, 252, 1)",
                color: "rgba(56, 152, 252, 1)",
              },
            }}
            placeholder={isFocused ? "example.com" : ""}
            value={
              isFocused
                ? newDomain.replace(/^https?:\/\//, "")
                : `https://${newDomain.replace(/^https?:\/\//, "")}`
            }
            onChange={handleWebsiteLink}
            onFocus={handleFocus}
            onBlur={handleBlur}
            error={!!error}
            helperText={error}
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
            }}
          />
          <Button
            variant="contained"
            sx={{
              backgroundColor: "rgba(56, 152, 252, 1)",
              textTransform: "none",
              minHeight: "48px",
              fontWeight: "400",
              fontFamily: "Nunito Sans",
              fontSize: "13px",
              "&:hover": {
                backgroundColor: "rgba(56, 152, 252, 1)",
              },
            }}
            onClick={handleAddDomain}
          >
            Save
          </Button>
        </Box>
      ) : (
        <SimpleDomainSelector
          domains={domains}
          selectedDomain={selectedDomain}
          onChange={(newDomain) => {
            setSelectedDomain(newDomain);
            onDomainSelected(newDomain);
            setDomains((prev) => {
              if (!prev.find((d) => d.id === newDomain.id)) {
                return [...prev, newDomain];
              }
              return prev;
            });
          }}
        />
      )}
    </Box>
  );
};

export default DomainSelector;
