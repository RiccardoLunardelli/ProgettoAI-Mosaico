import { lazy, useState, Suspense, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CreateTemplateAPIHook } from "../../../customHooks/API/CreateTemplate/CreateTemplateAPI";
import { SetInputSlice } from "../../../stores/slices/Base/inputSlice";

const TabsTag = lazy(() =>
  import("rsuite").then((module) => ({ default: module.Tabs })),
);

const TabTag = lazy(() =>
  import("rsuite").then((module) => ({ default: module.Tab })),
);

const PanelTag = lazy(() =>
  import("rsuite").then((module) => ({ default: module.Panel })),
);

const ButtonTag = lazy(() =>
  import("rsuite").then((module) => ({ default: module.Button })),
);

const TemplateInfoTabTag = lazy(() => import("./Tabs/TemplateInfoTab"));
const ContinuosReadsTabTag = lazy(() => import("./Tabs/ContinuosReadsTab"));
const ParametersTabTag = lazy(() => import("./Tabs/ParametersTab"));
const CommandsTabTag = lazy(() => import("./Tabs/CommandsTab"));

const inputPrefix = "CreateTemplate";

interface ComponentStateInterface {
  activeTab: string;
  continuosReadsIds: number[];
  parametersIds: number[];
  commandsIds: number[];
}

interface InputSliceInterface {
  [key: string]: string;
}

function BuildHtmlMaskValueObject(
  inputSlice: InputSliceInterface,
  readId: number,
) {
  const result: {
    [key: string]: {
      it: string;
      en: string;
    };
  } = {};

  let rowIndex = 0;

  while (true) {
    const rowKey =
      inputSlice[
        `${inputPrefix}-ContinuosReads-${readId}-HTMLMaskValue-${rowIndex}-Key`
      ];

    const rowIt =
      inputSlice[
        `${inputPrefix}-ContinuosReads-${readId}-HTMLMaskValue-${rowIndex}-It`
      ];

    const rowEn =
      inputSlice[
        `${inputPrefix}-ContinuosReads-${readId}-HTMLMaskValue-${rowIndex}-En`
      ];

    const isUndefinedRow =
      rowKey === undefined && rowIt === undefined && rowEn === undefined;

    const isEmptyRow =
      (rowKey ?? "").trim() === "" &&
      (rowIt ?? "").trim() === "" &&
      (rowEn ?? "").trim() === "";

    if (isUndefinedRow || isEmptyRow) {
      break;
    }

    if ((rowKey ?? "").trim() !== "") {
      result[rowKey as string] = {
        it: rowIt ?? "",
        en: rowEn ?? "",
      };
    }

    rowIndex += 1;
  }

  return result;
}

function BuildHtmlMaskValueObjectForParameters(
  inputSlice: InputSliceInterface,
  parameterId: number,
) {
  const result: {
    [key: string]: {
      it: string;
      en: string;
    };
  } = {};

  let rowIndex = 0;

  while (true) {
    const rowKey =
      inputSlice[
        `${inputPrefix}-Parameters-${parameterId}-HTMLMaskValue-${rowIndex}-Key`
      ];

    const rowIt =
      inputSlice[
        `${inputPrefix}-Parameters-${parameterId}-HTMLMaskValue-${rowIndex}-It`
      ];

    const rowEn =
      inputSlice[
        `${inputPrefix}-Parameters-${parameterId}-HTMLMaskValue-${rowIndex}-En`
      ];

    const isUndefinedRow =
      rowKey === undefined && rowIt === undefined && rowEn === undefined;

    const isEmptyRow =
      (rowKey ?? "").trim() === "" &&
      (rowIt ?? "").trim() === "" &&
      (rowEn ?? "").trim() === "";

    if (isUndefinedRow || isEmptyRow) {
      break;
    }

    if ((rowKey ?? "").trim() !== "") {
      result[rowKey as string] = {
        it: rowIt ?? "",
        en: rowEn ?? "",
      };
    }

    rowIndex += 1;
  }

  return result;
}

