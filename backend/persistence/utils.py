from datetime import datetime
from typing import Optional, List

from sqlalchemy import or_
from sqlalchemy.orm import Query

from enums import TypeOfSourceOrigin, TypeOfCustomer
from models.audience_sources import AudienceSource
from models.users import Users
from models.users_domains import UserDomains


def apply_filters(
        query: Query,
        name: Optional[str] = None,
        source_origin_list: Optional[List[str]] = None,
        source_type_list: Optional[List[str]] = None,
        domain_name_list: Optional[List[str]] = None,
        created_date_start: Optional[datetime] = None,
        created_date_end: Optional[datetime] = None
) -> Query:
    filters = []

    if name:
        filters.append(
            or_(
                AudienceSource.name.ilike(f"{name}"),
                Users.full_name.ilike(f"{name}")
            )
        )

    if source_origin_list:
        filters.append(AudienceSource.source_origin.in_(source_origin_list))

    if source_type_list:
        if len(source_type_list) == 1:
            single_source_type = source_type_list[0]
            filters.append(
                (AudienceSource.source_type == single_source_type) |
                (AudienceSource.source_type.contains(single_source_type))
            )
        else:
            # This line creates a list of conditions using a list comprehension:
            # for each element 't' in 'source_type_list', it generates a condition
            # that checks if 'AudienceSource.source_type' contains 't'.
            # The asterisk (*) unpacks the list of conditions into separate arguments
            # for the 'or_' function, which then combines them with the logical OR operator.
            # This means that 'or_conditions' will be true if any one of the conditions is true.
            or_conditions = or_(*[AudienceSource.source_type.contains(t) for t in source_type_list])
            filters.append(or_conditions)

    if domain_name_list:
        if len(domain_name_list) == 1:
            filters.append(UserDomains.domain == domain_name_list[0])
        else:
            or_conditions = or_(*[UserDomains.domain.contains(d) for d in domain_name_list])
            filters.append(or_conditions)

    if created_date_start and created_date_end:
        filters.append(AudienceSource.created_at.between(created_date_start, created_date_end))
    elif created_date_start:
        filters.append(AudienceSource.created_at >= created_date_start)
    elif created_date_end:
        filters.append(AudienceSource.created_at <= created_date_end)

    if filters:
        query = query.filter(*filters)

    return query
