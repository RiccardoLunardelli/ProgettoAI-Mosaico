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
  SetTemplateDetailSlice,
  SetTemplateListSlice,
  SetTemplatePercentualSlice,
} from "../../../stores/slices/Base/templateListSlice";
import type { TemplateBaseListInterface } from "../../../stores/slices/Base/templateBaseListSlice";

const GetTemplateIdsAPIHook = () => {
  const dispatch = useDispatch();

  const GetTemplateIdsAPI = async (infoObj: {
    EndCallback?: (returnValue?: ResponseMessageInterface) => void;
    showLoader?: boolean;
    saveResponse?: boolean;
  }) => {
    //Apre il loader, se richiesto
    if (infoObj.showLoader) {
      dispatch(OpenLoader());
    }

    try {
      const apiCall = await fetch(apiDomainString + "/templates", {
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
        const templateBaseList: TemplateBaseListInterface[] = jsonResponse ?? [];

        dispatch(SetTemplateListSlice(templateBaseList));
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

  return [GetTemplateIdsAPI];
};

const GetTemplateDetailAPIHook = () => {
  const dispatch = useDispatch();

  const GetTemplateDetailAPI = async (infoObj: {
    data: {
      id: string;
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
        apiDomainString + "/templates/" + infoObj.data.id,
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
        dispatch(SetTemplateDetailSlice(jsonResponse));
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
      console.error("template error:", err);

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

  return [GetTemplateDetailAPI];
};

const RunTemplateStartAPIHook = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const RunTemplateStartAPI = async (infoObj: {
    data: {
      id: string;
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
      const apiCall = await fetch(apiDomainString + "/run/template/start", {
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
          render: t("Matching eseguito con successo!"),
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

  return [RunTemplateStartAPI];
};

const RunTemplateLLMAPIHook = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const RunTemplateLLMAPI = async (infoObj: {
    data: {
      run_id: string;
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
      const apiCall = await fetch(apiDomainString + "/run/template/llm", {
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

  return [RunTemplateLLMAPI];
};

const GetTemplatePercentualAPIHook = () => {
  const dispatch = useDispatch();

  const GetTemplatePercentualAPI = async (infoObj: {
    data: {
      id: string;
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
        apiDomainString + "/llm/percentual?run_id=" + infoObj.data.id,
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
        dispatch(SetTemplatePercentualSlice(jsonResponse));
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
      console.error("template error:", err);

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

  return [GetTemplatePercentualAPI];
};

const RunTemplateFinishAPIHook = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const RunTemplateFinishAPI = async (infoObj: {
    data: {
      run_id: string;
      template_name: string;
      validate_only: boolean;
      apply_llm: boolean;
      llm_patch_actions: {};
    };
    EndCallback?: (returnValue?: ResponseMessageInterface) => void;
    showLoader?: boolean;
    showToast?: boolean;
    saveResponse?: boolean;
  }) => {
    if (infoObj.showLoader) {
      dispatch(OpenLoader());
    }

    let toastId: Id | undefined = undefined;

    if (infoObj.showToast) {
      toastId = toast.loading(t("Operazione in corso..."));
    }

    try {
      console.log("RunTemplateFinishAPI payload:", infoObj.data);

      const apiCall = await fetch(apiDomainString + "/run/template/finish", {
        method: "POST",
        credentials: "include",
        body: JSON.stringify(infoObj.data),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const responseText = await apiCall.text();

      console.log("RunTemplateFinishAPI status:", apiCall.status);
      console.log("RunTemplateFinishAPI response:", responseText);

      if (!apiCall.ok) {
        if (infoObj.EndCallback) {
          infoObj.EndCallback({
            result: ResultTypeEnum.Error,
            message: responseText,
            messageType: FetchResponseTypeEnum.Json,
            otherResponseInfo: "",
          });
        }

        if (infoObj.showToast && toastId !== undefined) {
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
          message: responseText,
          messageType: FetchResponseTypeEnum.Json,
          otherResponseInfo: "",
        });
      }

      if (infoObj.showToast && toastId !== undefined) {
        toast.update(toastId, {
          render: t("Operazione completata con successo!"),
          type: "success",
          isLoading: false,
          autoClose: 3000,
          closeButton: true,
        });
      }
    } catch (err) {
      console.error("RunTemplateFinishAPI error:", err);

      if (infoObj.EndCallback) {
        infoObj.EndCallback({
          result: ResultTypeEnum.Error,
          message: String(err),
          messageType: FetchResponseTypeEnum.Json,
          otherResponseInfo: "",
        });
      }

      if (infoObj.showToast && toastId !== undefined) {
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

  return [RunTemplateFinishAPI] as const;
};

export {
  GetTemplateIdsAPIHook,
  GetTemplateDetailAPIHook,
  RunTemplateStartAPIHook,
  RunTemplateLLMAPIHook,
  GetTemplatePercentualAPIHook,
  RunTemplateFinishAPIHook,
};
