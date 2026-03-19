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
import { SetConfigDetailSlice, SetConfigListSlice } from "../../../stores/slices/Base/configListSlice";


const GetConfigListIdsAPIHook = () => {
  const dispatch = useDispatch();

  const GetConfigListIdsAPI = async (infoObj: {
    EndCallback?: (returnValue?: ResponseMessageInterface) => void;
    showLoader?: boolean;
    saveResponse?: boolean;
  }) => {
    if (infoObj.showLoader) {
      dispatch(OpenLoader());
    }

    try {
      const apiCall = await fetch(apiDomainString + "/config/device_list", {
        method: FetchMethodEnum.Get,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response: string = await apiCall.text();
      const jsonResponse = JSON.parse(response);

      if (infoObj?.saveResponse ?? true) {
        const configListList: string[] = jsonResponse ?? [];
        dispatch(SetConfigListSlice(configListList));
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

  return [GetConfigListIdsAPI];
};

const GetConfigListDetailAPIHook = () => {
  const dispatch = useDispatch();

  const GetConfigListDetailAPI = async (infoObj: {
    data: {
      name: string;
    };
    EndCallback?: (returnValue?: ResponseMessageInterface) => void;
    showLoader?: boolean;
    saveResponse?: boolean;
  }) => {
    if (infoObj.showLoader) {
      dispatch(OpenLoader());
    }

    try {
      const apiCall = await fetch(apiDomainString + "/config/content/" + infoObj.data.name, {
        method: FetchMethodEnum.Get,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response: string = await apiCall.text();
      const jsonResponse = JSON.parse(response);

      if (infoObj?.saveResponse ?? true) {
        dispatch(SetConfigDetailSlice(jsonResponse));
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
      console.error("ConfigList error:", err);

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

  return [GetConfigListDetailAPI];
};





export {
  GetConfigListIdsAPIHook,
  GetConfigListDetailAPIHook,
};