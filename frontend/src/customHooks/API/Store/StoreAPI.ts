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
import { useTranslation } from "react-i18next";
import { toast, type Id } from "react-toastify";
import {
  SetStoreListSlice,
  type StoreListInterface,
} from "../../../stores/slices/Base/storeListSlice";

const GetStoreListAPIHook = () => {
  const dispatch = useDispatch();

  const GetStoreListAPI = async (infoObj: {
    EndCallback?: (returnValue?: ResponseMessageInterface) => void;
    showLoader?: boolean;
    saveResponse?: boolean;
  }) => {
    //Apre il loader, se richiesto
    if (infoObj.showLoader) {
      dispatch(OpenLoader());
    }

    try {
      const apiCall = await fetch(apiDomainString + "/list_store", {
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
        const storeListList: StoreListInterface[] = jsonResponse ?? [];

        dispatch(SetStoreListSlice(storeListList));
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
      console.error("StoreList error:", err);

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

  return [GetStoreListAPI];
};

const UpdateStoreListAPIHook = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const UpdateStoreListAPI = async (infoObj: {
    data: {
      id: string;
      client_id: string;
      name: string;
      new_name: string;
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
      const apiCall = await fetch(apiDomainString + "/update_store", {
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

        if (infoObj.showToast) {
          toast.update(toastId, {
            render: t("Errore durante l'operazione"),
            type: "error",
            isLoading: false,
            autoClose: 3000,
            closeButton: true,
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
          message: jsonResponse,
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
      console.error("UserUpdate error:", err);

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

  return [UpdateStoreListAPI];
};

const DeleteStoreListAPIHook = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const DeleteStoreListAPI = async (infoObj: {
    data: {
      name: string;
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
      const apiCall = await fetch(apiDomainString + "/delete_store", {
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

        if (infoObj.showToast) {
          toast.update(toastId, {
            render: t("Errore durante l'operazione"),
            type: "error",
            isLoading: false,
            autoClose: 3000,
            closeButton: true,
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
          message: jsonResponse,
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
      console.error("Delete User error:", err);

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

  return [DeleteStoreListAPI];
};

const InsertStoreListAPIHook = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const InsertStoreListAPI = async (infoObj: {
    data: {
      client_id: string;
      store: string;
      content: any[];
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
      const apiCall = await fetch(apiDomainString + "/upsert_store", {
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

        if (infoObj.showToast) {
          toast.update(toastId, {
            render: t("Errore durante l'operazione"),
            type: "error",
            isLoading: false,
            autoClose: 3000,
            closeButton: true,
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
          message: jsonResponse,
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
      console.error("Delete User error:", err);

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

  return [InsertStoreListAPI];
};

export {
  GetStoreListAPIHook,
  UpdateStoreListAPIHook,
  DeleteStoreListAPIHook,
  InsertStoreListAPIHook,
};
