import {
  lazy,
  Suspense,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { SetInputSlice } from "../../../../stores/slices/Base/inputSlice";
import { Modal } from "rsuite";

const PanelTag = lazy(() =>
  import("rsuite").then((module) => ({ default: module.Panel })),
);
const InputTag = lazy(() =>
  import("rsuite").then((module) => ({ default: module.Input })),
);
const InputNumberTag = lazy(() =>
  import("rsuite").then((module) => ({ default: module.InputNumber })),
);
const ToggleTag = lazy(() =>
  import("rsuite").then((module) => ({ default: module.Toggle })),
);
const SelectPickerTag = lazy(() =>
  import("rsuite").then((module) => ({ default: module.SelectPicker })),
);

const ButtonTag = lazy(() => import("../../../button/BasicButtonGeneric"));

const inputPrefix = "CreateTemplate";

interface ComponentStateInterface {
  activeTab: string;
  continuosReadsIds: number[];
  parametersIds: number[];
  commandsIds: number[];
}

interface ContinuosReadsTabTagPropsInterface {
  continuosReadsIds: number[];
  setComponentState: Dispatch<SetStateAction<ComponentStateInterface>>;
}

interface InputSliceInterface {
  [key: string]: string;
}

interface LocalComponentStateInterface {
  showModal: boolean;
  selectedContinuosReadId: number | null;
  isNewRecord: boolean;
}

interface HtmlMaskRowInterface {
  key: string;
  it: string;
  en: string;
}

interface ModalFormStateInterface {
  NameVariable: string;
  Name: string;
  Description: string;
  Alias: string;
  Type: number;
  Measurement: string;
  Enable: boolean;
  ShowIndexPage: boolean;
  HTMLViewEnable: number;
  HTMLViewIndexPosition: number;
  TroubleSettings: string;
  MultiLanguageDescriptionIt: string;
  MultiLanguageDescriptionEn: string;
  HTMLViewCategoryIt: string;
  HTMLViewCategoryEn: string;
  ModbusAddress: number;
  ModbusGroupName: string;
  ModbusRegisterType: string;
  HTMLMaskRows: HtmlMaskRowInterface[];
}

const registerTypeOptions = [
  { label: "Coils", value: "Coils" },
  { label: "Discrete", value: "Discrete" },
  { label: "Registers", value: "Registers" },
  { label: "Inputs", value: "Inputs" },
  { label: "Nothing", value: "Nothing" },
];

const typeOptions = [
  { label: "Boolean", value: 0 },
  { label: "SByte", value: 1 },
  { label: "Byte", value: 2 },
  { label: "Int16", value: 3 },
  { label: "UInt16", value: 4 },
  { label: "Int32", value: 5 },
  { label: "UInt32", value: 6 },
  { label: "Int64", value: 7 },
  { label: "UInt64", value: 8 },
  { label: "Single", value: 9 },
  { label: "Double", value: 10 },
  { label: "DateTime", value: 11 },
  { label: "String", value: 12 },
];

function GetDefaultModalFormState(): ModalFormStateInterface {
  return {
    NameVariable: "",
    Name: "",
    Description: "",
    Alias: "",
    Type: 0,
    Measurement: "",
    Enable: true,
    ShowIndexPage: false,
    HTMLViewEnable: 0,
    HTMLViewIndexPosition: 0,
    TroubleSettings: "[]",
    MultiLanguageDescriptionIt: "",
    MultiLanguageDescriptionEn: "",
    HTMLViewCategoryIt: "",
    HTMLViewCategoryEn: "",
    ModbusAddress: 0,
    ModbusGroupName: "",
    ModbusRegisterType: "Coils",
    HTMLMaskRows: [{ key: "", it: "", en: "" }],
  };
}

function ContinuosReadsTabTag({
  continuosReadsIds,
  setComponentState,
}: ContinuosReadsTabTagPropsInterface) {
  const dispatch = useDispatch();

  const [localComponentState, setLocalComponentState] =
    useState<LocalComponentStateInterface>({
      showModal: false,
      selectedContinuosReadId: null,
      isNewRecord: false,
    });

  const [modalFormState, setModalFormState] = useState<ModalFormStateInterface>(
    GetDefaultModalFormState(),
  );

  const inputSlice: { value: InputSliceInterface } = useSelector(
    (state: { inputSlice: { value: InputSliceInterface } }) => state.inputSlice,
  );

  function HandleSetInput(inputId: string, value: string) {
    dispatch(
      SetInputSlice({
        id: inputId,
        value: value,
      }),
    );
  }

  function GetTypeLabel(typeValue: number | string) {
    const parsedType = Number(typeValue ?? 0);

    return (
      typeOptions.find((singleTypeOption) => singleTypeOption.value === parsedType)
        ?.label ?? String(parsedType)
    );
  }

  function GetHtmlMaskRowsFromStore(readId: number): HtmlMaskRowInterface[] {
    const result: HtmlMaskRowInterface[] = [];
    let rowIndex = 0;

    while (true) {
      const rowKey =
        inputSlice.value[
          `${inputPrefix}-ContinuosReads-${readId}-HTMLMaskValue-${rowIndex}-Key`
        ];
      const rowIt =
        inputSlice.value[
          `${inputPrefix}-ContinuosReads-${readId}-HTMLMaskValue-${rowIndex}-It`
        ];
      const rowEn =
        inputSlice.value[
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

      result.push({
        key: rowKey ?? "",
        it: rowIt ?? "",
        en: rowEn ?? "",
      });

      rowIndex += 1;
    }

    if (result.length === 0) {
      return [{ key: "", it: "", en: "" }];
    }

    return result;
  }

  function BuildModalStateFromStore(readId: number): ModalFormStateInterface {
    return {
      NameVariable:
        inputSlice.value[
          `${inputPrefix}-ContinuosReads-${readId}-NameVariable`
        ] ?? "",
      Name:
        inputSlice.value[`${inputPrefix}-ContinuosReads-${readId}-Name`] ?? "",
      Description:
        inputSlice.value[
          `${inputPrefix}-ContinuosReads-${readId}-Description`
        ] ?? "",
      Alias:
        inputSlice.value[`${inputPrefix}-ContinuosReads-${readId}-Alias`] ?? "",
      Type: Number(
        inputSlice.value[`${inputPrefix}-ContinuosReads-${readId}-Type`] ?? 0,
      ),
      Measurement:
        inputSlice.value[
          `${inputPrefix}-ContinuosReads-${readId}-Measurement`
        ] ?? "",
      Enable:
        inputSlice.value[`${inputPrefix}-ContinuosReads-${readId}-Enable`] ===
        "true",
      ShowIndexPage:
        inputSlice.value[
          `${inputPrefix}-ContinuosReads-${readId}-ShowIndexPage`
        ] === "true",
      HTMLViewEnable: Number(
        inputSlice.value[
          `${inputPrefix}-ContinuosReads-${readId}-HTMLViewEnable`
        ] ?? 0,
      ),
      HTMLViewIndexPosition: Number(
        inputSlice.value[
          `${inputPrefix}-ContinuosReads-${readId}-HTMLViewIndexPosition`
        ] ?? 0,
      ),
      TroubleSettings:
        inputSlice.value[
          `${inputPrefix}-ContinuosReads-${readId}-TroubleSettings`
        ] ?? "[]",
      MultiLanguageDescriptionIt:
        inputSlice.value[
          `${inputPrefix}-ContinuosReads-${readId}-MultiLanguageDescription-It`
        ] ?? "",
      MultiLanguageDescriptionEn:
        inputSlice.value[
          `${inputPrefix}-ContinuosReads-${readId}-MultiLanguageDescription-En`
        ] ?? "",
      HTMLViewCategoryIt:
        inputSlice.value[
          `${inputPrefix}-ContinuosReads-${readId}-HTMLViewCategory-It`
        ] ?? "",
      HTMLViewCategoryEn:
        inputSlice.value[
          `${inputPrefix}-ContinuosReads-${readId}-HTMLViewCategory-En`
        ] ?? "",
      ModbusAddress: Number(
        inputSlice.value[
          `${inputPrefix}-ContinuosReads-${readId}-Modbus-Address`
        ] ?? 0,
      ),
      ModbusGroupName:
        inputSlice.value[
          `${inputPrefix}-ContinuosReads-${readId}-Modbus-GroupName`
        ] ?? "",
      ModbusRegisterType:
        inputSlice.value[
          `${inputPrefix}-ContinuosReads-${readId}-Modbus-RegisterType`
        ] ?? "Coils",
      HTMLMaskRows: GetHtmlMaskRowsFromStore(readId),
    };
  }

  function HandleOpenNewModal() {
    const newId =
      continuosReadsIds.length > 0 ? Math.max(...continuosReadsIds) + 1 : 0;

    setModalFormState(GetDefaultModalFormState());

    setLocalComponentState({
      showModal: true,
      selectedContinuosReadId: newId,
      isNewRecord: true,
    });
  }

  function HandleOpenEditModal(readId: number) {
    setModalFormState(BuildModalStateFromStore(readId));

    setLocalComponentState({
      showModal: true,
      selectedContinuosReadId: readId,
      isNewRecord: false,
    });
  }

  function HandleCloseModal() {
    setLocalComponentState({
      showModal: false,
      selectedContinuosReadId: null,
      isNewRecord: false,
    });

    setModalFormState(GetDefaultModalFormState());
  }

  function SaveModalFormIntoStore(readId: number) {
    HandleSetInput(
      `${inputPrefix}-ContinuosReads-${readId}-NameVariable`,
      modalFormState.NameVariable,
    );
    HandleSetInput(
      `${inputPrefix}-ContinuosReads-${readId}-Name`,
      modalFormState.Name,
    );
    HandleSetInput(
      `${inputPrefix}-ContinuosReads-${readId}-Description`,
      modalFormState.Description,
    );
    HandleSetInput(
      `${inputPrefix}-ContinuosReads-${readId}-Alias`,
      modalFormState.Alias,
    );
    HandleSetInput(
      `${inputPrefix}-ContinuosReads-${readId}-Type`,
      String(Number(modalFormState.Type ?? 0)),
    );
    HandleSetInput(
      `${inputPrefix}-ContinuosReads-${readId}-Measurement`,
      modalFormState.Measurement,
    );
    HandleSetInput(
      `${inputPrefix}-ContinuosReads-${readId}-Enable`,
      String(modalFormState.Enable),
    );
    HandleSetInput(
      `${inputPrefix}-ContinuosReads-${readId}-ShowIndexPage`,
      String(modalFormState.ShowIndexPage),
    );
    HandleSetInput(
      `${inputPrefix}-ContinuosReads-${readId}-HTMLViewEnable`,
      String(Number(modalFormState.HTMLViewEnable ?? 0)),
    );
    HandleSetInput(
      `${inputPrefix}-ContinuosReads-${readId}-HTMLViewIndexPosition`,
      String(Number(modalFormState.HTMLViewIndexPosition ?? 0)),
    );
    HandleSetInput(
      `${inputPrefix}-ContinuosReads-${readId}-TroubleSettings`,
      modalFormState.TroubleSettings,
    );
    HandleSetInput(
      `${inputPrefix}-ContinuosReads-${readId}-MultiLanguageDescription-It`,
      modalFormState.MultiLanguageDescriptionIt,
    );
    HandleSetInput(
      `${inputPrefix}-ContinuosReads-${readId}-MultiLanguageDescription-En`,
      modalFormState.MultiLanguageDescriptionEn,
    );
    HandleSetInput(
      `${inputPrefix}-ContinuosReads-${readId}-HTMLViewCategory-It`,
      modalFormState.HTMLViewCategoryIt,
    );
    HandleSetInput(
      `${inputPrefix}-ContinuosReads-${readId}-HTMLViewCategory-En`,
      modalFormState.HTMLViewCategoryEn,
    );
    HandleSetInput(
      `${inputPrefix}-ContinuosReads-${readId}-Modbus-Address`,
      String(Number(modalFormState.ModbusAddress ?? 0)),
    );
    HandleSetInput(
      `${inputPrefix}-ContinuosReads-${readId}-Modbus-GroupName`,
      modalFormState.ModbusGroupName,
    );
    HandleSetInput(
      `${inputPrefix}-ContinuosReads-${readId}-Modbus-RegisterType`,
      modalFormState.ModbusRegisterType,
    );

    modalFormState.HTMLMaskRows.forEach((singleRowValue, rowIndex) => {
      HandleSetInput(
        `${inputPrefix}-ContinuosReads-${readId}-HTMLMaskValue-${rowIndex}-Key`,
        singleRowValue.key,
      );
      HandleSetInput(
        `${inputPrefix}-ContinuosReads-${readId}-HTMLMaskValue-${rowIndex}-It`,
        singleRowValue.it,
      );
      HandleSetInput(
        `${inputPrefix}-ContinuosReads-${readId}-HTMLMaskValue-${rowIndex}-En`,
        singleRowValue.en,
      );
    });

    HandleSetInput(
      `${inputPrefix}-ContinuosReads-${readId}-HTMLMaskValue-${modalFormState.HTMLMaskRows.length}-Key`,
      "",
    );
    HandleSetInput(
      `${inputPrefix}-ContinuosReads-${readId}-HTMLMaskValue-${modalFormState.HTMLMaskRows.length}-It`,
      "",
    );
    HandleSetInput(
      `${inputPrefix}-ContinuosReads-${readId}-HTMLMaskValue-${modalFormState.HTMLMaskRows.length}-En`,
      "",
    );
  }

  function HandleSaveModal() {
    if (localComponentState.selectedContinuosReadId === null) {
      return;
    }

    const readId = localComponentState.selectedContinuosReadId;

    SaveModalFormIntoStore(readId);

    if (localComponentState.isNewRecord) {
      setComponentState((previousStateValue) => {
        return {
          ...previousStateValue,
          continuosReadsIds: [...previousStateValue.continuosReadsIds, readId],
        };
      });
    }

    HandleCloseModal();
  }

  function HandleRemoveContinuosRead(readId: number) {
    setComponentState((previousStateValue) => {
      return {
        ...previousStateValue,
        continuosReadsIds: previousStateValue.continuosReadsIds.filter(
          (singleId) => singleId !== readId,
        ),
      };
    });

    if (localComponentState.selectedContinuosReadId === readId) {
      HandleCloseModal();
    }
  }

  function HandleAddHtmlMaskRow() {
    setModalFormState((previousStateValue) => {
      return {
        ...previousStateValue,
        HTMLMaskRows: [
          ...previousStateValue.HTMLMaskRows,
          { key: "", it: "", en: "" },
        ],
      };
    });
  }

  function HandleRemoveHtmlMaskRow(rowIndex: number) {
    setModalFormState((previousStateValue) => {
      if (previousStateValue.HTMLMaskRows.length === 1) {
        return previousStateValue;
      }

      return {
        ...previousStateValue,
        HTMLMaskRows: previousStateValue.HTMLMaskRows.filter(
          (_, index) => index !== rowIndex,
        ),
      };
    });
  }

  function HandleUpdateHtmlMaskRow(
    rowIndex: number,
    field: "key" | "it" | "en",
    value: string,
  ) {
    setModalFormState((previousStateValue) => {
      return {
        ...previousStateValue,
        HTMLMaskRows: previousStateValue.HTMLMaskRows.map(
          (singleRowValue, index) => {
            if (index !== rowIndex) {
              return singleRowValue;
            }

            return {
              ...singleRowValue,
              [field]: value,
            };
          },
        ),
      };
    });
  }

  const labelStyle = {
    fontSize: "13px",
    color: "#6b7280",
    fontWeight: 500,
    marginBottom: "8px",
  };

  const tableHeaderStyle = {
    textAlign: "left" as const,
    padding: "12px 14px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#374151",
    backgroundColor: "#f9fafb",
    borderBottom: "1px solid #e5e7eb",
    whiteSpace: "nowrap" as const,
  };

  const tableCellStyle = {
    padding: "12px 14px",
    fontSize: "13px",
    color: "#4b5563",
    borderBottom: "1px solid #eef2f7",
    verticalAlign: "middle" as const,
  };

  const actionButtonStyle = {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#6b7280",
    fontSize: "14px",
    cursor: "pointer",
    transition: "0.2s",
  };

  return (
    <div>
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            fontSize: "16px",
            fontWeight: 600,
            color: "#111827",
          }}
        >
          Continuos Reads
        </div>

        <Suspense fallback={<></>}>
          <ButtonTag
            clickCallBack={HandleOpenNewModal}
            textToSee="Aggiungi Continuos Read"
          />
        </Suspense>
      </div>

      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          overflow: "hidden",
          backgroundColor: "#ffffff",
        }}
      >
        <div
          style={{
            overflow: "auto",
            height: "60vh",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: "1100px",
            }}
          >
            <thead>
              <tr>
                <th style={tableHeaderStyle}>NameVariable</th>
                <th style={tableHeaderStyle}>Description</th>
                <th style={tableHeaderStyle}>Type</th>
                <th style={tableHeaderStyle}>Measurement</th>
                <th style={tableHeaderStyle}>Alias</th>
                <th style={tableHeaderStyle}>Enabled</th>
                <th style={tableHeaderStyle}>Azioni</th>
              </tr>
            </thead>

            <tbody>
              {continuosReadsIds.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      ...tableCellStyle,
                      textAlign: "center",
                      color: "#6b7280",
                      padding: "24px",
                    }}
                  >
                    Nessun Continuos Read presente
                  </td>
                </tr>
              ) : (
                continuosReadsIds.map((singleReadId, index) => {
                  const nameVariableValue =
                    inputSlice.value[
                      `${inputPrefix}-ContinuosReads-${singleReadId}-NameVariable`
                    ] ?? "";

                  const descriptionValue =
                    inputSlice.value[
                      `${inputPrefix}-ContinuosReads-${singleReadId}-Description`
                    ] ?? "";

                  const typeValue =
                    inputSlice.value[
                      `${inputPrefix}-ContinuosReads-${singleReadId}-Type`
                    ] ?? "0";

                  const measurementValue =
                    inputSlice.value[
                      `${inputPrefix}-ContinuosReads-${singleReadId}-Measurement`
                    ] ?? "";

                  const aliasValue =
                    inputSlice.value[
                      `${inputPrefix}-ContinuosReads-${singleReadId}-Alias`
                    ] ?? "";

                  const enableValue =
                    inputSlice.value[
                      `${inputPrefix}-ContinuosReads-${singleReadId}-Enable`
                    ] === "true";

                  return (
                    <tr
                      key={singleReadId}
                      onClick={() => HandleOpenEditModal(singleReadId)}
                      style={{
                        cursor: "pointer",
                        transition: "0.2s",
                      }}
                      className="HoverTransform"
                    >
                      <td style={tableCellStyle}>
                        {nameVariableValue !== ""
                          ? nameVariableValue
                          : `Continuos Read ${index + 1}`}
                      </td>

                      <td style={tableCellStyle}>
                        {descriptionValue !== "" ? descriptionValue : "-"}
                      </td>

                      <td style={tableCellStyle}>{GetTypeLabel(typeValue)}</td>

                      <td style={tableCellStyle}>
                        {measurementValue !== "" ? measurementValue : "-"}
                      </td>

                      <td style={tableCellStyle}>
                        {aliasValue !== "" ? aliasValue : "-"}
                      </td>

                      <td style={tableCellStyle}>
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "11px",
                            fontWeight: 600,
                            padding: "5px 10px",
                            borderRadius: "999px",
                            backgroundColor: enableValue ? "#dcfce7" : "#fee2e2",
                            color: enableValue ? "#166534" : "#991b1b",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {enableValue ? "Enabled" : "Disabled"}
                        </div>
                      </td>

                      <td style={tableCellStyle}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <div
                            onClick={(event) => {
                              event.stopPropagation();
                              HandleOpenEditModal(singleReadId);
                            }}
                            style={actionButtonStyle}
                            className="HoverTransform"
                          >
                            <span
                              className="material-symbols-outlined"
                              style={{ color: "#2563eb", fontSize: "18px" }}
                            >
                              edit
                            </span>
                          </div>

                          <div
                            onClick={(event) => {
                              event.stopPropagation();
                              HandleRemoveContinuosRead(singleReadId);
                            }}
                            style={actionButtonStyle}
                            className="HoverTransform"
                          >
                            <span
                              className="material-symbols-outlined"
                              style={{ color: "red", fontSize: "18px" }}
                            >
                              delete
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Suspense fallback={<></>}>
        <Modal
          open={localComponentState.showModal}
          onClose={HandleCloseModal}
          size="lg"
          overflow={true}
        >
          <Modal.Header>
            <Modal.Title>
              {localComponentState.isNewRecord
                ? "Nuovo Continous Read"
                : "Modifica Continous Read"}
            </Modal.Title>
          </Modal.Header>

          <Modal.Body
            style={{
              maxHeight: "75vh",
              overflow: "auto",
              paddingRight: "6px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "18px",
                padding: "4px",
              }}
            >
              <PanelTag bordered header="Informazioni principali">
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                  }}
                >
                  <div>
                    <div style={labelStyle}>NameVariable</div>
                    <InputTag
                      value={modalFormState.NameVariable}
                      onChange={(value) =>
                        setModalFormState((previousStateValue) => {
                          return {
                            ...previousStateValue,
                            NameVariable: value,
                          };
                        })
                      }
                    />
                  </div>

                  <div>
                    <div style={labelStyle}>Name</div>
                    <InputTag
                      value={modalFormState.Name}
                      onChange={(value) =>
                        setModalFormState((previousStateValue) => {
                          return {
                            ...previousStateValue,
                            Name: value,
                          };
                        })
                      }
                    />
                  </div>

                  <div>
                    <div style={labelStyle}>Description</div>
                    <InputTag
                      value={modalFormState.Description}
                      onChange={(value) =>
                        setModalFormState((previousStateValue) => {
                          return {
                            ...previousStateValue,
                            Description: value,
                          };
                        })
                      }
                    />
                  </div>

                  <div>
                    <div style={labelStyle}>Alias</div>
                    <InputTag
                      value={modalFormState.Alias}
                      onChange={(value) =>
                        setModalFormState((previousStateValue) => {
                          return {
                            ...previousStateValue,
                            Alias: value,
                          };
                        })
                      }
                    />
                  </div>

                  <div>
                    <div style={labelStyle}>Type</div>
                    <SelectPickerTag
                      data={typeOptions}
                      value={modalFormState.Type}
                      onChange={(value) =>
                        setModalFormState((previousStateValue) => {
                          return {
                            ...previousStateValue,
                            Type: Number(value ?? 0),
                          };
                        })
                      }
                      searchable={false}
                      cleanable={false}
                      style={{ width: "100%" }}
                    />
                  </div>

                  <div>
                    <div style={labelStyle}>Measurement</div>
                    <InputTag
                      value={modalFormState.Measurement}
                      onChange={(value) =>
                        setModalFormState((previousStateValue) => {
                          return {
                            ...previousStateValue,
                            Measurement: value,
                          };
                        })
                      }
                    />
                  </div>

                  <div>
                    <div style={labelStyle}>Enable</div>
                    <ToggleTag
                      checked={modalFormState.Enable}
                      onChange={(value) =>
                        setModalFormState((previousStateValue) => {
                          return {
                            ...previousStateValue,
                            Enable: value,
                          };
                        })
                      }
                    />
                  </div>

                  <div>
                    <div style={labelStyle}>ShowIndexPage</div>
                    <ToggleTag
                      checked={modalFormState.ShowIndexPage}
                      onChange={(value) =>
                        setModalFormState((previousStateValue) => {
                          return {
                            ...previousStateValue,
                            ShowIndexPage: value,
                          };
                        })
                      }
                    />
                  </div>

                  <div>
                    <div style={labelStyle}>HTMLViewEnable</div>
                    <InputNumberTag
                      value={modalFormState.HTMLViewEnable}
                      onChange={(value) =>
                        setModalFormState((previousStateValue) => {
                          return {
                            ...previousStateValue,
                            HTMLViewEnable: Number(value ?? 0),
                          };
                        })
                      }
                      style={{ width: "100%" }}
                    />
                  </div>

                  <div>
                    <div style={labelStyle}>HTMLViewIndexPosition</div>
                    <InputNumberTag
                      value={modalFormState.HTMLViewIndexPosition}
                      onChange={(value) =>
                        setModalFormState((previousStateValue) => {
                          return {
                            ...previousStateValue,
                            HTMLViewIndexPosition: Number(value ?? 0),
                          };
                        })
                      }
                      style={{ width: "100%" }}
                    />
                  </div>

                  <div style={{ gridColumn: "1 / span 2" }}>
                    <div style={labelStyle}>TroubleSettings</div>
                    <InputTag
                      as="textarea"
                      rows={3}
                      value={modalFormState.TroubleSettings}
                      onChange={(value) =>
                        setModalFormState((previousStateValue) => {
                          return {
                            ...previousStateValue,
                            TroubleSettings: value,
                          };
                        })
                      }
                    />
                  </div>
                </div>
              </PanelTag>

              <PanelTag bordered header="MultiLanguageDescription">
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                  }}
                >
                  <div>
                    <div style={labelStyle}>it</div>
                    <InputTag
                      value={modalFormState.MultiLanguageDescriptionIt}
                      onChange={(value) =>
                        setModalFormState((previousStateValue) => {
                          return {
                            ...previousStateValue,
                            MultiLanguageDescriptionIt: value,
                          };
                        })
                      }
                    />
                  </div>

                  <div>
                    <div style={labelStyle}>en</div>
                    <InputTag
                      value={modalFormState.MultiLanguageDescriptionEn}
                      onChange={(value) =>
                        setModalFormState((previousStateValue) => {
                          return {
                            ...previousStateValue,
                            MultiLanguageDescriptionEn: value,
                          };
                        })
                      }
                    />
                  </div>
                </div>
              </PanelTag>

              <PanelTag bordered header="HTMLViewCategory">
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                  }}
                >
                  <div>
                    <div style={labelStyle}>it</div>
                    <InputTag
                      value={modalFormState.HTMLViewCategoryIt}
                      onChange={(value) =>
                        setModalFormState((previousStateValue) => {
                          return {
                            ...previousStateValue,
                            HTMLViewCategoryIt: value,
                          };
                        })
                      }
                    />
                  </div>

                  <div>
                    <div style={labelStyle}>en</div>
                    <InputTag
                      value={modalFormState.HTMLViewCategoryEn}
                      onChange={(value) =>
                        setModalFormState((previousStateValue) => {
                          return {
                            ...previousStateValue,
                            HTMLViewCategoryEn: value,
                          };
                        })
                      }
                    />
                  </div>
                </div>
              </PanelTag>

              <PanelTag bordered header="HTMLMaskValue">
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {modalFormState.HTMLMaskRows.map(
                    (singleRowValue, rowIndex) => {
                      return (
                        <div
                          key={rowIndex}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "160px 1fr 1fr 120px",
                            gap: "12px",
                            alignItems: "end",
                            border: "1px solid #eef2f7",
                            borderRadius: "10px",
                            padding: "12px",
                          }}
                        >
                          <div>
                            <div style={labelStyle}>Key</div>
                            <InputTag
                              value={singleRowValue.key}
                              onChange={(value) =>
                                HandleUpdateHtmlMaskRow(rowIndex, "key", value)
                              }
                            />
                          </div>

                          <div>
                            <div style={labelStyle}>it</div>
                            <InputTag
                              value={singleRowValue.it}
                              onChange={(value) =>
                                HandleUpdateHtmlMaskRow(rowIndex, "it", value)
                              }
                            />
                          </div>

                          <div>
                            <div style={labelStyle}>en</div>
                            <InputTag
                              value={singleRowValue.en}
                              onChange={(value) =>
                                HandleUpdateHtmlMaskRow(rowIndex, "en", value)
                              }
                            />
                          </div>

                          <ButtonTag
                            clickCallBack={() =>
                              HandleRemoveHtmlMaskRow(rowIndex)
                            }
                            textToSee="Rimuovi"
                          />
                        </div>
                      );
                    },
                  )}

                  <div>
                    <ButtonTag
                      clickCallBack={HandleAddHtmlMaskRow}
                      textToSee="Aggiungi riga HTMLMaskValue"
                    />
                  </div>
                </div>
              </PanelTag>

              <PanelTag bordered header="Modbus">
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "16px",
                  }}
                >
                  <div>
                    <div style={labelStyle}>Address</div>
                    <InputNumberTag
                      value={modalFormState.ModbusAddress}
                      onChange={(value) =>
                        setModalFormState((previousStateValue) => {
                          return {
                            ...previousStateValue,
                            ModbusAddress: Number(value ?? 0),
                          };
                        })
                      }
                      style={{ width: "100%" }}
                    />
                  </div>

                  <div>
                    <div style={labelStyle}>GroupName</div>
                    <InputTag
                      value={modalFormState.ModbusGroupName}
                      onChange={(value) =>
                        setModalFormState((previousStateValue) => {
                          return {
                            ...previousStateValue,
                            ModbusGroupName: value,
                          };
                        })
                      }
                    />
                  </div>

                  <div>
                    <div style={labelStyle}>RegisterType</div>
                    <SelectPickerTag
                      data={registerTypeOptions}
                      value={modalFormState.ModbusRegisterType}
                      onChange={(value) =>
                        setModalFormState((previousStateValue) => {
                          return {
                            ...previousStateValue,
                            ModbusRegisterType: String(value ?? "Coils"),
                          };
                        })
                      }
                      searchable={false}
                      cleanable={false}
                      style={{ width: "100%" }}
                    />
                  </div>
                </div>
              </PanelTag>
            </div>
          </Modal.Body>

          <Modal.Footer>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <ButtonTag clickCallBack={HandleCloseModal} textToSee="Chiudi" />
              <ButtonTag clickCallBack={HandleSaveModal} textToSee="Salva" />
            </div>
          </Modal.Footer>
        </Modal>
      </Suspense>
    </div>
  );
}

export default ContinuosReadsTabTag;