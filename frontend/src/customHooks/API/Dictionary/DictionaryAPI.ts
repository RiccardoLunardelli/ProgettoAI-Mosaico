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
  SetDictionaryDetailSlice,
  SetDictionaryListSlice,
} from "../../../stores/slices/Base/dictionaryListSlice";
import { useTranslation } from "react-i18next";
import { toast, type Id } from "react-toastify";

const GetDictionaryIdsAPIHook = () => {
  const dispatch = useDispatch();

  const GetDictionaryIdsAPI = async (infoObj: {
    EndCallback?: (returnValue?: ResponseMessageInterface) => void;
    showLoader?: boolean;
    saveResponse?: boolean;
  }) => {
    if (infoObj.showLoader) {
      dispatch(OpenLoader());
    }

    try {
      const apiCall = await fetch(apiDomainString + "/dictionaries", {
        method: FetchMethodEnum.Get,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response: string = await apiCall.text();
      const jsonResponse = JSON.parse(response);

      if (infoObj?.saveResponse ?? true) {
        const dictionaryList: string[] = jsonResponse ?? [];
        dispatch(SetDictionaryListSlice(dictionaryList));
      }

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

  return [GetDictionaryIdsAPI];
};

const GetDictionaryDetailAPIHook = () => {
  const dispatch = useDispatch();

  const GetDictionaryDetailAPI = async (infoObj: {
    data: {
      id: string;
    };
    EndCallback?: (returnValue?: ResponseMessageInterface) => void;
    showLoader?: boolean;
    saveResponse?: boolean;
  }) => {
    if (infoObj.showLoader) {
      dispatch(OpenLoader());
    }

    try {
      const apiCall = await fetch(
        apiDomainString + "/dictionaries/" + infoObj.data.id,
        {
          method: FetchMethodEnum.Get,
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const response: string = await apiCall.text();
      const jsonResponse = JSON.parse(response);

      if (infoObj?.saveResponse ?? true) {
        dispatch(SetDictionaryDetailSlice(jsonResponse));
      }

      if (infoObj.EndCallback) {
        infoObj.EndCallback({
          result: ResultTypeEnum.Success,
          message: jsonResponse,
          messageType: FetchResponseTypeEnum.Json,
          otherResponseInfo: "",
        });
      }
    } catch (err) {
      console.error("Dictionary error:", err);

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

  return [GetDictionaryDetailAPI];
};

const UpdateDictionaryDetailAPIHook = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const UpdateDictionaryDetailAPI = async (infoObj: {
    data: {
      dictionary_name: string;
      dictionary_json: {};
    };
    EndCallback?: (returnValue?: ResponseMessageInterface) => void;
    showLoader?: boolean;
    showToast?: boolean;
    saveResponse?: boolean;
  }) => {
    if (infoObj.showLoader) {
      dispatch(OpenLoader());
    }

    let toastId: Id = -1;
    if (infoObj.showToast) {
      toastId = toast.loading(t("Operazione in corso..."));
    }

    try {
      const apiCall = await fetch(apiDomainString + "/dictionary/edit", {
        method: "POST",
        credentials: "include",
        body: JSON.stringify(infoObj.data),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const jsonResponse: string = await apiCall.text();
      const responseOk: boolean = apiCall.status == 200;

      if (!responseOk) {
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

      if (infoObj?.saveResponse ?? true) {
      }

      if (infoObj.EndCallback) {
        infoObj.EndCallback({
          result: ResultTypeEnum.Success,
          message: jsonResponse,
          messageType: FetchResponseTypeEnum.Json,
          otherResponseInfo: "",
        });
      }

      if (infoObj.showToast) {
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

      if (infoObj.showToast) {
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

  return [UpdateDictionaryDetailAPI];
};

const RunReportDictionaryAPIHook = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const RunReportDictionaryAPI = async (infoObj: {
    data: {
      dictionary_name: string;
      validate_only: boolean;
      mode: string;
      run_id: string;
      manual_mode: string;
      patch_json: {};
    };
    EndCallback?: (returnValue?: ResponseMessageInterface) => void;
    showLoader?: boolean;
    showToast?: boolean;
    saveResponse?: boolean;
  }) => {
    if (infoObj.showLoader) {
      dispatch(OpenLoader());
    }

    let toastId: Id = -1;

    if (infoObj.showToast) {
      toastId = toast.loading(t("Operazione in corso..."));
    }

    try {
      const apiCall = await fetch(apiDomainString + "/run/dictionary", {
        method: "POST",
        credentials: "include",
        body: JSON.stringify(infoObj.data),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const jsonResponse: string = await apiCall.text();
      const responseOk: boolean = apiCall.ok;

      if (!responseOk) {
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

      if (infoObj.EndCallback) {
        infoObj.EndCallback({
          result: ResultTypeEnum.Success,
          message: jsonResponse,
          messageType: FetchResponseTypeEnum.Json,
          otherResponseInfo: "",
        });
      }

      if (infoObj.showToast) {
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

      if (infoObj.showToast) {
        toast.update(toastId, {
          render: t("Errore durante l'operazione"),
          type: "error",
          isLoading: false,
          autoClose: 3000,
          closeButton: true,
        });
      }
    } finally {
      if (infoObj.showLoader) {
        dispatch(CloseLoader());
      }
    }
  };

  return [RunReportDictionaryAPI];
};

export {
  GetDictionaryIdsAPIHook,
  GetDictionaryDetailAPIHook,
  UpdateDictionaryDetailAPIHook,
  RunReportDictionaryAPIHook,
};