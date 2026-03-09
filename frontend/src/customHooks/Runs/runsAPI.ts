import { useDispatch } from "react-redux";
import { CloseLoader, OpenLoader } from "../../stores/slices/Base/loaderSlice";
import { apiDomainString } from "../../commons/commonsVariables";
import { SetRunDetailSlice, SetRunsListSlice, type RunListInterface } from "../../stores/slices/Base/runsListSlice";
import {
    FetchMethodEnum,
  FetchResponseTypeEnum,
  ResultTypeEnum,
} from "../../commons/commonsEnums";
import type { ResponseMessageInterface } from "../../commons/commonsInterfaces";

const GetRunIdsAPIHook = () => {
  const dispatch = useDispatch();

  const GetRunIdsAPI = async (infoObj: {
    EndCallback?: (returnValue?: ResponseMessageInterface) => void;
    showLoader?: boolean;
    saveResponse?: boolean;
  }) => {
    //Apre il loader, se richiesto
    if (infoObj.showLoader) {
      dispatch(OpenLoader());
    }

    try {
      const apiCall = await fetch(apiDomainString + "/runs/ids", {
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
        const runsList: RunListInterface[] = jsonResponse?.run_ids ?? [];

        dispatch(SetRunsListSlice(runsList));
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

  return [GetRunIdsAPI];
};

const GetRunDetailAPIHook = () => {
  const dispatch = useDispatch();

  const GetRunDetailAPI = async (infoObj: {
    data: {
        run_id: string
    },
    EndCallback?: (returnValue?: ResponseMessageInterface) => void;
    showLoader?: boolean;
    saveResponse?: boolean;
  }) => {
    //Apre il loader, se richiesto
    if (infoObj.showLoader) {
      dispatch(OpenLoader());
    }

    try {
      const apiCall = await fetch(apiDomainString + "/run_id/" + infoObj.data.run_id, {
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

        dispatch(SetRunDetailSlice(jsonResponse));
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
      console.error("RunDetail error:", err);

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

  return [GetRunDetailAPI];
};






export { GetRunIdsAPIHook, GetRunDetailAPIHook }