import asyncio
import io
import aioboto3
import pandas as pd

from domains.liveramp.persistence.clickhouse import ClickHousePersistence
from resolver import injectable
from config.util import getenv
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


def _convert_age_range_to_age(age_range: str) -> str:
    if not age_range:
        return ""

    age_range = str(age_range).strip()

    age_mapping = {
        "18-24": "21",
        "25-34": "30",
        "35-44": "40",
        "45-54": "50",
        "55-64": "60",
        "65 and older": "70",
    }

    return age_mapping.get(age_range, age_range)


def _extract_first_email(emails_data) -> str:
    """Извлекает первый email из данных, обрабатывая numpy arrays"""
    try:
        # Если это None или пустой массив
        if emails_data is None:
            return ""

        # Если это numpy array
        if hasattr(emails_data, "dtype") and hasattr(emails_data, "size"):
            if emails_data.size == 0:
                return ""
            # Берем первый элемент массива
            first_email = (
                emails_data.flat[0]
                if hasattr(emails_data, "flat")
                else emails_data[0]
            )
            return str(first_email) if first_email is not None else ""

        # Если это обычный список
        if isinstance(emails_data, list) and emails_data:
            first_item = emails_data[0]
            return str(first_item) if first_item is not None else ""

        # Если это строка
        if isinstance(emails_data, str) and emails_data.strip():
            # Пытаемся распарсить если выглядит как список
            if emails_data.startswith("[") and emails_data.endswith("]"):
                try:
                    parsed_list = eval(emails_data)
                    if isinstance(parsed_list, list) and parsed_list:
                        return _extract_first_email(parsed_list[0])
                except:
                    pass
            return emails_data.strip()

        # Для других типов просто конвертируем в строку
        return str(emails_data) if emails_data is not None else ""

    except Exception as e:
        logger.warning(f"Error extracting email from {type(emails_data)}: {e}")
        return ""


def _convert_has_children(has_children) -> int:
    """Преобразует наличие детей в 1/0, обрабатывая numpy arrays"""
    try:
        if has_children is None:
            return 0

        # Если это numpy array, берем первое значение
        if hasattr(has_children, "dtype") and hasattr(has_children, "size"):
            if has_children.size == 0:
                return 0
            first_value = (
                has_children.flat[0]
                if hasattr(has_children, "flat")
                else has_children[0]
            )
            has_children = first_value

        has_children_str = (
            str(has_children).strip().upper()
            if has_children is not None
            else ""
        )
        return 1 if has_children_str == "Y" else 0

    except Exception as e:
        logger.warning(f"Error converting has_children {has_children}: {e}")
        return 0


def _convert_marital_status(is_married) -> str:
    """Преобразует семейное положение, обрабатывая numpy arrays"""
    try:
        if is_married is None:
            return "U"

        # Если это numpy array, берем первое значение
        if hasattr(is_married, "dtype") and hasattr(is_married, "size"):
            if is_married.size == 0:
                return "U"
            first_value = (
                is_married.flat[0]
                if hasattr(is_married, "flat")
                else is_married[0]
            )
            is_married = first_value

        is_married_str = (
            str(is_married).strip().upper() if is_married is not None else ""
        )

        if is_married_str == "Y":
            return "M"
        elif is_married_str == "N":
            return "S"
        else:
            return "U"

    except Exception as e:
        logger.warning(f"Error converting marital status {is_married}: {e}")
        return "U"


def _convert_gender(gender: str) -> str:
    if not gender:
        return ""

    gender = str(gender).strip().upper()

    if gender in ["M", "MALE"]:
        return "Male"
    elif gender in ["F", "FEMALE"]:
        return "Female"
    else:
        return gender


