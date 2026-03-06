import { useDispatch } from "react-redux";

import type { ResponseMessageInterface } from "../../../commons/commonsInterfaces";
import {
  FetchMethodEnum,
  FetchResponseTypeEnum,
  ResultTypeEnum,
} from "../../../commons/commonsEnums";
import { apiDomainString } from "../../../commons/commonsVariables";
import {
  CloseLoader,
  OpenLoader,
} from "../../../stores/slices/Base/loaderSlice";
import { SetAuthHook } from "../SetAuthHook";
import type { UserInfoInterface } from "../../../stores/slices/Base/userInfoSlice";

const CheckAuthAPIHook = () => {
  const dispatch = useDispatch();

  const { SetAuth } = SetAuthHook();

  const CheckAuthAPI = async (infoObj: {
    EndCallback?: (returnValue?: ResponseMessageInterface) => void;
    showLoader?: boolean;
    saveResponse?: boolean;
  }) => {
    //Apre il loader, se richiesto
    if (infoObj.showLoader) {
      dispatch(OpenLoader());
    }

    try {
      const apiCall = await fetch(apiDomainString + "/checkauth", {
        method: FetchMethodEnum.Get,
        credentials: "include",
      });

      const response = await apiCall.text();

      const jsonResponse = JSON.parse(response);

      const isAuthenticated = jsonResponse.isvalid === true;

      const infoUserObj: UserInfoInterface = {
        id: jsonResponse.user?.sub ?? "",
        email: jsonResponse.user?.email ?? "",
        name: jsonResponse.user?.name ?? "",
      };

      SetAuth(isAuthenticated, infoUserObj);

      if (infoObj.EndCallback) {
        infoObj.EndCallback({
          result: response ? ResultTypeEnum.Success : ResultTypeEnum.Error,
          message: jsonResponse,
          messageType: FetchResponseTypeEnum.Json,
          otherResponseInfo: "",
        });
      }
    } catch (err) {
      console.error("CheckAuth error:", err);

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

  return [CheckAuthAPI];
};

export { CheckAuthAPIHook };
