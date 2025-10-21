import csv
from io import StringIO
from charset_normalizer import from_bytes


class CSVError(Exception):
    """Base exception for CSV parsing errors."""


class CSVEncodingError(CSVError):
    """Raised when CSV bytes cannot be decoded as UTF-8."""


class CSVColumnError(CSVError):
    """Raised when CSV rows have inconsistent number of columns."""


def parse_csv_bytes(data: bytes) -> list[dict[str, str]]:
    """
    Parse CSV content from bytes into a list of dicts.
    Automatically detects encoding.
    Raises CSVEncodingError for invalid encoding.
    Raises CSVColumnError for inconsistent columns.
    """

    best = from_bytes(data).best()
    encoding = best.encoding or "utf-8"

    try:
        text = data.decode(encoding)
    except UnicodeDecodeError:
        raise CSVEncodingError(f"Invalid encoding ({encoding})")

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
