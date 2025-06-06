from typing import Tuple

from resolver import injectable


@injectable
class UserNamesService:
    def __init__(self):
        pass

    def get_name(self, user: dict) -> Tuple[str, str]:
        full_name = user.get('full_name')
        return self.split_name(full_name)


    def split_name(self, full_name: str):
        names = full_name.split(' ')
        if len(names) == 1:
            names.append('')
        first_name = names[0]
        last_name = names[1]
        return first_name, last_name