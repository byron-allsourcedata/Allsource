import os
import csv
from typing import Iterable
from datetime import datetime
from .schemas import LiverampRow
from . import config, utils

HEADER_ORDER = [
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


def build_rows_from_dataframe(df) -> Iterable[dict]:
    """
    Преобразует pandas.DataFrame в dict'ы, совместимые с LiverampRow.
    df должен содержать колонки (или эквиваленты):
      asid, first_name, last_name, business_email, personal_email, phone,
      personal_city, personal_state, gender, age_range/is_age, is_married, has_children, perc_score (-> spend)
    """
    for _, r in df.iterrows():
        asid = r.get("asid") or r.get("ASID") or r.get("Asid")
        if not asid:
            # можно пропустить или сгенерить — в LiveRamp ASID обязателен, пропускаем
            continue
        row = {
            "ASID": utils.asid_from_any(asid),
            "FirstName": r.get("first_name") or r.get("FirstName"),
            "LastName": r.get("last_name") or r.get("LastName"),
            "BUSINESS_EMAIL": r.get("business_email")
            or r.get("business_emails"),
            "PERSONAL_EMAIL": r.get("personal_email")
            or r.get("personal_emails"),
            "PhoneMobile1": r.get("phone") or r.get("PhoneMobile1"),
            "HomeCity": r.get("personal_city") or r.get("HomeCity"),
            "HomeState": r.get("personal_state") or r.get("HomeState"),
            "Gender": r.get("gender"),
            "Age": utils.age_from_range(r.get("age_range") or r.get("Age")),
            "MaritalStatus": "M"
            if (r.get("is_married") in (1, "1", True, "t", "true"))
            else (
                "S"
                if r.get("is_married") in (0, "0", False, None)
                else r.get("is_married")
            ),
            "Pets": int(r.get("pets") or 0),
            "ChildrenPresent": int(
                r.get("has_children") or r.get("children") or 0
            ),
            "Spend": r.get("perc_score") or r.get("segment") or r.get("Spend"),
        }
        # Validate via pydantic
        try:
            validated = LiverampRow(**row)
            yield validated.dict()
        except Exception:
            # skip invalid rows
            continue


def write_tsv(output_path: str, rows: Iterable[dict]):
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f, fieldnames=HEADER_ORDER, delimiter="\t", extrasaction="ignore"
        )
        writer.writeheader()
        for row in rows:
            writer.writerow(row)
