import { useDispatch } from "react-redux";
import type { ResponseMessageInterface } from "../../../commons/commonsInterfaces";
import { CloseLoader, OpenLoader } from "../../../stores/slices/Base/loaderSlice";
import { FetchMethodEnum, FetchResponseTypeEnum, ResultTypeEnum } from "../../../commons/commonsEnums";
import { apiDomainString } from "../../../commons/commonsVariables";
import { SetKnowledgeBaseDetailSlice, SetKnowledgeBaseListSlice } from "../../../stores/slices/Base/knowledgeBaseListSlice";


const GetKnoledgeBaseIdsAPIHook = () => {
  const dispatch = useDispatch();

  const GetKnoledgeBaseIdsAPI = async (infoObj: {
    EndCallback?: (returnValue?: ResponseMessageInterface) => void;
    showLoader?: boolean;
    saveResponse?: boolean;
  }) => {
    //Apre il loader, se richiesto
    if (infoObj.showLoader) {
      dispatch(OpenLoader());
    }

    try {
      const apiCall = await fetch(apiDomainString + "/kb", {
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
        const knowledgeBaseList: string[] = jsonResponse ?? [];

        dispatch(SetKnowledgeBaseListSlice(knowledgeBaseList));
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

  return [GetKnoledgeBaseIdsAPI];
};

const GetKnowledgeBaseDetailAPIHook = () => {
  const dispatch = useDispatch();

  const GetKnowledgeBaseDetailAPI = async (infoObj: {
    data: {
        id: string
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
      const apiCall = await fetch(apiDomainString + "/kb/" + infoObj.data.id, {
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

        dispatch(SetKnowledgeBaseDetailSlice(jsonResponse));
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
      console.error("KnowledgeBase error:", err);

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

  return [GetKnowledgeBaseDetailAPI];
};



export { GetKnoledgeBaseIdsAPIHook, GetKnowledgeBaseDetailAPIHook }