import csv
import io
import os
from datetime import datetime
from typing import List, Dict, Any
import logging
from pathlib import Path
import re

logger = logging.getLogger(__name__)


class LiveRampFileService:
    def __init__(self, base_directory: str = None):
        self.base_directory = base_directory or self._get_default_directory()
        self._ensure_directory_exists()

    def _get_default_directory(self) -> str:
        project_root = Path(__file__).parent.parent.parent
        data_dir = project_root / "data" / "liveramp_files"
        return str(data_dir)

    def _ensure_directory_exists(self):
        os.makedirs(self.base_directory, exist_ok=True)
        logger.info(f"Liveramp files directory: {self.base_directory}")

    def generate_filename(
        self, segment: str = "Allsource", category: str = "Skincare_Buyers"
    ) -> str:
        safe_segment = self._sanitize_filename(segment)
        safe_category = self._sanitize_filename(category)

        current_date = datetime.now().strftime("%Y%m%d")

        filename = f"{safe_segment}_{safe_category}_{current_date}.csv"

        logger.info(f"Generated filename: {filename}")
        return filename

    def _sanitize_filename(self, name: str) -> str:
        sanitized = re.sub(r"[!@#$%\[\]:{}?*\\\s]", "_", name)
        sanitized = re.sub(r"^[._]+", "", sanitized)
        sanitized = sanitized.encode("ascii", "ignore").decode("ascii")
        if len(sanitized) > 100:
            sanitized = sanitized[:100]

        return sanitized

    def remove_duplicate_records(
        self, data: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        if not data:
            return []

        seen_asids = set()
        unique_records = []
        duplicates_count = 0

        for record in data:
            asid = record.get("ASID")
            if not asid:
                continue

            if asid not in seen_asids:
                seen_asids.add(asid)
                unique_records.append(record)
            else:
                duplicates_count += 1
                existing_record = next(
                    (r for r in unique_records if r.get("ASID") == asid), None
                )
                if existing_record:
                    existing_data_count = self._count_filled_fields(
                        existing_record
                    )
                    current_data_count = self._count_filled_fields(record)

                    if current_data_count > existing_data_count:
                        unique_records = [
                            r for r in unique_records if r.get("ASID") != asid
                        ]
                        unique_records.append(record)
                        logger.debug(
                            f"Replaced duplicate ASID {asid} with more complete data"
                        )

        if duplicates_count > 0:
            logger.warning(
                f"Removed {duplicates_count} duplicate records by ASID. Final unique records: {len(unique_records)}"
            )

        return unique_records

    def _count_filled_fields(self, record: Dict[str, Any]) -> int:
        count = 0
        for key, value in record.items():
            if value and str(value).strip():
                count += 1
        return count

    def validate_record(self, record: Dict[str, Any]) -> bool:
        if not record.get("ASID"):
            return False

        try:
            for key, value in record.items():
                if value is not None:
                    str(value)
            return True
        except Exception:
            return False

    def format_data_to_csv(self, data: List[Dict[str, Any]]) -> str:
        if not data:
            logger.warning("No data to format to CSV")
            return ""

        logger.info(f"Original data count: {len(data)}")
        unique_data = self.remove_duplicate_records(data)
        logger.info(f"After removing duplicates: {len(unique_data)}")

        fieldnames = [
            "ASID",
            "FirstName",
            "LastName",
            "BUSINESS_EMAIL",
            "PERSONAL_EMAIL",
            "PhoneMobile1",
            "HomeCity",
            "HomeState",
            "Gender",
            "Age",
            "MaritalStatus",
            "Pets",
            "ChildrenPresent",
            "Spend",
        ]

        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=fieldnames, delimiter=",")
        writer.writeheader()

        valid_records = 0
        invalid_records = 0

        for record in unique_data:
            try:
                if not self.validate_record(record):
                    invalid_records += 1
                    continue

                row = {}
                for field in fieldnames:
                    value = record.get(field, "")
                    if value is None:
                        row[field] = ""
                    else:
                        row[field] = str(value).strip()

                writer.writerow(row)
                valid_records += 1

            except Exception as e:
                logger.warning(
                    f"Error formatting record {record.get('ASID')}: {e}"
                )
                invalid_records += 1
                continue

        csv_content = output.getvalue()

        logger.info(
            f"Formatted CSV: {valid_records} valid rows, {invalid_records} invalid rows"
        )
        logger.info(f"Final CSV size: {len(csv_content)} characters")

        return csv_content

    def save_csv_to_file(self, csv_content: str, filename: str = None) -> str:
        if not csv_content:
            logger.warning("No CSV content to save")
            return ""

        if not filename:
            filename = self.generate_filename()

        filepath = os.path.join(self.base_directory, filename)

        try:
            with open(filepath, "w", newline="", encoding="utf-8") as f:
                f.write(csv_content)

            file_size = os.path.getsize(filepath)
            logger.info(f"CSV report saved to {filepath} ({file_size} bytes)")

            self._validate_csv_file(filepath)

            return filepath

        except Exception as e:
            logger.error(f"Error saving CSV file: {e}")
            raise

    def _validate_csv_file(self, filepath: str):
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()

            lines = content.split("\n")
            header = lines[0] if lines else ""
            data_lines = lines[1:] if len(lines) > 1 else []

            expected_header = "ASID,FirstName,LastName,BUSINESS_EMAIL,PERSONAL_EMAIL,PhoneMobile1,HomeCity,HomeState,Gender,Age,MaritalStatus,Pets,ChildrenPresent,Spend"
            if header != expected_header:
                logger.warning(
                    f"CSV header mismatch. Expected: {expected_header}, Got: {header}"
                )

            asids_in_file = set()
            duplicate_asids = set()

            for i, line in enumerate(data_lines, 2):
                if line.strip():
                    parts = line.split(",")
                    if parts and len(parts) > 0:
                        asid = parts[0]
                        if asid in asids_in_file:
                            duplicate_asids.add(asid)
                            logger.warning(
                                f"Duplicate ASID in CSV line {i}: {asid}"
                            )
                        asids_in_file.add(asid)

            if duplicate_asids:
                logger.error(
                    f"Found {len(duplicate_asids)} duplicate ASIDs in final CSV file"
                )
            else:
                logger.info(
                    "CSV file validation passed - no duplicate ASIDs found"
                )

        except Exception as e:
            logger.error(f"Error validating CSV file: {e}")

    def get_file_path(self, filename: str = None) -> str:
        if not filename:
            filename = self.generate_filename()
        return os.path.join(self.base_directory, filename)

    def list_available_files(self) -> List[str]:
        try:
            files = os.listdir(self.base_directory)
            csv_files = [f for f in files if f.endswith(".csv")]
            return sorted(csv_files)
        except Exception as e:
            logger.error(f"Error listing files: {e}")
            return []
