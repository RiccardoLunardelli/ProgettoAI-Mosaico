import { diffLines } from "diff/lib/diff/line.js";
import { FetchResponseTypeEnum, ResultTypeEnum } from "./commonsEnums";
import {
  type FetchFunctionBodyInterface,
  type ResponseMessageInterface,
} from "./commonsInterfaces.tsx";

export const ClearCacheAndReload = async () => {
  await fetch(window.location.href, {
    method: "GET",
    cache: "reload",
  });
  window.location.reload();
};

//Metodo per effettuare chiamate API
export async function FetchData(
  //Opzioni per la chiamata API
  infoObj: FetchFunctionBodyInterface,
  //Callback eseguita alla risposta della chiamata
  EndCallback: (returnValue?: ResponseMessageInterface) => void,
  //Metodo per come leggere la risposta
  readResponseType: "json" | "string" = "json",
) {
  try {
    console.debug(["FetchData: " + JSON.stringify(infoObj)]);

    //Per sicurezza, non dovrebbe servire
    infoObj.url = infoObj.url.replace(" ", "");

    //Controllo che url non sia vuoto
    if (infoObj.url == "") {
      console.debug(
        "FetchData: " +
          JSON.stringify({
            result: ResultTypeEnum.Error,
            message: "Entered URL is an empty string",
            messageType: FetchResponseTypeEnum.String,
            otherResponseInfo: {},
          }),
      );
      EndCallback({
        result: ResultTypeEnum.Error,
        message: "Entered URL is an empty string",
        messageType: FetchResponseTypeEnum.String,
        otherResponseInfo: {},
      });
      return;
    }

    //Oggetto di base per la chiamata API Fetch
    const objForFetchData: object = {
      method: infoObj.method,
      mode: "cors",
      /* "cors" | "no-cors" | "same-origin" */
      cache: "no-cache",
      /*"no-cache"
			| "default"
			| "reload"
			| "force-cache"
			| "only-if-cached"*/
      credentials: "same-origin",
      /* "same-origin" | "include" | "omit" */
      headers: {
        "Content-Type": "application/json",
      },
      redirect: "follow",
      /* "follow" | "manual" | "error" */
      referrerPolicy: "no-referrer",
      /*"no-referrer"
			| "no-referrer-when-downgrade"
			| "origin"
			| "origin-when-cross-origin"
			| "same-origin"
			| "strict-origin"
			| "strict-origin-when-cross-origin"
			| "unsafe-url"*/
    };

    //Controllo se è stringa
    if (typeof infoObj.body == "string") {
      //Se è stringa viene messo direttamente
      (objForFetchData as any)["body"] = infoObj.body;
    } else if (typeof infoObj.body == "object") {
      //Se è un obj, viene castato in stringa
      (objForFetchData as any)["body"] = JSON.stringify(infoObj.body);
    }

    //Impostazioni di tutte le chiavi passate in input
    //Tranne che per "url", "method" e "body"
    Array.from(Object.keys(infoObj))
      .filter(
        (singleKey) =>
          singleKey != "url" && singleKey != "method" && singleKey != "body",
      )
      .forEach((singleKey) => {
        (objForFetchData as any)[singleKey] = infoObj[singleKey];
      });

    try {
      //Chiamata API, risposta nella variabile responseFetchCall
      const responseFetchCall = await fetch(infoObj.url, objForFetchData);

      //Prova a prendere il risultato come Json
      let responseCallbackJson: any = null;

      switch (readResponseType) {
        case "json":
          responseCallbackJson = await responseFetchCall.json();
          break;
        case "string":
          responseCallbackJson = await responseFetchCall.text();
          break;

        default:
          break;
      }

      //Controllo se la risposta è positiva
      if (responseFetchCall.ok) {
        console.debug(
          "FetchData: " +
            JSON.stringify({
              result: ResultTypeEnum.Success,
              message: responseCallbackJson,
              messageType: FetchResponseTypeEnum.Json,
              otherResponseInfo: responseFetchCall,
            }),
        );

        EndCallback({
          result: ResultTypeEnum.Success,
          message: responseCallbackJson,
          messageType: FetchResponseTypeEnum.Json,
          otherResponseInfo: responseFetchCall,
        });
        return;
      }

      console.debug(
        "FetchData: " +
          JSON.stringify({
            result: ResultTypeEnum.Error,
            message: responseCallbackJson,
            messageType: FetchResponseTypeEnum.Json,
            otherResponseInfo: responseFetchCall,
          }),
      );

      //Se arriva qua, la risposta non è positiva
      EndCallback({
        result: ResultTypeEnum.Error,
        message: responseCallbackJson,
        messageType: FetchResponseTypeEnum.Json,
        otherResponseInfo: responseFetchCall,
      });

      return;
    } catch (errorMessage) {
      console.debug(
        "FetchData: " +
          JSON.stringify({
            result: ResultTypeEnum.Error,
            message: errorMessage,
            messageType: FetchResponseTypeEnum.String,
            otherResponseInfo: "",
          }),
      );

      EndCallback({
        result: ResultTypeEnum.Error,
        message: errorMessage,
        messageType: FetchResponseTypeEnum.String,
        otherResponseInfo: "",
      });
      return;
    }
  } catch (error) {
    console.debug(error);
  }
}

