import React from 'react';
import {
  Box,
  Typography,
  Link as MuiLink,
  Divider,
  SxProps,
  Theme,
  Card,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';

export interface FollowupLink {
  label: string;
  href: string;
}

export interface DemoFollowupProps {
  /** Заголовок (с иконкой) */
  title: string;
  /** Текст под разделительной линией */
  introText: string;
  /** Разделы с описаниями и ссылками */
  sections: {
    heading: string;
    description: string;
    links: FollowupLink[];
  }[];
  sx?: SxProps<Theme>;
}

const DemoFollowup: React.FC<DemoFollowupProps> = ({
  title,
  introText,
  sections,
  sx,
}) => {
  const titleSx: SxProps<Theme> = {
    fontFamily: 'Nunito Sans',
    fontWeight: 600,
    fontSize: '24px',
    lineHeight: '32px',
    textAlign: 'center',
    color: 'rgba(0,0,0,1)',
  };
  const introSx: SxProps<Theme> = {
    fontFamily: 'Nunito Sans',
    fontWeight: 600,
    fontSize: '16px',
    lineHeight: '20px',
    letterSpacing: '0%',
    color: 'rgba(0,0,0,1)',
    mt: 2,
    mb: 3,
    textAlign: 'center',
  };
  const headingSx: SxProps<Theme> = {
    fontFamily: 'Nunito Sans',
    fontWeight: 600,
    fontSize: '16px',
    lineHeight: '20px',
    letterSpacing: '0%',
    color: 'rgba(0,0,0,1)',
    mb: 0.5,
  };
  const bodySx: SxProps<Theme> = {
    fontFamily: 'Nunito Sans',
    fontWeight: 400,
    fontSize: '14px',
    lineHeight: '20px',
    letterSpacing: '0%',
    color: 'rgba(0,0,0,1)',
    mb: 1,
  };
  const linkSx: SxProps<Theme> = {
    fontFamily: 'Nunito Sans',
    fontWeight: 400,
    fontSize: '14px',
    lineHeight: '20px',
    letterSpacing: '0%',
    color: '#3898FC',
    textDecoration: 'none',
    '&:hover': { textDecoration: 'underline' },
    whiteSpace: 'nowrap',
  };

  return (
    <Card
            sx={{
                width: "100%",
              mx: 'auto',
              p: 4,
              px: 20,
              backgroundImage: 'url("/card_backgroundv3.svg")',
              backgroundColor: 'rgba(255,255,255,0.8)',
              borderRadius: 2,
              backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
            }}
          >

      <Box sx={{ textAlign: 'center' }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            bgcolor: 'rgba(76, 175, 80, 1)',
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 1,
          }}
        >
          <CheckIcon sx={{ color: '#fff', fontSize: 28 }} />
        </Box>
        <Typography sx={titleSx}>{title}</Typography>
      </Box>

      <Divider sx={{ my: 2, borderColor: 'rgba(0,0,0,0.1)' }} />
      <Typography sx={introSx}>{introText}</Typography>

      {sections.map((sec, idx) => (
        <Box key={idx} sx={{ mb: idx < sections.length - 1 ? 3 : 0 }}>
          <Typography sx={headingSx}>{sec.heading}</Typography>
          <Typography sx={bodySx}>
            <Box component="span" sx={{ whiteSpace: 'nowrap' }}>
              {sec.description}&nbsp;
              <MuiLink href={sec.links[0].href} target="_blank" sx={linkSx}>
                {sec.links[0].label}
              </MuiLink>
            </Box>
          </Typography>
          {sec.links.slice(1).map((link, i) => (
            <Typography key={i} sx={bodySx}>
              <MuiLink href={link.href} target="_blank" sx={linkSx}>
                {link.label}
              </MuiLink>
            </Typography>
          ))}
        </Box>
      ))}
    </Card>
  );
};

export default DemoFollowup;
