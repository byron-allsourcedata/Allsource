class PlanNotFoundException(Exception):
    def __init__(self, alias: str):
        self.alias = alias
        super().__init__(f"Plan with alias '{alias}' not found")