function BuildHtmlMaskValueObjectForCommands(
  inputSlice: InputSliceInterface,
  commandId: number,
) {
  const result: {
    [key: string]: {
      it: string;
      en: string;
    };
  } = {};

  let rowIndex = 0;

  while (true) {
    const rowKey =
      inputSlice[
        `${inputPrefix}-Commands-${commandId}-HTMLMaskValue-${rowIndex}-Key`
      ];

    const rowIt =
      inputSlice[
        `${inputPrefix}-Commands-${commandId}-HTMLMaskValue-${rowIndex}-It`
      ];

    const rowEn =
      inputSlice[
        `${inputPrefix}-Commands-${commandId}-HTMLMaskValue-${rowIndex}-En`
      ];

    const isUndefinedRow =
      rowKey === undefined && rowIt === undefined && rowEn === undefined;

    const isEmptyRow =
      (rowKey ?? "").trim() === "" &&
      (rowIt ?? "").trim() === "" &&
      (rowEn ?? "").trim() === "";

    if (isUndefinedRow || isEmptyRow) {
      break;
    }

    if ((rowKey ?? "").trim() !== "") {
      result[rowKey as string] = {
        it: rowIt ?? "",
        en: rowEn ?? "",
      };
    }

    rowIndex += 1;
  }

  return result;
}

