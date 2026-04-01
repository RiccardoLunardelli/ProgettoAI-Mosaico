from pydantic import BaseModel, UUID4, EmailStr, field_validator
from typing import Any, Dict, List

#----ROLE-----
class UpdateRoleAdmin(BaseModel):
    role: int
    user_id: UUID4

#-----USER------
class UpdateUser(BaseModel):
    user_id: UUID4
    email: EmailStr | None = None 
    name: str | None = None 
    password: str | None = None
    role: int | None = None

class DeleteUserAdmin(BaseModel):
    user_id: UUID4

#----ARTIFACT-----
class GetArtifact(BaseModel):
    id: UUID4

class InsertArtifactAdmin(BaseModel):
    type: str 
    name: str 
    version: str 
    content: dict | str

class DropArtifactAdmin(BaseModel):
    ids: list[UUID4]

#----CLIENT-----
class InsertClientAdmin(BaseModel):
    name: str

class UpdateClientAdmin(BaseModel):
    name: str
    new_name: str

class DeleteClientAdmin(BaseModel):
    name: str

#---STORE----
class UpsertStoreAdmin(BaseModel):
    client_id: UUID4
    store: str
    content: list[dict[str, Any]]

class UpdateStoreAdmin(BaseModel):
    id: UUID4 
    client_id: UUID4 | None
    name: str | None
    new_name: str | None

class DeleteStoreAdmin(BaseModel):
    name: str

#---DEVICE-----
class UpdateDeviceAdmin(BaseModel):
    id: UUID4
    store_id: UUID4 | None 
    description: str | None 
    hd_plc: str | None 
    id_template: UUID4 | None

    @field_validator("store_id", "id_template", mode="before")
    @classmethod
    def empty_to_none(cls, v):
        if v == "":
            return None
        return v

class InsertDeviceAdmin(BaseModel):
    store_id: UUID4
    description: str
    hd_plc: str | None
    id_template: UUID4 | None

class DeleteDeviceAdmin(BaseModel):
    id: UUID4

#--CONFIG--
class EditConfigAdmin(BaseModel):
    id: str
    file: str 
    
#---CREATE TEMPLATE---

#--INFO TEMPLATE---
class TemplateInfoAdmin(BaseModel):
    Author: str | None = None
    Category: str | None = None
    TemplateName: str
    Product: str | None = None
    Version: str | None = None

#----SEZIONI DI BASE-----
class AspectAdmin(BaseModel):
    Decimals: int | None = None
    Gain: int | None = None
    LabelValues: str | None = None
    Mask: int | None = None
    Measurement: str | None = None

class CompatibilityAdmin(BaseModel):
    Alias: str | None = None 

class ModbusAdmin(BaseModel):
    Address: int | None = None 
    GroupName: str | None = None 
    RegisterType: str | None = None 

class ReportAdmin(BaseModel):
    Column: str | None = None 

class SystemAdmin(BaseModel):
    IsPersistent: bool | None = None 

class VariableAdmin(BaseModel):
    Enable: bool | None = None 
    MultiLanguageDescription: Dict[str, str] | None = None
    Position: float | None = None
    SwapByteToRead: bool | None = None
    SwapByteToWrite: bool | None = None
    Type: int | None = None

class DataLoggersAdmin(BaseModel):
    DataLoggerEnable: bool | None = None

#---CONTINUOS READS------
class ContinuosReadsAdmin(BaseModel):
    name: str
    Description: str | None = None
    Aspect: AspectAdmin | None = None
    Compatibility: CompatibilityAdmin | None = None
    Modbus: ModbusAdmin | None = None
    Report: ReportAdmin | None = None
    System: SystemAdmin | None = None
    Variable: VariableAdmin | None = None
    DataLoggers: DataLoggersAdmin | None = None

#--PARAMETERS-----
class ParameterSect(BaseModel):
    AccessLevel: int | None = None
    AccessWriteLevel: int | None = None
    Category: Dict[str, str] | None = None
    Default: str | None = None
    Label: str | None = None
    MaxValue: str | None = None
    MinValue: str | None = None
    Visibility: str | None = None

class ParametersAdmin(BaseModel):
    name: str
    Description: str | None = None
    Aspect: AspectAdmin | None = None
    Compatibility: CompatibilityAdmin | None = None
    Modbus: ModbusAdmin | None = None
    Parameter: ParameterSect | None = None
    Report: ReportAdmin | None = None
    System: SystemAdmin | None = None
    Variable: VariableAdmin | None = None
    DataLoggers: DataLoggersAdmin | None = None

#--COMMANDS---
class CommandsSect(BaseModel):
    ValueCommand: str | None = None
    WriteAccessLevel: int | None = None

class CommandsAdmin(BaseModel):
    name: str
    Description: str | None = None
    Aspect: AspectAdmin | None = None
    Command: CommandsSect | None = None
    Compatibility: CompatibilityAdmin | None = None
    Modbus: ModbusAdmin | None = None
    Report: ReportAdmin | None = None
    System: SystemAdmin | None = None
    Variable: VariableAdmin | None = None
    DataLoggers: DataLoggersAdmin | None = None

#--ALARMS----
class MessageSect(BaseModel):
    priority: int | None = None

class MessageCodeSect(BaseModel):
    Code: str | None = None

class AlarmsAdmin(BaseModel):
    name: str
    Description: str | None = None
    Aspect: AspectAdmin | None = None
    Compatibility: CompatibilityAdmin | None = None
    Message: MessageSect | None = None
    Report: ReportAdmin | None = None
    System: SystemAdmin | None = None
    Variable: VariableAdmin | None = None
    MessageCode: MessageCodeSect | None = None
    DataLoggers: DataLoggersAdmin | None = None

#--WARNINGS----
class WarningsAdmin(BaseModel):
    name: str
    Description: str | None = None
    Aspect: AspectAdmin | None = None
    Compatibility: CompatibilityAdmin | None = None
    Message: MessageSect | None = None
    Report: ReportAdmin | None = None
    System: SystemAdmin | None = None
    Variable: VariableAdmin | None = None
    MessageCode: MessageCodeSect | None = None
    DataLoggers: DataLoggersAdmin | None = None

#---VIRTUAL VARIABLES
class VariableVirtualVariables(BaseModel):
    AlwaysValidValue: bool | None = None
    Enable: bool | None = None 
    MultiLanguageDescription: Dict[str, str] | None = None
    Position: float | None = None
    SwapByteToRead: bool | None = None
    SwapByteToWrite: bool | None = None
    Type: int | None = None

class VirtualVariablesAdmin(BaseModel):
    name: str
    Description: str | None = None
    Aspect: AspectAdmin | None = None
    Compatibility: CompatibilityAdmin | None = None
    Report: ReportAdmin | None = None
    System: SystemAdmin | None = None
    Variable: VariableAdmin | None = None
    MessageCode: MessageCodeSect | None = None
    DataLoggers: DataLoggersAdmin | None = None

class TemplateCreation(BaseModel):
    TemplateInfo: TemplateInfoAdmin 
    ContinuosReads: List[ContinuosReadsAdmin] = []
    Parameters: List[ParametersAdmin] = []
    Commands: List[CommandsAdmin] = []
    Alarms: List[AlarmsAdmin] = []
    Warnings: List[WarningsAdmin] = []
    VirtualVariables: List[VirtualVariablesAdmin] = []


#----CREAZIONE TEMPLATE------
class CreateTemplateAdmin(BaseModel):
    Template: TemplateCreation
    Schema_id: str

#----DELETE RUNS-----
class DeleteRunAdmin(BaseModel):
    run_ids: List[str]