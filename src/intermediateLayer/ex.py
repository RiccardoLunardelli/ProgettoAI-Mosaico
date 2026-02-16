from uuid import UUID
import json
from src.intermediateLayer.postgres_repository import RunRepository

dsn = "dbname=semantic_ai_mapper user=semantic_user password=semantic_password host=localhost port=5432"

repo = RunRepository(dsn)
"""
with open("/home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/runs/run20260216_143121/run_report.json", "r", encoding="utf-8") as f:
    run_report = json.load(f)

repo.save_run(
    run_report=run_report,
    user_id=UUID("11111111-1111-1111-1111-111111111111"),
    batch_id=UUID("22222222-2222-2222-2222-222222222222"),
)
"""

# saved = repo.get_run(run_report["run_id"])
# saved = repo.get_run("run20260216_143121") # ritorna report completo 
# print(saved)
# delete = repo.delete_run("run20260216_143121") # elimina una run