//Metodo per effettuare chiamate API ricorsive in automatico
export function FetchDataRecursive(
  //Opzioni per la chiamata API
  infoObj: FetchFunctionBodyInterface,

  //Callback eseguita alla risposta della chiamata
  EndCallback: (returnValue?: ResponseMessageInterface) => void,

  //Indica se deve mettere i dati anche in querystring
  setQueryString?: boolean | undefined,
  //Indica se deve mettere il body come undefined
  resetBody?: boolean | undefined,

  //usato solo per i test, dove il metodo structureClone và in errore
  useStructureClone = true,
) {
  //Prende il valore di Limit iniziale
  let startLimit: number = 20;
  //Prende il valore di Skip iniziale
  let startSkip: number = 0;
  //Controlla se infoObj.body è un obj
  if (infoObj.body != undefined && typeof infoObj.body === "object") {
    if (Object.hasOwn(infoObj.body, "limit")) {
      startLimit = (infoObj.body as any)["limit"];
    }
    if (Object.hasOwn(infoObj.body, "offset")) {
      startSkip = (infoObj.body as any)["offset"];
    }
  } else {
    //Se infoObj.body non è un obj
    EndCallback({
      result: ResultTypeEnum.Error,
      message: "Body is not an object. Use FetchData instead",
      messageType: FetchResponseTypeEnum.String,
      otherResponseInfo: "",
    });
    return;
  }

  let accumulatorData: any[] = [];

  const startUrl = infoObj.url;

  //Copia del body
  const startBody = infoObj.body;

  //Reset del body
  if (resetBody != null && resetBody) {
    infoObj.body = undefined;
  }

  //Metodo per effettuare le chiamate ricorsive in automatico
  const StartRecursiveFunc = () => {
    //Controlla se infoObj.body è un obj
    if (typeof startBody === "object") {
      (startBody as any).limit = startLimit;
      (startBody as any).offset = startSkip;

      //Aggiunge il query string, se serve
      if (setQueryString != null && setQueryString) {
        //Imposta il querystring
        infoObj.url =
          startUrl + "?" + new URLSearchParams(startBody as any).toString();
      }

      FetchData(infoObj, (returnValue?: ResponseMessageInterface) => {
        //Controllo se la risposta è undefined
        if (returnValue == undefined) {
          EndCallback({
            result: ResultTypeEnum.Error,
            message: "returnValue undefined",
            messageType: FetchResponseTypeEnum.String,
            otherResponseInfo: "",
          });
          return;
        }

        //Controllo che non sia in errore
        if (returnValue.result == ResultTypeEnum.Error) {
          EndCallback(returnValue);
          return;
        }

        //Controllo se la risposta contiene Data
        if (!Object.hasOwn(returnValue.message, "Data")) {
          EndCallback({
            result: ResultTypeEnum.Error,
            message: "returnValue message not contains Data",
            messageType: FetchResponseTypeEnum.String,
            otherResponseInfo: "",
          });
          return;
        }

        //Controllo se la risposta contiene Count
        if (!Object.hasOwn(returnValue.message, "Count")) {
          EndCallback({
            result: ResultTypeEnum.Error,
            message: "returnValue message not contains Count",
            messageType: FetchResponseTypeEnum.String,
            otherResponseInfo: "",
          });
          return;
        }

        //Prende il valore di data convertito
        let dataJSON = structuredClone(returnValue.message.Data);
        if (typeof dataJSON == "string") {
          dataJSON = JSON.parse(dataJSON);
        }
        //Se non è un'array
        if (!Array.isArray(dataJSON)) {
          //Lo trasforma in array
          dataJSON = [dataJSON];
        }

        //Aggiunge i nuovi dati della risposta
        accumulatorData = accumulatorData.concat(dataJSON);

        //Controlla se ci sono altri valori da prendere oppure no
        if (returnValue.message["Count"] < startSkip + startLimit) {
          EndCallback({
            result: ResultTypeEnum.Success,
            message: {
              Data: useStructureClone
                ? structuredClone(accumulatorData)
                : accumulatorData,
              Count: useStructureClone
                ? structuredClone(returnValue.message["Count"])
                : returnValue.message["Count"],
            },
            messageType: FetchResponseTypeEnum.Json,
            otherResponseInfo: "",
          });
          return;
        }

        //Incrementa startSkip
        startSkip += startLimit;

        //Si richiama ricorsivamente
        StartRecursiveFunc();
      });
    }
  };

  //Parte la chiamat ricorsiva
  StartRecursiveFunc();
}

