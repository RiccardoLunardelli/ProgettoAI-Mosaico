import {
  FetchMethodEnum,
  FetchResponseTypeEnum,
  FilterColumnEnum,
  ResultTypeEnum,
  type AddEditType,
} from "./commonsEnums";

export interface TabsInterface {
  label: string;
  id: string;
}

export interface ResponseMessageInterface {
  result: ResultTypeEnum;
  message?: any;
  messageType?: FetchResponseTypeEnum;
  otherResponseInfo: any;
}

export interface FetchFunctionBodyInterface {
  url: string;
  method: FetchMethodEnum;
  body?: object | string;
  //Possono essere aggiunte quante corrispondenze chiave valore si vogliono.
  //Meglio controllare la documentazione ufficiale per le chiavi ed i valori accettati
  [propName: string]: any;
}

//Interfaccia per l'oggetto che gestisce un singolo valore nel Breadcrumb
export interface BreadcrumbPathInterface {
  path: string;
  textToSee: string;
  isSelected: boolean;
  nameForNavBar: string;
  otherProp?: any;
}

//Interfaccia per indicare le proprietà che richiede il componente Breadcrumb.
//Per ora solo path, un array di BreadcrumbPathInterface
export interface BreadcrumbPropertiesInterface {
  path: BreadcrumbPathInterface[];
}

export interface ResponseMessageInterface {
  result: ResultTypeEnum;
  message?: any;
  messageType?: FetchResponseTypeEnum;
  otherResponseInfo: any;
}

//Gestione paginazione
export interface PaginationBaseInterface {
  skip: number;
  limit: number;
}

export interface AddModaleBaseInterface {
  isToOpen: boolean;
}
export interface EditModaleBaseInterface {
  isToOpen: boolean;
  id: string;
}
//Gestione modali add/edit
export interface AddEditModaleInterface {
  isToOpen: boolean;
  viewEdit: AddEditType;
  id: string;
}
//Gestione modali delete
export interface DeleteModaleInterface {
  isToOpen: boolean;
  id: string;
}

//#region Filter

export interface FilterColumnComponentInterface {
  id: string;
  columnName: string;
  width: string;
  elementType: FilterColumnEnum;
  value?: any;
  //ChangeCallback?: any;
  overflow?: string;
  direction: //Dall'alto in basso
  | "down"
    //Da sx a dx con wrap
    | "rightwrap";
  startSelectedValue?: {
    [propName: string]: any;
  };
}

export interface FilterChangeCallbackInterface {
  id: string;
  value: string;
}
export interface FilterSelectInterface {
  id: string;
  label: string;
  startSelected?: boolean;
}
export interface FilterSelectTagInterface {
  id: string;
  tagObj: any;
  startSelected?: boolean;
}

//#endregion Filter
