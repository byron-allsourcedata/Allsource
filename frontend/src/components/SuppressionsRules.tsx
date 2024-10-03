import { Box, Typography, TextField, Button, Switch, Chip, InputAdornment, Divider, Tooltip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, DialogActions, DialogContent, DialogContentText, Popover, } from "@mui/material";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { suppressionsStyles } from "@/css/suppressions";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import { showErrorToast, showToast } from "./ToastNotification";
import dayjs from 'dayjs';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CustomizedProgressBar from "./CustomizedProgressBar";
import CancelIcon from '@mui/icons-material/Cancel'


interface CustomTablePaginationProps {
    count: number;
    page: number;
    rowsPerPage: number;
    onPageChange: (event: React.MouseEvent<HTMLButtonElement>, newPage: number) => void;
    onRowsPerPageChange: (event: React.ChangeEvent<{ value: unknown }>) => void;
}

const CustomTablePagination: React.FC<CustomTablePaginationProps> = ({
    count,
    page,
    rowsPerPage,
    onPageChange,
    onRowsPerPageChange,
}) => {
    const totalPages = Math.ceil(count / rowsPerPage);
    const maxPagesToShow = 3;

    const handlePageChange = (newPage: number) => {
        if (newPage >= 0 && newPage < totalPages) {
            onPageChange(null as any, newPage);
        }
    };

    const getPageButtons = () => {
        const pages = [];
        let startPage = Math.max(0, page - Math.floor(maxPagesToShow / 2));
        let endPage = Math.min(totalPages - 1, startPage + maxPagesToShow - 1);

        if (endPage - startPage + 1 < maxPagesToShow) {
            startPage = Math.max(0, endPage - maxPagesToShow + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        return pages;
    };

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: 1 }}>
            {page > 0 && (<select
                value={rowsPerPage}
                onChange={onRowsPerPageChange}
                style={{
                    marginLeft: 8,
                    border: '1px solid rgba(235, 235, 235, 1)',
                    backgroundColor: 'rgba(255, 255, 255, 1)'
                }}
            >
                {[5, 10, 15, 25].map((option) => (
                    <option key={option} value={option}>
                        {option} rows
                    </option>
                ))}
            </select>
            )}
            {page > 0 && (
                <Button
                    onClick={(e) => handlePageChange(page - 1)}
                    disabled={page === 0}
                    sx={{
                        minWidth: '30px',
                        minHeight: '30px',
                    }}
                >
                    <ChevronLeft
                        sx={{
                            border: page === 0 ? 'none' : '1px solid rgba(235, 235, 235, 1)',
                            borderRadius: '4px'
                        }} />
                </Button>
            )}
            {totalPages > 1 && (
                <>
                    {page > 1 && <Button onClick={() => handlePageChange(0)} sx={suppressionsStyles.page_number}>1</Button>}
                    {page > 2 && <Typography variant="body2" sx={{ mx: 1 }}>...</Typography>}
                    {getPageButtons().map((pageNumber) => (
                        <Button
                            key={pageNumber}
                            onClick={() => handlePageChange(pageNumber)}
                            sx={{
                                mx: 0.5, ...suppressionsStyles.page_number,
                                border: page === pageNumber ? '1px solid rgba(80, 82, 178, 1)' : 'none',
                                color: page === pageNumber ? 'rgba(80, 82, 178, 1)' : 'rgba(122, 122, 122, 1)',
                                minWidth: '30px',
                                minHeight: '30px',
                                padding: 0
                            }}
                            variant={page === pageNumber ? 'contained' : 'text'}
                        >
                            {pageNumber + 1}
                        </Button>
                    ))}
                    {totalPages - page > 3 && <Typography variant="body2" sx={{ mx: 1 }}>...</Typography>}
                    {page < totalPages - 1 && <Button onClick={() => handlePageChange(totalPages - 1)}
                        sx={suppressionsStyles.page_number}>{totalPages}</Button>}
                </>
            )}
            {page > 0 && (
                <Button
                    onClick={(e) => handlePageChange(page + 1)}
                    disabled={page >= totalPages - 1}
                    sx={{
                        minWidth: '30px',
                        minHeight: '30px',
                    }}
                >
                    <ChevronRight sx={{
                        border: page >= totalPages - 1 ? 'none' : '1px solid rgba(235, 235, 235, 1)',
                        borderRadius: '4px'
                    }} />
                </Button>
            )}
        </Box>
    );
};



