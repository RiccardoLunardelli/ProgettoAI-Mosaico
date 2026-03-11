import { useDispatch } from "react-redux";
import type { ResponseMessageInterface } from "../../../commons/commonsInterfaces";
import {
  CloseLoader,
  OpenLoader,
} from "../../../stores/slices/Base/loaderSlice";
import {
  FetchMethodEnum,
  FetchResponseTypeEnum,
  ResultTypeEnum,
} from "../../../commons/commonsEnums";
import { apiDomainString } from "../../../commons/commonsVariables";
import {
  SetDeviceListDetailSlice,
  SetDeviceListListSlice,
  SetEnrichedDetailSlice,
  SetEnrichedValueSlice,
  type DeviceListStoreFileInterface,
} from "../../../stores/slices/Base/deviceListSlice";
import { useTranslation } from "react-i18next";
import { toast, type Id } from "react-toastify";

const GetDeviceListIdsAPIHook = () => {
  const dispatch = useDispatch();

  const GetDeviceListIdsAPI = async (infoObj: {
    EndCallback?: (returnValue?: ResponseMessageInterface) => void;
    showLoader?: boolean;
    saveResponse?: boolean;
  }) => {
    //Apre il loader, se richiesto
    if (infoObj.showLoader) {
      dispatch(OpenLoader());
    }

    try {
      const apiCall = await fetch(apiDomainString + "/device_list", {
        method: FetchMethodEnum.Get,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      //Risposta in base64
      const response: string = await apiCall.text();

      //Risposta in json
      const jsonResponse = JSON.parse(response);

      //Se deve salvare il valore
      if (infoObj?.saveResponse ?? true) {
        const deviceListList: DeviceListStoreFileInterface[] =
          jsonResponse?.device_list ?? [];

        dispatch(SetDeviceListListSlice(deviceListList));
      }

      //Callback di successo
      if (infoObj.EndCallback) {
        infoObj.EndCallback({
          result: ResultTypeEnum.Success,
          message: jsonResponse,
          messageType: FetchResponseTypeEnum.Json,
          otherResponseInfo: "",
        });
      }
    } catch (err) {
      console.error("DataOra error:", err);

      if (infoObj.EndCallback) {
        infoObj.EndCallback({
          result: ResultTypeEnum.Error,
          message: err,
          messageType: FetchResponseTypeEnum.Json,
          otherResponseInfo: "",
        });
      }
    } finally {
      if (infoObj.showLoader) dispatch(CloseLoader());
    }
  };

  return [GetDeviceListIdsAPI];
};

const GetDeviceListDetailAPIHook = () => {
  const dispatch = useDispatch();

  const GetDeviceListDetailAPI = async (infoObj: {
    data: {
      store: string;
      dl: string;
    };
    EndCallback?: (returnValue?: ResponseMessageInterface) => void;
    showLoader?: boolean;
    saveResponse?: boolean;
  }) => {
    //Apre il loader, se richiesto
    if (infoObj.showLoader) {
      dispatch(OpenLoader());
    }

    try {
      const apiCall = await fetch(
        apiDomainString +
          "/device_list/" +
          infoObj.data.store +
          "/" +
          infoObj.data.dl,
        {
          method: FetchMethodEnum.Get,
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      //Risposta in base64
      const response: string = await apiCall.text();

      //Risposta in json
      const jsonResponse = JSON.parse(response);

      //Se deve salvare il valore
      if (infoObj?.saveResponse ?? true) {
        dispatch(SetDeviceListDetailSlice(jsonResponse));
      }

      //Callback di successo
      if (infoObj.EndCallback) {
        infoObj.EndCallback({
          result: ResultTypeEnum.Success,
          message: jsonResponse,
          messageType: FetchResponseTypeEnum.Json,
          otherResponseInfo: "",
        });
      }
    } catch (err) {
      console.error("DeviceList error:", err);

      if (infoObj.EndCallback) {
        infoObj.EndCallback({
          result: ResultTypeEnum.Error,
          message: err,
          messageType: FetchResponseTypeEnum.Json,
          otherResponseInfo: "",
        });
      }
    } finally {
      if (infoObj.showLoader) dispatch(CloseLoader());
    }
  };

  return [GetDeviceListDetailAPI];
};

const RunDeviceListAPIHook = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const RunDeviceListAPI = async (infoObj: {
    data: {
      store: string;
      device_list_name: string;
      validate_only: boolean;
    };
    EndCallback?: (returnValue?: ResponseMessageInterface) => void;
    showLoader?: boolean;
    showToast?: boolean;
    saveResponse?: boolean;
  }) => {
    //Apre il loader, se richiesto
    if (infoObj.showLoader) {
      dispatch(OpenLoader());
    }

    //Id del toast
    let toastId: Id = -1;
    //Se deve mostrare il toast
    if (infoObj.showToast) {
      toastId = toast.loading(t("Operazione in corso..."));
    }

    try {
      const apiCall = await fetch(apiDomainString + "/run/device_list", {
        method: "POST",
        credentials: "include",
        body: JSON.stringify(infoObj.data),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const jsonResponse: string = await apiCall.text();

      const responseOk: boolean = apiCall.status == 200;

      //Controllo risposta
      if (!responseOk) {
        if (infoObj.EndCallback) {
          infoObj.EndCallback({
            result: ResultTypeEnum.Error,
            message: JSON.stringify(jsonResponse),
            messageType: FetchResponseTypeEnum.Json,
            otherResponseInfo: "",
          });
        }
        return;
      }

      //Se la risposta è positiva

      //Se deve salvare il valore
      if (infoObj?.saveResponse ?? true) {
      }

      //Callback di successo
      if (infoObj.EndCallback) {
        infoObj.EndCallback({
          result: ResultTypeEnum.Success,
          message: JSON.parse(jsonResponse),
          messageType: FetchResponseTypeEnum.Json,
          otherResponseInfo: "",
        });
      }

      //Se deve mostrare il toast
      if (infoObj.showToast) {
        //Imposta il toast di successo
        toast.update(toastId, {
          render: t("Operazione completata con successo!"),
          type: "success",
          isLoading: false,
          autoClose: 3000,
          closeButton: true,
        });
      }
    } catch (err) {
      console.error("dataOra error:", err);

      if (infoObj.EndCallback) {
        infoObj.EndCallback({
          result: ResultTypeEnum.Error,
          message: err,
          messageType: FetchResponseTypeEnum.Json,
          otherResponseInfo: "",
        });
      }

      //Se deve mostrare il toast
      if (infoObj.showToast) {
        //Imposta il toast di successo
        toast.update(toastId, {
          render: t("Errore durante l'operazione"),
          type: "error",
          isLoading: false,
          autoClose: 3000,
          closeButton: true,
        });
      }
    } finally {
      if (infoObj.showLoader) dispatch(CloseLoader());
    }
  };

  return [RunDeviceListAPI];
};

const GetEnrichedIdsAPIHook = () => {
  const dispatch = useDispatch();

  const GetEnrichedIdsAPI = async (infoObj: {
    EndCallback?: (returnValue?: ResponseMessageInterface) => void;
    showLoader?: boolean;
    saveResponse?: boolean;
  }) => {
    //Apre il loader, se richiesto
    if (infoObj.showLoader) {
      dispatch(OpenLoader());
    }

    try {
      const apiCall = await fetch(apiDomainString + "/enrich_device_list", {
        method: FetchMethodEnum.Get,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      //Risposta in base64
      const response: string = await apiCall.text();

      //Risposta in json
      const jsonResponse = JSON.parse(response);

      //Se deve salvare il valore
      if (infoObj?.saveResponse ?? true) {
        const deviceListList: DeviceListStoreFileInterface[] =
          jsonResponse?.enriched_device_list ?? [];

        dispatch(SetEnrichedValueSlice(deviceListList));
      }

      //Callback di successo
      if (infoObj.EndCallback) {
        infoObj.EndCallback({
          result: ResultTypeEnum.Success,
          message: jsonResponse,
          messageType: FetchResponseTypeEnum.Json,
          otherResponseInfo: "",
        });
      }
    } catch (err) {
      console.error("enriched error:", err);

      if (infoObj.EndCallback) {
        infoObj.EndCallback({
          result: ResultTypeEnum.Error,
          message: err,
          messageType: FetchResponseTypeEnum.Json,
          otherResponseInfo: "",
        });
      }
    } finally {
      if (infoObj.showLoader) dispatch(CloseLoader());
    }
  };

  return [GetEnrichedIdsAPI];
};

const GetEnrichedDetailAPIHook = () => {
  const dispatch = useDispatch();

  const GetEnrichedDetailAPI = async (infoObj: {
    data: {
      store: string;
      dl: string;
    };
    EndCallback?: (returnValue?: ResponseMessageInterface) => void;
    showLoader?: boolean;
    saveResponse?: boolean;
  }) => {
    //Apre il loader, se richiesto
    if (infoObj.showLoader) {
      dispatch(OpenLoader());
    }

    try {
      const apiCall = await fetch(
        apiDomainString +
          "/enrich/device_list/" +
          infoObj.data.store +
          "/" +
          infoObj.data.dl,
        {
          method: FetchMethodEnum.Get,
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      //Risposta in base64
      const response: string = await apiCall.text();

      //Risposta in json
      const jsonResponse = JSON.parse(response);

      //Se deve salvare il valore
      if (infoObj?.saveResponse ?? true) {
        dispatch(SetEnrichedDetailSlice(jsonResponse));
      }

      //Callback di successo
      if (infoObj.EndCallback) {
        infoObj.EndCallback({
          result: ResultTypeEnum.Success,
          message: jsonResponse,
          messageType: FetchResponseTypeEnum.Json,
          otherResponseInfo: "",
        });
      }
    } catch (err) {
      console.error("DeviceList error:", err);

      if (infoObj.EndCallback) {
        infoObj.EndCallback({
          result: ResultTypeEnum.Error,
          message: err,
          messageType: FetchResponseTypeEnum.Json,
          otherResponseInfo: "",
        });
      }
    } finally {
      if (infoObj.showLoader) dispatch(CloseLoader());
    }
  };

  return [GetEnrichedDetailAPI];
};



export {
  GetDeviceListDetailAPIHook,
  GetDeviceListIdsAPIHook,
  RunDeviceListAPIHook,
  GetEnrichedIdsAPIHook,
  GetEnrichedDetailAPIHook
};

