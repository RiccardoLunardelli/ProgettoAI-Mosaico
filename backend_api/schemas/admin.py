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
#--INFO--
class TemplateInfoAdmin(BaseModel):
    Author: str 
    Category: str 
    Name: str 
    Product: str 
    Version: str 

#--MODBUS--
class ModbusInfo(BaseModel):
    Address: int 
    GroupName: str 
    RegisterType: str

#--CONTINUOS READS---
class ContinuosReadsSection(BaseModel):
    NameVariable: str 
    Enable: bool 
    MultiLanguageDescription: str 
    TroubleSettings: str 
    Name: str 
    Alias : str | None = None
    Description: str 
    Type: int 
    Measurement: str 
    ShowIndexPage: bool
    HTMLViewEnable: int 
    HTMLViewCategory: str
    HTMLViewIndexPosition: int 
    HTMLMaskValue: str
    Modbus: ModbusInfo

#---PARAMETERS-----
class ParametersSection(BaseModel):
    NameVariable: str 
    Label: str
    Category: str
    Default: str 
    Visibility: str 
    AccessLevel: int 
    AccessWriteLevel: int 
    Enable: bool 
    MultiLanguageDescription: str 
    TroubleSettings: str 
    Name: str 
    Alias : str | None = None
    Description: str 
    Type: int 
    Measurement: str 
    ShowIndexPage: bool
    HTMLViewEnable: int 
    HTMLViewCategory: str
    HTMLViewIndexPosition: int 
    HTMLMaskValue: str
    Modbus: ModbusInfo

#---COMMANDS----
class CommandsSection(BaseModel):
    pass 

#--ALARMS---
class AlarmsSection(BaseModel):
    pass

#--WARNINGS---
class WarningsSection(BaseModel):
    pass 

#--VIRTUALVARIABLES---
class VirtualVariablesSection(BaseModel):
    pass

#---DATALOGGERPEN-----
class DataLoggerPenSection(BaseModel):
    pass

#---TEMPLATEGUID----
class TemplateGuidSection(BaseModel):
    pass

#--CREAZIONE TEMPLATE---
class CreateTemplateAdmin(BaseModel):
    TemplateInfo: TemplateInfoAdmin
    ContinuosReads: List[ContinuosReadsSection]
    Parameters: List[ParametersSection]
    
