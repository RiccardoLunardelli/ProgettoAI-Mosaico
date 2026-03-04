
import type {
  BreadcrumbPathInterface,
  BreadcrumbPropertiesInterface,
} from "./commonsInterfaces.tsx";
import type { JSX } from "react";

//Url link server api
export const apiDomainString: string = import.meta.env.VITE_API_URL ?? "";

//Width massima per mobile
export const widthMaxMobile = 767;

//Width massima per tabled
//export const widthMaxTablet = 1024;
export const widthMaxTablet = 1281;

//Tag Base
export const anyNullVar: any = null;
export const DefaultTagVar: JSX.Element = <></>;


export const DefaultStringOrUndefined: string | undefined = undefined;

export const DefaultFunctionVar = () => {};

export const DefaultArrayString: Array<string> = [];

//Array di BreadcrumbPathInterface
export const DefaultBreadcrumbArray: Array<BreadcrumbPathInterface> = [];
//Oggetto vuoto di BreadcrumbPropertiesInterface
export const DefaultBreadcrumbProperties: BreadcrumbPropertiesInterface = {
  path: [],
};