const SuppressionRules: React.FC = () => {
    const [loading, setLoading] = useState(false);

    /// Switch Buttons
    const [checked, setChecked] = useState(false);
    const [checkedUrl, setCheckedUrl] = useState(false);
    const [checkedUrlParameters, setCheckedUrlParameters] = useState(false);

    const label = { inputProps: { 'aria-label': 'Switch demo' } };

    // First switch
    const handleSwitchChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = event.target.checked;
        setChecked(isChecked);

        try {
            setLoading(true)
            const response = await axiosInstance.post('/suppressions/collecting-contacts');
        } catch (error) {
            console.error('Error occurred while updating switch status:', error);
        } finally {
            setLoading(false)
        }
    };



    /// URL suppressions
    const [inputValue, setInputValue] = useState('');
    const [chipData, setChipData] = useState<string[]>([]);

    const handleKeyDownUrl = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter' && inputValue.trim()) {
            event.preventDefault(); // Prevent newline in contentEditable
            if (!chipData.includes(inputValue.trim())) {
                setChipData((prevChips) => [...prevChips, inputValue.trim()]);
                setInputValue(''); // Clear input after adding chip
            }
        }
    };

    const handleDelete = (chipToDelete: string) => {
        setChipData((prevChips) => prevChips.filter((chip) => chip !== chipToDelete));
    };

    const handleSubmitUrl = async () => {
        try {
            setLoading(true)
            const dataToSend = chipData.length > 0 ? chipData : [];

            const response = await axiosInstance.post('/suppressions/certain-urls', {
                data: dataToSend
            });

            if (response.status === 200) {
                console.log("URLs successfully sent:", response.data);
                showToast('URLs successfully processed!');
            }
        } catch (error) {
            console.error("Error while sending URLs:", error);
            showErrorToast('An error occurred while sending URLs.');
        }
        finally {
            setLoading(false)
        }
    };

    // Second switch
    const handleSwitchChangeURl = async (event: React.ChangeEvent<HTMLInputElement>) => {
        setCheckedUrl(event.target.checked);

        try {
            setLoading(true)
            const response = await axiosInstance.post('/suppressions/certain-activation');
        } catch (error) {
            console.error('Error occurred while updating switch status:', error);
        } finally {
            setLoading(false)
        }
    };


    /// URL with Param suppressions
    const [inputValueParam, setInputValueParam] = useState('');
    const [chipDataParam, setChipDataParam] = useState<string[]>([]);

    const handleKeyDownUrlParameters = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter' && inputValueParam.trim()) {
            event.preventDefault(); // Prevent newline in contentEditable
            if (!chipDataParam.includes(inputValueParam.trim())) {
                setChipDataParam((prevChips) => [...prevChips, inputValueParam.trim()]);
                setInputValueParam(''); // Clear input after adding chip
            }
        }
    };

    const handleDeleteParam = (chipToDelete: string) => {
        setChipDataParam((prevChips) => prevChips.filter((chip) => chip !== chipToDelete));
    };

    const handleSubmitUrlParam = async () => {
        try {
            setLoading(true)
            const dataToSend = chipDataParam.length > 0 ? chipDataParam : [];
            const response = await axiosInstance.post('/suppressions/based-urls', {
                data: dataToSend
            });

            if (response.status === 200) {
                showToast('URLs successfully processed!');
            }
        } catch (error) {
            showErrorToast('An error occurred while sending URLs.');
        } finally {
            setLoading(false)
        }
    };

    const handleSwitchChangeURlParameters = async (event: React.ChangeEvent<HTMLInputElement>) => {
        setCheckedUrlParameters(event.target.checked);
        try {
            setLoading(true)
            const response = await axiosInstance.post('/suppressions/based-activation');
        } catch (error) {
            console.error('Error occurred while updating switch status:', error);
        } finally {
            setLoading(false)
        }
    };


    /// Email Suppressions
    const [inputValueEmail, setInputValueEmail] = useState('');
    const [chipDataEmail, setChipDataEmail] = useState<string[]>([]);

    const handleDeleteEmail = (chipToDelete: string) => {
        setChipDataEmail((prevChips) => prevChips.filter((chip) => chip !== chipToDelete));
    };

    const handleKeyDownEmail = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter' && inputValueEmail.trim()) {
            event.preventDefault(); // Prevent newline in contentEditable
            if (!chipDataParam.includes(inputValueEmail.trim())) {
                setChipDataEmail((prevChips) => [...prevChips, inputValueEmail.trim()]);
                setInputValueEmail(''); // Clear input after adding chip
            }
        }
    };

    const handleSubmitEmail = async () => {
        try {
            setLoading(true)
            const dataToSend = chipDataEmail.length > 0 ? chipDataEmail : [];

            const response = await axiosInstance.post('/suppressions/suppression-multiple-emails', {
                data: dataToSend
            });

            if (response.status === 200) {
                showToast('Emails successfully processed!');
            }
        } catch (error) {
            console.error("Error while sending URLs:", error);
            showErrorToast('An error occurred while sending URLs.');
        } finally {
            setLoading(false)
        }

    };

    // file CSV
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isFileNameDuplicate, setIsFileNameDuplicate] = useState<boolean>(false);

    const handleFileUpload = (event: any) => {
        const file = event.target.files[0];

        const fileName = file.name.endsWith('.csv')
            ? file.name.slice(0, -4)
            : file.name;

        const isDuplicate = suppressionList.some(suppressionFile => suppressionFile.list_name === fileName);

        if (isDuplicate) {
            setIsFileNameDuplicate(true);
        } else {
            setIsFileNameDuplicate(false);
        }

        setUploadedFile(file);

    };

    const handleDeleteFile = () => {
        setUploadedFile(null);
    };

    const handleClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const downloadFile = async () => {
        try {
            setLoading(true)
            const response = await axiosInstance.get('/suppressions/sample-suppression-list', {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'sample-suppression-list.csv');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            showErrorToast('Error downloading the file.');
        } finally {
            setLoading(false)
        }
    };

    const saveFile = async () => {
        if (!uploadedFile) {
            showErrorToast('No file to upload.');
            return;
        }

        const fileName = uploadedFile.name.endsWith('.csv')
            ? uploadedFile.name.slice(0, -4)
            : uploadedFile.name;

        const isFileNameDuplicate = suppressionList.some(file => file.list_name === fileName);

        if (isFileNameDuplicate) {
            showErrorToast('File name must be unique.');
            return;
        }

        const formData = new FormData();
        formData.append('file', uploadedFile);

        try {
            setLoading(true)
            const response = await axiosInstance.post('/suppressions/suppression-list', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.status === 200) {
                showToast('File uploaded successfully.');
                handleUpdateSuppressionList()
            } else {
                showErrorToast('Failed to upload file.');
            }
        } catch (error) {
            showErrorToast('Error uploading the file.');
        }
        finally {
            setLoading(false)
        }
    };


    interface SuppressionListResponse {
        suppression_list: any[];
        total_count: number;
        max_page: number;
    }

    const [suppressionList, setSuppressionList] = useState<any[]>([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [totalCount, setTotalCount] = useState(0);

    const fetchSuppressionList = async (page: number, perPage: number) => {
        try {
            setLoading(true)
            const response = await axiosInstance.get<SuppressionListResponse>('/suppressions/suppression-list', {
                params: {
                    page: page + 1,
                    per_page: perPage,
                },
            });
            setSuppressionList(response.data.suppression_list);
            setTotalCount(response.data.total_count);
        } catch (error) {
        }
        finally {
            setLoading(false)
        }
    };

    useEffect(() => {
        try {
            setLoading(true)
            fetchSuppressionList(page, rowsPerPage);
        }
        finally {
            setLoading(false)
        }

    }, [page, rowsPerPage]);

    const handleUpdateSuppressionList = () => {
        fetchSuppressionList(page, rowsPerPage);
    };

    const handlePageChange = (event: React.MouseEvent<HTMLButtonElement>, newPage: number) => {
        setPage(newPage);
    };

    const handleRowsPerPageChange = (event: React.ChangeEvent<{ value: unknown }>) => {
        setRowsPerPage(parseInt(event.target.value as string, 10));
    };

    const handleDownloadFile = async (id: number) => {
        try {
            setLoading(true)
            const response = await axiosInstance.get('/suppressions/download-suppression-list', {
                params: {
                    suppression_list_id: id
                },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `suppression_list_${id}.csv`);
            document.body.appendChild(link);
            link.click();

            window.URL.revokeObjectURL(url);
        } catch (error) {
        } finally {
            setLoading(false)
        }
    };

    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [selectedFileId, setSelectedFileId] = useState<number | null>(null);

    // Открытие Popover
    const handleClickOpen = (event: React.MouseEvent<HTMLElement>, id: number) => {
        setSelectedFileId(id);
        setAnchorEl(event.currentTarget);
    };

    // Закрытие Popover
    const handleClose = () => {
        setAnchorEl(null);
        setSelectedFileId(null);
    };

    const handleDeleteTableFile = async () => {
        if (selectedFileId === null) return;

        try {
            setLoading(true)
            const response = await axiosInstance.delete('/suppressions/suppression-list', {
                data: {
                    suppression_list_id: selectedFileId
                }
            });
            if (response.data.status === "SUCCESS") {
                showToast("Successfully deleted file")
            }
            else {
                showErrorToast("Error deleting suppression list")
            }
            fetchSuppressionList(page, rowsPerPage);
            handleClose();
        } catch (error) {
        } finally {
            setLoading(false)
        }
    };

    const fetchRules = useCallback(async () => {
        try {
            setLoading(true)
            const response = await axiosInstance.get("/suppressions/rules");
            const data = response.data
            const EmailChip = data.suppressions_multiple_emails
                ? data.suppressions_multiple_emails.split(',').map((email: string) => email.trim())
                : [];
            const ChipData = data.activate_certain_urls
                ? data.activate_certain_urls.split(',').map((url: string) => `/${url.trim()}`)
                : [];
            setChecked(data.is_stop_collecting_contacts)
            setCheckedUrl(data.is_url_certain_activation)
            setCheckedUrlParameters(data.is_based_activation)
            setChipDataEmail(EmailChip);
            setChipData(ChipData)
        } catch (err) {
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRules();
    }, [fetchRules]);


    if (loading) {
        return <CustomizedProgressBar />;
    }

    return (
        <Box>
            <Box sx={suppressionsStyles.box}>
                <Box sx={suppressionsStyles.container}>
                    <Typography className="main-text" sx={suppressionsStyles.title}>
                        Suppression Rules
                    </Typography>

                    <Typography className="second-text" sx={suppressionsStyles.subtitle}>
                        Set up rules to automatically block contact collection. Suppression prevents contacts from being gathered.
                    </Typography>

                    <Box sx={{
                        background: 'rgba(239, 239, 239, 1)', border: '1px solid #efefef', borderRadius: '4px', p: 1, maxWidth: '43%', mb: '1.5rem', "@media (max-width:700px)": {
                            maxWidth: '100%'
                        }
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Image src='/info-circle.svg' alt='info-circle' height={20} width={20} />
                            <Typography variant="subtitle1" className="second-text" sx={{
                                fontSize: '12px',
                                fontWeight: '400',
                                color: 'rgba(128, 128, 128, 1)',
                                lineHeight: '20px'
                            }}>You still need to manually apply the suppression event to all sign-up and login forms.</Typography>
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'space-between', "@media (max-width: 700px)": { flexDirection: 'column' } }}>
                            <Box>
                                <Typography className="main-text"
                                    sx={suppressionsStyles.dote_text}
                                >
                                    Stop collecting contacts if you&apos;re using popup forms to gather emails.
                                </Typography>
                                <Typography className="second-text"
                                    sx={suppressionsStyles.dote_subtext}
                                >
                                    This means our suppression pixel will activate every time someone submits an email through a popup form.
                                </Typography>
                            </Box>
                            <Box position="relative" display="inline-block" sx={{
                                "@media (max-width:700px)": {
                                    pl: 2
                                }
                            }}>
                                <Switch
                                    {...label}
                                    checked={checked}
                                    onChange={handleSwitchChange}
                                    sx={{
                                        width: 54, // Increase width to fit "Yes" and "No"
                                        height: 24,
                                        padding: 0,
                                        '& .MuiSwitch-switchBase': {
                                            padding: 0,
                                            top: '2px',
                                            left: '3px',
                                            '&.Mui-checked': {
                                                left: 0,
                                                transform: 'translateX(32px)', // Adjust for larger width
                                                color: '#fff',
                                                '&+.MuiSwitch-track': {
                                                    backgroundColor: checked ? '#5052b2' : '#7b7b7b',
                                                    opacity: checked ? '1' : '1',
                                                }
                                            },
                                        },
                                        '& .MuiSwitch-thumb': {
                                            width: 20,
                                            height: 20,
                                        },
                                        '& .MuiSwitch-track': {
                                            borderRadius: 20 / 2,
                                            backgroundColor: checked ? '#5052b2' : '#7b7b7b',
                                            opacity: checked ? '1' : '1',
                                            '& .MuiSwitch-track.Mui-checked': {
                                                backgroundColor: checked ? '#5052b2' : '#7b7b7b',
                                                opacity: checked ? '1' : '1',
                                            }
                                        },
                                    }}
                                />
                                <Box sx={{
                                    position: "absolute",
                                    top: "19%",
                                    width: "100%",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    transform: "translateY(-50%)",
                                    pointerEvents: "none",
                                    "@media (max-width:700px)": {
                                        top: '49%'
                                    }
                                }}>
                                    {/* Conditional Rendering of Text */}
                                    {!checked && (
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                fontFamily: 'Roboto',
                                                fontSize: '12px',
                                                color: '#fff',
                                                fontWeight: '400',
                                                marginRight: '8px',
                                                lineHeight: 'normal',
                                                opacity: !checked ? 1 : 0,
                                                width: '100%',
                                                textAlign: 'right',
                                            }}
                                        >
                                            No
                                        </Typography>
                                    )}

                                    {checked && (
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                fontFamily: 'Roboto',
                                                fontSize: '12px',
                                                color: '#fff',
                                                fontWeight: '400',
                                                marginLeft: '6px',
                                                opacity: checked ? 1 : 0,
                                                lineHeight: 'normal'
                                            }}
                                        >
                                            Yes
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'space-between', "@media (max-width: 700px)": { flexDirection: 'column' } }}>
                            <Box>
                                <Typography className="main-text"
                                    sx={suppressionsStyles.dote_text}
                                >
                                    Activate on certain URLs
                                </Typography>
                                <Typography className="second-text"
                                    sx={suppressionsStyles.dote_subtext}
                                >
                                    You can use either full URLs or parts of them (e.g., /shoes, /books/fantasy). If any URL includes this text, it will trigger the suppression event.
                                </Typography>
                            </Box>

                            <Box position="relative" display="inline-block" sx={{
                                "@media (max-width:700px)": {
                                    pl: 2
                                }
                            }}>
                                <Switch
                                    {...label}
                                    checked={checkedUrl}
                                    onChange={handleSwitchChangeURl}
                                    sx={{
                                        width: 54, // Increase width to fit "Yes" and "No"
                                        height: 24,
                                        padding: 0,
                                        '& .MuiSwitch-switchBase': {
                                            padding: 0,
                                            top: '2px',
                                            left: '3px',
                                            '&.Mui-checked': {
                                                left: 0,
                                                transform: 'translateX(32px)', // Adjust for larger width
                                                color: '#fff',
                                                '&+.MuiSwitch-track': {
                                                    backgroundColor: checkedUrl ? '#5052b2' : '#7b7b7b',
                                                    opacity: checkedUrl ? '1' : '1',
                                                }
                                            },
                                        },
                                        '& .MuiSwitch-thumb': {
                                            width: 20,
                                            height: 20,
                                        },
                                        '& .MuiSwitch-track': {
                                            borderRadius: 20 / 2,
                                            backgroundColor: checkedUrl ? '#5052b2' : '#7b7b7b',
                                            opacity: checkedUrl ? '1' : '1',
                                            '& .MuiSwitch-track.Mui-checked': {
                                                backgroundColor: checkedUrl ? '#5052b2' : '#7b7b7b',
                                                opacity: checkedUrl ? '1' : '1',
                                            }
                                        },
                                    }}
                                />
                                <Box sx={{
                                    position: "absolute",
                                    top: "19%",
                                    width: "100%",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    transform: "translateY(-50%)",
                                    pointerEvents: "none",
                                    "@media (max-width:700px)": {
                                        top: '49%',
                                    }
                                }}>
                                    {/* Conditional Rendering of Text */}
                                    {!checkedUrl && (
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                fontFamily: 'Roboto',
                                                fontSize: '12px',
                                                color: '#fff',
                                                fontWeight: '400',
                                                marginRight: '8px',
                                                lineHeight: 'normal',
                                                opacity: !checkedUrl ? 1 : 0,
                                                width: '100%',
                                                textAlign: 'right',
                                            }}
                                        >
                                            No
                                        </Typography>
                                    )}

                                    {checkedUrl && (
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                fontFamily: 'Roboto',
                                                fontSize: '12px',
                                                color: '#fff',
                                                fontWeight: '400',
                                                marginLeft: '6px',
                                                opacity: checkedUrl ? 1 : 0,
                                                lineHeight: 'normal'
                                            }}
                                        >
                                            Yes
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, width: '100%', alignItems: 'end', '@media (max-width: 700px)': { flexDirection: 'column', justifyContent: 'flex-end' } }}>
                            <TextField
                                label="URL"
                                multiline
                                rows={3}
                                disabled={!checkedUrl}
                                variant="outlined"
                                fullWidth
                                sx={{ display: checkedUrl ? 'block' : 'none' }}
                                margin="normal"
                                value={inputValue}
                                onKeyDown={handleKeyDownUrl}
                                onChange={(e) => setInputValue(e.target.value)}
                                InputProps={{
                                    sx: {
                                        alignItems: 'flex-start',
                                        fontSize: 'Roboto',
                                        fontFamily: 'Roboto',
                                        fontWeight: 400,
                                        textAlign: '16.8px',
                                    },
                                    startAdornment: (
                                        <InputAdornment position="start" sx={{ display: 'flex', gap: 1, flexDirection: 'row', alignItems: 'start', }}>
                                            {chipData.map((chip, index) => (
                                                <Chip
                                                    key={index}
                                                    label={chip}
                                                    size="small"
                                                    onDelete={() => handleDelete(chip)}
                                                    sx={{
                                                        backgroundColor: 'rgba(237, 237, 247, 1)',
                                                        fontSize: '13px',
                                                        borderRadius: '4px',
                                                        fontFamily: 'Roboto',
                                                        fontWeight: 400,
                                                        textAlign: '16.8px',
                                                        '&.MuiChip-label': {
                                                            padding: 0
                                                        }
                                                    }}
                                                />
                                            ))}
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <Box sx={{ padding: 0 }}>
                                <Button variant="outlined" onClick={handleSubmitUrl} sx={{
                                    backgroundColor: '#fff',
                                    color: 'rgba(80, 82, 178, 1)',
                                    fontFamily: "Nunito Sans",
                                    textTransform: 'none',
                                    lineHeight: '22.4px',
                                    fontWeight: '700',
                                    display: checkedUrl ? '' : 'none',
                                    padding: '1em 1em',
                                    marginBottom: 1,
                                    textWrap: 'nowrap',
                                    border: '1px solid rgba(80, 82, 178, 1)',
                                    maxWidth: '79px',
                                    maxHeight: '40px',
                                    '&:hover': { backgroundColor: '#fff', boxShadow: '0 2px 2px rgba(0, 0, 0, 0.3)' },
                                }}>
                                    Save
                                </Button>
                            </Box>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', paddingTop: '2rem', justifyContent: 'space-between', "@media (max-width: 700px)": { flexDirection: 'column' } }}>
                            <Box>
                                <Typography className="main-text"
                                    sx={suppressionsStyles.dote_text}
                                >
                                    Activate based on URLs with certain parameters
                                </Typography>
                                <Typography className="second-text"
                                    sx={suppressionsStyles.dote_subtext}
                                >
                                    You can use this to exclude other traffic sources or UTM identifiers (like utm_source=instagram).
                                    Any URL parameters that match this text will trigger the suppression event.
                                </Typography>
                            </Box>

                            <Box position="relative" display="inline-block" sx={{
                                "@media (max-width:700px)": {
                                    pl: 2
                                }
                            }}>
                                <Switch
                                    {...label}
                                    checked={checkedUrlParameters}
                                    onChange={handleSwitchChangeURlParameters}
                                    sx={{
                                        width: 54, // Increase width to fit "Yes" and "No"
                                        height: 24,
                                        padding: 0,
                                        '& .MuiSwitch-switchBase': {
                                            padding: 0,
                                            top: '2px',
                                            left: '3px',
                                            '&.Mui-checked': {
                                                left: 0,
                                                transform: 'translateX(32px)', // Adjust for larger width
                                                color: '#fff',
                                                '&+.MuiSwitch-track': {
                                                    backgroundColor: checkedUrlParameters ? '#5052b2' : '#7b7b7b',
                                                    opacity: checkedUrlParameters ? '1' : '1',
                                                }
                                            },
                                        },
                                        '& .MuiSwitch-thumb': {
                                            width: 20,
                                            height: 20,
                                        },
                                        '& .MuiSwitch-track': {
                                            borderRadius: 20 / 2,
                                            backgroundColor: checkedUrlParameters ? '#5052b2' : '#7b7b7b',
                                            opacity: checkedUrlParameters ? '1' : '1',
                                            '& .MuiSwitch-track.Mui-checked': {
                                                backgroundColor: checkedUrlParameters ? '#5052b2' : '#7b7b7b',
                                                opacity: checkedUrlParameters ? '1' : '1',
                                            }
                                        },
                                    }}
                                />
                                <Box sx={{
                                    position: "absolute",
                                    top: "19%",
                                    width: "100%",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    transform: "translateY(-50%)",
                                    pointerEvents: "none",
                                    "@media (max-width:700px)": {
                                        top: '49%',
                                    }
                                }}>
                                    {/* Conditional Rendering of Text */}
                                    {!checkedUrlParameters && (
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                fontFamily: 'Roboto',
                                                fontSize: '12px',
                                                color: '#fff',
                                                fontWeight: '400',
                                                marginRight: '8px',
                                                lineHeight: 'normal',
                                                opacity: !checkedUrlParameters ? 1 : 0,
                                                width: '100%',
                                                textAlign: 'right',
                                            }}
                                        >
                                            No
                                        </Typography>
                                    )}

                                    {checkedUrlParameters && (
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                fontFamily: 'Roboto',
                                                fontSize: '12px',
                                                color: '#fff',
                                                fontWeight: '400',
                                                marginLeft: '6px',
                                                opacity: checkedUrlParameters ? 1 : 0,
                                                lineHeight: 'normal'
                                            }}
                                        >
                                            Yes
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, width: '100%', alignItems: 'end', '@media (max-width: 700px)': { flexDirection: 'column', justifyContent: 'flex-end' } }}>
                            <TextField
                                label="URL"
                                multiline
                                rows={3}
                                variant="outlined"
                                fullWidth
                                sx={{
                                    display: checkedUrlParameters ? '' : 'none',
                                }}
                                margin="normal"
                                value={inputValueParam}
                                onKeyDown={handleKeyDownUrlParameters}
                                onChange={(e) => setInputValueParam(e.target.value)}
                                InputProps={{
                                    sx: {
                                        alignItems: 'flex-start',
                                        fontSize: 'Roboto',
                                        fontFamily: 'Roboto',
                                        fontWeight: 400,
                                        textAlign: '16.8px',
                                    },
                                    startAdornment: (
                                        <InputAdornment position="start" sx={{ display: 'flex', gap: 1, flexDirection: 'row', alignItems: 'start', }}>
                                            {chipDataParam.map((chip, index) => (
                                                <Chip
                                                    key={index}
                                                    label={chip}
                                                    size="small"
                                                    onDelete={() => handleDeleteParam(chip)}
                                                    sx={{
                                                        backgroundColor: 'rgba(237, 237, 247, 1)',
                                                        fontSize: '13px',
                                                        borderRadius: '4px',
                                                        fontFamily: 'Roboto',
                                                        fontWeight: 400,
                                                        textAlign: '16.8px',
                                                        '&.MuiChip-label': {
                                                            padding: 0
                                                        }
                                                    }}
                                                />
                                            ))}
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <Box sx={{ padding: 0 }}>
                                <Button variant="outlined" onClick={handleSubmitUrlParam} sx={{
                                    backgroundColor: '#fff',
                                    color: 'rgba(80, 82, 178, 1)',
                                    fontFamily: "Nunito Sans",
                                    textTransform: 'none',
                                    lineHeight: '22.4px',
                                    fontWeight: '700',
                                    display: checkedUrlParameters ? '' : 'none',
                                    padding: '1em 1em',
                                    marginBottom: 1,
                                    textWrap: 'nowrap',
                                    border: '1px solid rgba(80, 82, 178, 1)',
                                    maxWidth: '79px',
                                    maxHeight: '40px',
                                    '&:hover': { backgroundColor: '#fff', boxShadow: '0 2px 2px rgba(0, 0, 0, 0.3)' },
                                }}>
                                    Save
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Box>

            <Box sx={suppressionsStyles.box}>

                <Box sx={suppressionsStyles.container}>
                    <Typography className="main-text" sx={suppressionsStyles.title}>
                        Add Suppressions
                    </Typography>

                    <Typography className="second-text" sx={suppressionsStyles.subtitle}>
                        You can add multiple emails.
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, width: '100%', alignItems: 'end', '@media (max-width: 700px)': { flexDirection: 'column', justifyContent: 'flex-end' } }}>
                        <TextField
                            label="Email address"
                            multiline
                            rows={3}
                            variant="outlined"
                            fullWidth
                            margin="normal"
                            value={inputValueEmail}
                            onKeyDown={handleKeyDownEmail}
                            onChange={(e) => setInputValueEmail(e.target.value)}
                            InputProps={{
                                sx: {
                                    alignItems: 'flex-start',
                                    fontSize: 'Roboto',
                                    fontFamily: 'Roboto',
                                    fontWeight: 400,
                                    textAlign: '16.8px',
                                },
                                startAdornment: (
                                    <InputAdornment position="start" sx={{ display: 'flex', gap: 1, flexDirection: 'row', alignItems: 'start', }}>
                                        {chipDataEmail.map((chip, index) => (
                                            <Chip
                                                key={index}
                                                label={chip}
                                                size="small"
                                                onDelete={() => handleDeleteEmail(chip)}
                                                sx={{
                                                    backgroundColor: 'rgba(237, 237, 247, 1)',
                                                    fontSize: '13px',
                                                    borderRadius: '4px',
                                                    fontFamily: 'Roboto',
                                                    fontWeight: 400,
                                                    textAlign: '16.8px',
                                                    '&.MuiChip-label': {
                                                        padding: 0
                                                    }
                                                }}
                                            />
                                        ))}
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Box sx={{ padding: 0 }}>
                            <Button variant="outlined" onClick={handleSubmitEmail} sx={{
                                backgroundColor: '#fff',
                                color: 'rgba(80, 82, 178, 1)',
                                fontFamily: "Nunito Sans",
                                textTransform: 'none',
                                lineHeight: '22.4px',
                                fontWeight: '700',
                                padding: '1em 1em',
                                marginBottom: 1,
                                textWrap: 'nowrap',
                                border: '1px solid rgba(80, 82, 178, 1)',
                                maxWidth: '79px',
                                maxHeight: '40px',
                                '&:hover': { backgroundColor: '#fff', boxShadow: '0 2px 2px rgba(0, 0, 0, 0.3)' },
                            }}>
                                Save
                            </Button>
                        </Box>
                    </Box>
                </Box>




            </Box>

            <Box sx={suppressionsStyles.box}>
                <Box sx={suppressionsStyles.container}>
                    <Typography className="main-text" sx={suppressionsStyles.title}>
                        Add a CSV file
                    </Typography>

                    <Typography className="second-text" sx={suppressionsStyles.subtitle}>
                        Upload your external contact list to avoid paying for contacts you already have. There are two methods to do this.
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'space-between', "@media (max-width: 700px)": { flexDirection: 'column' } }}>
                        <Box sx={{ width: '100%', display: 'flex', alignItems: 'flex-start', flexDirection: 'column' }}>
                            <Typography className="main-text"
                                sx={suppressionsStyles.text}
                            >
                                1. Set up automatic suppression by creating an integration. This will automatically update your list daily, directly from your email marketing program.
                            </Typography>

                            <Box sx={suppressionsStyles.or_border}>
                                <Box sx={{ width: '20%', borderBottom: '1px solid var(--Grey-lighter, rgba(220, 225, 232, 1))' }} />
                                <Typography variant="body1" sx={suppressionsStyles.or_text}>
                                    OR
                                </Typography>
                                <Box sx={{ width: '20%', borderBottom: '1px solid var(--Grey-lighter, rgba(220, 225, 232, 1))' }} />
                            </Box>

                            <Typography className="main-text"
                                sx={suppressionsStyles.text}
                            >
                                2. The input must be in CSV format with a header, contain only one column labeled &apos;email&apos;, and be no larger than 100MB.
                            </Typography>

                            <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'start', flexDirection: 'row', mt: '1.5rem', gap: 2 }}>

                                <Box onClick={handleClick}
                                    sx={{
                                        border: '1px dashed rgba(80, 82, 178, 1)',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        width: '49%',
                                        maxHeight: '5rem',
                                        alignItems: 'center',
                                        padding: '16px',
                                        gap: '16px',

                                        cursor: 'pointer',
                                        '&:hover': {
                                            backgroundColor: 'rgba(80, 82, 178, 0.09)',
                                        },
                                        "@media (max-width: 700px)": {
                                            width: '100%',
                                        }
                                    }}
                                >
                                    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            style={{ display: 'none' }}
                                            onChange={handleFileUpload}
                                        />
                                        <Button sx={{ padding: 0, margin: 0 }}>
                                            <Image src='upload.svg' alt="upload" width={40} height={40} />
                                        </Button>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'start', justifyContent: 'start' }}>
                                            <Typography className="main-text" sx={{ color: 'rgba(80, 82, 178, 1)', mb: 0, padding: 0, fontWeight: 500 }}>
                                                Upload a file
                                            </Typography>
                                            <Typography className="main-text" sx={{ color: 'rgba(32, 33, 36, 1)', mb: 0, padding: 0, fontWeight: 500 }}>
                                                CSV. Max 100MB
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                                {uploadedFile && (
                                    <Box
                                        sx={{
                                            border: '1px solid rgba(218, 220, 224, 1)',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            width: '49%',
                                            maxHeight: '5rem',
                                            alignItems: 'center',
                                            padding: '16px',
                                            gap: '16px',
                                            backgroundColor: '#FAFAFA',
                                            "@media (max-width: 700px)": {
                                                width: '100%',
                                            }
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, gap: 1 }}>
                                            <Typography className="first-sub-title" sx={{ color: 'rgba(32, 33, 36, 1)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {uploadedFile.name}
                                                {isFileNameDuplicate ? (
                                                    <Tooltip title={"File name must be unique."}>
                                                    <CancelIcon sx={{ color: 'red', fontSize: '17px' }} />
                                                    </Tooltip>
                                                ) : (
                                                    <CheckCircleIcon sx={{ color: 'green', fontSize: '17px' }} />
                                                )}
                                            </Typography>

                                            <Typography className="table-heading" sx={{ color: 'rgba(114, 114, 114, 1)' }}>
                                                {(uploadedFile.size / (1024 * 1024)).toFixed(2)}MB
                                            </Typography>
                                        </Box>

                                        <IconButton onClick={handleDeleteFile}>
                                            <Image src={'/trash.svg'} alt="delete" width={24} height={24} />
                                        </IconButton>
                                    </Box>
                                )}
                            </Box>

                            <Typography className="main-text" component="div"
                                sx={{ ...suppressionsStyles.text, gap: 0.25, pt: 1, "@media (max-width: 700px)": { mb: 1 } }}
                            >
                                Sample doc: <Typography onClick={downloadFile} component="span" sx={{ ...suppressionsStyles.text, color: 'rgba(80, 82, 178, 1)', cursor: 'pointer', fontWeight: 400 }}>sample suppression-list.csv</Typography>
                            </Typography>

                            <Box sx={{ width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                                <Button variant="outlined" onClick={saveFile} sx={{
                                    backgroundColor: '#fff',
                                    color: 'rgba(80, 82, 178, 1)',
                                    fontFamily: "Nunito Sans",
                                    textTransform: 'none',
                                    lineHeight: '22.4px',
                                    fontWeight: '700',
                                    padding: '1em 1em',
                                    marginBottom: 1,
                                    textWrap: 'nowrap',
                                    border: '1px solid rgba(80, 82, 178, 1)',
                                    maxWidth: '79px',
                                    maxHeight: '40px',
                                    '&:hover': { backgroundColor: '#fff', boxShadow: '0 2px 2px rgba(0, 0, 0, 0.3)' },
                                }}>
                                    Save
                                </Button>
                            </Box>
                        </Box>

                    </Box>
                </Box>
            </Box>
            <Divider sx={{ pt: '1.5rem' }} />

            <Box sx={{ ...suppressionsStyles.container, paddingLeft: 0 }}>
                <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.5rem', mb: '1.25rem' }}>
                    <Typography className="main-text" sx={{ ...suppressionsStyles.title, mb: 0 }}>
                        Suppression list
                    </Typography>
                    <Tooltip title="Suppression list" placement="right">
                        <Image src='/info-icon.svg' alt='info-icon' height={13} width={13} />
                    </Tooltip>
                </Box>

                <Box>
                    <TableContainer sx={{
                        border: '1px solid #EBEBEB',
                        borderRadius: '4px 4px 0px 0px',
                    }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell
                                        sx={{
                                            ...suppressionsStyles.tableColumn,
                                            left: 0,
                                            zIndex: 9,
                                        }}>List name</TableCell>
                                    <TableCell sx={suppressionsStyles.tableColumn}>Date</TableCell>
                                    <TableCell sx={suppressionsStyles.tableColumn}>Total</TableCell>
                                    <TableCell sx={suppressionsStyles.tableColumn}>Status</TableCell>
                                    <TableCell sx={suppressionsStyles.tableColumn}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {suppressionList.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} sx={{
                                            ...suppressionsStyles.tableBodyColumn,
                                            textAlign: 'center'
                                        }}>
                                            No suppression list
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    suppressionList.map((suppression, index) => (
                                        <TableRow key={index} sx={{
                                            ...suppressionsStyles.tableBodyRow,
                                            '&:hover': {
                                                backgroundColor: '#F7F7F7',
                                                '& .sticky-cell': {
                                                    backgroundColor: '#F7F7F7',
                                                }
                                            },
                                        }}>
                                            <TableCell className="sticky-cell" sx={{
                                                ...suppressionsStyles.tableBodyColumn,
                                                cursor: 'pointer', position: 'sticky', left: '0', zIndex: 9
                                            }}>
                                                {suppression.list_name}
                                            </TableCell>
                                            <TableCell sx={suppressionsStyles.tableBodyColumn}>
                                                {dayjs(suppression.created_at).format('MMM D, YYYY')}
                                            </TableCell>
                                            <TableCell sx={suppressionsStyles.tableBodyColumn}>
                                                {suppression.total_emails.split(', ').length}
                                            </TableCell>
                                            <TableCell sx={suppressionsStyles.tableBodyColumn}>
                                                <Typography component="span" sx={{
                                                    background: 'rgba(234, 248, 221, 1)',
                                                    padding: '6px 8px',
                                                    borderRadius: '2px',
                                                    fontFamily: 'Roboto',
                                                    fontSize: '12px',
                                                    fontWeight: '400',
                                                    lineHeight: '16px',
                                                    color: 'rgba(43, 91, 0, 1)',
                                                    textTransform: 'capitalize'
                                                }}>
                                                    {suppression.status}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{
                                                ...suppressionsStyles.tableColumn,
                                                maxWidth: '10.8125rem',
                                                width: '15%',
                                                textAlign: 'center'
                                            }}>
                                                <Button
                                                    sx={{ minWidth: 'auto', padding: '0.5rem', marginRight: '1rem' }}
                                                    onClick={() => handleDownloadFile(suppression.id)}
                                                >
                                                    <Image src='download.svg' alt="download" width={11.67} height={15} />
                                                </Button>
                                                <Button
                                                    sx={{ minWidth: 'auto', padding: '0.5rem' }}
                                                    onClick={(event) => handleClickOpen(event, suppression.id)}

                                                >
                                                    <Image src='trash-icon-filled.svg' alt="delete" width={11.67} height={15} />
                                                </Button>
                                                <Popover
                                                    open={Boolean(anchorEl)}
                                                    anchorEl={anchorEl}
                                                    onClose={handleClose}
                                                    anchorOrigin={{
                                                        vertical: 'bottom',
                                                        horizontal: 'right',
                                                    }}
                                                    transformOrigin={{
                                                        vertical: 'top',
                                                        horizontal: 'center',
                                                    }}
                                                    PaperProps={{
                                                        sx: {
                                                            padding: '0.125rem',
                                                            width: '15.875rem',
                                                            boxShadow: 0,
                                                            borderRadius: '8px',
                                                            border: '0.5px solid rgba(175, 175, 175, 1)'
                                                        }
                                                    }}
                                                >
                                                    <Typography className="first-sub-title" sx={{ paddingLeft: 2, pt: 1, pb: 0 }}>Confirm Deletion</Typography>
                                                    <DialogContent sx={{ padding: 2 }}>
                                                        <DialogContentText className="table-data">
                                                            Are you sure you want to delete this list data?
                                                        </DialogContentText>
                                                    </DialogContent>
                                                    <DialogActions>
                                                        <Button className="second-sub-title" onClick={handleClose} sx={{
                                                            backgroundColor: '#fff',
                                                            color: 'rgba(80, 82, 178, 1) !important',
                                                            fontSize: '14px',
                                                            textTransform: 'none',
                                                            padding: '0.75em 1em',
                                                            border: '1px solid rgba(80, 82, 178, 1)',
                                                            maxWidth: '50px',
                                                            maxHeight: '30px',
                                                            '&:hover': { backgroundColor: '#fff', boxShadow: '0 2px 2px rgba(0, 0, 0, 0.3)' },
                                                        }}>
                                                            Cancel
                                                        </Button>
                                                        <Button className="second-sub-title" onClick={handleDeleteTableFile} sx={{
                                                            backgroundColor: 'rgba(80, 82, 178, 1)',
                                                            color: '#fff !important',
                                                            fontSize: '14px',
                                                            textTransform: 'none',
                                                            padding: '0.75em 1em',
                                                            border: '1px solid rgba(80, 82, 178, 1)',
                                                            maxWidth: '60px',
                                                            maxHeight: '30px',
                                                            '&:hover': { backgroundColor: 'rgba(80, 82, 178, 1)', boxShadow: '0 2px 2px rgba(0, 0, 0, 0.3)' },
                                                        }}>
                                                            Delete
                                                        </Button>
                                                    </DialogActions>
                                                </Popover>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <CustomTablePagination
                        count={totalCount}
                        page={page}
                        rowsPerPage={rowsPerPage}
                        onPageChange={handlePageChange}
                        onRowsPerPageChange={handleRowsPerPageChange}
                    />
                </Box>
            </Box>
        </Box>
    );
};


export default SuppressionRules;
