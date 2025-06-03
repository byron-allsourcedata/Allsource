import React, {
    ReactNode,
    useRef,
    useState,
    useLayoutEffect,
    MouseEvent,
    FC,
} from 'react';
import {
    TableCell,
    Box,
    Typography,
    Tooltip,
    Skeleton,
    SxProps,
    TooltipProps,
    Theme,
} from '@mui/material';
import CellTooltip from './CellTooltip';

export const table_array = {
    position: 'relative',
    fontFamily: 'Roboto',
    fontSize: '12px',
    fontWeight: 400,
    lineHeight: '16.8px',
    textAlign: 'left',
    color: 'rgba(95, 99, 104, 1)',
    '&::after': {
        content: '""',
        display: 'block',
        position: 'absolute',
        top: 15,
        bottom: 15,
        right: 0,
        width: '1px',
        height: 'calc(100% - 30px)',
        backgroundColor: 'rgba(235, 235, 235, 1)',
    },
    "&:last-of-type::after": {
        display: "none",
    },
    '&.sticky-cell': {
        '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: '1px',
            backgroundColor: 'rgba(235, 235, 235, 1)',
        },
    },
} as const;

export const baseCellStyles = {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
} as const;

export interface TooltipOptions {
    content: React.ReactNode;
    always?: boolean;
    props?: Omit<TooltipProps, 'title' | 'children'>;
}
export interface CellOptions {
    key?: React.Key;
    sx?: SxProps<Theme>;
    className?: string;
    hideDivider?: boolean;
    onClick?: (e: MouseEvent) => void;
    style?: React.CSSProperties;
}
export interface ContentOptions {
    sx?: SxProps<Theme>;
    onClick?: (e: MouseEvent) => void;
    loading?: boolean | ReactNode;
}

export interface SmartCellProps {
    children?: ReactNode;
    render?: () => ReactNode;
    tooltipOptions?: TooltipOptions;
    cellOptions?: CellOptions;
    contentOptions?: ContentOptions;
}

const SmartCell: FC<SmartCellProps> = ({
    children,
    render,
    tooltipOptions,
    cellOptions = {},
    contentOptions = {},
}) => {
    const rawContent = children ?? (render ? render() : "");
    const isString = typeof rawContent === "string";

    const textRef = useRef<HTMLDivElement>(null);
    const [isOverflow, setIsOverflow] = useState(false);

    useLayoutEffect(() => {
        if (!textRef.current) return;
        const el = textRef.current;
        const check = () => setIsOverflow(el.scrollWidth > el.clientWidth);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, [rawContent]);

    const contentNode = isString ? (
        <Typography
            ref={textRef}
            component="div"
            sx={{ display: 'inline-block', width: '100%', ...table_array, ...baseCellStyles, ...contentOptions.sx }}
            onClick={contentOptions.onClick}
        >
            {rawContent as string}
        </Typography>
    ) : (
        <Box
            ref={textRef}
            sx={{ display: 'inline-block', width: '100%', ...baseCellStyles, ...contentOptions.sx }}
            onClick={contentOptions.onClick}
        >
            {rawContent}
        </Box>
    );

    const needTooltip = tooltipOptions?.always === true || isOverflow;
    const tooltipContent = tooltipOptions?.content;
    const tooltipPropsFinal = tooltipOptions?.props;

    const maybeTooltip = needTooltip && tooltipContent ? (
        <CellTooltip
            content={tooltipContent}
            always={tooltipOptions.always}
            props={tooltipPropsFinal}
            isOverflow={isOverflow}
            sx={{}}
        >
            {contentNode}
        </CellTooltip>
    ) : (
        contentNode
    );

    const body =
        contentOptions.loading === true ? (
            <Skeleton width="100%" />
        ) : contentOptions.loading ? (
            contentOptions.loading
        ) : (
            maybeTooltip
        );

    return (
        <TableCell
            key={cellOptions.key}
            onClick={cellOptions.onClick}
            sx={{
                ...table_array,
                ...baseCellStyles,
                ...cellOptions.sx,
                ...(cellOptions.hideDivider && {
                    "&::after": {
                        display: "none",
                    },
                }),
            }}
            className={cellOptions.className}
        >
            {body}
        </TableCell>
    );
};

export default SmartCell;
