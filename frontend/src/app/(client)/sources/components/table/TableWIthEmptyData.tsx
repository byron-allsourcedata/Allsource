import { TableCell, TableContainer, Typography, Box, Table, TableHead, TableRow, LinearProgress, Paper } from '@mui/material';
import { sourcesStyles } from "../../sourcesStyles";
import { useNotification } from "@/context/NotificationContext";
import Image from "next/image";

interface TableColumns {
    key: string;
    label: string;
    widths: { width: string; minWidth: string; maxWidth: string };
    sortable?: boolean;
}

interface MyTableCellProps {
    columns: TableColumns[]
    loaderForTable: boolean
    selectedFiltersLength: number
    isScrolledX: boolean;
  }


const TableWithEmptyData: React.FC<MyTableCellProps> = ({
    columns,
    loaderForTable,
    selectedFiltersLength,
    isScrolledX
  }) => {
    const { hasNotification } = useNotification();


    return (
    <Box
    sx={{
    ...sourcesStyles.centerContainerStyles,
    border: "1px solid rgba(235, 235, 235, 1)",
    borderRadius: "8px",
    overflow: "hidden",
    }}
    >
    <TableContainer
    component={Paper}
    sx={{
        borderBottom: "none",
        overflowX: "auto",
        maxHeight:
        selectedFiltersLength > 0
            ? hasNotification
            ? "63vh"
            : "68vh"
            : "72vh",
        overflowY: "auto",
        "@media (max-height: 800px)": {
        maxHeight:
            selectedFiltersLength > 0
            ? hasNotification
                ? "53vh"
                : "57vh"
            : "70vh",
        },
        "@media (max-width: 400px)": {
        maxHeight:
            selectedFiltersLength > 0
            ? hasNotification
                ? "53vh"
                : "60vh"
            : "67vh",
        },
    }}
    >
    <Table stickyHeader aria-label="leads table">
        <TableHead sx={{ position: "relative" }}>
        <TableRow>
            {columns.map(
            ({
                key,
                label,
                sortable = false,
                widths,
            }) => (
                <TableCell
                key={key}
                sx={{
                    ...sourcesStyles.table_column,
                    ...(key === "name" && {
                    position: "sticky",
                    left: 0,
                    zIndex: 10,
                    top: 0,
                    boxShadow: isScrolledX
                        ? "3px 0px 3px #00000033"
                        : "none",
                    }),
                }}
                >
                <Box
                    sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    }}
                >
                    <Typography
                    variant="body2"
                    sx={{
                        ...sourcesStyles.table_column,
                        borderRight: "0",
                    }}
                    >
                    {label}
                    </Typography>
                </Box>
                </TableCell>
            )
            )}
        </TableRow>
        {loaderForTable ? (
            <TableRow
            sx={{
                position: "sticky",
                top: "56px",
                zIndex: 11,
            }}
            >
            <TableCell
                colSpan={columns.length}
                sx={{ p: 0, pb: "1px" }}
            >
                <LinearProgress
                variant="indeterminate"
                sx={{
                    width: "100%",
                    height: "2px",
                    position: "absolute",
                }}
                />
            </TableCell>
            </TableRow>
        ) : (
            <TableRow
            sx={{
                position: "sticky",
                top: "56px",
                zIndex: 11,
            }}
            >
            <TableCell
                colSpan={columns.length}
                sx={{
                p: 0,
                pb: "1px",
                backgroundColor:
                    "rgba(235, 235, 235, 1)",
                borderColor: "rgba(235, 235, 235, 1)",
                }}
            />
            </TableRow>
        )}
        </TableHead>
    </Table>
    </TableContainer>

    <Box
    sx={{ p: 3, textAlign: "center", width: "100%" }}
    >
    <Typography
        variant="h5"
        sx={{
        mb: 3,
        fontFamily: "Nunito Sans",
        fontSize: "20px",
        color: "#4a4a4a",
        fontWeight: "600",
        lineHeight: "28px",
        }}
    >
        Data not matched yet
    </Typography>
    <Image
        src="/no-data.svg"
        alt="No Data"
        height={250}
        width={300}
    />
    <Typography
        variant="body1"
        color="textSecondary"
        sx={{
        mt: 3,
        fontFamily: "Nunito Sans",
        fontSize: "14px",
        color: "#808080",
        fontWeight: "600",
        lineHeight: "20px",
        }}
    >
        It seems that the current filters don’t match any
        records. Try adjusting the filters.
    </Typography>
    </Box>
    </Box>
)}


export default TableWithEmptyData;