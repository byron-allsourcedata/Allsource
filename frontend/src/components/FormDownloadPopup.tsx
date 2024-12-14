import React, { useState } from 'react';
import { Drawer, Box, Typography, Button, IconButton, TextField } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import axiosInstance from '@/axios/axiosInterceptorInstance';


interface FormDownloadPopupProps {
  open: boolean;
  onClose: () => void;
}

const FormDownloadPopup: React.FC<FormDownloadPopupProps> = ({ open, onClose }) => {
    const [dragActive, setDragActive] = useState(false);
    const [buttonContain, setButtonContain] = useState(false);
    const [file, setFile] = useState<any>(null);
    const [fileObject, setFileobjet] = useState<any>(null);
    const [description, setDescription] = useState(""); 

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
            processDownloadFile(uploadedFile);
        }
    };

    const processDownloadFile = (uploadedFile: any) => {
        const fileNameWithoutExtension = uploadedFile.name.split('.').slice(0, -1).join('.');
        setFileobjet({...uploadedFile, 
            name:  uploadedFile.name,
            preview: URL.createObjectURL(uploadedFile), 
            size: (uploadedFile.size / (1024 * 1024)).toFixed(2) + "MB"});
        setDescription(fileNameWithoutExtension);
        setButtonContain(true)
    }

    const handleFileUpload = (event: any) => {
        processDownloadFile(event.target.files[0]);
    };

    const handleDeleteFile = (fileName: any) => {
        setFile(null);
        setFileobjet(null)
        setDescription("");
    };

    const handleSubmit = async () => {
        console.log(file)
        if (file) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('description', description);

            try {
                const response = await axiosInstance.post(`partners-assets/`, {data: formData});
                console.log({response})
            }
            catch (error) {
                console.error("Error fetching rewards:", error);
            }
        };
    }
    
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
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
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
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "8px",
                                cursor: "pointer",
                                backgroundColor: dragActive ? "rgba(80, 82, 178, 0.1)" : "transparent",
                            }}
                            onClick={() => document.getElementById("fileInput")?.click()}>
                               
                            <FileUploadOutlinedIcon sx={{ fontSize: "32px", backgroundColor: "rgba(234, 235, 255, 1)", borderRadius: "4px", color: "rgba(80, 82, 178, 1)" }} />
                            <Typography sx={{ fontFamily: "Nunito Sans", fontSize: "14px" }}>
                                Drag & drop
                            </Typography>
                            <Typography sx={{ fontFamily: "Nunito Sans", fontSize: "12px" }}>
                                OR
                            </Typography>
                            <Button
                                component="label"
                                sx={{
                                fontFamily: "Nunito Sans",
                                fontSize: "14px",
                                textTransform: "none",
                                color: "rgba(80, 82, 178, 1)",
                                }}
                            >
                                Upload a files
                            </Button>
                            <input
                                id="fileInput"
                                type="file"
                                hidden
                                onChange={handleFileUpload}
                            />
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
                    <Box sx={{ marginTop: "16px" }}>
                    {fileObject &&
                        <Box
                        key={fileObject.name}
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            border: "0.2px solid rgba(189, 189, 189, 1)",
                            borderRadius: "4px",
                            padding: "8px 16px",
                            height: "80px",
                            backgroundColor: "rgba(250, 250, 246, 1)",
                            gap: "16px",
                        }}
                        >
                        <Box
                            component="img"
                            src={fileObject.preview}
                            alt={fileObject.name}
                            sx={{
                            width: "120px",
                            height: "60px",
                            borderRadius: "4px",
                            objectFit: "cover",
                            }}
                        />
                        <Box sx={{ flexGrow: 1 }}>
                            <Typography
                            sx={{
                                fontFamily: "Nunito Sans",
                                fontSize: "14px",
                                fontWeight: "600",
                            }}
                            >
                            {fileObject.name}
                            </Typography>
                            <Typography
                            sx={{
                                fontFamily: "Nunito Sans",
                                fontSize: "12px",
                                color: "rgba(120, 120, 120, 1)",
                            }}
                            >
                            {fileObject.size}
                            </Typography>
                        </Box>
                        <IconButton onClick={() => handleDeleteFile(fileObject.name)}>
                            <DeleteOutlinedIcon />
                        </IconButton>
                        </Box>
                    }
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
                    borderColor: "rgba(80, 82, 178, 1)",
                    opacity: buttonContain ? "100%" : "20%",
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
                <Button variant="contained" onClick={handleSubmit} sx={{
                    opacity: buttonContain ? "100%" : "20%",
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
