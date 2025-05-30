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
} from '@mui/material';

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
  } as const;
  

export const baseCellStyles = {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
} as const;

export interface SmartCellProps<V = unknown> {
    value?: V;
    children?: ReactNode;
    render?: (value: V) => ReactNode;

    loading?: boolean | ReactNode;

    tooltip?: 'auto' | 'always' | 'never';
    tooltipProps?: Omit<TooltipProps, 'title' | 'children'>;

    onCellClick?: (e: MouseEvent, value: V | undefined) => void;
    onContentClick?: (e: MouseEvent, value: V | undefined) => void;

    sticky?: boolean;

    sx?: SxProps;
    contentSx?: SxProps;
}

const SmartCell: FC<SmartCellProps> = ({
    value,
    children,
    render,
    loading,
    tooltip = 'auto',
    tooltipProps,
    onCellClick,
    onContentClick,
    sticky,
    sx,
    contentSx,
}) => {
    const rawContent =
        children ?? (render ? render(value as any) : (value as ReactNode));

    const isString = typeof rawContent === 'string';

    const ref = useRef<HTMLElement | null>(null);
    const [overflow, setOverflow] = useState(false);

    useLayoutEffect(() => {
        if (!ref.current) return;
        const el = ref.current;
        const check = () =>
            setOverflow(el.scrollWidth > el.clientWidth && isString);
        check();

        const ro = new ResizeObserver(check);
        ro.observe(el);
        return () => ro.disconnect();
    }, [rawContent, isString]);

    const contentNode = isString ? (
        <Typography
            ref={ref as React.RefObject<HTMLSpanElement>}
            component="span"
            onClick={(e) => onContentClick?.(e, value)}
            sx={{ ...baseCellStyles, ...contentSx }}
        >
            {rawContent as string}
        </Typography>
    ) : (
        <Box ref={ref} sx={contentSx} onClick={(e) => onContentClick?.(e, value)}>
            {rawContent}
        </Box>
    );

    const needTooltip =
        tooltip === 'always' || (tooltip === 'auto' && overflow && isString);

    const maybeTooltip = needTooltip ? (
        <Tooltip title={rawContent as string} {...tooltipProps}>
            {contentNode}
        </Tooltip>
    ) : (
        contentNode
    );

    const body =
        loading === true ? (
            <Skeleton width="100%" />
        ) : loading ? (
            loading
        ) : (
            maybeTooltip
        );

    return (
        <TableCell
            onClick={(e) => onCellClick?.(e, value)}
            sx={{
                ...table_array,
                ...baseCellStyles,
                ...sx,
            }}
            className={sticky ? 'sticky-cell' : undefined}
        >
            {body}
        </TableCell>
    );
};

export default SmartCell;
