'use client'
import Image from "next/image";
import { Typography, Box, Link } from "@mui/material";
import { useEffect } from "react";
import { thanksInstalledAppStyle } from "./thanksInstalledAppStyle";

const ThanksInstalledApp = () => {
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
          document.body.style.overflow = 'auto';
        };
      }, []);
    return ( 
        <Box sx={thanksInstalledAppStyle.mainContent}>
            <Link display={'flex'} sx={{alignItems: 'center', textDecoration: 'none'}} href='https://maximiz.ai'>
                <Image src={'/logo.svg'} width={61} height={39} alt="Maximiz" />
                <Typography variant="h1" color={'#F8464B'} fontSize={'51.21px'} fontWeight={400}>Maximiz</Typography>
            </Link>
            <Image src={'/app_intalled.svg'} width={330} height={246} alt="Maximiz installed"/>
            <Typography variant="h6" fontSize={'16px'} fontWeight={400} mt={2}><Link href='https://maximiz.ai' sx={{textDecoration: 'none'}}>Maximiz</Link> installed! Get ready to supercharge your store’s success!</Typography>
        </Box>
     );
}
 
export default ThanksInstalledApp;