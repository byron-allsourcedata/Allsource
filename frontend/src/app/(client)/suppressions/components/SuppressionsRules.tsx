import { Box, Typography, TextField, Button, Switch, Chip, InputAdornment, Divider, Tooltip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, DialogActions, DialogContent, DialogContentText, Popover, MenuItem, Select, SelectChangeEvent, OutlinedInput, FormControl, InputLabel, } from "@mui/material";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { suppressionsStyles } from "./suppressions";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import { showErrorToast, showToast } from "../../../../components/ToastNotification";
import dayjs from 'dayjs';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CustomizedProgressBar from "../../../../components/CustomizedProgressBar";
import CancelIcon from '@mui/icons-material/Cancel'
import { TagsInput } from "react-tag-input-component";
import "@/css/suppressionsStyle.css";
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import CustomTablePagination from '@/components/CustomTablePagination';
import CustomTooltip from "../../../../components/customToolTip";

const isValidUrlOrPath = (input: string): boolean => {
    const fullUrlRegex = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d{1,5})?(\/.*)?$/;
    const pathRegex = /^\/[a-zA-Z0-9-_/]*$/;

    return fullUrlRegex.test(input) || pathRegex.test(input);
};

const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

interface CustomTablePaginationProps {
    count: number;
    page: number;
    rowsPerPage: number;
    onPageChange: (event: React.MouseEvent<HTMLButtonElement>, newPage: number) => void;
    onRowsPerPageChange: (event: React.ChangeEvent<{ value: unknown }>) => void;
}




