import csv
from io import StringIO


class CSVError(Exception):
    """Base exception for CSV parsing errors."""


class CSVEncodingError(CSVError):
    """Raised when CSV bytes cannot be decoded as UTF-8."""


class CSVColumnError(CSVError):
    """Raised when CSV rows have inconsistent number of columns."""


def parse_csv_bytes(data: bytes) -> list[dict[str, str]]:
    """
    Parse CSV content from bytes into a list of dicts.\n
    Raises CSVEncodingError for invalid UTF-8.\n
    Raises CSVColumnError for inconsistent columns.
    """
    try:
        text = data.decode("utf-8")
    except UnicodeDecodeError as e:
        raise CSVEncodingError("Invalid UTF-8 encoding") from e

    reader = csv.reader(StringIO(text))
    rows: list[dict[str, str]] = []
    header = None

    for row_number, row in enumerate(reader, start=1):
        if not row:
            continue

        if header is None:
            header = [column.lower() for column in row]
        elif len(row) != len(header):
            raise CSVColumnError(
                f"Inconsistent number of columns at row {row_number}"
            )

        rows.append(dict(zip(header, row)))

    return rows
