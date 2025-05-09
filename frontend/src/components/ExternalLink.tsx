import React from 'react';
import Link from '@mui/material/Link';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Box } from '@mui/material';

type ExternalLinkProps = {
    href: string;
    children: React.ReactNode;
};

export const ExternalLink: React.FC<ExternalLinkProps> = ({ href, children }) => {
    return (
        <Link
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            color="primary"
            sx={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontFamily: 'Nunito Sans', fontWeight: 600, fontSize: '14px', }}
        >
            {children}
            <OpenInNewIcon fontSize="small" sx={{ fontSize: '14px' }} />
        </Link>
    );
};
