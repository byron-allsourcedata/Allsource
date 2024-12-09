import { IconButton, Typography, Link } from "@mui/material";
import DownloadIcon from '@mui/icons-material/Download';
import { Box } from "@mui/system";
import Image from "next/image";
import { useState } from "react";
import axiosInstance from "@/axios/axiosInterceptorInstance";

interface MonthDetailsProps {
    asset: any;
}

const PartnersAssetsImage: React.FC<MonthDetailsProps> = ({asset }) => {
    const [videoWidth, setVideoWidth] = useState(154);
    const [loading, setLoading] = useState(false);

    const handleDownloadFile = async (id: number) => {
        console.log(id)
        try {
            setLoading(true)
            const response = await axiosInstance.get('/partners-assets/download', {
                params: {
                    asset_id: id
                },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            const contentDisposition = response.headers['content-disposition'];
            let filename = 'downloaded_file';
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = decodeURIComponent(filenameMatch[1]);
                }
            }
            link.setAttribute('download', filename);

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            console.log('File downloaded successfully:', filename);
        } catch (error) {
        } finally {
            setLoading(false)
        }
    };

    return (
        <Box
            sx={{
            width: "174px",
            border: "1px solid #E0E0E0",
            borderRadius: "4px",
            padding: "10px",
            boxShadow: "0px 1px 4px 0px #00000040",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            position: "relative",
            overflow: "hidden",
            '@media (max-width: 360px)': {width: "calc(50% - 8px)", padding: "8px"}
            }}
        >
            <Link href={asset.file_url} target="_blank" rel="noopener noreferrer">
                <Image src={asset.preview_url} alt="Pitch decks image" height={79} width={videoWidth}/>
            </Link>
            <Box sx={{
                display: "flex",
                justifyContent: "space-between",
            }}>
                <Box sx={{
                    display: "flex",
                    flexDirection: "column",
                }}>
                    <Typography
                    sx={{
                        fontFamily: "Roboto",
                        color: "#202124",
                        fontSize: "10px",
                        fontWeight: "600",
                        lineHeight: "14px",
                        letterSpacing: "0.005em"
                    }}
                    >
                    {asset.title}
                    </Typography>
                    <Typography
                    sx={{
                        fontFamily: "Roboto",
                        color: "#5F6368",
                        fontSize: "10px",
                        fontWeight: "400",
                        lineHeight: "14px",
                        letterSpacing: "0.005em"
                    }}
                    >
                    10MB
                    </Typography>
                </Box>
                <IconButton onClick={() => handleDownloadFile(asset.id)} sx={{ ':hover': { backgroundColor: 'transparent', }, padding: 0 }}>
                    <DownloadIcon sx={{ width: '20px', height: '20px', color: 'rgba(188, 188, 188, 1)', ':hover': { color: 'rgba(80, 82, 178, 1)' } }} />
                </IconButton>
            </Box>
        </Box>
    )
};

export default PartnersAssetsImage;