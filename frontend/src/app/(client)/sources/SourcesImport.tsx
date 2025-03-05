"use client";
import React, { ChangeEvent, useState, useEffect } from 'react';
import { Box, Grid, Typography, TextField, Button, FormControl, MenuItem, Select, LinearProgress, SelectChangeEvent, IconButton, Popover } from '@mui/material';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import axiosInstance from '../../../axios/axiosInterceptorInstance';
import axios from "axios";
import { sourcesStyles } from './sourcesStyles';
import Slider from '../../../components/Slider';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import CustomizedProgressBar from '@/components/CustomizedProgressBar';
import { showErrorToast, showToast } from '@/components/ToastNotification';
import Link from '@mui/material/Link';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import { styled } from '@mui/material/styles';

interface SourcesImportProps {
    setCreatedSource: (state: Source) => void
    setNewSource: (state: boolean) => void
    setSources: (state: boolean) => void
}

interface Row {
    id: number;
    type: string;
    value: string;
    selectValue?: string;
    canDelete?: boolean;
}

interface Source {
    id: number
    name: string
    source_origin: string
    source_type: string
    created_date: Date
    updated_date: Date
    created_by: string
    total_records?: number
    matched_records?: number
}

const BorderLinearProgress = styled(LinearProgress)(({ theme }) => ({
    height: 4,
    borderRadius: 0,
    backgroundColor: '#c6dafc',
    '& .MuiLinearProgress-bar': {
      borderRadius: 5,
      backgroundColor: '#4285f4',
    },
  }));


