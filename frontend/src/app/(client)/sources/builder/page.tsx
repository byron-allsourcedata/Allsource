"use client";
import React, { ChangeEvent, useState, useEffect } from 'react';
import { Box, Grid, Typography, TextField, Button, FormControl, MenuItem, Select, LinearProgress, SelectChangeEvent, IconButton } from '@mui/material';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import axiosInstance from "@/axios/axiosInterceptorInstance";
import { sourcesStyles } from '../sourcesStyles';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import CustomizedProgressBar from '@/components/CustomizedProgressBar';
import { showErrorToast, showToast } from '@/components/ToastNotification';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import { styled } from '@mui/material/styles';
import CustomToolTip from '@/components/customToolTip';
import { useNotification } from '@/context/NotificationContext';
import Papa, { ParseResult } from "papaparse";

interface Row {
    id: number;
    type: string;
    value: string;
    canDelete: boolean;
    isHidden: boolean
}

interface EventTypeInterface {
    id: number;
    name: string;
    title: string;
}

interface NewSource {
    source_type: string;
    source_origin: string;
    source_name: string;
    file_url?: string;
    rows?: { type: string; value: string }[];
    domain_id?: number;
}

interface DomainsLeads {
    id: number;
    name: string
    pixel_installed: boolean
    converted_sales_count: number
    viewed_product_count: number
    visitor_count: number
    abandoned_cart_count: number
    total_count: number
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


const SourcesImport: React.FC = () => {
    const router = useRouter();
    const [isChatGPTProcessing, setIsChatGPTProcessing] = useState(false);
    const [isDomainSearchProcessing, setIsDomainSearchProcessing] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [sourceType, setSourceType] = useState<string>("");
    const [selectedDomain, setSelectedDomain] = useState<string>("");
    const [sourceName, setSourceName] = useState<string>("");
    const [fileSizeStr, setFileSizeStr] = useState<string>("");
    const [fileName, setFileName] = useState<string>("");
    const [fileUrl, setFileUrl] = useState<string>("");
    const [sourceMethod, setSourceMethod] = useState<number>(0);
    const [selectedDomainId, setSelectedDomainId] = useState<number>(0);
    const [dragActive, setDragActive] = useState(false);
    const [emailNotSubstitution, setEmailNotSubstitution] = useState(false);
    const [pixelNotInstalled, setPixelNotInstalled] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [headersinCSV, setHeadersinCSV] = useState<string[]>([]);
    const { hasNotification } = useNotification();

    const [eventType, setEventType] = useState<number[]>([]);
    const [domains, setDomains] = useState<DomainsLeads[]>([]);
    const [totalLeads, setTotalLeads] = useState(0);
    const [matchedLeads, setMatchedLeads] = useState(0);

    const eventTypes: EventTypeInterface[] = [
        { id: 1, name: "visitor_count", title: "visitor"},
        { id: 2, name: "viewed_product_count", title: "viewed_product" },
        { id: 3, name: "abandoned_cart_count", title: "abandoned_cart"},
        { id: 4, name: "converted_sales_count", title: "converted_sales"}
    ];

    const defaultRows: Row[] = [
        { id: 1, type: 'Email', value: '', canDelete: false, isHidden: false },
        { id: 2, type: 'Phone number', value: '', canDelete: true, isHidden: false },
        { id: 3, type: 'Last Name', value: '', canDelete: true, isHidden: false },
        { id: 4, type: 'First Name', value: '', canDelete: true, isHidden: false },
        { id: 5, type: 'Transaction Date', value: '', canDelete: true, isHidden: false },
    ];
    const [rows, setRows] = useState<Row[]>(defaultRows);

    const handleMapListChange = (id: number, value: string) => {
        setRows(rows.map(row =>
            row.id === id ? { ...row, value } : row
        ));

        if (id === 1) {
            setEmailNotSubstitution(false);
        }
    };

    useEffect(() => {
        let updatedRows = defaultRows.map(row => {
            if (row.type === 'Transaction Date') {
                let newType = row.type;
                if (sourceType === "Customer conversion") newType = "Transaction Date";
                if (sourceType === "Failed Leads") newType = "Lead Date";
                if (sourceType === "Interest") newType = "Interest Date";

                return { ...row, type: newType };
            }
            return row;
        });
        if (sourceType === "Customer conversion") {
            updatedRows = [
                ...updatedRows,
                { id: 6, type: 'Order Amount', value: '', canDelete: true, isHidden: false },
            ];
        }

        setRows(updatedRows);
    }, [sourceType]);

    const handleChangeSourceType = (event: SelectChangeEvent<string>) => {
        handleDeleteFile()
        setSourceType(event.target.value);
    };


    const handleDelete = (id: number) => {
        setRows(rows.map(row => (row.id === id ? { ...row, isHidden: true } : row)));
    };

    const handleAdd = () => {
        const hiddenRowIndex = rows.findIndex(row => row.isHidden);
        if (hiddenRowIndex !== -1) {
            const updatedRows = [...rows];
            updatedRows[hiddenRowIndex].isHidden = false;
            setRows(updatedRows);
        }
    };

    const handleDeleteFile = () => {
        setFile(null);
        setFileName('')
        setEmailNotSubstitution(false)
        setRows(defaultRows)
    };

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

        const uploadedFile = event.dataTransfer.files[0];
        if (uploadedFile) {
            handleFileUpload(uploadedFile)
        }
    };

