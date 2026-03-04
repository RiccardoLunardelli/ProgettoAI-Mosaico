export enum ErrorPageTypeEnum {
  Generic = "Generic",
  Path = "Path",
}

export enum ResultTypeEnum {
  Error = "Error",
  Success = "Success",
}

export enum FetchResponseTypeEnum {
  String = "String",
  Json = "Json",
}

export enum FetchMethodEnum {
  Get = "GET",
  Post = "POST",
  Put = "PUT",
  Patch = "PATCH",
  Delete = "DELETE",
}

export type AddEditType = "add" | "edit";

export enum OperazioniLogEnum {
  "CREATE" = "CREATE",
  "DELETE" = "DELETE",
  "UPDATE" = "UPDATE",
  "" = "",
}

export enum ParitySerialeEnum {
  "None" = 0,
  "Odd" = 1,
  "Even" = 2,
  "Mark" = 3,
  "Space" = 4,
}

export enum StopBitSerialeEnum {
  "None" = 0,
  "One" = 1,
  "Two" = 2,
  "OnePointFive" = 3,
}

//#region Filter

export enum FilterColumnEnum {
  None = "None",
  SelectMany = "SelectMany",
  InputText = "InputText",
}

//#endregion Filter

export enum ProtocolTypeLineeSerialiEnum {
  "Modbus RTU" = 0,
  "Carelbus" = 1,
}

export enum DeviceFinderSerialPortStatusEnum {
  "None" = 0,
  "Started" = 1,
  "Complete" = 2,
}

export enum LineeSerialiOperativeStatusStatusEnum {
  "None" = 0,
  "DeviceFinderStarted" = 1,
  "DeviceFinderCompleted" = 2,
}
export enum LineeSerialiStatusEnum {
  "Offline" = -1,
  "Online" = 0,
}

export enum SchedulerCalendarsTypeEnum {
  "Settimanale" = 0,
  "Giorni Speciali" = 1,
  "Personalizzato" = 2,
  "Pasqua" = 3,
  "Pasquetta" = 4,
}

export enum SchedulerCalendarsMonthsEnum {
  "Tutti" = 0,
  "Gennaio" = 1,
  "Febbraio" = 2,
  "Marzo" = 3,
  "Aprile" = 4,
  "Maggio" = 5,
  "Giugno" = 6,
  "Luglio" = 7,
  "Agosto" = 8,
  "Settembre" = 9,
  "Ottobre" = 10,
  "Novembre" = 11,
  "Dicembre" = 12,
}
export enum SchedulerCalendarsSpecialMonthsEnum {
  "Gennaio" = 1,
  "Febbraio" = 2,
  "Marzo" = 3,
  "Aprile" = 4,
  "Maggio" = 5,
  "Giugno" = 6,
  "Luglio" = 7,
  "Agosto" = 8,
  "Settembre" = 9,
  "Ottobre" = 10,
  "Novembre" = 11,
  "Dicembre" = 12,
}

export enum SchedulerWeekDaysEnum {
  "Dom" = 0,
  "Lun" = 1,
  "Mar" = 2,
  "Mer" = 3,
  "Gio" = 4,
  "Ven" = 5,
  "Sab" = 6,
}

export enum CustomDateWeekNumberEnum {
  "Prima" = 0,
  "Seconda" = 1,
  "Terza" = 2,
  "Quarta" = 3,
  "Quinta" = 4,
}

export enum InputCaseEnum {
  Insentive = "Insentive",
  Lower = "Lower",
  Upper = "Upper",
}