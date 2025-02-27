import React, { useState } from "react";
import {
    Box,
    Typography,
    IconButton,
    TextField,
    InputAdornment,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Button,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import AllInboxIcon from "@mui/icons-material/AllInbox";
import GroupsIcon from "@mui/icons-material/Groups";
import EventIcon from "@mui/icons-material/Event";
import DnsIcon from "@mui/icons-material/Dns";
import AspectRatioIcon from "@mui/icons-material/AspectRatio";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

interface SearchFilterProps {}

const SearchFilter: React.FC<SearchFilterProps> = () => {
    const [expanded, setExpanded] = useState<string | false>(false); // Тип для состояния expanded

    const handleAccordionChange =
        (panel: string) =>
        (event: React.SyntheticEvent, isExpanded: boolean) => {
            setExpanded(isExpanded ? panel : false);
        };

    return (
        <Box
            sx={{
                width: "620px",
                marginTop: "32px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                backgroundColor: "#FFFFFF",
                height: "100vh",
            }}
        >
            <Box
                sx={{
                    height: "70px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid #E4E4E4",
                    paddingRight: "16px",
                    paddingLeft: "16px",
                }}
            >
                <Typography variant="h6" sx={{ color: "#000000" }}>
                    Filter Search
                </Typography>
                <IconButton>
                    <CloseIcon />
                </IconButton>
            </Box>
            <Box
                sx={{
                    height: "70px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingRight: "16px",
                    paddingLeft: "16px",
                    marginTop: "0px",
                }}
            >
                <TextField
                    placeholder="Search people by name or creator"
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                    sx={{
                        width: "572px",
                        height: "48px",
                        paddingRight: "12px",
                        paddingLeft: "12px",
                        borderRadius: "4px",
                        borderWidth: "1px",
                        "& .MuiOutlinedInput-root": {
                            "& fieldset": {
                                borderRadius: "4px",
                            },
                        },
                    }}
                />
            </Box>
            <Box
                sx={{
                    width: "100%",
                    height: "290px",
                    gap: "0px",
                    display: "flex",
                    flexDirection: "column",
                    flexGrow: 1,
                    overflowY: "auto",
                }}
            >
                {[
                    "Source",
                    "Lookalike Size",
                    "Created dateType",
                    "Type",
                    "Size",
                ].map((label, index) => {
                    let Icon: React.ElementType;
                    switch (index) {
                        case 0:
                            Icon = AllInboxIcon;
                            break;
                        case 1:
                            Icon = GroupsIcon;
                            break;
                        case 2:
                            Icon = EventIcon;
                            break;
                        case 3:
                            Icon = DnsIcon;
                            break;
                        case 4:
                            Icon = AspectRatioIcon;
                            break;
                        default:
                            Icon = AllInboxIcon;
                    }

                    return (
                        <Accordion
                            key={index}
                            expanded={expanded === `panel${index}`}
                            onChange={handleAccordionChange(`panel${index}`)}
                            disableGutters
                            sx={{
                                width: "100%",
                                borderTop:
                                    index === 0 ? "1px solid #E4E4E4" : "none",
                                borderBottom:
                                    index === 4 ? "1px solid #E4E4E4" : "none",
                                backgroundColor: "transparent",
                                boxShadow: "none",
                            }}
                        >
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                sx={{
                                    padding: "8px 16px",
                                    display: "flex",
                                    alignItems: "center",
                                }}
                            >
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                    }}
                                >
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                        }}
                                    >
                                        <Icon sx={{ marginRight: "8px" }} />
                                        <Typography sx={{ color: "#000000" }}>
                                            {label}
                                        </Typography>
                                    </Box>
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails
                                sx={{
                                    backgroundColor: "#FFFFFF",
                                    padding: "8px 16px",
                                }}
                            ></AccordionDetails>
                        </Accordion>
                    );
                })}
            </Box>
            <Box
                sx={{
                    paddingTop: "28px",
                    paddingRight: "16px",
                    paddingBottom: "28px",
                    paddingLeft: "16px",
                    display: "flex",
                    justifyContent: "flex-end",
                    borderTop: "1px solid #E4E4E4",
                }}
            >
                <Button
                    variant="outlined"
                    sx={{
                        marginRight: "16px",
                        width: "138px",
                        height: "40px",
                        textTransform: "none",
                    }}
                >
                    Clear all
                </Button>
                <Button
                    variant="contained"
                    sx={{
                        backgroundColor: "#5052B2",
                        width: "120px",
                        height: "40px",
                        textTransform: "none",
                    }}
                >
                    Apply
                </Button>
            </Box>
        </Box>
    );
};

export default SearchFilter;