function GetFinalTemplateJson(
  inputSlice: InputSliceInterface,
  continuosReadsIds: number[],
  parametersIds: number[],
  commandsIds: number[],
) {
  function BuildMultiLangString(it: string, en: string): string {
    const result: { it?: string; en?: string } = {};

    if (it.trim() !== "") {
      result.it = it;
    }

    if (en.trim() !== "") {
      result.en = en;
    }

    if (Object.keys(result).length === 0) {
      return "";
    }

    return JSON.stringify(result);
  }

  return {
    TemplateInfo: {
      Author: inputSlice[`${inputPrefix}-TemplateInfo-Author`] ?? "",
      Category: inputSlice[`${inputPrefix}-TemplateInfo-Category`] ?? "",
      Name: inputSlice[`${inputPrefix}-TemplateInfo-Name`] ?? "",
      Product: inputSlice[`${inputPrefix}-TemplateInfo-Product`] ?? "",
      Version: inputSlice[`${inputPrefix}-TemplateInfo-Version`] ?? "",
    },
    ContinuosReads: continuosReadsIds.map((singleReadId) => {
      const multiLanguageDescriptionIt =
        inputSlice[
          `${inputPrefix}-ContinuosReads-${singleReadId}-MultiLanguageDescription-It`
        ] ?? "";

      const multiLanguageDescriptionEn =
        inputSlice[
          `${inputPrefix}-ContinuosReads-${singleReadId}-MultiLanguageDescription-En`
        ] ?? "";

      const htmlViewCategoryIt =
        inputSlice[
          `${inputPrefix}-ContinuosReads-${singleReadId}-HTMLViewCategory-It`
        ] ?? "";

      const htmlViewCategoryEn =
        inputSlice[
          `${inputPrefix}-ContinuosReads-${singleReadId}-HTMLViewCategory-En`
        ] ?? "";

      const aliasValue =
        inputSlice[`${inputPrefix}-ContinuosReads-${singleReadId}-Alias`] ?? "";

      const singleReadResult: any = {
        NameVariable:
          inputSlice[
            `${inputPrefix}-ContinuosReads-${singleReadId}-NameVariable`
          ] ?? "",
        Enable:
          inputSlice[`${inputPrefix}-ContinuosReads-${singleReadId}-Enable`] ===
          "true",
        MultiLanguageDescription: BuildMultiLangString(
          multiLanguageDescriptionIt,
          multiLanguageDescriptionEn,
        ),
        TroubleSettings:
          inputSlice[
            `${inputPrefix}-ContinuosReads-${singleReadId}-TroubleSettings`
          ] ?? "[]",
        Name:
          inputSlice[`${inputPrefix}-ContinuosReads-${singleReadId}-Name`] ??
          "",
        Description:
          inputSlice[
            `${inputPrefix}-ContinuosReads-${singleReadId}-Description`
          ] ?? "",
        Type: Number(
          inputSlice[`${inputPrefix}-ContinuosReads-${singleReadId}-Type`] ?? 0,
        ),
        Measurement:
          inputSlice[
            `${inputPrefix}-ContinuosReads-${singleReadId}-Measurement`
          ] ?? "",
        ShowIndexPage:
          inputSlice[
            `${inputPrefix}-ContinuosReads-${singleReadId}-ShowIndexPage`
          ] === "true",
        HTMLViewEnable: Number(
          inputSlice[
            `${inputPrefix}-ContinuosReads-${singleReadId}-HTMLViewEnable`
          ] ?? 0,
        ),
        HTMLViewCategory: BuildMultiLangString(
          htmlViewCategoryIt,
          htmlViewCategoryEn,
        ),
        HTMLViewIndexPosition: Number(
          inputSlice[
            `${inputPrefix}-ContinuosReads-${singleReadId}-HTMLViewIndexPosition`
          ] ?? 0,
        ),
        HTMLMaskValue: JSON.stringify(
          BuildHtmlMaskValueObject(inputSlice, singleReadId),
        ),
        Modbus: {
          Address: Number(
            inputSlice[
              `${inputPrefix}-ContinuosReads-${singleReadId}-Modbus-Address`
            ] ?? 0,
          ),
          GroupName:
            inputSlice[
              `${inputPrefix}-ContinuosReads-${singleReadId}-Modbus-GroupName`
            ] ?? "",
          RegisterType:
            inputSlice[
              `${inputPrefix}-ContinuosReads-${singleReadId}-Modbus-RegisterType`
            ] ?? "Coils",
        },
      };

      singleReadResult.Alias = aliasValue.trim() === "" ? null : aliasValue;

      return singleReadResult;
    }),
    Parameters: parametersIds.map((singleParameterId) => {
      const multiLanguageDescriptionIt =
        inputSlice[
          `${inputPrefix}-Parameters-${singleParameterId}-MultiLanguageDescription-It`
        ] ?? "";

      const multiLanguageDescriptionEn =
        inputSlice[
          `${inputPrefix}-Parameters-${singleParameterId}-MultiLanguageDescription-En`
        ] ?? "";

      const htmlViewCategoryIt =
        inputSlice[
          `${inputPrefix}-Parameters-${singleParameterId}-HTMLViewCategory-It`
        ] ?? "";

      const htmlViewCategoryEn =
        inputSlice[
          `${inputPrefix}-Parameters-${singleParameterId}-HTMLViewCategory-En`
        ] ?? "";

      const aliasValue =
        inputSlice[`${inputPrefix}-Parameters-${singleParameterId}-Alias`] ??
        "";

      const singleParameterResult: any = {
        NameVariable:
          inputSlice[
            `${inputPrefix}-Parameters-${singleParameterId}-NameVariable`
          ] ?? "",
        Label:
          inputSlice[`${inputPrefix}-Parameters-${singleParameterId}-Label`] ??
          "",
        Category:
          inputSlice[
            `${inputPrefix}-Parameters-${singleParameterId}-Category`
          ] ?? "",
        Default:
          inputSlice[
            `${inputPrefix}-Parameters-${singleParameterId}-Default`
          ] ?? "",
        Visibility:
          inputSlice[
            `${inputPrefix}-Parameters-${singleParameterId}-Visibility`
          ] ?? "",
        AccessLevel: Number(
          inputSlice[
            `${inputPrefix}-Parameters-${singleParameterId}-AccessLevel`
          ] ?? 0,
        ),
        AccessWriteLevel: Number(
          inputSlice[
            `${inputPrefix}-Parameters-${singleParameterId}-AccessWriteLevel`
          ] ?? 0,
        ),
        Enable:
          inputSlice[
            `${inputPrefix}-Parameters-${singleParameterId}-Enable`
          ] === "true",
        MultiLanguageDescription: BuildMultiLangString(
          multiLanguageDescriptionIt,
          multiLanguageDescriptionEn,
        ),
        TroubleSettings:
          inputSlice[
            `${inputPrefix}-Parameters-${singleParameterId}-TroubleSettings`
          ] ?? "[]",
        Name:
          inputSlice[`${inputPrefix}-Parameters-${singleParameterId}-Name`] ??
          "",
        Description:
          inputSlice[
            `${inputPrefix}-Parameters-${singleParameterId}-Description`
          ] ?? "",
        Type: Number(
          inputSlice[`${inputPrefix}-Parameters-${singleParameterId}-Type`] ??
            0,
        ),
        Measurement:
          inputSlice[
            `${inputPrefix}-Parameters-${singleParameterId}-Measurement`
          ] ?? "",
        ShowIndexPage:
          inputSlice[
            `${inputPrefix}-Parameters-${singleParameterId}-ShowIndexPage`
          ] === "true",
        HTMLViewEnable: Number(
          inputSlice[
            `${inputPrefix}-Parameters-${singleParameterId}-HTMLViewEnable`
          ] ?? 0,
        ),
        HTMLViewCategory: BuildMultiLangString(
          htmlViewCategoryIt,
          htmlViewCategoryEn,
        ),
        HTMLViewIndexPosition: Number(
          inputSlice[
            `${inputPrefix}-Parameters-${singleParameterId}-HTMLViewIndexPosition`
          ] ?? 0,
        ),
        HTMLMaskValue: JSON.stringify(
          BuildHtmlMaskValueObjectForParameters(inputSlice, singleParameterId),
        ),
        Modbus: {
          Address: Number(
            inputSlice[
              `${inputPrefix}-Parameters-${singleParameterId}-Modbus-Address`
            ] ?? 0,
          ),
          GroupName:
            inputSlice[
              `${inputPrefix}-Parameters-${singleParameterId}-Modbus-GroupName`
            ] ?? "",
          RegisterType:
            inputSlice[
              `${inputPrefix}-Parameters-${singleParameterId}-Modbus-RegisterType`
            ] ?? "Coils",
        },
      };

      singleParameterResult.Alias =
        aliasValue.trim() === "" ? null : aliasValue;

      return singleParameterResult;
    }),
    Commands: commandsIds.map((singleCommandId) => {
      const multiLanguageDescriptionIt =
        inputSlice[
          `${inputPrefix}-Commands-${singleCommandId}-MultiLanguageDescription-It`
        ] ?? "";

      const multiLanguageDescriptionEn =
        inputSlice[
          `${inputPrefix}-Commands-${singleCommandId}-MultiLanguageDescription-En`
        ] ?? "";

      const htmlViewCategoryIt =
        inputSlice[
          `${inputPrefix}-Commands-${singleCommandId}-HTMLViewCategory-It`
        ] ?? "";

      const htmlViewCategoryEn =
        inputSlice[
          `${inputPrefix}-Commands-${singleCommandId}-HTMLViewCategory-En`
        ] ?? "";

      const aliasValue =
        inputSlice[`${inputPrefix}-Commands-${singleCommandId}-Alias`] ?? "";

      return {
        NameVariable:
          inputSlice[
            `${inputPrefix}-Commands-${singleCommandId}-NameVariable`
          ] ?? "",
        ValueCommand:
          inputSlice[
            `${inputPrefix}-Commands-${singleCommandId}-ValueCommand`
          ] ?? "",
        AccessWriteLevel: Number(
          inputSlice[
            `${inputPrefix}-Commands-${singleCommandId}-AccessWriteLevel`
          ] ?? 0,
        ),
        Enable:
          inputSlice[`${inputPrefix}-Commands-${singleCommandId}-Enable`] ===
          "true",
        MultiLanguageDescription: BuildMultiLangString(
          multiLanguageDescriptionIt,
          multiLanguageDescriptionEn,
        ),
        TroubleSettings:
          inputSlice[
            `${inputPrefix}-Commands-${singleCommandId}-TroubleSettings`
          ] ?? "[]",
        Name:
          inputSlice[`${inputPrefix}-Commands-${singleCommandId}-Name`] ?? "",
        Alias: aliasValue.trim() === "" ? null : aliasValue,
        Description:
          inputSlice[
            `${inputPrefix}-Commands-${singleCommandId}-Description`
          ] ?? "",
        Type: Number(
          inputSlice[`${inputPrefix}-Commands-${singleCommandId}-Type`] ?? 0,
        ),
        Measurement:
          inputSlice[
            `${inputPrefix}-Commands-${singleCommandId}-Measurement`
          ] ?? "",
        ShowIndexPage:
          inputSlice[
            `${inputPrefix}-Commands-${singleCommandId}-ShowIndexPage`
          ] === "true",
        HTMLViewEnable: Number(
          inputSlice[
            `${inputPrefix}-Commands-${singleCommandId}-HTMLViewEnable`
          ] ?? 0,
        ),
        HTMLViewCategory: BuildMultiLangString(
          htmlViewCategoryIt,
          htmlViewCategoryEn,
        ),
        HTMLViewIndexPosition: Number(
          inputSlice[
            `${inputPrefix}-Commands-${singleCommandId}-HTMLViewIndexPosition`
          ] ?? 0,
        ),
        HTMLMaskValue: JSON.stringify(
          BuildHtmlMaskValueObjectForCommands(inputSlice, singleCommandId),
        ),
        Modbus: {
          Address: Number(
            inputSlice[
              `${inputPrefix}-Commands-${singleCommandId}-Modbus-Address`
            ] ?? 0,
          ),
          GroupName:
            inputSlice[
              `${inputPrefix}-Commands-${singleCommandId}-Modbus-GroupName`
            ] ?? "",
          RegisterType:
            inputSlice[
              `${inputPrefix}-Commands-${singleCommandId}-Modbus-RegisterType`
            ] ?? "Coils",
        },
      };
    }),
  };
}

