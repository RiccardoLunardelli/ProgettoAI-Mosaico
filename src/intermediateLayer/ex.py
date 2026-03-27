from uuid import uuid4
from datetime import datetime, timezone, timedelta
import json
from src.intermediateLayer.postgres_repository import RunRepository, UsersRepository, Roles, Devices, Schema, ArtifactRepository
from scripts.orchestrator import load_json

dsn = "dbname=semantic_ai_mapper user=semantic_user password=semantic_password host=localhost port=5432"

repo = RunRepository(dsn)
user = UsersRepository(dsn)
role = Roles(dsn)
device = Devices(dsn)
schema = Schema(dsn)
artifact = ArtifactRepository(dsn)
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

#repo.truncate_runs()
#user.truncate_users()

## INSERIMENTO ROLE
#role.upsert_role()

# AGGIORNAMENTO RUOLO
#user.update_user_role(1, "admin@gmail.com")


# INSERIMENTO DEVICE

#device.insert_device("a406276b-e290-4627-874f-3e8c04fc6d2c", "CENTRALE TN MAT: 0VCD345201 ADR: 1.005", "PLC1.RACK0.SLOT2.DB100.DBX0.0","981465f4-3f24-4f5e-b7a9-4d92f3a3c870")


# INSERIMENTO SCHEMA

#schema_json = load_json("/home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/schemas/schema_tipo_v0.1.json")
#schema.insert_schema("schema_tipo_v0.1.json", "0.1", schema_json)

#DROP SCHEMA
#schema.drop_schema("bd4ca902-4db5-4bfc-b18c-a9ecfa38ed92")

#INSERIMENTO SCHEMA ID IN ARTIFACT
"id schema 0.2 = 6437f2fa-7b49-4e4f-bb66-76db696f23d6"
"id schema 0.1 = 234683f9-d45a-435d-8687-c3e698132c45"

artifact.insert_schema_id("45af03a0-9ee5-47b5-9b2e-bbf0ccc852df", "6437f2fa-7b49-4e4f-bb66-76db696f23d6")
