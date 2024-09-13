from datetime import datetime, timedelta, timezone

def get_utc_aware_date():
    return datetime.now(timezone.utc).replace(microsecond=0)

def get_utc_aware_date_for_postgres():
    return get_utc_aware_date().isoformat()[:-6] + "Z"


def normalize_url(url):
        """
        Normalize the URL by removing all query parameters and trailing slashes.
        """
        if not url:
            return url
        
        scheme_end = url.find('://')
        if scheme_end != -1:
            scheme_end += 3
            scheme = url[:scheme_end]
            remainder = url[scheme_end:]
        else:
            scheme = ''
            remainder = url
        
        path_end = remainder.find('?')
        if path_end != -1:
            path = remainder[:path_end]
        else:
            path = remainder

        path = path.rstrip('/')
        normalized_url = scheme + path
        return normalized_url
