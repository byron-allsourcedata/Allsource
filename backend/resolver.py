import inspect
from functools import wraps
from typing import Callable

from fastapi import Depends
from typing_extensions import Annotated


def dep_constructor(cls) -> Callable:
    """
    Return fast api dependency constructor, that matches provided class's constructor
    """

    init_sig = inspect.signature(cls.__init__)

    params = list(init_sig.parameters.values())[1:]  # skip 'self'
    factory_sig = init_sig.replace(parameters=params, return_annotation=cls)

    @wraps(cls)
    def constructor(*args, **kwargs):
        return cls(*args, **kwargs)

    constructor.__signature__ = factory_sig

    constructor.__annotations__ = cls.__init__.__annotations__
    constructor.__annotations__['return'] = cls
    return constructor


def injectable(cls):
    return Annotated[cls, Depends(dep_constructor(cls))]
