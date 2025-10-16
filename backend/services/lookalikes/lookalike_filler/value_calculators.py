from __future__ import annotations
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from catboost import CatBoostRegressor
import pickle
import time


class ValueCalculator(ABC):
    """
    Abstraction: unified interface for get scores.
    - predict_batch return tuple (times_seconds, list_of_scores) for users list
    - is_ml flag for logging or serialize
    """

    @abstractmethod
    def is_ml(self) -> bool: ...

    @abstractmethod
    def predict_batch(
        self, asids: List, batch_buffer: List[Dict[str, Any]]
    ) -> tuple[float, List[float]]:
        """
        Calculates scores for batch_buffer (corresponds to asids in order).
        Return (elapsed_seconds, scores_list)
        """
        ...

    @abstractmethod
    def serialize(self) -> bytes: ...

    @staticmethod
    @abstractmethod
    def deserialize(data: bytes) -> "ValueCalculator": ...


class MLValueCalculator(ValueCalculator):
    def __init__(self, model: CatBoostRegressor):
        self.model = model

    def is_ml(self) -> bool:
        return True

    def predict_batch(self, asids, batch_buffer): ...

    def serialize(self) -> bytes:
        return pickle.dumps(self.model)

    @staticmethod
    def deserialize(data: bytes) -> "MLValueCalculator":
        model = pickle.loads(data)
        return MLValueCalculator(model=model)


class SimpleStatsValueCalculator(ValueCalculator):
    def __init__(
        self,
        distribution: Dict[str, Dict[str, Dict[str, float]]],
        feature_weights: Optional[Dict[str, float]] = None,
        significant_fields: Optional[Dict[str, Any]] = None,
    ):
        """
        distribution: format: { "b2c": { "personal_info": { "gender": {"male": 33.2, ...}, ... }, ... }, "b2b": {...} }
        feature_weights: mapping from feature_name (column name) -> weight (float). If None -> same weight.
        significant_fields: native structure as in the table
        """
        self.distribution = distribution or {}
        self.weights = feature_weights or {}
        self.significant_fields = significant_fields or {}

        self._dist_cache: Dict[str, Dict[str, float]] = {}
        for top in self.distribution.values():
            for cat_name, cat_map in top.items():
                if isinstance(cat_map, dict):
                    for feat_name, feat_dist in cat_map.items():
                        if isinstance(feat_dist, dict):
                            self._dist_cache[feat_name.lower()] = feat_dist

    def is_ml(self) -> bool:
        return False

    def _score_single_feature(self, feature_col: str, user_value) -> float:
        """
        Rules (simple method):
        - If there is a distribution for the column and it is a categorical variable in the form {val: percent}
          then score_feature = (pct_for_user_value / 100)
          (i.e., a user receives more if their category appears frequently in the source)
          - if the value is missing or there is no distribution -> 0.0
        """
        if user_value is None:
            return 0.0

        dist = self._dist_cache.get(feature_col.lower())
        if not dist:
            return 0.0

        key = str(user_value)

        if key in dist:
            return float(dist[key]) / 100.0

        try:
            num = float(user_value)
            for bucket_key, pct in dist.items():
                if "-" in bucket_key:
                    parts = bucket_key.split("-")
                    if len(parts) == 2:
                        try:
                            lo, hi = float(parts[0]), float(parts[1])
                            if lo <= num <= hi:
                                return float(pct) / 100.0
                        except Exception:
                            continue
        except Exception:
            pass

        # Фаззи по lower()
        for k, pct in dist.items():
            if k.lower() == key.lower():
                return float(pct) / 100.0

        return 0.0

    def calculate(self, batch: list[dict[str, Any]]) -> list[float]:
        """
        Unified interface for calculating scoring batches.
        Compatible with SimilarAudiencesScoresService.calculate_batch_scores_v3.
        """
        _, scores = self.predict_batch(
            asids=[row.get("asid") for row in batch],
            batch_buffer=batch,
        )
        return scores

    def predict_batch(self, asids: List, batch_buffer: List[Dict[str, Any]]):
        start = time.perf_counter()
        scores = []

        if self.weights:
            weights = self.weights
        else:
            first = batch_buffer[0] if batch_buffer else {}
            feature_cols = [
                k for k in first.keys() if k not in ("asid", "customer_value")
            ]
            w = 1.0 / max(1, len(feature_cols))
            weights = {f: w for f in feature_cols}

        _score_feature = self._score_single_feature
        _weights_items = list(weights.items())

        for row in batch_buffer:
            s = 0.0
            for feature_col, w in _weights_items:
                val = row.get(feature_col)
                s += w * _score_feature(feature_col, val)
            scores.append(s)

        elapsed = time.perf_counter() - start
        return elapsed, scores

    def serialize(self) -> bytes:
        import json

        return json.dumps(
            {"distribution": self.distribution, "weights": self.weights}
        ).encode("utf-8")

    @staticmethod
    def deserialize(data: bytes) -> "SimpleStatsValueCalculator":
        import json

        obj = json.loads(data.decode("utf-8"))
        return SimpleStatsValueCalculator(
            distribution=obj.get("distribution", {}),
            feature_weights=obj.get("weights"),
        )
