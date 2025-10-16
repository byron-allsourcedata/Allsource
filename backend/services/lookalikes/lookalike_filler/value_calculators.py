from __future__ import annotations
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from catboost import CatBoostRegressor
import pickle


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
        dist = None
        for top in self.distribution.values():
            if not isinstance(top, dict):
                print("⚠️ BAD ENTRY in distribution:", top, "type:", type(top))
                continue
            if feature_col in top.get("personal_info", {}):
                dist = top["personal_info"][feature_col]
                break
            # try other categories
            for cat_name, cat_map in top.items():
                if isinstance(cat_map, dict) and feature_col in cat_map:
                    dist = cat_map[feature_col]
                    break
            if dist is not None:
                break

        if dist is None:
            for top in self.distribution.values():
                for cat_map in top.values():
                    if isinstance(cat_map, dict):
                        for k in cat_map.keys():
                            if k.lower() == str(feature_col).lower():
                                dist = cat_map
                                break
                        if dist:
                            break
                if dist:
                    break

        if dist is None:
            return 0.0

        if user_value is None:
            return 0.0

        key = str(user_value)

        if key in dist:
            pct = float(dist[key])
            return pct / 100.0

        # if user_value is numeric (e.g. age 34) but distribution uses buckets ("25-35"), try to find bucket containing it
        try:
            num = float(user_value)
            for bucket_key, pct in dist.items():
                if "-" in bucket_key:
                    parts = bucket_key.split("-")
                    try:
                        lo = float(parts[0])
                        hi = float(parts[1])
                    except Exception:
                        continue
                    if lo <= num <= hi:
                        return float(pct) / 100.0
        except Exception:
            pass

        # else try fuzzy match ignoring case
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

    def predict_batch(self, asids, batch_buffer):
        import time

        start = time.perf_counter()
        scores = []
        if self.weights:
            weights = self.weights
        else:
            # create equal weights from first row keys
            first = batch_buffer[0] if batch_buffer else {}
            feature_cols = [
                k for k in first.keys() if k not in ("asid", "customer_value")
            ]
            if not feature_cols:
                feature_cols = []
            w = 1.0 / max(1, len(feature_cols))
            weights = {f: w for f in feature_cols}

        for row in batch_buffer:
            s = 0.0
            for feature_col, w in weights.items():
                user_value = row.get(feature_col)
                feat_score = self._score_single_feature(feature_col, user_value)
                s += w * feat_score
            scores.append(float(s))
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
