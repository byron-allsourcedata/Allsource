import { Box, Typography} from '@mui/material';
import React, { useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import Image from 'next/image';

interface IntegrationBoxProps {
    image: string;
    handleClick?: () => void;
    serviceName: string;
    active?: boolean;
    isAvalible?: boolean;
    isFailed?: boolean;
    isIntegrated?: boolean;
  }

const IntegrationBox: React.FC<IntegrationBoxProps> = ({ image, handleClick, serviceName, active, isAvalible, isFailed, isIntegrated }) => {
    const [isHovered, setIsHovered] = useState(false);
  
    const altImageIntegration = [
      'Cordial'
    ]

    const formatServiceName = (serviceName: string) => {
      return serviceName
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/^./, (match) => match.toUpperCase());
    };
  
    return (
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
      }}>

        <Box 
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          sx={{
            backgroundColor: !isIntegrated
              ? 'rgba(0, 0, 0, 0.04)'
              : active
                ? 'rgba(80, 82, 178, 0.1)'
                : 'transparent',
              border: active ? '1px solid #5052B2' : '1px solid #E4E4E4',
              position: 'relative',
              display: 'flex',
              borderRadius: '4px',
              width: '100%',
              height: '8rem',
              filter: !isIntegrated ? 'grayscale(1)' : 'none',
              justifyContent: 'center',
              alignItems: 'center',
              transition: '0.2s',
              '&:hover': {
                boxShadow: isIntegrated ? 'none' : '0 0 4px #00000040',
                filter: !isIntegrated ? 'none' : 'none',
                backgroundColor: !isIntegrated ? 'transparent' : 'rgba(80, 82, 178, 0.1)',
              },
              '&:hover .edit-icon': {
                opacity: 1
              },
              "@media (max-width: 900px)": {
                width: '156px'
              },
          }}>
          {isAvalible && (
            <Box sx={{
              display: 'flex',
              justifyContent: 'center'
            }}>
              <Box onClick={handleClick} sx={{
                position: 'absolute',
                top: '0%',
                left: '0%',
                margin: '8px 0 0 8px',
                transition: 'opacity 0.2s',
                cursor: 'pointer',
                display: 'flex',
                background: !isFailed ? '#EAF8DD' : '#FCDBDC',
                height: '20px',
                padding: '2px 8px 1px 8px',
                borderRadius: '4px'
              }}>
                {!isFailed ? (
                  <Typography fontSize={'12px'} fontFamily={'Nunito Sans'} color={'#2B5B00'} fontWeight={600}>Integrated</Typography>
                ) : (
                  <Typography fontSize={'12px'} fontFamily={'Nunito Sans'} color={'#4E0110'} fontWeight={600}>Failed</Typography>
                )}
              </Box>
            </Box>
          )}
          {!isIntegrated && isHovered && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',

              }}
            >
              <AddIcon sx={{ color: "#5052B2", fontSize: 45 }} />
            </Box>
          )}
          <Image
            src={image}
            width={altImageIntegration.some(int => int == serviceName) ? 100 : 32}
            height={32}
            alt={serviceName}
            style={{
              transition: '0.2s',
              filter: !isIntegrated && isHovered ? 'blur(10px)' : 'none',
            }}
          />
        </Box>

        <Typography mt={0.5} fontSize={'14px'} fontWeight={500} textAlign={'center'} fontFamily={'Nunito Sans'}>
          {formatServiceName(serviceName)}
        </Typography>
      </Box>
    );
  };

export default IntegrationBox;