const SourcesImport: React.FC<SourcesImportProps> = ({ setCreatedSource, setNewSource, setSources}) => {
    const router = useRouter();
    const [showSlider, setShowSlider] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isChatGPTProcessing, setIsChatGPTProcessing] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [sourceType, setSourceType] = useState<string>("");
    const [deleteAnchorEl, setDeleteAnchorEl] = useState<null | HTMLElement>(null)
    const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
    const [sourceName, setSourceName] = useState<string>("");
    const [fileSizeStr, setFileSizeStr] = useState<string>("");
    const [fileName, setFileName] = useState<string>("");
    const [fileUrl, setFileUrl] = useState<string>("");
    const [sourceMethod, setSourceMethod] = useState<number>(0);
    const [dragActive, setDragActive] = useState(false);
    const [fileSizeError, setFileSizeError] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [headersinCSV, setHeadersinCSV] = useState<string[]>([]);

    const deleteOpen = Boolean(deleteAnchorEl);
    const deleteId = deleteOpen ? 'delete-popover' : undefined;
    const defaultRows: Row[] = [
        { id: 1, type: 'Email', value: '', canDelete: false },
        { id: 2, type: 'Phone number', value: '', canDelete: true },
        { id: 3, type: 'Last Name', value: '', canDelete: true },
        { id: 4, type: 'First Name', value: '', canDelete: true },
        { id: 5, type: 'Gender', value: '', canDelete: true },
        { id: 6, type: 'Age', value: '', canDelete: true },
        { id: 7, type: 'Order Amount', value: '', canDelete: true },
        { id: 8, type: 'State', value: '', canDelete: true },
        { id: 9, type: 'City', value: '', canDelete: true },
        { id: 10, type: 'Zip Code', value: '', canDelete: true }
    ];
    const [rows, setRows] = useState<Row[]>(defaultRows);

    const handleMapListChange = (id: number, value: string) => {
        setRows(rows.map(row =>
            row.id === id ? { ...row, value } : row
        ));
    };

    const handleDeletePopoverOpen = (event: React.MouseEvent<HTMLElement>, id: number) => {
        setDeleteAnchorEl(event.currentTarget);
        setSelectedRowId(id);
    };

    const handleChangeSourceType = (event: SelectChangeEvent<string>) => {
        setSourceType(event.target.value);
    };

    const handleDeleteClose = () => {
        setDeleteAnchorEl(null);
        setSelectedRowId(null);
        if (deleteAnchorEl) {
            deleteAnchorEl.focus();
        }
    };


    const handleDelete = () => {
        if (selectedRowId) {
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

    const handleSumbit = async () => {
        setLoading(true)

        const rowsToSubmit = rows.map(({ id, canDelete, ...rest }) => rest);

        const newSource = {
            source_type: sourceType,
            source_origin: sourceMethod === 1 ? "csv" : "pixel",
            source_name: sourceName,
            file_url: fileUrl,
            rows: rowsToSubmit
        }
        
        try {
            const response = await axiosInstance.post(`/audience-sources/create`, newSource, {
                headers: { 'Content-Type': 'application/json' },
            })
            if (response.status === 200){
                setCreatedSource(response.data)
                setNewSource(true)
                setSources(true)
            }
        } 
        catch {
        }
        finally {
            setLoading(false)
        }
    }

    const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            
            const response = await fetch("/api/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fileType: file.type }),
              });
          
            const { url } = await response.json();
            if (!url) {
                showErrorToast("Error at upload file!")
                return
            }

            setFileUrl(url)
            
            const xhr = new XMLHttpRequest();
            xhr.open("PUT", url);
        
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
        

            xhr.setRequestHeader("Content-Type", file.type);
            xhr.send(file);

            processDownloadFile(file);

            const reader = new FileReader();

            reader.onload = async (event) => {
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

                const newHeadings = await smartSubstitutionHeaders(headers)
        
                const updatedRows = defaultRows.map((row, index) => {
                    return {
                        ...row,
                        value: newHeadings[index],
                    };
                });

                setRows(updatedRows);
            };
        
            reader.readAsText(file);
        }

        
    };

    const smartSubstitutionHeaders = async (headings: string[]) => {
        setIsChatGPTProcessing(true)
        try {
            const response = await axiosInstance.post(`/audience-sources/heading-substitution`, {headings}, {
                headers: { 'Content-Type': 'application/json' },
            })
            if (response.status === 200){
                const updateEmployee = response.data
                return updateEmployee
            }
        } 
        catch {
        }
        finally {
            setIsChatGPTProcessing(false)
        }
    } 


    if (isLoading) {
        return <CustomizedProgressBar />;
    }



    return (
        <>
            {loading && (
                <CustomizedProgressBar/>
            )}
            <Box sx={{
                display: 'flex', flexDirection: 'column', pr: 2,
                '@media (max-width: 900px)': {
                    minHeight: '100vh'

                }
            }}>
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
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
                                    onClick={() => {
                                        setSourceMethod(1)
                                        handleDeleteFile()
                                    }}
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
                                    onClick={() => {
                                        setSourceMethod(2)
                                        handleDeleteFile()
                                    }}
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
                                    onChange={handleChangeSourceType}
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
                            {sourceType !== "" && !file &&
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
                        <Box sx={{display: sourceMethod !== 0 && file ? "flex" : "none", flexDirection: "column", position: 'relative', gap: 2, flexWrap: "wrap", border: "1px solid rgba(228, 228, 228, 1)", borderRadius: "6px", padding: "20px" }}>
                            {isChatGPTProcessing && <Box
                                sx={{
                                width: '100%',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                zIndex: 1200,   
                                }}
                            >
                                <BorderLinearProgress variant="indeterminate" sx={{borderRadius: "6px",}} />
                            </Box>}
                            <Box sx={{display: "flex", flexDirection: "column", gap: 1}}>
                                <Typography sx={{fontFamily: "Nunito Sans", fontSize: "16px"}}>Data Maping</Typography>
                                <Typography sx={{fontFamily: "Nunito Sans", fontSize: "12px", color: "rgba(95, 99, 104, 1)"}}>Map your Field from your Source to the destination data base.</Typography>
                            </Box>
                            {rows?.map((row, index) => (
                                <Box key={index}>
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
                                                    onChange={(e) => handleMapListChange(row.id, e.target.value)}
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
                                            {row.canDelete && (
                                                <>
                                                    <IconButton onClick={(event) => handleDeletePopoverOpen(event, row.id)}>
                                                        <Image
                                                            src='/trash-icon-filled.svg'
                                                            alt='trash-icon-filled'
                                                            height={18}
                                                            width={18}
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
                                                        disableEnforceFocus
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
                                            )}
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
                                <Button variant="outlined" onClick={() => {
                                    setSourceMethod(0)
                                    handleDeleteFile()
                                    setSourceName('')
                                    setSourceType('')
                                    setSources(true)

                                }} sx={{
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
                                <Button variant="contained" onClick={handleSumbit} disabled={sourceName.trim() === ""} sx={{
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
