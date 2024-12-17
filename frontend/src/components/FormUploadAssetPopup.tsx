import React, { ChangeEvent, useState, useEffect } from 'react';
import { Drawer, Box, Typography, Button, IconButton, TextField } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import axiosInstance from '@/axios/axiosInterceptorInstance';

interface AssetsData {
    id: number;
    file_url: string;
    preview_url: string;
    type: string;
    title: string;
    file_extension: string;
    file_size: string;
    isFavorite: boolean;
}

interface FormDownloadPopupProps {
    updateOrAddAsset: (type: string, newAsset: AssetsData) => void;
    fileData: {id: number, title: string} | null
    open: boolean;
    onClose: () => void;
    type: string
}

interface FileObject extends File{   
    name: string;
    type: string; 
    sizesStr: string; 
}

const FormDownloadPopup: React.FC<FormDownloadPopupProps> = ({ updateOrAddAsset, fileData, open, onClose, type }) => {
    const [action, setAction] = useState("Add");
    const [actionType, setActionType] = useState<keyof typeof allowedExtensions>("video");
    const [dragActive, setDragActive] = useState(false);
    const [buttonContain, setButtonContain] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [fileObject, setFileobjet] = useState<FileObject | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [fileSizeError, setFileSizeError] = useState(false); 
    const [description, setDescription] = useState(""); 

    const allowedExtensions = {
        image: ["jpg", "png", "jpeg", "gif", "webp", "svg", "tiff", "bmp", "heic", "heif"],
        video: ["mp4", "mov", "avi", "mkv"],
        document: ["pdf", "xslx"],
        presentation: ["pptx"],
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
        setFileSizeError(false)

        const uploadedFile = event.dataTransfer.files[0];
        if (uploadedFile) {
            processDownloadFile(uploadedFile);
        }
    };

    const processDownloadFile = (uploadedFile: File) => {
        const fileNameWithoutExtension = uploadedFile.name.split('.').slice(0, -1).join('.');
        const fileSize = parseFloat((uploadedFile.size / (1024 * 1024)).toFixed(2));
        const fileExtension = uploadedFile.name.split(".").pop()?.toLowerCase();
        if (fileSize > 30){
            setFileSizeError(true)
            handleDeleteFile()
            return
        }
        if (
            fileExtension &&
            (allowedExtensions.image.includes(fileExtension) ||
                allowedExtensions.video.includes(fileExtension) ||
                allowedExtensions.document.includes(fileExtension) ||
                allowedExtensions.presentation.includes(fileExtension))
        ) {
            if (allowedExtensions.image.includes(fileExtension) || allowedExtensions.video.includes(fileExtension)) {
                setPreview(URL.createObjectURL(uploadedFile));
            } else {
                setPreview(null); 
            }
        }
        else {
            setFileSizeError(true)
            handleDeleteFile()
            return
        }
        setFileobjet({...uploadedFile, 
            name:  uploadedFile.name,
            type: uploadedFile.type.split("/")[0],
            sizesStr: fileSize + " MB"});
        setDescription(fileNameWithoutExtension);
        setButtonContain(true)
    }

    const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
        setFileSizeError(false)
        if (event.target.files && event.target.files[0]) {
            processDownloadFile(event.target.files[0]);
        }
    };

    const handleDeleteFile = () => {
        setFile(null);
        setFileobjet(null)
        setDescription("");
        setButtonContain(false)
    };

    const handleClose = () => {
        handleDeleteFile()
        onClose()
        setAction("Add")
    }

    const handleSubmit = async () => {
        const formData = new FormData();
        formData.append("description", description);
    
        if (file) {
            formData.append("file", file);
        }
    
        try {
            let response;
    
            if (action === "Edit" && fileData && fileData.id) {
                response = await axiosInstance.put(`partners-assets/${fileData.id}/`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            } else {
                formData.append("type", type);
                response = await axiosInstance.post(`partners-assets/`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            }
            updateOrAddAsset(response.data.type, {...response.data, isFavorite: false});
        } catch (error) {
            console.error("Error submitting asset:", error);
        } finally {
            handleClose()
        }
    };

    useEffect(() => {
        if (fileData) {
            setDescription(fileData.title);
            setButtonContain(true)
            setAction("Edit")
        }
    }, [fileData]);

    useEffect(() => {
        if(type){
            setActionType(type as keyof typeof allowedExtensions)
        }
        setButtonContain(description.trim().length > 0);
    }, [description, type]);

    
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
                {action} {type}
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "row" }}>
                    <IconButton onClick={handleClose}>
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
                            Upload and manage your {type}, all in one centralised section.
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
                                Upload a file
                            </Button>
                            <input
                                id="fileInput"
                                type="file"
                                hidden
                                accept=".jpg,.png,.mp4,.pdf,.xsl,.ppt"
                                onChange={handleFileUpload}
                            />
                        </Box>

                        <Typography
                            sx={{
                                fontFamily: "Nunito Sans",
                                fontSize: "12px",
                                lineHeight: "22px",
                                color: fileSizeError ? "red" : "#000",
                                fontWeight: fileSizeError ? "600" : "400"
                            }}
                            >
                            {allowedExtensions[actionType]?.join(', ')}, formats up to 30MB
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
                         {preview &&<Box
                            component= {fileObject.type == "image" ? "img" : "video"}
                            src={preview}
                            alt={fileObject.name}
                            sx={{
                            width: "120px",
                            height: "60px",
                            borderRadius: "4px",
                            objectFit: "cover",
                            }}
                        />}
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
                            {fileObject.sizesStr}
                            </Typography>
                        </Box>
                        <IconButton onClick={handleDeleteFile}>
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
                <Button variant="outlined" onClick={handleClose} sx={{
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
                        Save
                    </Typography>
                </Button> 
            </Box>
        </Drawer>
    )
};

export default FormDownloadPopup;