    const convertToDBFormat = (sourceType: string) => {
        return sourceType.split(' ').join('_').toLowerCase()
    }

    const convertToDBFormat2 = (eventTypesArr: number[]) => {
        return eventTypesArr
            .map(id => {
                const eventType = eventTypes.find(event => event.id === id);
                return eventType?.title
            })
            .filter(name => name)
            .join(',');
    };
    const handleSumbit = async () => {
        setLoading(true)

        const rowsToSubmit = rows.map(({ id, canDelete, isHidden, ...rest }) => rest);

        const newSource: NewSource = {
            source_type: sourceMethod === 1  ? convertToDBFormat(sourceType) : convertToDBFormat2(eventType),
            source_origin: sourceMethod === 1 ? "csv" : "pixel",
            source_name: sourceName,
        }

        if (sourceMethod === 1) {
            newSource.file_url = fileUrl
            newSource.rows = rowsToSubmit
        }


        if (sourceMethod === 2) {
            newSource.domain_id = selectedDomainId;
        }
        
        try {
            const response = await axiosInstance.post(`/audience-sources/create`, newSource, {
                headers: { 'Content-Type': 'application/json' },
            })
            if (response.status === 200){
                const dataString = encodeURIComponent(JSON.stringify(response.data));
                router.push(`/sources/created-source?data=${dataString}`)
            }
        }
        catch {
        }
        finally {
            setLoading(false)
        }
    }

    const downloadSampleFile = async () => {
        try {
            setLoading(true)
            if (sourceType !== ""){
                const response = await axiosInstance.get(`/audience-sources/sample-customers-list?&source_type=${convertToDBFormat(sourceType)}`, {
                    responseType: 'blob',
                });
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'sample-customers-list.csv');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
            else {
                showErrorToast("Please select source type")
            }

        } catch (error) {
            showErrorToast('Error downloading the file.');
        } finally {
            setLoading(false)
        }
    };
    
    const validateFileSize = (file: File, maxSizeMB: number): boolean => {
        const fileSize = parseFloat((file.size / (1024 * 1024)).toFixed(2));
        if (fileSize > maxSizeMB) {
            handleDeleteFile();
            showErrorToast("The uploaded CSV file exceeds the 100MB limit. Please reduce the file size and try again.");
            return false;
        }
        setFileSizeStr(fileSize + " MB");
        setFileName(file.name);
        return true;
    };

