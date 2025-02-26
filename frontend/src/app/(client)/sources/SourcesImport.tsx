"use client";
import React, { ChangeEvent, useState, useEffect, Suspense } from 'react';
import { Box, Grid, Typography, TextField, Button, FormControl, MenuItem, Select, LinearProgress, SelectChangeEvent, Paper, IconButton, Chip, Drawer, List, ListItemText, ListItemButton, Popover } from '@mui/material';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import axiosInstance from '../../../axios/axiosInterceptorInstance';
import axios from "axios";
import { sourcesStyles } from './sourcesStyles';
import FileUploadRoundedIcon from '@mui/icons-material/FileUploadRounded';
import LanguageIcon from '@mui/icons-material/Language';
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Slider from '../../../components/Slider';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { SliderProvider } from '../../../context/SliderContext';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import DownloadIcon from '@mui/icons-material/Download';
import DateRangeIcon from '@mui/icons-material/DateRange';
import FilterListIcon from '@mui/icons-material/FilterList';
// import FilterPopup from './CompanyEmployeesFilters';
import AudiencePopup from '@/components/AudienceSlider';
import SouthOutlinedIcon from '@mui/icons-material/SouthOutlined';
import NorthOutlinedIcon from '@mui/icons-material/NorthOutlined';
import dayjs from 'dayjs';
// import PopupDetails from './EmployeeDetails';
// import PopupChargeCredits from './ChargeCredits'
import CloseIcon from '@mui/icons-material/Close';
import CustomizedProgressBar from '@/components/CustomizedProgressBar';
import Tooltip from '@mui/material/Tooltip';
import CustomToolTip from '@/components/customToolTip';
import CustomTablePagination from '@/components/CustomTablePagination';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useNotification } from '@/context/NotificationContext';
import { showErrorToast, showToast } from '@/components/ToastNotification';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import { UpgradePlanPopup } from  '../components/UpgradePlanPopup'
import { sources } from 'next/dist/compiled/webpack/webpack';
import Link from '@mui/material/Link';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import Fuse from "fuse.js";

interface CompanyEmployeesProps {
    setSources: (state: boolean) => void
}

interface Row {
    id: number;
    type: string;
    value: string;
    selectValue?: string;
    canDelete?: boolean;
}


