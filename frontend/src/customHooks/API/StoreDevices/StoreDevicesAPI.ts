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
  SetStoreDevicesListSlice,
  type StoreDevicesListInterface,
} from "../../../stores/slices/Base/storeDevicesListSlice";

const GetStoreDevicesListAPIHook = () => {
  const dispatch = useDispatch();

  const GetStoreDevicesListAPI = async (infoObj: {
    EndCallback?: (returnValue?: ResponseMessageInterface) => void;
    showLoader?: boolean;
    saveResponse?: boolean;
  }) => {
    if (infoObj.showLoader) {
      dispatch(OpenLoader());
    }

    try {
      const apiCall = await fetch(apiDomainString + "/devices", {
        method: FetchMethodEnum.Get,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response: string = await apiCall.text();
      const jsonResponse = JSON.parse(response);

      if (infoObj?.saveResponse ?? true) {
        const storeDevicesListList: StoreDevicesListInterface[] =
          jsonResponse ?? [];

        dispatch(SetStoreDevicesListSlice(storeDevicesListList));
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
      console.error("StoreDevicesList error:", err);

      if (infoObj.EndCallback) {
        infoObj.EndCallback({
          result: ResultTypeEnum.Error,
          message: err,
          messageType: FetchResponseTypeEnum.Json,
          otherResponseInfo: "",
        });
      }
    } finally {
      if (infoObj.showLoader) {
        dispatch(CloseLoader());
      }
    }
  };

  return [GetStoreDevicesListAPI];
};

const UpdateStoreDevicesListAPIHook = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const UpdateStoreDevicesListAPI = async (infoObj: {
    data: {
      id: string;
      store_id: string;
      description: string;
      hd_plc: string;
      id_template: string;
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
      const apiCall = await fetch(apiDomainString + "/update_device", {
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
      console.error("UpdateStoreDevices error:", err);

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

  return [UpdateStoreDevicesListAPI];
};

const DeleteStoreDevicesListAPIHook = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const DeleteStoreDevicesListAPI = async (infoObj: {
    data: {
      id: string;
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
      const apiCall = await fetch(apiDomainString + "/delete_device", {
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
      console.error("DeleteStoreDevices error:", err);

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

  return [DeleteStoreDevicesListAPI];
};

const InsertStoreDevicesListAPIHook = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const InsertStoreDevicesListAPI = async (infoObj: {
    data: {
      store_id: string;
      description: string;
      hd_plc: string;
      id_template: string;
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
      const apiCall = await fetch(apiDomainString + "/insert_device", {
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
      console.error("InsertStoreDevices error:", err);

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

  return [InsertStoreDevicesListAPI];
};

export {
  GetStoreDevicesListAPIHook,
  UpdateStoreDevicesListAPIHook,
  DeleteStoreDevicesListAPIHook,
  InsertStoreDevicesListAPIHook,
};
