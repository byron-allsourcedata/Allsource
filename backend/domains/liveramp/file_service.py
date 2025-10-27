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

    def format_data_to_csv(self, data: List[Dict[str, Any]]) -> str:
        if not data:
            logger.warning("No data to format to CSV")
            return ""

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
        writer = csv.DictWriter(output, fieldnames=fieldnames, delimiter="\t")
        writer.writeheader()

        valid_records = 0
        for record in data:
            try:
                if not record.get("ASID"):
                    continue

                row = {field: record.get(field, "") for field in fieldnames}
                writer.writerow(row)
                valid_records += 1
            except Exception as e:
                logger.warning(f"Error formatting record: {e}")
                continue

        csv_content = output.getvalue()
        logger.info(f"Formatted CSV with {valid_records} valid rows")
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
            return filepath

        except Exception as e:
            logger.error(f"Error saving CSV file: {e}")
            raise

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
