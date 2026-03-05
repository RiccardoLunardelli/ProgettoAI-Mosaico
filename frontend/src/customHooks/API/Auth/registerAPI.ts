import { useDispatch } from "react-redux";

import type { ResponseMessageInterface } from "../../../commons/commonsInterfaces";
import {
  FetchMethodEnum,
  FetchResponseTypeEnum,
  ResultTypeEnum,
} from "../../../commons/commonsEnums";
import { CheckAuthAPIHook } from "./checkAuthAPI";
import { SetAuthHook } from "../SetAuthHook";
import { apiDomainString } from "../../../commons/commonsVariables";
import {
  CloseLoader,
  OpenLoader,
} from "../../../stores/slices/Base/loaderSlice";

const RegisterAPIHook = () => {
  const dispatch = useDispatch();

  const { SetAuth } = SetAuthHook();
  const [CheckAuthAPI] = CheckAuthAPIHook();

  const RegisterAPI = async (infoObj: {
    data: {
      name: string;
      email: string;
      password: string;
    };
    EndCallback?: (returnValue?: ResponseMessageInterface) => void;
    showLoader?: boolean;
  }) => {
    //Apre il loader, se richiesto
    if (infoObj.showLoader) {
      dispatch(OpenLoader());
    }

    try {
      const apiCall = await fetch(apiDomainString + "/signup", {
        method: FetchMethodEnum.Post,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(infoObj.data),
        credentials: "include",
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

      //Callback di successo
      if (infoObj.EndCallback) {
        infoObj.EndCallback({
          result: ResultTypeEnum.Success,
          message: jsonResponse,
          messageType: FetchResponseTypeEnum.Json,
          otherResponseInfo: "",
        });
      }

      CheckAuthAPI({
        showLoader: infoObj.showLoader,
        saveResponse: true,
        EndCallback: infoObj.EndCallback,
      });
    } catch (err) {
      console.error("Register error:", err);

      SetAuth(false);

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

  return [RegisterAPI];
};

export { RegisterAPIHook };
