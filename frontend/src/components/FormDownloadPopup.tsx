import React, { useEffect, useState } from 'react';
import { Drawer, Box, Typography, Button, IconButton, Backdrop, TextField, InputAdornment, Collapse, Divider, FormControlLabel, Checkbox, Radio, List, ListItem, ListItemText } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import Image from 'next/image';
import { filterStyles } from '../css/filterSlider';
import debounce from 'lodash/debounce';
import axiosInstance from '@/axios/axiosInterceptorInstance';
import { display } from '@mui/system';


interface FormDownloadPopupProps {
  open: boolean;
  onClose: () => void;
}

const FormDownloadPopup: React.FC<FormDownloadPopupProps> = ({ open, onClose }) => {
    const [dragActive, setDragActive] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);

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

        const file = event.dataTransfer.files[0];
        if (file) {
            setUploadedFile(file);
        }
    };
    
    return (
        <Drawer anchor="right" open={open}>
            <Box
            sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0.75em 1em 0.25em 1em",
            borderBottom: "1px solid #e4e4e4",
            position: "sticky",
            top: 0,
            zIndex: 9900,
            backgroundColor: "#fff",
            }}
        >
                <Typography
                sx={{
                    fontFamily: "Nunito Sans",
                    fontSize: "16px",
                    fontWeight: "600",
                    lineHeight: "21.82px"
                }}
                >
                Add video
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "row" }}>
                    <IconButton onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </Box>
            <Box 
                sx={{
                    padding: "0 32px"
                }}>
                <Box 
                    sx={{
                        display: "flex",
                        flexDirection: "column"
                    }}>
                        <Typography
                            sx={{
                                fontFamily: "Nunito Sans",
                                fontSize: "16px",
                                fontWeight: "600",
                                lineHeight: "21.82px",
                                margin: "24px 0 40px"
                            }}
                            >
                            Upload and manage your videos, all in one centralised section.
                        </Typography>    
                                        
                        <TextField
                            id="outlined-required"
                            label="Description"
                            placeholder='Name'
                            sx={{
                                borderBottom: "1px solid #e4e4e4",
                                paddingBottom: "24px"  
                            }}
                        />

                        <Box 
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            sx={{
                                border: "1px dashed rgba(80, 82, 178, 1)",
                                marginTop: "24px",
                                height: "180px",
                                width: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: dragActive ? "rgba(80, 82, 178, 0.1)" : "transparent",
                            }}>
                                {uploadedFile ? (
                            <Typography
                                sx={{
                                    fontFamily: "Nunito Sans",
                                    fontSize: "14px",
                                    textAlign: "center",
                                }}
                            >
                                File uploaded: {uploadedFile.name}
                            </Typography>
                        ) : (
                            <Typography
                                sx={{
                                    fontFamily: "Nunito Sans",
                                    fontSize: "14px",
                                    textAlign: "center",
                                    color: dragActive ? "rgba(80, 82, 178, 1)" : "rgba(0, 0, 0, 0.6)",
                                }}
                            >
                                Drag & Drop your video here
                            </Typography>
                        )}
                        </Box>

                        <Typography
                            sx={{
                                fontFamily: "Nunito Sans",
                                fontSize: "12px",
                                lineHeight: "22px",
                            }}
                            >
                            MP4,formats up to 30MB
                        </Typography>  
                </Box>
            </Box>
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "16px",
                    borderTop: "1px solid #e4e4e4",
                    position: "absolute",
                    width: "100%",
                    bottom: 0,
                    zIndex: 9901,
                    padding: "20px 1em",
                }}
            >
                <Button variant="outlined" onClick={onClose} sx={{
                    opacity: "20%"
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
                <Button variant="contained" onClick={() => {}} sx={{
                    opacity: "20%",
                    backgroundColor: "rgba(80, 82, 178, 1)"
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
                        Load
                    </Typography>
                </Button> 
            </Box>
        </Drawer>
    )
};

export default FormDownloadPopup;
