from datetime import datetime
from typing import Optional, List

from sqlalchemy import or_
from sqlalchemy.orm import Query

from enums import TypeOfSourceOrigin, TypeOfCustomer
from models.audience_sources import AudienceSource
from models.users import Users


def apply_filters(
        query: Query,
        name: Optional[str] = None,
        source: Optional[List[str]] = None,
        type_customer: Optional[List[str]] = None,
        domain_id: Optional[int] = None,
        created_date_start: Optional[datetime] = None,
        created_date_end: Optional[datetime] = None
) -> Query:
    filters = []

    if name:
        filters.append(AudienceSource.name.ilike(f"%{name}%"))

    if name:
        filters.append(
            or_(
                AudienceSource.name.ilike(f"%{name}%"),
                Users.full_name.ilike(f"%{name}%")
            )
        )

    if source:
        filters.append(AudienceSource.source_origin.in_(source))

    if type_customer:
        if len(type_customer) == 1:
            single_type = type_customer[0]
            filters.append(
                (AudienceSource.source_type == single_type) |
                (AudienceSource.source_type.contains(single_type))
            )
        else:
            for t in type_customer:
                print()
                filters.append(AudienceSource.source_type.contains(t))

    if domain_id is not None:
        filters.append(AudienceSource.domain_id == domain_id)

    if created_date_start and created_date_end:
        filters.append(AudienceSource.created_at.between(created_date_start, created_date_end))
    elif created_date_start:
        filters.append(AudienceSource.created_at >= created_date_start)
    elif created_date_end:
        filters.append(AudienceSource.created_at <= created_date_end)

    if filters:
        query = query.filter(*filters)

    return query