const SourcesImport: React.FC<CompanyEmployeesProps> = ({ setSources }) => {
    const router = useRouter();
    const [showSlider, setShowSlider] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [sourceType, setSourceType] = useState<string>("");
    const [deleteAnchorEl, setDeleteAnchorEl] = useState<null | HTMLElement>(null)
    const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
    const [sourceName, setSourceName] = useState<string>("");
    const [fileSizeStr, setFileSizeStr] = useState<string>("");
    const [fileName, setFileName] = useState<string>("");
    const [sourceMethod, setSourceMethod] = useState<number>(0);
    const [dragActive, setDragActive] = useState(false);
    const [fileSizeError, setFileSizeError] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [headersinCSV, setHeadersinCSV] = useState<any>([]);

    const deleteOpen = Boolean(deleteAnchorEl);
    const deleteId = deleteOpen ? 'delete-popover' : undefined;
    const defaultRows: Row[] = [
        { id: 1, type: 'Email', value: '' },
        { id: 2, type: 'Phone number', value: '' },
        { id: 3, type: 'Last Name', value: '' },
        { id: 4, type: 'First Name', value: '' },
        { id: 5, type: 'Gender', value: '' },
        { id: 6, type: 'Age', value: '' },
        { id: 7, type: 'Order Amount', value: '' },
        { id: 8, type: 'State', value: '' },
        { id: 9, type: 'City', value: '' },
        { id: 10, type: 'Zip Code', value: '' }
    ];
    const [rows, setRows] = useState<Row[]>(defaultRows);

    const handleMapListChange = (id: number, field: 'value' | 'selectValue', value: string) => {
        setRows(rows.map(row =>
            row.id === id ? { ...row, [field]: value } : row
        ));
    };

    const handleClickOpen = (event: React.MouseEvent<HTMLElement>, id: number) => {
        setDeleteAnchorEl(event.currentTarget);  // Set the current target as the anchor
        setSelectedRowId(id);  // Set the ID of the row to delete
    };

    const handleChange = (event: SelectChangeEvent<string>) => {
        setSourceType(event.target.value);
    };

    const handleDeleteClose = () => {
        setDeleteAnchorEl(null);
        setSelectedRowId(null);
    };


    const handleDelete = () => {
        if (selectedRowId !== null) {
            setRows(rows.filter(row => row.id !== selectedRowId));
            handleDeleteClose();
        }
    };

    const handleDeleteFile = () => {
        setFile(null);
        setFileName('')
        setFileSizeStr('')
    };

    const processDownloadFile = (uploadedFile: File) => {
        setFile(uploadedFile)
        const fileSize = parseFloat((uploadedFile.size / (1024 * 1024)).toFixed(2))
        setFileSizeStr(fileSize + " MB")
        setFileName(uploadedFile.name)
    }

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setDragActive(true);
    };

    const handleDragLeave = () => {
        setDragActive(false);
    };


    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setDragActive(false);
        setFileSizeError(false)

        const uploadedFile = event.dataTransfer.files[0];
        if (uploadedFile) {
            processDownloadFile(uploadedFile);
        }
    };

    const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const formData = new FormData();
            formData.append("file", file);
            
            const xhr = new XMLHttpRequest();
            xhr.open("POST", "/api/upload");
        
            xhr.upload.onprogress = (event) => {
              if (event.lengthComputable) {
                const percentCompleted = Math.round((event.loaded * 100) / event.total);
                setUploadProgress(percentCompleted);
              }
            };
        
            xhr.onload = () => {
              setUploadProgress(null);
            };
        
            xhr.onerror = () => {
              setUploadProgress(null);
            };
        
            xhr.send(formData);

            processDownloadFile(file);

            const reader = new FileReader();

            reader.onload = (event) => {
                const content = event.target?.result as string;
        
                if (!content) {
                    console.error("File is empty or couldn't be read");
                    return;
                }
        
                const lines = content.split("\n");
                const headers = lines[0]?.split(",").map(header => header.trim());
                setHeadersinCSV(headers)
        
                if (!headers) {
                    console.error("No headers found in the file");
                    return;
                }
        
                const fuseOptions = {
                    threshold: 0.3, // The lower the value, the stricter the match.
                    includeScore: true,
                };
        
                const fuse = new Fuse(headers, fuseOptions);
        
                const updatedRows = defaultRows.map(row => {
                    const match = fuse.search(row.type)?.[0];
        
                    return match && match.score !== undefined && match.score <= 0.3
                        ? { ...row, value: match.item }
                        : row;
                });
        
                setRows(updatedRows);
            };
        
            reader.readAsText(file);
        }

        
    };


    if (isLoading) {
        return <CustomizedProgressBar />;
    }

    const centerContainerStyles = {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        border: '1px solid rgba(235, 235, 235, 1)',
        borderRadius: 2,
        padding: 3,
        boxSizing: 'border-box',
        width: '100%',
        textAlign: 'center',
        flex: 1,
        '& img': {
            width: 'auto',
            height: 'auto',
            maxWidth: '100%'
        }
    };



    return (
        <>
            {loading && (
                <CustomizedProgressBar/>
            )}
            <Box sx={{
                display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%',
                '@media (max-width: 900px)': {
                    paddingRight: 0,
                    minHeight: '100vh'

                }
            }}>
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <Box sx={{
                        flex: 1, gap: 2, display: 'flex', flexDirection: 'column', maxWidth: '100%', pl: 0, pr: 0, pt: '14px', pb: '20px',
                        '@media (max-width: 900px)': {
                            pt: '2px',
                            pb: '18px'
                        }
                    }}>
                        <Box sx={{display: "flex", flexDirection: "column", gap: 2, flexWrap: "wrap", border: "1px solid rgba(228, 228, 228, 1)", borderRadius: "6px", padding: "20px" }}>
                            <Box sx={{display: "flex", flexDirection: "column", gap: 1}}>
                                <Typography sx={{fontFamily: "Nunito Sans", fontSize: "16px"}}>Choose your data source</Typography>
                                <Typography sx={{fontFamily: "Nunito Sans", fontSize: "12px", color: "rgba(95, 99, 104, 1)"}}>Choose your data source, and let Maximia AI Audience Algorithm identify high-intent leads and create lookalike audiences to slash your acquisition costs.</Typography>
                            </Box>
                            <Box sx={{display: "flex",  gap: 2, "@media (max-width: 420px)": { display: "grid", gridTemplateColumns: "1fr" }}}>
                                <Button
                                    variant="outlined"
                                    startIcon={<Image src="upload-minimalistic.svg" alt="upload" width={20} height={20} />}
                                    sx={{
                                        fontFamily: "Nunito Sans",
                                        border: "1px solid rgba(208, 213, 221, 1)",
                                        borderRadius: "4px",
                                        color: "rgba(32, 33, 36, 1)",
                                        textTransform: "none",
                                        fontSize: "14px",
                                        padding: "8px 12px",
                                        backgroundColor: sourceMethod === 1 ? "rgba(246, 248, 250, 1)" : "#fff",
                                        ":hover": {
                                            borderColor: "#1C3A57",
                                            backgroundColor: "rgba(236, 238, 241, 1)"
                                        },
                                    }}
                                    onClick={() => setSourceMethod(1)}
                                    >
                                    Manually upload
                                </Button>
                                <Button
                                    variant="outlined"
                                    startIcon={<Image src="website-icon.svg" alt="upload" width={20} height={20} />}
                                    sx={{
                                        fontFamily: "Nunito Sans",
                                        border: "1px solid rgba(208, 213, 221, 1)",
                                        borderRadius: "4px",
                                        color: "rgba(32, 33, 36, 1)",
                                        textTransform: "none",
                                        fontSize: "14px",
                                        padding: "8px 12px",
                                        backgroundColor: sourceMethod === 2 ? "rgba(246, 248, 250, 1)" : "#fff",
                                        ":hover": {
                                            borderColor: "#1C3A57",
                                            backgroundColor: "rgba(236, 238, 241, 1)"
                                        },
                                    }}
                                    onClick={() => setSourceMethod(2)}
                                    >
                                    Website - Pixel
                                </Button>
                            </Box>
                        </Box>
                        <Box sx={{display: sourceMethod === 0 ? "none" : "flex", flexDirection: "column", gap: 2, position: "relative", flexWrap: "wrap", border: "1px solid rgba(228, 228, 228, 1)", borderRadius: "6px", padding: "20px" }}>
                            {uploadProgress !== null && (
                                            <Box sx={{ width: "100%", position: "absolute", top: 0, left: 0, zIndex: 1200  }}>
                                                <LinearProgress variant="determinate" value={uploadProgress} sx={{borderRadius: "6px",}} />
                                            </Box>
                            )}
                            <Box sx={{display: "flex", flexDirection: "column", gap: 1}}>
                                <Typography sx={{fontFamily: "Nunito Sans", fontSize: "16px"}}>Select your Source File</Typography>
                                <Typography sx={{fontFamily: "Nunito Sans", fontSize: "12px", color: "rgba(95, 99, 104, 1)"}}>Please upload a CSV file containing the list of customers who have successfully completed an order on your website.</Typography>
                            </Box>
                            <FormControl
                                variant="outlined"
                                >
                                <Select
                                    value={sourceType}
                                    onChange={handleChange}
                                    displayEmpty
                                    sx={{   
                                        ...sourcesStyles.text,
                                        width: "316px",
                                        borderRadius: "4px",
                                        "@media (max-width: 390px)": { width: "calc(100vw - 74px)" },
                                    }}
                                >
                                    <MenuItem value="" disabled sx={{display: "none"}}>
                                        Select a Source Type
                                    </MenuItem>
                                    <MenuItem value={"Customer Conversions"}>Customer Conversions</MenuItem>
                                    <MenuItem value={"Lead Failures"}>Lead Failures</MenuItem>
                                    <MenuItem value={"Intent"}>Intent</MenuItem>
                                </Select>
                            </FormControl>
                            {sourceType !== "" &&
                                <Box sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    width: "316px",
                                    border: dragActive
                                        ? "2px dashed rgba(80, 82, 178, 1)"
                                        : "1px dashed rgba(80, 82, 178, 1)",
                                    borderRadius: "4px",
                                    padding: "8px 16px",
                                    height: "80px",
                                    gap: "16px",
                                    cursor: "pointer",
                                    backgroundColor: dragActive
                                        ? "rgba(80, 82, 178, 0.1)"
                                        : "rgba(246, 248, 250, 1)",
                                    transition: "background-color 0.3s, border-color 0.3s",
                                    "@media (max-width: 390px)": { width: "calc(100vw - 74px)" },
                                }}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={() => document.getElementById("fileInput")?.click()}>
                                    <IconButton sx={{ width: "40px", height: "40px", borderRadius: "4px", backgroundColor: "rgba(234, 235, 255, 1)",  }} >
                                    <FileUploadOutlinedIcon sx={{
                                        color: "rgba(80, 82, 178, 1)" }} />
                                    </IconButton>
                                    <Box sx={{ flexGrow: 1 }}>
                                        <Typography
                                        sx={{
                                            fontFamily: "Nunito Sans",
                                            fontSize: "16px",
                                            fontWeight: "600",
                                            color: "rgba(80, 82, 178, 1)"
                                        }}
                                        >
                                        Upload a file
                                        </Typography>
                                        <Typography
                                        sx={{
                                            fontFamily: "Nunito Sans",
                                            fontSize: "14px",
                                            fontWeight: "500",
                                            color: "rgba(32, 33, 36, 1)",
                                        }}
                                        >
                                        CSV.Max 100MB
                                        </Typography>
                                    </Box>
                                    <input
                                        id="fileInput"
                                        type="file"
                                        hidden
                                        accept=".csv"
                                        onChange={(event: any) => {
                                            handleFileUpload(event);
                                            event.target.value = null;
                                        }}
                                    />
                                </Box>
                            }
                            {sourceType !== "" && file &&
                                <Box sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    width: "316px",
                                    border: "1px solid rgba(228, 228, 228, 1)",
                                    borderRadius: "4px",
                                    padding: "8px 16px",
                                    height: "80px",
                                    backgroundColor: "rgba(246, 248, 250, 1)",
                                    gap: "16px",
                                    "@media (max-width: 390px)": { width: "calc(100vw - 74px)" }
                                }}>
                                    <Box sx={{ flexGrow: 1 }}>
                                        <Typography
                                        sx={{
                                            fontFamily: "Nunito Sans",
                                            fontSize: "16px",
                                            fontWeight: "600",
                                            color: "rgba(32, 33, 36, 1)"
                                        }}
                                        >
                                        {fileName}
                                        </Typography>
                                        <Typography
                                        sx={{
                                            fontFamily: "Nunito Sans",
                                            fontSize: "12px",
                                            fontWeight: "600",
                                            color: "rgba(74, 74, 74, 1)",
                                        }}
                                        >
                                        {fileSizeStr}
                                        </Typography>
                                    </Box>
                                    <IconButton onClick={handleDeleteFile}>
                                        <DeleteOutlinedIcon />
                                    </IconButton>
                                </Box>
                            }
                            <Typography sx={sourcesStyles.text}>Sample doc: <Link href="https://dev.maximiz.ai/integrations" sx={sourcesStyles.textLink}>sample recent customers-list.csv</Link></Typography>
                        </Box>
                        <Box sx={{display: sourceMethod !== 0 && file ? "flex" : "none", flexDirection: "column", gap: 2, flexWrap: "wrap", border: "1px solid rgba(228, 228, 228, 1)", borderRadius: "6px", padding: "20px" }}>
                        {rows.map((row) => (
                            <Box key={row.id}>
                                <Grid container spacing={2} alignItems="center" sx={{ flexWrap: { xs: 'nowrap', sm: 'wrap' } }}>
                                    {/* Left Input Field */}
                                    <Grid item xs="auto" sm={2}>
                                        <TextField
                                            fullWidth
                                            variant="outlined"
                                            value={row.type}
                                            InputLabelProps={{
                                                sx: {
                                                    fontFamily: 'Nunito Sans',
                                                    fontSize: '12px',
                                                    lineHeight: '16px',
                                                    color: 'rgba(17, 17, 19, 0.60)',
                                                    top: '-5px',
                                                    '&.Mui-focused': {
                                                        color: '#0000FF',
                                                        top: 0
                                                    },
                                                    '&.MuiInputLabel-shrink': {
                                                        top: 0
                                                    }
                                                }
                                            }}
                                            InputProps={{

                                                sx: {
                                                    '&.MuiOutlinedInput-root': {
                                                        height: '36px',
                                                        '& .MuiOutlinedInput-input': {
                                                            padding: '6.5px 8px',
                                                            fontFamily: 'Roboto',
                                                            color: '#202124',
                                                            fontSize: '12px',
                                                            fontWeight: '400',
                                                            lineHeight: '20px'
                                                        },
                                                        '& .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: '#A3B0C2',
                                                        },
                                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: '#A3B0C2',
                                                        },
                                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: '#0000FF',
                                                        },
                                                    },
                                                    '&+.MuiFormHelperText-root': {
                                                        marginLeft: '0',
                                                    },
                                                }
                                            }}
                                        />
                                    </Grid>

                                    {/* Middle Icon Toggle (Right Arrow or Close Icon) */}
                                    <Grid item xs="auto" sm={0.5} container justifyContent="center">
                                        {row.selectValue !== undefined ? (
                                            row.selectValue ? (
                                                <Image
                                                    src='/chevron-right-purple.svg'
                                                    alt='chevron-right-purple'
                                                    height={18}
                                                    width={18} // Adjust the size as needed
                                                />

                                            ) : (
                                                <Image
                                                    src='/close-circle.svg'
                                                    alt='close-circle'
                                                    height={18}
                                                    width={18} // Adjust the size as needed
                                                />
                                            )
                                        ) : (
                                            <Image
                                                src='/chevron-right-purple.svg'
                                                alt='chevron-right-purple'
                                                height={18}
                                                width={18} // Adjust the size as needed
                                            /> // For the first two rows, always show the right arrow
                                        )}
                                    </Grid>
                                    
                                    <Grid item xs="auto" sm={2}>
                                        <FormControl fullWidth>
                                            <Select
                                                value={row.value || ''}
                                                onChange={(e) => handleMapListChange(row.id, 'value', e.target.value)}
                                                displayEmpty
                                                inputProps={{
                                                    sx: {
                                                        fontFamily: 'Nunito Sans',
                                                        fontSize: '12px',
                                                        lineHeight: '16px',
                                                        top: '-5px',
                                                        '&.Mui-focused': {
                                                            color: '#0000FF',
                                                            top: 0
                                                        },
                                                        '&.MuiInputLabel-shrink': {
                                                            top: 0
                                                        },
                                                        '&.MuiOutlinedInput-root': {
                                                            height: '36px',
                                                            '& .MuiOutlinedInput-input': {
                                                                padding: '6.5px 8px',
                                                                fontFamily: 'Roboto',
                                                                color: '#202124',
                                                                fontSize: '12px',
                                                                fontWeight: '400',
                                                                lineHeight: '20px',
                                                            },
                                                            '& .MuiOutlinedInput-notchedOutline': {
                                                                borderColor: '#A3B0C2',
                                                            },
                                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                                borderColor: '#A3B0C2',
                                                            },
                                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                                borderColor: '#0000FF',
                                                            },
                                                        },
                                                    },
                                                }}
                                            >
                                                {headersinCSV.map((item: string, index: number) => (
                                                    <MenuItem key={index} value={item}>
                                                        {item}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>


                                    {/* Delete Icon */}
                                    <Grid item xs="auto" sm={0.5} container justifyContent="center">
                                        <>
                                            <IconButton onClick={(event) => handleClickOpen(event, row.id)}>
                                                <Image
                                                    src='/trash-icon-filled.svg'
                                                    alt='trash-icon-filled'
                                                    height={18}
                                                    width={18} // Adjust the size as needed
                                                />
                                            </IconButton>
                                            <Popover
                                                id={deleteId}
                                                open={deleteOpen}
                                                anchorEl={deleteAnchorEl}
                                                onClose={handleDeleteClose}
                                                anchorOrigin={{
                                                    vertical: 'bottom',
                                                    horizontal: 'center',
                                                }}
                                                transformOrigin={{
                                                    vertical: 'top',
                                                    horizontal: 'right',
                                                }}
                                            >
                                                <Box sx={{
                                                    minWidth: '254px',
                                                    borderRadius: '4px',
                                                    border: '0.2px solid #afafaf',
                                                    background: '#fff',
                                                    boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.12)',
                                                    padding: '16px 21px 16px 16px'
                                                }}>
                                                    <Typography variant="body1" className='first-sub-title' sx={{
                                                        paddingBottom: '12px'
                                                    }}>Confirm Deletion</Typography>
                                                    <Typography variant="body2" sx={{
                                                        color: '#5f6368',
                                                        fontFamily: 'Roboto',
                                                        fontSize: '12px',
                                                        fontWeight: '400',
                                                        lineHeight: '16px',
                                                        paddingBottom: '26px'
                                                    }}>
                                                        Are you sure you want to delete this <br /> map data?
                                                    </Typography>
                                                    <Box display="flex" justifyContent="flex-end" mt={2}>
                                                        <Button onClick={handleDeleteClose} sx={{
                                                            borderRadius: '4px',
                                                            border: '1px solid #5052b2',
                                                            boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                                                            color: '#5052b2',
                                                            fontFamily: 'Nunito Sans',
                                                            fontSize: '14px',
                                                            fontWeight: '600',
                                                            lineHeight: '20px',
                                                            marginRight: '16px',
                                                            textTransform: 'none'
                                                        }}>
                                                            Clear
                                                        </Button>
                                                        <Button onClick={handleDelete} sx={{
                                                            background: '#5052B2',
                                                            borderRadius: '4px',
                                                            border: '1px solid #5052b2',
                                                            boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                                                            color: '#fff',
                                                            fontFamily: 'Nunito Sans',
                                                            fontSize: '14px',
                                                            fontWeight: '600',
                                                            lineHeight: '20px',
                                                            textTransform: 'none',
                                                            '&:hover': {
                                                                color: '#5052B2'
                                                            }
                                                        }}>
                                                            Delete
                                                        </Button>
                                                    </Box>
                                                </Box>
                                            </Popover>
                                        </>
                                    </Grid>
                                </Grid>
                            </Box>
                        ))}
                        </Box>
                        <Box sx={{display: sourceMethod !== 0 && file ? "flex" : "none", flexDirection: "column", gap: 2, flexWrap: "wrap", border: "1px solid rgba(228, 228, 228, 1)", borderRadius: "6px", padding: "20px" }}>
                            <Box sx={{display: "flex", alignItems: "center", gap: 2}}>
                                <Typography sx={{fontFamily: "Nunito Sans", fontSize: "16px"}}>Name</Typography>
                                <TextField
                                    id="outlined"
                                    label="Name"
                                    InputLabelProps={{
                                        sx: {
                                            color: 'rgba(17, 17, 19, 0.6)',
                                            fontFamily: 'Nunito Sans',
                                            fontWeight: 400,
                                            fontSize: '15px',
                                            padding:0,
                                            top: '-1px',
                                            margin:0
                                    }}}
                                    sx={{
                                        "& .MuiInputLabel-root.Mui-focused": {
                                            color: "rgba(17, 17, 19, 0.6)",
                                        },
                                        "& .MuiInputLabel-root[data-shrink='false']": {
                                            transform: "translate(16px, 50%) scale(1)",
                                        },
                                        "& .MuiOutlinedInput-root":{
                                            maxHeight: '40px'
                                        }
                                    }}
                                    InputProps={{
                                        className: "form-input"
                                    }}
                                    value={sourceName}
                                    onChange={(e) => setSourceName(e.target.value)}
                                    />
                            </Box>
                        </Box>
                        <Box sx={{display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "flex-end", borderRadius: "6px"}}>
                            <Box sx={{display: "flex", alignItems: "center", gap: 3}}>
                                <Button variant="outlined" onClick={() => setSources(true)} sx={{
                                    borderColor: "rgba(80, 82, 178, 1)",
                                    width: "92px",
                                    height: "40px",
                                    ":hover": {
                                        borderColor: "rgba(62, 64, 142, 1)"},
                                    ":active": {
                                        borderColor: "rgba(80, 82, 178, 1)"},
                                    ":disabled": {
                                        borderColor: "rgba(80, 82, 178, 1)",
                                        opacity: 0.4,
                                    },
                                }}>
                                    <Typography
                                        sx={{
                                        textAlign: "center",
                                        color: "rgba(80, 82, 178, 1)",
                                        textTransform: "none",
                                        fontFamily: "Nunito Sans",
                                        fontWeight: "600",
                                        fontSize: "14px",
                                        lineHeight: "19.6px",
                                        }}
                                    >
                                        Cancel
                                    </Typography>
                                </Button> 
                                <Button variant="contained" onClick={() => {}} disabled={sourceName.trim() === ""} sx={{
                                    backgroundColor: "rgba(80, 82, 178, 1)",
                                    width: "120px",
                                    height: "40px",
                                    ":hover": {
                                        backgroundColor: "rgba(62, 64, 142, 1)"},
                                    ":active": {
                                        backgroundColor: "rgba(80, 82, 178, 1)"},
                                    ":disabled": {
                                        backgroundColor: "rgba(80, 82, 178, 1)",
                                        opacity: 0.6,
                                    },
                                }}>
                                    <Typography
                                        sx={{
                                        textAlign: "center",
                                        color: "rgba(255, 255, 255, 1)",
                                        fontFamily: "Nunito Sans",
                                        textTransform: "none",
                                        fontWeight: "600",
                                        fontSize: "14px",
                                        lineHeight: "19.6px",
                                        }}
                                    >
                                        Create
                                    </Typography>
                                </Button> 
                            </Box>
                        </Box>
                        {showSlider && <Slider />}
                    </Box>
                </Box>
            </Box>
        </>
    );
};

export default SourcesImport;
