import { LinearProgress, Typography, TextField, Chip, Button, FormControl, Select, MenuItem, InputAdornment, IconButton, TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody, SelectChangeEvent } from "@mui/material"
import { Box } from "@mui/system"
import { smartAudiences } from "../../smartAudiences"
import { useState } from "react";
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from "@mui/icons-material/Search";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import Image from 'next/image';

interface SelectedData {
    includeExclude: string;
    sourceLookalike: string;
    selectedSource: string;
    selectedSourceId: string;
}

const sourceData = [
    { id: 'uuid-123', name: "My orders", type: "Customer Conversions", size: "10,000" },
    { id: 'uuid-124', name: "Failed", type: "Lead Failures", size: "35,000" },
    { id: 'uuid-125', name: "Intent list", type: "Intent", size: "37,000" },
];

const lookalikeData = [
    { id: 'uuid-126', name: "List 2", type: "Customer Conversions", size: "4,000,000" },
    { id: 'uuid-127', name: "List 1", type: "Customer Conversions", size: "20,000" },
    { id: 'uuid-128', name: "New List", type: "Customer Conversions", size: "50,000" },
];

const SmartAudiencesContacts: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [audienceName, setAudienceName] = useState<string>("");
    const [option, setOption] = useState<string>("");
    const [sourceType, setSourceType] = useState<string>("");
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [AudienceSize, setAudienceSize] = useState<number | null>(null);
    const [search, setSearch] = useState("");
    const [selectedSources, setSelectedSources] = useState<SelectedData[]>([]);
    const [showTable, setShowTable] = useState(true);
    const [showForm, setShowForm] = useState(true);
    const [isTableVisible, setIsTableVisible] = useState(true);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setAudienceName(event.target.value);
    };

    const handleSelectSourceType = (event: SelectChangeEvent<string>) => {
        setSourceType(event.target.value);
    };

    const handleSelectOption = (event: SelectChangeEvent<string>) => {
        setOption(event.target.value);
    };

    const getFilteredData = (data: any[]) => {
        return data.filter((item) =>
            item.name.toLowerCase().includes(search.toLowerCase()) &&
            !selectedSources.some(source => source.selectedSourceId === item.id)
        );
    };


    const handleSelectRow = (row: any) => {
        if (selectedSources.some(source => source.selectedSourceId === row.id)) {
            return;
        }

        setShowTable(false);

        if (option && sourceType) {
            setSelectedSources([
                ...selectedSources,
                {
                    includeExclude: option,
                    sourceLookalike: sourceType,
                    selectedSource: row.name,
                    selectedSourceId: row.id
                }
            ]);
            setOption("");
            setSourceType("");
            setShowTable(true);
            setShowForm(false);
        }
    };


    const handleDeleteChip = (id: string) => {
        setSelectedSources(selectedSources.filter(source => source.selectedSourceId !== id));
    };

    const handleAddMore = () => {
        setShowForm(true);
    };

    const groupedSources = selectedSources.reduce((acc, data) => {
        if (!acc[data.includeExclude]) {
            acc[data.includeExclude] = [];
        }
        acc[data.includeExclude].push({ source: data.selectedSource, type: data.sourceLookalike, id: data.selectedSourceId });
        return acc;
    }, {} as Record<string, { source: string; type: string; id: string }[]>);

    const currentData = sourceType === "Source" ? sourceData : lookalikeData;
    const filteredData = getFilteredData(currentData);

    const handleCalculate = () => {
        setAudienceSize(123)
    }

    const handleEditContacts = () => {
        setAudienceSize(null)
    }

    return (
        <Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, minWidth: '100%', flexGrow: 1, position: "relative", flexWrap: "wrap", border: "1px solid rgba(228, 228, 228, 1)", borderRadius: "6px", padding: "20px", mt: 2 }}>
                {uploadProgress !== null && (
                    <Box sx={{ width: "100%", position: "absolute", top: 0, left: 0, zIndex: 1200 }}>
                        <LinearProgress variant="determinate" value={uploadProgress} sx={{ borderRadius: "6px", backgroundColor: '#c6dafc', '& .MuiLinearProgress-bar': { borderRadius: 5, backgroundColor: '#4285f4' } }} />
                    </Box>
                )}
                <Box sx={{ display: "flex", width: '100%', flexDirection: "row", justifyContent: 'space-between', gap: 1 }}>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, }}>
                        <Typography sx={{ fontFamily: "Nunito Sans", fontSize: "16px", fontWeight: 500 }}>Select your Contacts</Typography>
                        <Typography sx={{ fontFamily: "Roboto", fontSize: "12px", color: "rgba(95, 99, 104, 1)" }}>Choose what data sources you want to use.</Typography>
                    </Box>

                    {AudienceSize &&
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Typography className='table-data' sx={{ color: 'rgba(32, 33, 36, 1) !important', fontSize: '14px !important' }}>Size</Typography>
                            <TextField
                                fullWidth
                                size="small"
                                margin="none"
                                variant="outlined"
                                value={AudienceSize}
                                disabled
                                sx={{
                                    maxHeight: '40px',
                                    width: '120px',
                                    '& .MuiInputBase-root': {
                                        height: '40px',
                                    },
                                    '& .MuiOutlinedInput-input': {
                                        padding: '8px 16px',
                                    },
                                    '& .MuiOutlinedInput-input.Mui-disabled': {
                                        color: 'rgba(33, 33, 33, 1)',
                                        WebkitTextFillColor: 'rgba(33, 33, 33, 1)'
                                    }
                                }}
                            />
                        </Box>
                    }


                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'end', justifyContent: 'space-between' }}>
                        <Box>
                            {Object.entries(groupedSources).map(([key, values]) => (
                                <Box key={key} sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                                    <Typography sx={{ fontFamily: 'Roboto', fontWeight: '400', fontSize: '14px', color: '#202124' }}>{key}</Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        {values.map(({ source, type, id }, index) => (
                                            <Chip
                                                key={index}
                                                label={`${type} - ${source}`}
                                                deleteIcon={
                                                    !AudienceSize ? (
                                                        <CloseIcon sx={{ color: 'rgba(32, 33, 36, 1) !important', fontSize: '16px !important' }} />
                                                    ) : undefined
                                                }
                                                sx={{
                                                    border: '1px solid #90A4AE', backgroundColor: '#ffffff', borderRadius: '4px',
                                                    '& .MuiChip-label': {
                                                        fontSize: '12px', fontFamily: 'Nunito Sans', fontWeight: '500'
                                                    },
                                                }}
                                                onDelete={!AudienceSize ? () => handleDeleteChip(id) : undefined}
                                            />
                                        ))}
                                    </Box>
                                </Box>
                            ))}
                        </Box>

                        {AudienceSize &&
                            <Button
                                onClick={handleEditContacts}
                                variant="outlined"
                                sx={{
                                    ...smartAudiences.buttonform,
                                    borderColor: "rgba(80, 82, 178, 1)",
                                    width: "92px",
                                    ":hover": {
                                        backgroundColor: "#fff"
                                    },
                                }}>
                                <Typography
                                    sx={{
                                        ...smartAudiences.textButton,
                                        color: "rgba(80, 82, 178, 1)",


                                    }}
                                >
                                    Edit
                                </Typography>
                            </Button>
                        }
                    </Box>



                    {(showForm || selectedSources.length === 0) && (
                        <Box sx={{ display: "flex", flexDirection: "row", gap: 2 }}>
                            <FormControl variant="outlined">
                                <Select value={option} onChange={handleSelectOption} displayEmpty sx={{ ...smartAudiences.text, width: "316px", borderRadius: "4px", pt: 0 }}>
                                    <MenuItem value="" disabled sx={{ display: "none", mt: 0 }}>Select an option</MenuItem>
                                    <MenuItem className="second-sub-title" value={"Include"}>Include</MenuItem>
                                    <MenuItem className="second-sub-title" value={"Exclude"}>Exclude</MenuItem>
                                </Select>
                            </FormControl>

                            {option && (
                                <FormControl variant="outlined">
                                    <Select value={sourceType} onChange={handleSelectSourceType} displayEmpty sx={{ ...smartAudiences.text, width: "316px", borderRadius: "4px", pt: 0 }}>
                                        <MenuItem value="" disabled sx={{ display: "none", mt: 0 }}>Select audience source</MenuItem>
                                        <MenuItem className="second-sub-title" value={"Source"}>Source</MenuItem>
                                        <MenuItem className="second-sub-title" value={"Lookalike"}>Lookalike</MenuItem>
                                    </Select>
                                </FormControl>
                            )}
                        </Box>
                    )}

                    {option && sourceType && showTable && (
                        <Box sx={{ display: 'flex', width: '100%', flexDirection: 'column', pt: 2, gap: 2 }}>
                            <Typography>Choose your {sourceType}</Typography>
                            <Box sx={{ width: "100%" }}>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    placeholder="Source Search"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <IconButton onClick={() => setIsTableVisible(!isTableVisible)}>
                                                {isTableVisible ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                                            </IconButton>
                                        )
                                    }}
                                    sx={{ pb: '2px' }}
                                />
                                {isTableVisible && (
                                    <TableContainer component={Paper}>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell className="black-table-data" >Name</TableCell>
                                                    <TableCell className="black-table-data" >Type</TableCell>
                                                    <TableCell className="black-table-data" >Size</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {filteredData.map((row) => (
                                                    <TableRow key={row.name} hover sx={{ cursor: "pointer" }} onClick={() => handleSelectRow(row)}>
                                                        <TableCell className="black-table-header">{row.name}</TableCell>
                                                        <TableCell className="black-table-header">{row.type}</TableCell>
                                                        <TableCell className="black-table-header">{row.size}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}
                            </Box>
                        </Box>
                    )}

                    {(!showForm && selectedSources.length !== 0 && !AudienceSize) && (
                        <Box sx={{ display: 'flex', width: '100%', alignItems: 'self-start' }}>
                            <Button onClick={handleAddMore} variant="text" className="second-sub-title" sx={{ textTransform: 'none', textDecoration: 'underline', color: 'rgba(80, 82, 178, 1) !important' }}>+ Add more</Button>
                        </Box>
                    )}
                </Box>

            </Box>
            {(!showForm && selectedSources.length !== 0 && !AudienceSize) && (
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mt: 2, justifyContent: "flex-end", borderRadius: "6px" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <Button variant="outlined" sx={{
                            ...smartAudiences.buttonform,
                            borderColor: "rgba(80, 82, 178, 1)",
                            width: "92px",
                        }}>
                            <Typography
                                sx={{
                                    ...smartAudiences.textButton,
                                    color: "rgba(80, 82, 178, 1)",
                                }}
                            >
                                Cancel
                            </Typography>
                        </Button>
                        <Button variant="contained" onClick={handleCalculate} sx={{
                            ...smartAudiences.buttonform,
                            backgroundColor: "rgba(80, 82, 178, 1)",
                            width: "120px",
                            ":hover": {
                                backgroundColor: "rgba(80, 82, 178, 1)"
                            },
                        }}>
                            <Typography
                                sx={{
                                    ...smartAudiences.textButton,
                                    color: "rgba(255, 255, 255, 1)",

                                }}
                            >
                                Calculate
                            </Typography>
                        </Button>
                    </Box>
                </Box>
            )}

            {AudienceSize &&
                <Box>
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            borderRadius: "6px",
                            border: "1px solid #E4E4E4",
                            backgroundColor: "white",
                            padding: "24px 20px",
                            mt: 2,
                        }}
                    >
                        <Typography
                            className="first-sub-title"
                            variant="body1"
                            sx={{
                                fontWeight: "bold",
                                fontSize: "19px",
                                fontFamily: "Nunito Sans",
                                letterSpacing: "0%",
                                paddingRight: "20px",
                                color: "#000000",
                                whiteSpace: "nowrap",
                            }}
                        >
                            Name
                        </Typography>
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="Enter Audience name"
                            value={audienceName}
                            onChange={handleInputChange}
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: "8px",
                                    paddingLeft: "8px",
                                    width: "300px",
                                    height: "40px",
                                    "@media (max-width: 1080px)": {
                                        width: "250px",
                                    },
                                    "@media (max-width: 600px)": {
                                        width: "100%",
                                    },
                                },
                                "& .MuiInputBase-input": {
                                    fontFamily: "Nunito Sans",
                                    fontWeight: 400,
                                    fontSize: "14px",
                                    lineHeight: "20px",
                                },
                            }}
                        />
                    </Box>
                    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mt: 2, justifyContent: "flex-end", borderRadius: "6px" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
                            <Button variant="outlined" sx={{
                                ...smartAudiences.buttonform,
                                borderColor: "rgba(80, 82, 178, 1)",
                                width: "92px",
                            }}>
                                <Typography
                                    sx={{
                                        ...smartAudiences.textButton,
                                        color: "rgba(80, 82, 178, 1)",
                                    }}
                                >
                                    Cancel
                                </Typography>
                            </Button>
                            <Button variant="contained" onClick={handleCalculate} sx={{
                                ...smartAudiences.buttonform,
                                backgroundColor: "rgba(80, 82, 178, 1)",
                                width: "237px",
                                ":hover": {
                                    backgroundColor: "rgba(80, 82, 178, 1)"
                                },
                            }}>

                                <Box
                                    sx={{
                                        display: "flex",
                                        flexDirection: "row",
                                        alignItems: "center",
                                        padding: "0.5rem 0.25rem",
                                        gap: 1,
                                    }}
                                >
                                    <Image
                                        src={"/stars-icon.svg"}
                                        alt="Stars icon"
                                        width={15}
                                        height={15}
                                    />
                                    <Typography
                                        sx={{
                                            ...smartAudiences.textButton,
                                            color: "rgba(255, 255, 255, 1)",

                                        }}
                                    >
                                        Generate Smart Audience
                                    </Typography>
                                </Box>

                            </Button>
                        </Box>
                    </Box>
                </Box>
            }
        </Box>
    )
}

export default SmartAudiencesContacts;