    const getFileUploadUrl = async (fileType: string): Promise<string> => {
        try {
            const response = await fetch("/api/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fileType }),
            });

            const { url } = await response.json();
    
            if (!url) {
                throw new Error("Storage access error!");
            }

            setFileUrl(url);
            return url

        } catch (error: unknown) {
            throw error;
        }
    };

    const uploadFile = (file: File, url: string, onProgress: (progress: number) => void): Promise<void> => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("PUT", url);

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percentCompleted = Math.round((event.loaded * 100) / event.total);
                    onProgress(percentCompleted);
                }
            };

            xhr.onload = () => resolve();
            xhr.onerror = () => reject(new Error("Failed to upload file. Please contact our Support team"));

            xhr.setRequestHeader("Content-Type", file.type);
            xhr.send(file);
        });
    };

    const processFileContent = async (parsedData: ParseResult<string[]>): Promise<void> => {
        try {
            const { data } = parsedData;
            const headers = data[0]
            setHeadersinCSV(headers);

            if (headers.length === 0 || headers.every((header: string) => header === "")) {
                throw new Error("CSV file doesn't contain headers!");
            }

            const newHeadings = await smartSubstitutionHeaders(headers);

            if (newHeadings[0] === "None") {
                setEmailNotSubstitution(true);
            }

            const updatedRows = rows.map((row, index) => ({
                ...row,
                value: newHeadings[index] === "None" ? "" : newHeadings[index],
            }));

            setRows(updatedRows);
        } catch (error: unknown) {
            throw error;
        }
    };

    const readFileContent = (file: File): Promise<ParseResult<string[]>> => {
        return new Promise((resolve, reject) => {
            Papa.parse<string[]>(file, {
                complete: (result: any) => {
                    if (result.data && result.data.length > 0) {
                        resolve(result);
                    } else {
                        reject(new Error("CSV file is empty or couldn't be parsed."));
                    }
                },
                error: () => {
                    reject(new Error(`Error parsing CSV file`));
                },
                skipEmptyLines: true,
            });
        });
    };

    const handleFileUpload = async (file: File) => {
        try {
            if (!file) return;

            if (!validateFileSize(file, 100)) return;

            const url = await getFileUploadUrl(file.type);

            await uploadFile(file, url, setUploadProgress);
            setUploadProgress(null);

            setFile(file);

            const content = await readFileContent(file);
            await processFileContent(content);

        } catch (error: unknown) {
            if (error instanceof Error) {
                showErrorToast(error.message);
            } else {
                showErrorToast("An unexpected error occurred during file upload.");
            }
            setUploadProgress(null);
        }
    };

    const smartSubstitutionHeaders = async (headings: string[]) => {
        setIsChatGPTProcessing(true)
        try {
            const response = await axiosInstance.post(`/audience-sources/heading-substitution`, {source_type: sourceType, headings}, {
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


    const toggleEventType = (id: number) => { 
        const isCurrentlyActive = eventType.includes(id);
    
        const typeCount = eventTypes.find(event => event.id === id)?.name as keyof DomainsLeads;
        const countChange = Number(domains.find(domain => domain.name === selectedDomain)?.[typeCount] || 0);

        setEventType((prev) => {
            if (isCurrentlyActive) {
                return prev.filter((item) => item !== id);
            } else {
                return [...prev, id];
            }
        });
    
        setMatchedLeads((prevLeads) => {
            if (isCurrentlyActive) {
                return prevLeads - countChange;
            } else {
                return prevLeads + countChange;
            }
        });
    };
    
    

    const handleChangeDomain = (event: SelectChangeEvent<string>) => {
        const domainName = event.target.value;
        setSelectedDomain(domainName);
    
        const selectedDomainData = domains.find((domain: DomainsLeads) => domain.name === domainName);
        if (selectedDomainData) {
            setTotalLeads(selectedDomainData.total_count || 0);
            setSelectedDomainId(selectedDomainData.id);
            setMatchedLeads(0)
            setEventType([])
            if (!selectedDomainData.pixel_installed) {
                setPixelNotInstalled(true);
            }
            else {
                setPixelNotInstalled(false);
            }
        }
    };

    const fetchDomainsAndLeads = async () => {
        setIsDomainSearchProcessing(true)
        try {
            const response = await axiosInstance.get(`/audience-sources/domains-with-leads`)
            if (response.status === 200){
                const domains = response.data
                setDomains(domains)
            }
        } 
        catch {
        }
        finally {
            setIsDomainSearchProcessing(false)
        }
    }



    return (
        <>
            {loading && (
                <CustomizedProgressBar/>
            )}
            <Box sx={{
                display: 'flex', flexDirection: 'column', height: 'calc(100vh - 4.25rem)', overflow: 'auto',
                '@media (max-width: 1024px)': {
                    pr: 2,
                }
            }}>
                <Box sx={{display: "flex", flexDirection: 'column', alignItems: "center"}}>
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                marginTop: hasNotification ? '1rem' : 4,
                                flexWrap: 'wrap',
                                gap: '15px',
                                '@media (max-width: 900px)': {
                                    marginTop: hasNotification ? '3rem' : '1rem',
                                },
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography className='first-sub-title'>
                                        Import Source
                                    </Typography>
                                    <CustomToolTip title={'Here you can upload new ones to expand your data.'} linkText='Learn more' linkUrl='https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/contacts' />
                                </Box>
                        </Box>
                        <Box sx={{
                            flex: 1, gap: 2, display: 'flex', flexDirection: 'column', maxWidth: '100%', pl: 0, pr: 0, pt: '16px', pb: '20px',
                        }}>
                            <Box sx={{display: "flex", flexDirection: "column", gap: 2, flexWrap: "wrap", border: "1px solid rgba(228, 228, 228, 1)", borderRadius: "6px", padding: "20px" }}>
                                <Box sx={{display: "flex", flexDirection: "column", gap: 1}}>
                                    <Typography sx={{fontFamily: "Nunito Sans", fontSize: "16px", fontWeight: 500}}>Choose your data source</Typography>
                                    <Typography sx={{fontFamily: "Roboto", fontSize: "12px", color: "rgba(95, 99, 104, 1)"}}>Choose your data source, and let Maximia AI Audience Algorithm identify high-intent leads and create lookalike audiences to slash your acquisition costs.</Typography>
                                </Box>
                                <Box sx={{display: "flex",  gap: 2, "@media (max-width: 420px)": { display: "grid", gridTemplateColumns: "1fr" }}}>
                                    <Button
                                        variant="outlined"
                                        startIcon={<Image src="../upload-minimalistic.svg" alt="upload" width={20} height={20} />}
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
                                            setSourceType('')
                                        }}
                                        >
                                        Manually upload
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        startIcon={<Image src="../website-icon.svg" alt="upload" width={20} height={20} />}
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
                                            setSourceType('')
                                            fetchDomainsAndLeads()
                                        }}
                                        >
                                        Website - Pixel
                                    </Button>
                                </Box>
                            </Box>
                            
                            {sourceMethod === 1 && 
                                <Box sx={{display: "flex", flexDirection: "column", gap: 2, position: "relative", flexWrap: "wrap", border: "1px solid rgba(228, 228, 228, 1)", borderRadius: "6px", padding: "20px" }}>
                                    {uploadProgress !== null && (
                                                    <Box sx={{ width: "100%", position: "absolute", top: 0, left: 0, zIndex: 1200  }}>
                                                        <LinearProgress variant="determinate" value={uploadProgress} sx={{borderRadius: "6px", backgroundColor: '#c6dafc', '& .MuiLinearProgress-bar': {borderRadius: 5, backgroundColor: '#4285f4'}}} />
                                                    </Box>
                                    )}
                                    <Box sx={{display: "flex", flexDirection: "column", gap: 1}}>
                                        <Typography sx={{fontFamily: "Nunito Sans", fontSize: "16px", fontWeight: 500}}>Select your Source File</Typography>
                                        <Typography sx={{fontFamily: "Roboto", fontSize: "12px", color: "rgba(95, 99, 104, 1)"}}>Please upload a CSV file containing the list of customers who have successfully completed an order on your website.</Typography>
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
                                            <MenuItem value={"Failed Leads"}>Failed Leads</MenuItem>
                                            <MenuItem value={"Interest"}>Interest</MenuItem>
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
                                                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                                                    const file = event.target.files?.[0];
                                                    if (file) {
                                                        handleFileUpload(file);
                                                    }
                                                    event.target.value = "";
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
                                    <Typography className="main-text" component="div"
                                            sx={{ ...sourcesStyles.text, gap: 0.25, pt: 1, "@media (max-width: 700px)": { mb: 1 } }}
                                        >
                                            Sample doc: <Typography onClick={downloadSampleFile} component="span" sx={{ ...sourcesStyles.text, color: 'rgba(80, 82, 178, 1)', cursor: 'pointer', fontWeight: 400 }}>sample recent customers-list.csv</Typography>
                                        </Typography>
                                </Box>
                            }

                            {sourceMethod === 1 && 
                                <Box sx={{display: file ? "flex" : "none", flexDirection: "column", position: 'relative', gap: 2, flexWrap: "wrap", border: "1px solid rgba(228, 228, 228, 1)", borderRadius: "6px", padding: "20px" }}>
                                    {isChatGPTProcessing && <Box
                                        sx={{
                                        width: '100%',
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        zIndex: 1200,   
                                        }}
                                    >
                                        <BorderLinearProgress variant="indeterminate" sx={{borderRadius: "6px"}} />
                                    </Box>}
                                    <Box sx={{display: "flex", flexDirection: "column", gap: 1}}>
                                        <Typography sx={{fontFamily: "Nunito Sans", fontSize: "16px", fontWeight: 500}}>Data Maping</Typography>
                                        <Typography sx={{fontFamily: "Roboto", fontSize: "12px", color: "rgba(95, 99, 104, 1)"}}>Map your Field from your Source to the destination data base.</Typography>
                                    </Box>
                                    <Grid container alignItems="center" sx={{ flexWrap: { xs: 'nowrap', sm: 'wrap' }, }}>
                                        <Grid item xs={5} sm={3} sx={{textAlign: "center"}}>
                                            <Image src='/logo.svg' alt='logo' height={22} width={34} />
                                        </Grid>
                                        <Grid item xs={1} sm={0.5}>&nbsp;</Grid>
                                        <Grid item xs={5} sm={3} sx={{textAlign: "center"}}>
                                            <Image src='/csv-icon.svg' alt='scv' height={22} width={34} />
                                        </Grid>
                                    </Grid>
                                    {rows?.filter(row => !row.isHidden).map((row, index) => (
                                        <Box key={index} sx={{
                                            mt: index === 1 && emailNotSubstitution ? "10px" : 0,
                                        }}>
                                            <Grid container spacing={2} alignItems="center" sx={{ flexWrap: { xs: 'nowrap', sm: 'wrap' } }}>
                                                {/* Left Input Field */}
                                                <Grid item xs={5} sm={3}>
                                                    <TextField
                                                        fullWidth
                                                        variant="outlined"
                                                        value={row.type}
                                                        disabled={true}
                                                        InputLabelProps={{
                                                            sx: {
                                                                fontFamily: 'Nunito Sans',
                                                                fontSize: '12px',
                                                                lineHeight: '16px',
                                                                color: 'rgba(17, 17, 19, 0.60)',
                                                                top: '-5px',
                                                                '&.Mui-focused': {
                                                                    color: 'rgba(80, 82, 178, 1)',
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
                                                                        borderColor: 'rgba(80, 82, 178, 1)',
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
                                                <Grid item xs={1} sm={0.5} container justifyContent="center">
                                                    <Image
                                                        src='/chevron-right-purple.svg'
                                                        alt='chevron-right-purple'
                                                        height={18}
                                                        width={18}
                                                    /> 
                                                </Grid>
                                                
                                                <Grid item xs={5} sm={3}>
                                                    <FormControl fullWidth sx={{ height: '36px'}}>
                                                        <Select
                                                            value={row.value || ''}
                                                            onChange={(e) => handleMapListChange(row.id, e.target.value)}
                                                            displayEmpty
                                                            inputProps={{
                                                                sx: {
                                                                    height: '36px',
                                                                    padding: '6.5px 8px',
                                                                    fontFamily: 'Roboto',
                                                                    fontSize: '12px',
                                                                    fontWeight: '400',
                                                                    color: '#202124',
                                                                    lineHeight: '20px',
                                                                },
                                                            }}
                                                            sx={{
                                                                '&.MuiOutlinedInput-root': {
                                                                    height: '36px',
                                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                                        borderColor: '#A3B0C2',
                                                                    },
                                                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                                                        borderColor: '#A3B0C2',
                                                                    },
                                                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                                        borderColor: 'rgba(80, 82, 178, 1)',
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
                                                        {row.type === "Email" && emailNotSubstitution && <Typography sx={{fontFamily: "Nunito", fontSize: "12px", color: "rgba(224, 49, 48, 1)"}}>Please match email</Typography>}
                                                    </FormControl>
                                                </Grid>

                                                {/* Delete Icon */}
                                                <Grid item xs={1} sm={0.5} container justifyContent="center">
                                                    {row.canDelete && (
                                                        <>
                                                            <IconButton onClick={() => handleDelete(row.id)}>
                                                                <Image
                                                                    src='/trash-icon-filled.svg'
                                                                    alt='trash-icon-filled'
                                                                    height={18}
                                                                    width={18}
                                                                />
                                                            </IconButton>
                                                        </>
                                                    )}
                                                </Grid>
                                            </Grid>
                                        </Box>
                                    ))}
                                    {rows.some(row => row.isHidden) && (
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-start'}} onClick={handleAdd}>
                                                <Typography sx={{
                                                    fontFamily: 'Nunito Sans',
                                                    lineHeight: '22.4px',
                                                    fontSize: '14px',
                                                    fontWeight: '600',
                                                    color: 'rgba(80, 82, 178, 1)',
                                                    cursor: 'pointer'
                                                }}>
                                                    + Add more
                                                </Typography>
                                        </Box>
                                    )}
                                </Box>
                            }


                            {sourceMethod === 2 && 
                                <Box sx={{display: "flex", flexDirection: "column", gap: 2, position: "relative", flexWrap: "wrap", border: "1px solid rgba(228, 228, 228, 1)", borderRadius: "6px", padding: "20px" }}>
                                    {isDomainSearchProcessing && <Box
                                        sx={{
                                        width: '100%',
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        zIndex: 1200,   
                                        }}
                                    >
                                        <BorderLinearProgress variant="indeterminate" sx={{borderRadius: "6px"}} />
                                    </Box>}
                                    <Box sx={{display: "flex", flexDirection: "column", gap: 1}}>
                                        <Typography sx={{fontFamily: "Nunito Sans", fontSize: "16px", fontWeight: 500}}>Select your Domain</Typography>
                                        <Typography sx={{fontFamily: "Roboto", fontSize: "12px", color: "rgba(95, 99, 104, 1)"}}>Please Select your domain.</Typography>
                                    </Box>
                                    <FormControl
                                        variant="outlined"
                                        >
                                        <Select
                                            value={selectedDomain}
                                            onChange={handleChangeDomain}
                                            displayEmpty
                                            sx={{   
                                                ...sourcesStyles.text,
                                                width: "316px",
                                                borderRadius: "4px",
                                                "@media (max-width: 390px)": { width: "calc(100vw - 74px)" },
                                            }}
                                        >
                                            <MenuItem value="" disabled sx={{display: "none"}}>
                                                Select domain
                                            </MenuItem>
                                            {domains.map((item: DomainsLeads, index) => (
                                                <MenuItem sx={{fontfamily: "Nunito Sans", "fontWeight": 600, fontSize: "14px"}} key={index} value={item.name}>{item.name}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    {pixelNotInstalled && 
                                        <Box sx={{display: "flex", flexDirection: "column", gap: 1}}>
                                            <Typography sx={{fontFamily: "Roboto", fontSize: "12px", color: "rgba(205, 40, 43, 1)"}}>✗ The selected domain does not have the pixel installed. Please install the pixel first to continue.</Typography>
                                            <Button
                                                variant="contained"
                                                onClick={() => router.push('/dashboard')}
                                                className='second-sub-title'
                                                sx={{
                                                    alignSelf: "flex-end",
                                                    width: "130px",
                                                    backgroundColor: 'rgba(80, 82, 178, 1)',
                                                    textTransform: 'none',
                                                    padding: '10px 24px',
                                                    mt: 3,
                                                    color: '#fff !important',
                                                    ':hover': {
                                                        backgroundColor: 'rgba(80, 82, 178, 1)'
                                                    }
                                                }}
                                            >
                                                Install Pixel
                                            </Button>
                                        </Box>
                                    }
                                    {!pixelNotInstalled && 
                                        <Box sx={{display: "flex", flexDirection: "column", gap: 1}}>
                                            <Typography sx={{fontFamily: "Roboto", fontSize: "14px", color: "rgba(32, 33, 36, 1)"}}>Total Leads</Typography> 
                                            <Typography sx={{fontFamily: "Nunino Sans", fontWeight: 600, fontSize: "16px", color: "rgba(32, 33, 36, 1)"}}>{totalLeads}</Typography>
                                        </Box>
                                    }
                                </Box>
                            }

                            { sourceMethod === 2 && !pixelNotInstalled && 
                                <Box sx={{display: "flex", flexDirection: "column", gap: 2, flexWrap: "wrap", border: "1px solid rgba(228, 228, 228, 1)", borderRadius: "6px", padding: "20px" }}>
                                    <Box sx={{display: "flex", flexDirection: "column", gap: 1}}>
                                        <Typography sx={{fontFamily: "Nunito Sans", fontSize: "16px", fontWeight: 500}}>Choose your data source</Typography>
                                        <Typography sx={{fontFamily: "Roboto", fontSize: "12px", color: "rgba(95, 99, 104, 1)"}}>Please Select your event type.</Typography>
                                    </Box>
                                    <Box sx={{display: "flex",  gap: 2, "@media (max-width: 420px)": { display: "grid", gridTemplateColumns: "1fr" }}}>
                                        <Button
                                            variant="outlined"
                                            sx={{
                                                fontFamily: "Nunito Sans",
                                                border: "1px solid rgba(208, 213, 221, 1)",
                                                borderRadius: "4px",
                                                color: "rgba(32, 33, 36, 1)",
                                                textTransform: "none",
                                                fontSize: "14px",
                                                padding: "8px 12px",
                                                backgroundColor: eventType.includes(1) ? "rgba(246, 248, 250, 1)" : "#fff",
                                                ":hover": {
                                                    borderColor: "#1C3A57",
                                                    backgroundColor: "rgba(236, 238, 241, 1)"
                                                },
                                            }}
                                            onClick={() => {
                                                toggleEventType(1)
                                            }}
                                            >
                                            Visitor
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            sx={{
                                                fontFamily: "Nunito Sans",
                                                border: "1px solid rgba(208, 213, 221, 1)",
                                                borderRadius: "4px",
                                                color: "rgba(32, 33, 36, 1)",
                                                textTransform: "none",
                                                fontSize: "14px",
                                                padding: "8px 12px",
                                                backgroundColor: eventType.includes(2) ? "rgba(246, 248, 250, 1)" : "#fff",
                                                ":hover": {
                                                    borderColor: "#1C3A57",
                                                    backgroundColor: "rgba(236, 238, 241, 1)"
                                                },
                                            }}
                                            onClick={() => {
                                                toggleEventType(2)
                                            }}
                                            >
                                                View Product
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            sx={{
                                                fontFamily: "Nunito Sans",
                                                border: "1px solid rgba(208, 213, 221, 1)",
                                                borderRadius: "4px",
                                                color: "rgba(32, 33, 36, 1)",
                                                textTransform: "none",
                                                fontSize: "14px",
                                                padding: "8px 12px",
                                                backgroundColor: eventType.includes(3) ? "rgba(246, 248, 250, 1)" : "#fff",
                                                ":hover": {
                                                    borderColor: "#1C3A57",
                                                    backgroundColor: "rgba(236, 238, 241, 1)"
                                                },
                                            }}
                                            onClick={() => {
                                                toggleEventType(3)
                                            }}
                                            >
                                                Abandoned Cart
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            sx={{
                                                fontFamily: "Nunito Sans",
                                                border: "1px solid rgba(208, 213, 221, 1)",
                                                borderRadius: "4px",
                                                color: "rgba(32, 33, 36, 1)",
                                                textTransform: "none",
                                                fontSize: "14px",
                                                padding: "8px 12px",
                                                backgroundColor: eventType.includes(4) ? "rgba(246, 248, 250, 1)" : "#fff",
                                                ":hover": {
                                                    borderColor: "#1C3A57",
                                                    backgroundColor: "rgba(236, 238, 241, 1)"
                                                },
                                            }}
                                            onClick={() => {
                                                toggleEventType(4)
                                            }}
                                            >
                                                Converted Sales
                                        </Button>
                                    </Box>
                                    <Box sx={{display: "flex", flexDirection: "column", gap: 1}}>
                                        <Typography sx={{fontFamily: "Roboto", fontSize: "14px", color: "rgba(32, 33, 36, 1)"}}>Matched Leads</Typography> 
                                        <Typography sx={{fontFamily: "Nunino Sans", fontWeight: 600, fontSize: "16px", color: "rgba(32, 33, 36, 1)"}}>{matchedLeads}</Typography>
                                    </Box>
                                </Box>
                            }
                            
                            
                            <Box sx={{display: sourceMethod !== 0 && file || selectedDomain !== "" && eventType.length > 0 && !pixelNotInstalled && matchedLeads > 0 ? "flex" : "none", flexDirection: "column", gap: 2, flexWrap: "wrap", border: "1px solid rgba(228, 228, 228, 1)", borderRadius: "6px", padding: "20px" }}>
                                <Box sx={{display: "flex", alignItems: "center", gap: 2, "@media (max-width: 400px)": { justifyContent: "space-between" },}}>
                                    <Typography sx={{fontFamily: "Nunito Sans", fontSize: "16px", fontWeight: 500}}>Create Name</Typography>
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
                                                margin:0,
                                        }}}
                                        sx={{
                                            width: "250px",
                                            "@media (max-width: 400px)": { width: "150px" },
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
                                        router.push("/sources")

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
                                    <Button variant="contained" onClick={handleSumbit} disabled={sourceName.trim() === "" || emailNotSubstitution || pixelNotInstalled} sx={{
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
                        </Box>
                    </Box>
                </Box>
            </Box>
        </>
    );
};

export default SourcesImport;
