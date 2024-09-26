import { Box, Typography, TextField, Button, Switch, Chip, InputAdornment, Divider, Tooltip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, } from "@mui/material";
import Image from "next/image";
import { useRef, useState } from "react";
import { suppressionsStyles } from "@/css/suppressions";


const SuppressionRules: React.FC = () => {
    /// Table
    const [pendingInvitations, setPendingInvitations] = useState<any[]>([[1, 2, 3, 4, 5]]);

    /// Switch Buttons
    const [checked, setChecked] = useState(false);
    const [checkedUrl, setCheckedUrl] = useState(false);
    const [checkedUrlParameters, setCheckedUrlParameters] = useState(false);
    const handleSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setChecked(event.target.checked);
    };
    const handleSwitchChangeURl = (event: React.ChangeEvent<HTMLInputElement>) => {
        setCheckedUrl(event.target.checked);
    };
    const handleSwitchChangeURlParameters = (event: React.ChangeEvent<HTMLInputElement>) => {
        setCheckedUrlParameters(event.target.checked);
    };
    const label = { inputProps: { 'aria-label': 'Switch demo' } };



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

    const handleSubmit = () => {
        // Здесь отправляем данные на бэкенд
        console.log('Отправка данных на бэкенд: ', chipData);
        // Пример POST запроса:
        // axios.post('/api/save', { data: chipData })
        //     .then(response => console.log(response))
        //     .catch(error => console.error(error));
    };

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (event: any) => {
        const file = event.target.files[0];
        console.log(file);
    };

    const handleClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click(); // Проверяем наличие элемента перед вызовом
        }
    };

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
                                variant="outlined"
                                fullWidth
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
                                <Button variant="outlined" sx={{
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
                                <Button variant="outlined" sx={{
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
                            <Button variant="outlined" sx={{
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

                            <Box onClick={handleClick} // Делаем весь Box кликабельным
                                sx={{
                                    border: '1px dashed rgba(80, 82, 178, 1)',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    width: '45%',
                                    maxHeight: '5rem',
                                    alignItems: 'center',
                                    padding: '16px',
                                    gap: '16px',
                                    mt: '1.5rem',
                                    cursor: 'pointer', // Меняем на pointer, чтобы указать на интерактивность
                                    '&:hover': {
                                        backgroundColor: 'rgba(80, 82, 178, 0.09)', // Изменение фона при наведении
                                    },
                                    "@media (max-width: 700px)": {
                                        width: '100%',
                                    }
                                }}
                            >
                                <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
                                    <input
                                        type="file"
                                        ref={fileInputRef} // Используем реф для доступа к элементу
                                        style={{ display: 'none' }} // Скрываем input
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

                            <Typography className="main-text"
                                sx={{ ...suppressionsStyles.text, gap: 0.25, pt: 1, "@media (max-width: 700px)": {mb:1 }}}
                            >
                                Sample doc: <Typography sx={{ ...suppressionsStyles.text, color: 'rgba(80, 82, 178, 1)', fontWeight: 400 }}>sample suppression-list.csv</Typography>
                            </Typography>

                            <Box sx={{ width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                                <Button variant="outlined" sx={{
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
                                            position: 'sticky', // Make the Name column sticky
                                            left: 0, // Stick it to the left
                                            zIndex: 9,
                                            background: '#fff'
                                        }}>List name</TableCell>
                                    <TableCell sx={suppressionsStyles.tableColumn}>Date</TableCell>
                                    <TableCell sx={suppressionsStyles.tableColumn}>Total</TableCell>
                                    <TableCell sx={suppressionsStyles.tableColumn}>Status</TableCell>
                                    <TableCell sx={suppressionsStyles.tableColumn}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {pendingInvitations.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} sx={{
                                            ...suppressionsStyles.tableBodyColumn,
                                            textAlign: 'center'
                                        }}>
                                            No suppresions list
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    pendingInvitations.map((invitation, index) => (
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
                                                cursor: 'pointer', position: 'sticky', left: '0', zIndex: 9, backgroundColor: '#fff'
                                            }}>{invitation.name}</TableCell>
                                            <TableCell sx={suppressionsStyles.tableBodyColumn}>{invitation.date}</TableCell>
                                            <TableCell sx={suppressionsStyles.tableBodyColumn}>{invitation.total}</TableCell>
                                            <TableCell sx={suppressionsStyles.tableBodyColumn}>
                                                <Typography component="span" sx={{
                                                    background: '#ececec',
                                                    padding: '6px 8px',
                                                    borderRadius: '2px',
                                                    fontFamily: 'Roboto',
                                                    fontSize: '12px',
                                                    fontWeight: '400',
                                                    lineHeight: '16px',
                                                    color: '#5f6368',
                                                }}>
                                                    {invitation.status}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{
                                                ...suppressionsStyles.tableColumn,
                                                maxWidth: '10.8125rem',  // Ограничение на максимальную ширину
                                                width: '15%',  // Чтобы столбец занимал доступное пространство
                                                textAlign: 'center'  // Выравнивание по центру
                                            }}>
                                                <Button sx={{minWidth: 'auto', padding: '0.5rem',marginRight: '1rem' }}>
                                                    <Image src='download.svg' alt="donwload" width={11.67} height={15} />
                                                </Button>
                                                <Button sx={{minWidth: 'auto', padding: '0.5rem' }}>
                                                    <Image src='trash-icon-filled.svg' alt="delete" width={11.67} height={15} />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            </Box>




        </Box>
    );
};


export default SuppressionRules;