//Funzione per controllare se una stringa è in formato mail
export function CheckStringIfMail(stringToCheck: string = "") {
  //Controllo che la stringa non sia vuota
  if (stringToCheck == "") {
    return false;
  }

  //Regex di controllo
  //anystring@anystring.anystring
  const regexMail: RegExp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  //Return se la stringa è una mail
  return regexMail.test(stringToCheck);
}

//Metodo per avere una lista distinct
export function DistinctList(
  //Array di partenza
  startArray: any[],
) {
  //Ritorna la lista filtrata
  return startArray.filter(
    //Controlla il valore tramite JSON stringify
    (value, index, array) => array.indexOf(value) === index,
  );
}

export interface ThemeInfo {
  theme: string;
  smartPrimary: string | null;
}

//Metodo per prendersi tutti i temi disponibili
export function GetThemesWithSmartPrimary(): ThemeInfo[] {
  const results: ThemeInfo[] = [];

  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList | undefined;

    try {
      rules = sheet.cssRules;
    } catch {
      continue; // Stylesheet non accessibile (CORS)
    }

    if (!rules) continue;

    for (const rule of Array.from(rules)) {
      if (rule.type !== CSSRule.STYLE_RULE) continue;

      const styleRule = rule as CSSStyleRule;
      const selector = styleRule.selectorText;

      // Cerca selettori con data-theme
      const match = selector?.match(/\[data-theme=["']?([\w-]+)["']?\]/);
      if (!match) continue;

      const themeName = match[1];

      // Legge il valore della variabile --smart-primary
      const smartPrimary =
        styleRule.style?.getPropertyValue("--smart-primary") ?? "";

      results.push({
        theme: themeName,
        smartPrimary: smartPrimary?.trim() ?? "",
      });
    }
  }

  return results;
}

//Metodo per generarsi ricorsivamente la lista dei path dato un oggetto
export function GetListOfPathFromObjectRecursive(
  obj: any,
  currentPath: any[] = [],
  results: string[][] = [],
) {
  for (const key in obj) {
    const value = obj[key];

    // Se è un oggetto, continua la ricorsione
    if (typeof value === "object" && value !== null) {
      GetListOfPathFromObjectRecursive(value, [...currentPath, key], results);
    }

    // Se è una stringa
    if (typeof value === "string") {
      results.push([...currentPath, key, value]);
    }
  }

  return results;
}

export const IsValidJSON = (text: string) => {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
};

export const getJsonDiffLines = (json1: [], json2: []) => {
  if (!json1 || !json2) return [];

  const oldText = JSON.stringify(json1, null, 2);
  const newText = JSON.stringify(json2, null, 2);

  const diff = diffLines(oldText, newText);

  const result: { line: string; type: "same" | "added" | "removed" }[] = [];

  diff.forEach((part) => {
    const lines = part.value.split("\n");

    lines.forEach((line, index) => {
      if (index === lines.length - 1 && line === "") return;

      result.push({
        line,
        type: part.added ? "added" : part.removed ? "removed" : "same",
      });
    });
  });

  return result;
};
