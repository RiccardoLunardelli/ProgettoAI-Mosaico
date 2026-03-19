from uuid import uuid4
from datetime import datetime, timezone, timedelta
import json
from src.intermediateLayer.postgres_repository import RunRepository, UsersRepository, Roles, Devices

dsn = "dbname=semantic_ai_mapper user=semantic_user password=semantic_password host=localhost port=5432"

repo = RunRepository(dsn)
user = UsersRepository(dsn)
role = Roles(dsn)
device = Devices(dsn)
"""
REPO
with open("/home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/runs/run20260216_143121/run_report.json", "r", encoding="utf-8") as f:
    run_report = json.load(f)

repo.save_run(
    run_report=run_report,
    user_id=UUID("11111111-1111-1111-1111-111111111111"),
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

"""

## -------------TRONCATE-----------------------

repo.truncate_runs()
#user.truncate_users()

## INSERIMENTO ROLE
#role.upsert_role()

# AGGIORNAMENTO RUOLO
#user.update_user_role(1, "admin@gmail.com")


# INSERIMENTO DEVICE

#device.insert_device("a406276b-e290-4627-874f-3e8c04fc6d2c", "CENTRALE TN MAT: 0VCD345201 ADR: 1.005", "PLC1.RACK0.SLOT2.DB100.DBX0.0","981465f4-3f24-4f5e-b7a9-4d92f3a3c870")