@injectable
class DelivrPersistence:
    def __init__(self, clickhouse_persistence: ClickHousePersistence):
        self.bucket = getenv("DELIVR_BUCKET_NAME")
        self.aws_access_key = getenv("DELIVR_AWS_ACCESS_KEY_ID")
        self.aws_secret_key = getenv("DELIVR_AWS_SECRET_ACCESS_KEY")
        self.region = getenv("DELIVR_AWS_REGION")
        self.clickhouse_persistence = clickhouse_persistence

    async def fetch_weekly_unified_data(
        self, days: int = 7
    ) -> List[Dict[str, Any]]:
        try:
            raw_df = await self.fetch_weekly_parquet(days=days)
            if raw_df.empty:
                logger.info("No Delivr data found")
                return []

            all_emails = self._extract_all_emails_from_data(raw_df)
            logger.info(
                f"Extracted {len(all_emails)} unique emails from Delivr data"
            )

            batch_size = 5000
            email_batches = [
                all_emails[i : i + batch_size]
                for i in range(0, len(all_emails), batch_size)
            ]
            logger.info(
                f"Split {len(all_emails)} emails into {len(email_batches)} batches"
            )

            clickhouse_data_map = {}
            total_matched = 0

            for i, email_batch in enumerate(email_batches, 1):
                logger.info(
                    f"Processing email batch {i}/{len(email_batches)} with {len(email_batch)} emails"
                )

                try:
                    clickhouse_data = (
                        self.clickhouse_persistence.match_leads_with_users(
                            email_batch
                        )
                    )
                    batch_matched = 0

                    for record in clickhouse_data:
                        business_email = record.get(
                            "BUSINESS_EMAIL", ""
                        ).lower()
                        personal_email = record.get(
                            "PERSONAL_EMAIL", ""
                        ).lower()

                        if business_email:
                            clickhouse_data_map[business_email] = record
                            batch_matched += 1
                        if personal_email:
                            clickhouse_data_map[personal_email] = record
                            batch_matched += 1

                    total_matched += batch_matched
                    logger.info(
                        f"Batch {i}: matched {batch_matched} emails, total so far: {total_matched}"
                    )

                except Exception as e:
                    logger.error(f"Error processing email batch {i}: {e}")
                    continue

            logger.info(
                f"Total matched {total_matched} emails with ClickHouse data"
            )

            unified_data = []
            error_count = 0
            matched_count = 0
            unmatched_count = 0

            logger.info(
                f"Transforming {len(raw_df)} Delivr records to unified format"
            )

            # Обрабатываем записи Delivr также батчами для избежания memory issues
            transform_batch_size = 2000
            for i in range(0, len(raw_df), transform_batch_size):
                batch_df = raw_df.iloc[i : i + transform_batch_size]
                logger.info(
                    f"Transforming batch {i // transform_batch_size + 1}/{(len(raw_df) - 1) // transform_batch_size + 1} with {len(batch_df)} records"
                )

                for index, row in batch_df.iterrows():
                    unified_record = self._transform_to_unified_format(
                        row, clickhouse_data_map
                    )
                    if unified_record:
                        unified_data.append(unified_record)
                        if unified_record.get(
                            "ASID"
                        ):  # Если есть ASID - значит сматчилось
                            matched_count += 1
                        else:
                            unmatched_count += 1
                    else:
                        error_count += 1
                        if error_count <= 5:  # Логируем только первые 5 ошибок
                            logger.warning(
                                f"Transformation failure at row {index}"
                            )

            success_rate = (len(unified_data) / len(raw_df)) * 100
            match_rate = (
                (matched_count / len(unified_data)) * 100 if unified_data else 0
            )

            logger.info(
                f"Delivr transformation: {len(unified_data)}/{len(raw_df)} records ({success_rate:.1f}% success)"
            )
            logger.info(
                f"Email matching: {matched_count} matched, {unmatched_count} unmatched ({match_rate:.1f}% match rate)"
            )

            if error_count > 0:
                logger.warning(f"Failed to transform {error_count} records")

            matched_data = [
                record for record in unified_data if record.get("ASID")
            ]
            logger.info(
                f"Returning {len(matched_data)} matched records after filtering"
            )

            return matched_data

        except Exception as e:
            logger.error(f"Error fetching unified Delivr data: {e}")
            return []

    def _extract_all_emails_from_data(self, df: pd.DataFrame) -> List[str]:
        """Извлекаем все уникальные email из Delivr данных"""
        emails = set()

        for _, row in df.iterrows():
            personal_email = _extract_first_email(
                row.get("personal_emails", [])
            )
            business_email = _extract_first_email(
                row.get("business_emails", [])
            )

            if personal_email and "@" in personal_email:
                emails.add(personal_email.lower())
            if business_email and "@" in business_email:
                emails.add(business_email.lower())

        return list(emails)

    def _transform_to_unified_format(
        self, delivr_row, clickhouse_data_map: Dict[str, Dict] = None
    ) -> Optional[Dict[str, Any]]:
        """Преобразует запись Delivr в единый формат с обогащением из ClickHouse"""
        try:
            personal_emails = delivr_row.get("personal_emails", [])
            personal_email = _extract_first_email(personal_emails)

            business_emails = delivr_row.get("business_emails", [])
            business_email = _extract_first_email(business_emails)

            # Ищем соответствующие данные в ClickHouse по email
            clickhouse_record = None
            if clickhouse_data_map:
                if (
                    business_email
                    and business_email.lower() in clickhouse_data_map
                ):
                    clickhouse_record = clickhouse_data_map[
                        business_email.lower()
                    ]
                elif (
                    personal_email
                    and personal_email.lower() in clickhouse_data_map
                ):
                    clickhouse_record = clickhouse_data_map[
                        personal_email.lower()
                    ]

            age_range = delivr_row.get("age_range", "")
            age = _convert_age_range_to_age(age_range)

            is_married = delivr_row.get("is_married", "")
            marital_status = _convert_marital_status(is_married)

            has_children = delivr_row.get("has_children", "")
            children_present = _convert_has_children(has_children)

            perc_score_raw = delivr_row.get("perc_score")
            perc_score = self._safe_get_perc_score(perc_score_raw)
            spend = "Low" if perc_score > 75 else "Medium"

            asid_value = (
                clickhouse_record.get("ASID", "") if clickhouse_record else ""
            )

            first_name_delivr = delivr_row.get("first_name", "")
            first_name_ch = (
                clickhouse_record.get("FirstName", "")
                if clickhouse_record
                else ""
            )
            first_name_value = first_name_delivr or first_name_ch

            last_name_delivr = delivr_row.get("last_name", "")
            last_name_ch = (
                clickhouse_record.get("LastName", "")
                if clickhouse_record
                else ""
            )
            last_name_value = last_name_delivr or last_name_ch

            phone_value = (
                clickhouse_record.get("PhoneMobile1", "")
                if clickhouse_record
                else ""
            )

            home_city_delivr = delivr_row.get("personal_city", "")
            home_city_ch = (
                clickhouse_record.get("HomeCity", "")
                if clickhouse_record
                else ""
            )
            home_city_value = home_city_delivr or home_city_ch

            home_state_delivr = delivr_row.get("personal_state", "")
            home_state_ch = (
                clickhouse_record.get("HomeState", "")
                if clickhouse_record
                else ""
            )
            home_state_value = home_state_delivr or home_state_ch

            gender_delivr = _convert_gender(delivr_row.get("gender", ""))
            gender_ch = (
                clickhouse_record.get("Gender", "") if clickhouse_record else ""
            )
            gender_value = gender_delivr or gender_ch

            age_ch = (
                clickhouse_record.get("Age", "") if clickhouse_record else ""
            )
            age_value = age or age_ch

            marital_status_ch = (
                clickhouse_record.get("MaritalStatus", "")
                if clickhouse_record
                else ""
            )
            marital_status_value = marital_status or marital_status_ch

            pets_value = (
                clickhouse_record.get("Pets", 0) if clickhouse_record else 0
            )

            children_present_ch = (
                clickhouse_record.get("ChildrenPresent", "")
                if clickhouse_record
                else ""
            )
            children_present_value = children_present or children_present_ch

            unified_record = {
                "ASID": asid_value,
                "FirstName": first_name_value,
                "LastName": last_name_value,
                "BUSINESS_EMAIL": business_email,
                "PERSONAL_EMAIL": personal_email,
                "PhoneMobile1": phone_value,
                "HomeCity": home_city_value,
                "HomeState": home_state_value,
                "Gender": gender_value,
                "Age": age_value,
                "MaritalStatus": marital_status_value,
                "Pets": pets_value,
                "ChildrenPresent": children_present_value,
                "Spend": spend,
            }

            return unified_record

        except Exception as e:
            logger.error(f"Error transforming Delivr record: {e}")
            return None

    def _safe_get_perc_score(self, perc_score_value) -> int:
        try:
            if perc_score_value is None:
                return 0

            if isinstance(perc_score_value, (int, float)):
                return int(perc_score_value)

            if isinstance(perc_score_value, str):
                return int(float(perc_score_value))

            if hasattr(perc_score_value, "__iter__") and not isinstance(
                perc_score_value, str
            ):
                if len(perc_score_value) > 0:
                    first_val = list(perc_score_value)[0]
                    return self._safe_get_perc_score(first_val)
                else:
                    return 0

            return int(float(perc_score_value))

        except (ValueError, TypeError) as e:
            logger.warning(
                f"Could not convert perc_score value '{perc_score_value}' to int, using 0. Error: {e}"
            )
            return 0

    async def fetch_weekly_parquet(
        self, end_date: datetime | None = None, days: int = 7
    ) -> pd.DataFrame:
        end_date = end_date or datetime.now(timezone.utc)
        result = []

        logger.info(
            f"Starting Delivr S3 data fetch for {days} days, end date: {end_date.strftime('%Y-%m-%d')}"
        )

        session = aioboto3.Session()
        async with session.client(
            "s3",
            aws_access_key_id=self.aws_access_key,
            aws_secret_access_key=self.aws_secret_key,
            region_name=self.region,
        ) as s3:
            tasks = []
            days_processed = 0
            days_with_data = 0

            for i in range(days):
                day = (end_date - timedelta(days=i)).strftime("%Y%m%d")
                prefix = f"day={day}/"
                logger.info(f"Processing day: {day}, prefix: {prefix}")
                tasks.append(self._fetch_day_parquets(s3, prefix, day))

            all_results = await asyncio.gather(*tasks, return_exceptions=True)

            for i, day_result in enumerate(all_results):
                day = (end_date - timedelta(days=i)).strftime("%Y%m%d")
                days_processed += 1

                if isinstance(day_result, Exception):
                    logger.error(f"Error processing day {day}: {day_result}")
                    continue

                day_dfs = day_result
                if day_dfs:
                    days_with_data += 1
                    result.extend(day_dfs)
                    logger.info(
                        f"Day {day}: processed {len(day_dfs)} files, total records: {sum(len(df) for df in day_dfs)}"
                    )
                else:
                    logger.info(f"Day {day}: no files found or empty files")

        if result:
            final_df = pd.concat(result, ignore_index=True)
            total_records = len(final_df)
            logger.info(
                f"Delivr S3 fetch completed: {days_with_data}/{days_processed} days had data, total records: {total_records}"
            )
            return final_df
        else:
            logger.warning(
                f"Delivr S3 fetch completed: no data found for {days_processed} days"
            )
            return pd.DataFrame()

    async def _fetch_day_parquets(self, s3, prefix: str, day: str):
        """Получаем parquet файлы за конкретный день"""
        dfs = []
        try:
            response = await s3.list_objects_v2(
                Bucket=self.bucket, Prefix=prefix
            )
            files = response.get("Contents", [])

            if not files:
                return dfs

            for obj in files:
                key = obj["Key"]
                try:
                    file_obj = await s3.get_object(Bucket=self.bucket, Key=key)
                    body = await file_obj["Body"].read()
                    df = pd.read_parquet(io.BytesIO(body))
                    dfs.append(df)
                except Exception as e:
                    logger.warning(f"Error reading file {key}: {e}")
                    continue

            if dfs:
                day_total_records = sum(len(df) for df in dfs)
                logger.debug(
                    f"Day {day}: {len(dfs)} files, {day_total_records} records"
                )

        except Exception as e:
            logger.error(f"Error processing day {day}: {e}")

        return dfs