const SuppressionRules: React.FC = () => {
    const [loading, setLoading] = useState(false);

    /// Switch Buttons
    const [checked, setChecked] = useState(false);
    const [checkedUrl, setCheckedUrl] = useState(false);
    const [checkedUrlParameters, setCheckedUrlParameters] = useState(false);
    const [checkedDeleteContacts, setCheckedDeleteContacts] = useState(false);

    /// Days
    const [days, setDays] = useState<string>('');

    const handleDaysChange = (event: SelectChangeEvent) => {
        setDays(event.target.value);
    };

    const daysOptions: (string | number)[] = Array.from({ length: 12 }, (_, i) => (i + 1) * 30);
    daysOptions.push('Eternal');
    const label = { inputProps: { 'aria-label': 'Switch demo' } };

    const handleSubmitDaysContacts = async () => {
        try {
            setLoading(true)
            const response = await axiosInstance.post('/suppressions/contacts-days', {
                data: days
            });

            if (response.status === 200) {
                showToast('Suppresions days successfully processed!');
            }
        } catch (error) {
            showErrorToast('An error occurred while sending URLs.');
        } finally {
            setLoading(false)
        }
    };

    // First switch
    const handleSwitchChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = event.target.checked;
        setChecked(isChecked);

        try {
            setLoading(true)
            const response = await axiosInstance.post('/suppressions/collecting-contacts');
        } catch (error) {
        } finally {
            setLoading(false)
        }
    };



    /// URL suppressions
    const [chipData, setChipData] = useState<string[]>([]);

    const handleSubmitUrl = async () => {
        try {
            setLoading(true)
            const dataToSend = chipData.length > 0 ? chipData : [];

            const response = await axiosInstance.post('/suppressions/certain-urls', {
                data: dataToSend
            });

            if (response.status === 200) {
                showToast('URLs successfully processed!');
            }
        } catch (error) {
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
        } finally {
            setLoading(false)
        }
    };


    /// URL with Param suppressions
    const [chipDataParam, setChipDataParam] = useState<string[]>([]);

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

    const handleSwitchChangeDeleteContacts = async (event: React.ChangeEvent<HTMLInputElement>) => {
        setCheckedDeleteContacts(event.target.checked);
        try {
            setLoading(true)
            const response = await axiosInstance.post('/suppressions/delete-contacts');
        } catch (error) {
            showErrorToast('Failed to switch change delete contacts')
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
        } finally {
            setLoading(false)
        }
    };

    /// Email Suppressions
    const [chipDataEmail, setChipDataEmail] = useState<string[]>([]);

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
                handleUpdateSuppressionList();
                handleDeleteFile();
                if (response.data.leads_count > 0) {
                    showToast(`You have ${response.data.leads_count} leads to delete`)
                }
            } else {
                showErrorToast('Failed to upload file.');
            }
        } catch (error) {
            showErrorToast('Error uploading the file.');
        }
        finally {
            setLoading(false);
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

    const handlePageChange = (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
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
            if (response.data === "SUCCESS") {
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
                ? data.activate_certain_urls.split(',').map((url: string) => `${url.trim()}`)
                : [];
            const ChipDataParam = data.activate_based_urls
                ? data.activate_based_urls.split(',').map((url: string) => `${url.trim()}`)
                : [];
            setChecked(data.is_stop_collecting_contacts)
            setCheckedUrl(data.is_url_certain_activation)
            setCheckedUrlParameters(data.is_based_activation)
            setCheckedDeleteContacts(data.is_delete_contacts)
            if (typeof data.actual_contect_days !== 'undefined') {
                setDays(data.actual_contect_days === -1 ? 'Eternal' : data.actual_contect_days);
            }
            setChipDataEmail(EmailChip);
            setChipData(ChipData)
            setChipDataParam(ChipDataParam)
        } catch (err) {
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRules();
    }, [fetchRules]);

    const [contactCount, setContactCount] = useState(null);
    const fetchContactCount = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get(`/suppressions/suppressed-contacts-count`);
            const data = response.data;
            setContactCount(data.suppressed_contacts_count);
        } catch (err) {
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchContactCount();
    }, [fetchContactCount]);


    return (
        <Box>
            {loading && (
                <Box sx={suppressionsStyles.loaderOverlay}>
                    <CustomizedProgressBar />
                </Box>
            )}
            <Box sx={suppressionsStyles.box}>
                <Box sx={suppressionsStyles.container}>
                    <Box sx={{
                        display: 'flex', flexDirection: 'row', justifyContent: 'space-between', "@media (max-width:700px)": {
                            flexDirection: 'column', mb: 2
                        }
                    }}>

                        <Box sx={{ display: 'flex', gap: 1, }}>
                            <Typography className="main-text" sx={suppressionsStyles.title}>
                                Suppression Rules
                            </Typography>
                            <Box sx={{ pt: 0.25 }}>
                                <CustomTooltip title={"Set rules to exclude specific contacts or data from campaigns to improve targeting."} linkText="Learn more" linkUrl="https://maximizai.zohodesk.eu/portal/en/kb/articles/suppression-rules" />
                            </Box>
                        </Box>

                        <Box sx={{
                            background: 'rgba(239, 239, 239, 1)', border: '1px solid #efefef', borderRadius: '4px', p: 1, maxWidth: '43%', "@media (max-width:700px)": {
                                maxWidth: '100%'
                            }
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Typography variant="subtitle1" sx={{
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    color: 'rgba(95, 99, 104, 1)',
                                    lineHeight: '20px',
                                    fontFamily: 'Nunito Sans',
                                }}> {contactCount === 0 ? "No suppressed contacts" : `Contacts suppressed till now - ${contactCount}`}</Typography>
                            </Box>
                        </Box>
                    </Box>
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
                                    Choose how long to suppress contacts.
                                </Typography>
                                <Typography className="second-text"
                                    sx={{ ...suppressionsStyles.dote_subtext, width: '70%' }}
                                >
                                    Once X days have passed, the contact will no longer be suppressed and will be treated as a
                                    new contact, ready for fresh engagement.
                                </Typography>
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', gap: 0, width: '100%', alignItems: 'center', '@media (max-width: 700px)': { flexDirection: 'column', alignItems: 'start' } }}>
                            <FormControl
                                sx={{
                                    marginBottom: '32px',
                                    width: '69%',
                                    "@media (max-width: 700px)": { width: '100%' }
                                }}
                            >
                                <InputLabel
                                    sx={{
                                        fontFamily: 'Roboto',
                                        fontSize: '14px',
                                        color: 'rgba(74, 74, 74, 1)',  // Цвет текста
                                    }}
                                >
                                    Select
                                </InputLabel>
                                <Select
                                    value={days}
                                    onChange={handleDaysChange}
                                    label="Select"
                                    sx={{
                                        backgroundColor: '#fff',
                                        borderRadius: '4px',
                                        height: '48px',
                                        fontFamily: 'Nunito Sans',
                                        fontSize: '14px',
                                        fontWeight: 400,
                                        zIndex: 0,
                                        color: 'rgba(17, 17, 19, 1)',
                                    }}
                                    MenuProps={{
                                        PaperProps: { style: { maxHeight: 200, zIndex: 100 } }
                                    }}
                                    IconComponent={(props) => (
                                        days === '' ?
                                            <KeyboardArrowDownIcon {...props} sx={{ color: 'rgba(74, 74, 74, 1)' }} /> :
                                            <KeyboardArrowUpIcon {...props} sx={{ color: 'rgba(74, 74, 74, 1)' }} />
                                    )}
                                >
                                    {daysOptions.map((option, index) => (
                                        <MenuItem
                                            key={index}
                                            value={typeof option === 'number' ? option.toString() : option}
                                            sx={{
                                                fontFamily: 'Nunito Sans',
                                                fontWeight: 500,
                                                fontSize: '14px',
                                                lineHeight: '19.6px',
                                                '&:hover': { backgroundColor: 'rgba(80, 82, 178, 0.1)' },
                                            }}
                                        >
                                            {typeof option === 'number' ? `${option} days` : 'Eternal'}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <Box sx={{ padding: 0 }}>
                                <Button variant="outlined" onClick={handleSubmitDaysContacts} sx={{
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
                                    '&:hover': { backgroundColor: '#fff', boxShadow: '0 2px 2px rgba(0, 0, 0, 0.3)', },
                                }}>
                                    Save
                                </Button>
                            </Box>
                        </Box>

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
                                    pl: 2,
                                    mb: 2
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
                                                paddingLeft: 3,
                                                fontWeight: '400',
                                                marginLeft: '6px',
                                                opacity: !checked ? 1 : 0,
                                                lineHeight: 'normal'
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
                                    pl: 2,
                                    mb: 2
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
                                                paddingLeft: 3,
                                                fontWeight: '400',
                                                marginLeft: '6px',
                                                opacity: !checked ? 1 : 0,
                                                lineHeight: 'normal'
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

                        <Box sx={{
                            display: checkedUrl ? 'flex' : 'none',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            gap: 2,
                            width: '100%',
                            alignItems: 'flex-end',
                            '@media (max-width: 700px)': { flexDirection: 'column', alignItems: 'start' }
                        }}>
                            <TagsInput
                                value={chipData}
                                onChange={(newTags) => {
                                    const validTags = newTags.filter(isValidUrlOrPath);
                                    setChipData(validTags);
                                }}
                                onBlur={(event: any) => {
                                    const inputValue = event.target.value.trim();
                                    if (inputValue && isValidUrlOrPath(inputValue) && !chipData.includes(inputValue)) {
                                        setChipData([...chipData, inputValue]);

                                    }
                                    setTimeout(() => event.target.value = '', 0);
                                }}
                                name="urlTags"
                                placeHolder="Enter URL"
                                disabled={!checkedUrl}
                                beforeAddValidate={(input: string, existingTags: string[]) => {
                                    if (!isValidUrlOrPath(input)) {
                                        showErrorToast("Invalid URL or part of URL. Please enter a valid value.");
                                        return false;
                                    }
                                    return true;
                                }}
                            />
                            <Box sx={{ padding: 0, }}>
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
                                    pl: 2,
                                    mb: 2
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
                                                paddingLeft: 3,
                                                fontWeight: '400',
                                                marginLeft: '6px',
                                                opacity: !checked ? 1 : 0,
                                                lineHeight: 'normal'
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

                        <Box sx={{ display: checkedUrlParameters ? 'flex' : 'none', flexDirection: 'row', justifyContent: 'space-between', gap: 2, width: '100%', alignItems: 'end', '@media (max-width: 700px)': { flexDirection: 'column', alignItems: 'start' } }}>
                            <TagsInput
                                value={chipDataParam}
                                onChange={setChipDataParam}
                                name="urlTags"
                                placeHolder="Enter URL or Path"
                                disabled={!checkedUrlParameters}
                                onBlur={(event: { target: { value: string; }; }) => {
                                    const inputValue = event.target.value.trim();
                                    if (inputValue && isValidUrlOrPath(inputValue) && !chipDataParam.includes(inputValue)) {
                                        setChipDataParam([...chipDataParam, inputValue]);
                                    }
                                    setTimeout(() => event.target.value = '', 0);
                                }}
                                beforeAddValidate={(input: string) => {
                                    if (!isValidUrlOrPath(input)) {
                                        showErrorToast("Invalid URL or Path. Please enter a valid value.");
                                        return false;
                                    }
                                    return true;
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

                    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, width: '100%', justifyContent: 'space-between', alignItems: 'end', '@media (max-width: 700px)': { flexDirection: 'column', alignItems: 'start' } }}>
                        <TagsInput
                            value={chipDataEmail}
                            onChange={(newTags) => {
                                const validEmails = newTags.filter(isValidEmail);
                                setChipDataEmail(validEmails);
                            }}
                            name="emailTags"
                            placeHolder="Enter email"
                            onBlur={(event: { target: { value: string; }; }) => {
                                const inputValue = event.target.value.trim();
                                if (inputValue && isValidEmail(inputValue) && !chipDataEmail.includes(inputValue)) {
                                    setChipDataEmail([...chipDataEmail, inputValue]);
                                }
                                setTimeout(() => event.target.value = '', 0);
                            }}
                            beforeAddValidate={(input: string) => {
                                if (!isValidEmail(input)) {
                                    showErrorToast("Incorrect email. Please enter a correct email.");
                                    return false;
                                }
                                return true;
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
                            <Box sx={{
                                width: '100%',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                mt: 2,
                                ml: 2,
                            }}>
                                <Box sx={{ width: '100%', display: 'flex', alignItems: 'flex-start', flexDirection: 'column' }}>
                                    <Typography
                                        className="main-text"
                                        sx={suppressionsStyles.text}
                                    >
                                        • Delete these contacts from already existing audience lists
                                    </Typography>
                                    <Typography
                                        className="second-text" sx={{ ...suppressionsStyles.subtitle, ml: 2, mt: 1 }}
                                    >
                                        short description
                                    </Typography>
                                </Box>
                                <Box sx={{ width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', mt: 1, position: 'relative', }}>
                                    <Switch
                                        {...label}
                                        checked={checkedDeleteContacts}
                                        onChange={handleSwitchChangeDeleteContacts}
                                        sx={{
                                            width: 54,
                                            height: 24,
                                            padding: 0,
                                            '& .MuiSwitch-switchBase': {
                                                padding: 0,
                                                top: '2px',
                                                left: '3px',
                                                '&.Mui-checked': {
                                                    left: 0,
                                                    transform: 'translateX(32px)',
                                                    color: '#fff',
                                                    '&+.MuiSwitch-track': {
                                                        backgroundColor: checkedDeleteContacts ? '#5052b2' : '#7b7b7b',
                                                        opacity: checkedDeleteContacts ? '1' : '1',
                                                    }
                                                },
                                            },
                                            '& .MuiSwitch-thumb': {
                                                width: 20,
                                                height: 20,
                                            },
                                            '& .MuiSwitch-track': {
                                                borderRadius: 10,
                                                backgroundColor: checkedDeleteContacts ? '#5052b2' : '#7b7b7b',
                                                opacity: checkedDeleteContacts ? '1' : '1',
                                                '& .MuiSwitch-track.Mui-checked': {
                                                    backgroundColor: checkedDeleteContacts ? '#5052b2' : '#7b7b7b',
                                                    opacity: checkedDeleteContacts ? '1' : '1',
                                                }
                                            },
                                        }}
                                    />
                                    <Box sx={{
                                        position: "absolute",
                                        top: "20%",
                                        display: "flex",
                                        alignItems: 'flex-end',
                                        justifyContent: 'flex-end',
                                        pointerEvents: "none",
                                        "@media (max-width:700px)": {
                                            top: '49%',
                                        }
                                    }}>
                                        {!checkedDeleteContacts && (
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    fontFamily: 'Roboto',
                                                    fontSize: '12px',
                                                    color: '#fff',
                                                    fontWeight: '400',
                                                    pr: 1,
                                                    lineHeight: 'normal'
                                                }}
                                            >
                                                No
                                            </Typography>
                                        )}

                                        {checkedDeleteContacts && (
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    fontFamily: 'Roboto',
                                                    fontSize: '12px',
                                                    color: '#fff',
                                                    fontWeight: '400',
                                                    pr: 3.5,
                                                    lineHeight: 'normal'
                                                }}
                                            >
                                                Yes
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>
                            </Box>

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
                                            accept=".csv"
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
            <Divider sx={{ pt: '1rem' }} />

            <Box sx={{ ...suppressionsStyles.suppressionContainer, paddingLeft: 0, pr: 0 }}>
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
                                    <TableCell className='table-heading'
                                        sx={{
                                            ...suppressionsStyles.tableColumn,
                                            zIndex: 9,
                                            cursor: 'pointer', position: 'sticky', backgroundColor: '#fff', left: 0
                                        }}>List name</TableCell>
                                    <TableCell className='table-heading' sx={suppressionsStyles.tableColumn}>Date</TableCell>
                                    <TableCell className='table-heading' sx={suppressionsStyles.tableColumn}>Total</TableCell>
                                    <TableCell className='table-heading' sx={{ ...suppressionsStyles.tableColumn, textAlign: 'center', pl: 0 }}>Status</TableCell>
                                    <TableCell className='table-heading' sx={suppressionsStyles.tableColumn}>Actions</TableCell>
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
                                            <TableCell className='sticky-cell table-data' sx={{
                                                ...suppressionsStyles.tableBodyColumn,
                                                cursor: 'pointer',
                                                position: 'sticky',
                                                left: 0,
                                                zIndex: 1,
                                                backgroundColor: '#fff',
                                            }}>
                                                {suppression.list_name}
                                            </TableCell>
                                            <TableCell className='table-data' sx={suppressionsStyles.tableBodyColumn}>
                                                {dayjs(suppression.created_at).format('MMM D, YYYY')}
                                            </TableCell>
                                            <TableCell className='table-data' sx={{ ...suppressionsStyles.tableColumn, pl: 7 }}>
                                                {suppression.total_emails.split(', ').length}
                                            </TableCell>
                                            <TableCell className='table-data' sx={{ ...suppressionsStyles.tableColumn, textAlign: 'center', pl: 0 }}>
                                                <Typography component="span" className='table-data' sx={{
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
                                            <TableCell className='table-data' sx={{
                                                ...suppressionsStyles.tableColumn,
                                                '@media (max-width: 800px)': { display: 'flex', flexDirection: 'row', pl: 5 }
                                            }}>
                                                <IconButton onClick={() => handleDownloadFile(suppression.id)} sx={{ ':hover': { backgroundColor: 'transparent', }, padding: 0, mr: 1 }}>
                                                    <DownloadIcon sx={{ width: '20px', height: '20px', color: 'rgba(188, 188, 188, 1)', ':hover': { color: 'rgba(80, 82, 178, 1)' } }} />
                                                </IconButton>
                                                <IconButton onClick={(event) => handleClickOpen(event, suppression.id)} sx={{ ':hover': { backgroundColor: 'transparent', }, padding: 0 }}>
                                                    <DeleteIcon sx={{ width: '20px', height: '20px', color: 'rgba(188, 188, 188, 1)', ':hover': { color: 'rgba(80, 82, 178, 1)' } }} />
                                                </IconButton>
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
                    <Box sx={{ display: 'flex', justifyContent: 'end' }}>
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

        </Box>
    );
};


export default SuppressionRules;