function CreateTemplatePageTag() {
  const [CreateTemplateAPI] = CreateTemplateAPIHook();

  const dispatch = useDispatch();

  const inputSlice: { value: InputSliceInterface } = useSelector(
    (state: { inputSlice: { value: InputSliceInterface } }) => state.inputSlice,
  );

  const [componentState, setComponentState] = useState<ComponentStateInterface>(
    {
      activeTab: "TemplateInfo",
      continuosReadsIds: [],
      parametersIds: [],
      commandsIds: [],
    },
  );

  const finalTemplateJson = GetFinalTemplateJson(
    inputSlice.value ?? {},
    componentState.continuosReadsIds,
    componentState.parametersIds,
    componentState.commandsIds,
  );

  function HandleResetTemplateInfo() {
    [
      `${inputPrefix}-TemplateInfo-Author`,
      `${inputPrefix}-TemplateInfo-Category`,
      `${inputPrefix}-TemplateInfo-Name`,
      `${inputPrefix}-TemplateInfo-Product`,
      `${inputPrefix}-TemplateInfo-Version`,
    ].forEach((singleId) => {
      dispatch(
        SetInputSlice({
          id: singleId,
          value: "",
        }),
      );
    });
  }

  function HandleResetPageState() {
    setComponentState({
      activeTab: "TemplateInfo",
      continuosReadsIds: [],
      parametersIds: [],
      commandsIds: [],
    });
  }

  useEffect(() => {
    HandleResetTemplateInfo();
    HandleResetPageState();
  }, []);

  function HandleSaveTemplate() {
    CreateTemplateAPI({
      saveResponse: false,
      showLoader: true,
      showToast: true,
      data: {
        createTemplate: finalTemplateJson,
      },
      EndCallback() {},
    });
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#f9fafb",
        boxSizing: "border-box",
        overflow: "auto",
      }}
    >
      <div
        style={{
          fontSize: "24px",
          fontWeight: 700,
          color: "#111827",
          marginBottom: "16px",
        }}
      >
        Create Template
      </div>

      <div
        style={{
          display: "flex",
          gap: "20px",
          alignItems: "flex-start",
          zIndex: 1,
          marginLeft: "20px",
          marginRight: "20px",
        }}
      >
        <div
          style={{
            width: "62%",
            minWidth: "720px",
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
            padding: "18px",
            zIndex: 1,
          }}
        >
          <Suspense fallback={<></>}>
            <TabsTag
              activeKey={componentState.activeTab}
              onSelect={(eventKey) => {
                setComponentState((previousStateValue) => {
                  return {
                    ...previousStateValue,
                    activeTab: String(eventKey),
                  };
                });
              }}
              appearance="subtle"
            >
              <TabTag eventKey="TemplateInfo" title="TemplateInfo">
                <TemplateInfoTabTag />
              </TabTag>

              <TabTag eventKey="ContinuosReads" title="ContinuosReads">
                <ContinuosReadsTabTag
                  continuosReadsIds={componentState.continuosReadsIds}
                  setComponentState={setComponentState}
                />
              </TabTag>

              <TabTag eventKey="Parameters" title="Parameters">
                <ParametersTabTag
                  parametersIds={componentState.parametersIds}
                  setComponentState={setComponentState}
                />
              </TabTag>

              <TabTag eventKey="Commands" title="Commands">
                <CommandsTabTag
                  commandsIds={componentState.commandsIds}
                  setComponentState={setComponentState}
                />
              </TabTag>
            </TabsTag>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "20px",
                paddingTop: "16px",
                borderTop: "1px solid #e5e7eb",
              }}
            >
              <ButtonTag appearance="primary" onClick={HandleSaveTemplate}>
                Salva Template
              </ButtonTag>
            </div>
          </Suspense>
        </div>

        <div
          style={{
            width: "38%",
            minWidth: "420px",
            position: "sticky",
            top: "20px",
            zIndex: 1,
          }}
        >
          <Suspense fallback={<></>}>
            <PanelTag bordered header="Preview JSON">
              <pre
                style={{
                  margin: 0,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fontSize: "12px",
                  lineHeight: "18px",
                  color: "#111827",
                  maxHeight: "75vh",
                  overflow: "auto",
                }}
              >
                {JSON.stringify(finalTemplateJson, null, 2)}
              </pre>
            </PanelTag>
          </Suspense>
        </div>
      </div>
    </div>
  );
}

export default CreateTemplatePageTag;