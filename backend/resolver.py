import logging

import inspect

from functools import wraps
from types import GeneratorType
from typing import Callable, Optional, get_args, TypeVar, Type

from fastapi import Depends
from typing_extensions import Annotated


logger = logging.getLogger(__name__)

def get_dependency(annotated_class) -> Depends:
    return Depends(get_args(annotated_class)[1].dependency)


def extract_args(func) -> dict:
    d = {}

    for (k, v) in func.__annotations__.items():
        if k != 'return':
            d[k] = v

    return d


class NotAnnotated(Exception):
    def __init__(self, wrong_annotation):
        self.wrong_annotation = wrong_annotation

    def __str__(self):
        return f'"{self.wrong_annotation}" is not annotated (Provide Annotated[...] dependency provider or @injectable decorator)'


class InjectionError(Exception):
    def __init__(self, dependency, wrong_annotation: Optional[NotAnnotated] = None):
        self.dependency = dependency
        self.wrong_annotation = wrong_annotation

    def __str__(self):
        if self.wrong_annotation is None:
            return f"error while resolving '{self.dependency}'"
        return f"error while resolving '{self.dependency}', '{self.wrong_annotation}' is not annotated (Provide Annotated[...] dependency provider or @injectable decorator)"


T = TypeVar('T')

class Resolver:
    def __init__(self):
        self.deps_cache = {}
        self._cleanup_stack = []

    async def resolve(self, fastapi_dep_annotation: Type[T]) -> T:
        try:
            fastapi_dep = fastapi_dep_annotation.__metadata__[0]
        except Exception as e:
            logger.error(e)
            raise NotAnnotated(fastapi_dep_annotation)
        dependency_func = fastapi_dep.dependency

        if dependency_func in self.deps_cache:
            return self.deps_cache[dependency_func]

        args = extract_args(dependency_func)
        kwargs = {}
        try:
            for name, ann in args.items():
                kwargs[name] = await self.resolve(ann)
        except NotAnnotated as e:
            raise InjectionError(fastapi_dep, e.wrong_annotation)
        except Exception as e:
            raise InjectionError(fastapi_dep)

        result = dependency_func(**kwargs)
        if inspect.isawaitable(result):
            result = await result

        if isinstance(result, GeneratorType):
            self._cleanup_stack.append((result, False))
            value = next(result)
            self.deps_cache[dependency_func] = value
            return value

        if inspect.isasyncgen(result):
            self._cleanup_stack.append((result, True))
            value = await result.__anext__()
            self.deps_cache[dependency_func] = value
            return value

        self.deps_cache[dependency_func] = result
        return result

    async def cleanup(self) -> None:
        for gen, is_async in reversed(self._cleanup_stack):
            if is_async:
                try:
                    async for _ in gen:
                        pass
                except StopAsyncIteration:
                    pass
            else:
                try:
                    for _ in gen:
                        pass
                except StopIteration:
                    pass

        self._cleanup_stack.clear()

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
