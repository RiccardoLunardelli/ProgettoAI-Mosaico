from uuid import uuid4
from datetime import datetime, timezone, timedelta
import json
from src.intermediateLayer.postgres_repository import RunRepository, UsersRepository, BatchesRepository

dsn = "dbname=semantic_ai_mapper user=semantic_user password=semantic_password host=localhost port=5432"

repo = RunRepository(dsn)
user = UsersRepository(dsn)
batch = BatchesRepository(dsn)
"""
REPO
with open("/home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/runs/run20260216_143121/run_report.json", "r", encoding="utf-8") as f:
    run_report = json.load(f)

repo.save_run(
    run_report=run_report,
    user_id=UUID("11111111-1111-1111-1111-111111111111"),
    batch_id=UUID("22222222-2222-2222-2222-222222222222"),
)
"""
"""
# saved = repo.get_run(run_report["run_id"])
# saved = repo.get_run("run20260216_143121") # ritorna report completo 
# print(saved)
# delete = repo.delete_run("run20260216_143121") # elimina una run


#------USER-----

user_id = uuid4()
email = "test.user@gmail.com"
name = "Test User"
created_at_user = datetime.now(timezone(timedelta(hours=1))).isoformat()

#user.create_user(user_id=user_id, email=email, name=name, created_at=created_at_user)
user_id = "d875ceed-5219-41f7-bc38-bb069f7514d7"
#name = "Test User"
#email = "test.user@gmail.com"
#search = user.get_user(user_id)
#search = user.get_user_by_email(email)
#update = user.update_user_name(user_id=user_id, name="Update nome user")
#delete = user.delete_user(user_id)
#print(search)

#--------BATCH---------

batch_id = uuid4()
#user = user_id
created_at_batch = datetime.now(timezone(timedelta(hours=1))).isoformat()
total_runs = 10
completed_runs = 0
status = batch._validate_and_status(total_runs, completed_runs)

#batch.create_batch(batch_id=batch_id, user_id=user, created_at=created_at_batch, status=status, total_runs=total_runs, completed_runs=completed_runs)
batch_id = "9b6d62b0-ae8c-4492-9b3b-8b048f4760b9"
#search_batch = batch.get_batch(batch_id=batch_id)
#print(search_batch)
#status_batch = batch.update_batch_status(batch_id=batch_id, status="stopped")
#increment = batch.increment_completed_runs(batch_id=batch_id, delta=+1)
#batch.delete_batch(batch_id=batch_id)
"""

## -------------TRONCATE-----------------------

#repo.truncate_runs()
#batch.truncate_batches()
#user.truncate_users()

repo.delete_run("run20260219_091337")