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

interface CommandsTabTagPropsInterface {
  commandsIds: number[];
  setComponentState: Dispatch<SetStateAction<ComponentStateInterface>>;
}

interface InputSliceInterface {
  [key: string]: string;
}

interface LocalComponentStateInterface {
  showModal: boolean;
  selectedCommandId: number | null;
  isNewRecord: boolean;
}

interface HtmlMaskRowInterface {
  key: string;
  it: string;
  en: string;
}

interface ModalFormStateInterface {
  NameVariable: string;
  ValueCommand: string;
  AccessWriteLevel: number;
  Enable: boolean;
  MultiLanguageDescriptionIt: string;
  MultiLanguageDescriptionEn: string;
  TroubleSettings: string;
  Name: string;
  Alias: string;
  Description: string;
  Type: number;
  Measurement: string;
  ShowIndexPage: boolean;
  HTMLViewEnable: number;
  HTMLViewCategoryIt: string;
  HTMLViewCategoryEn: string;
  HTMLViewIndexPosition: number;
  HTMLMaskRows: HtmlMaskRowInterface[];
  ModbusAddress: number;
  ModbusGroupName: string;
  ModbusRegisterType: string;
}

const registerTypeOptions = [
  { label: "Coils", value: "Coils" },
  { label: "Discrete", value: "Discrete" },
  { label: "Registers", value: "Registers" },
  { label: "Input", value: "Inputs" },
  { label: "Nothing", value: "Nothing" },
];

function GetDefaultModalFormState(): ModalFormStateInterface {
  return {
    NameVariable: "",
    ValueCommand: "",
    AccessWriteLevel: 0,
    Enable: true,
    MultiLanguageDescriptionIt: "",
    MultiLanguageDescriptionEn: "",
    TroubleSettings: "[]",
    Name: "",
    Alias: "",
    Description: "",
    Type: 0,
    Measurement: "",
    ShowIndexPage: false,
    HTMLViewEnable: 0,
    HTMLViewCategoryIt: "",
    HTMLViewCategoryEn: "",
    HTMLViewIndexPosition: 0,
    HTMLMaskRows: [{ key: "", it: "", en: "" }],
    ModbusAddress: 0,
    ModbusGroupName: "",
    ModbusRegisterType: "Coils",
  };
}

function CommandsTabTag({
  commandsIds,
  setComponentState,
}: CommandsTabTagPropsInterface) {
  const dispatch = useDispatch();

  const [localComponentState, setLocalComponentState] =
    useState<LocalComponentStateInterface>({
      showModal: false,
      selectedCommandId: null,
      isNewRecord: false,
    });

  const [modalFormState, setModalFormState] =
    useState<ModalFormStateInterface>(GetDefaultModalFormState());

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

  function GetHtmlMaskRowsFromStore(commandId: number): HtmlMaskRowInterface[] {
    const result: HtmlMaskRowInterface[] = [];
    let rowIndex = 0;

    while (true) {
      const rowKey =
        inputSlice.value[
          `${inputPrefix}-Commands-${commandId}-HTMLMaskValue-${rowIndex}-Key`
        ];
      const rowIt =
        inputSlice.value[
          `${inputPrefix}-Commands-${commandId}-HTMLMaskValue-${rowIndex}-It`
        ];
      const rowEn =
        inputSlice.value[
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

  function BuildModalStateFromStore(commandId: number): ModalFormStateInterface {
    return {
      NameVariable:
        inputSlice.value[`${inputPrefix}-Commands-${commandId}-NameVariable`] ??
        "",
      ValueCommand:
        inputSlice.value[`${inputPrefix}-Commands-${commandId}-ValueCommand`] ??
        "",
      AccessWriteLevel: Number(
        inputSlice.value[
          `${inputPrefix}-Commands-${commandId}-AccessWriteLevel`
        ] ?? 0,
      ),
      Enable:
        inputSlice.value[`${inputPrefix}-Commands-${commandId}-Enable`] ===
        "true",
      MultiLanguageDescriptionIt:
        inputSlice.value[
          `${inputPrefix}-Commands-${commandId}-MultiLanguageDescription-It`
        ] ?? "",
      MultiLanguageDescriptionEn:
        inputSlice.value[
          `${inputPrefix}-Commands-${commandId}-MultiLanguageDescription-En`
        ] ?? "",
      TroubleSettings:
        inputSlice.value[
          `${inputPrefix}-Commands-${commandId}-TroubleSettings`
        ] ?? "[]",
      Name:
        inputSlice.value[`${inputPrefix}-Commands-${commandId}-Name`] ?? "",
      Alias:
        inputSlice.value[`${inputPrefix}-Commands-${commandId}-Alias`] ?? "",
      Description:
        inputSlice.value[
          `${inputPrefix}-Commands-${commandId}-Description`
        ] ?? "",
      Type: Number(
        inputSlice.value[`${inputPrefix}-Commands-${commandId}-Type`] ?? 0,
      ),
      Measurement:
        inputSlice.value[
          `${inputPrefix}-Commands-${commandId}-Measurement`
        ] ?? "",
      ShowIndexPage:
        inputSlice.value[
          `${inputPrefix}-Commands-${commandId}-ShowIndexPage`
        ] === "true",
      HTMLViewEnable: Number(
        inputSlice.value[
          `${inputPrefix}-Commands-${commandId}-HTMLViewEnable`
        ] ?? 0,
      ),
      HTMLViewCategoryIt:
        inputSlice.value[
          `${inputPrefix}-Commands-${commandId}-HTMLViewCategory-It`
        ] ?? "",
      HTMLViewCategoryEn:
        inputSlice.value[
          `${inputPrefix}-Commands-${commandId}-HTMLViewCategory-En`
        ] ?? "",
      HTMLViewIndexPosition: Number(
        inputSlice.value[
          `${inputPrefix}-Commands-${commandId}-HTMLViewIndexPosition`
        ] ?? 0,
      ),
      HTMLMaskRows: GetHtmlMaskRowsFromStore(commandId),
      ModbusAddress: Number(
        inputSlice.value[
          `${inputPrefix}-Commands-${commandId}-Modbus-Address`
        ] ?? 0,
      ),
      ModbusGroupName:
        inputSlice.value[
          `${inputPrefix}-Commands-${commandId}-Modbus-GroupName`
        ] ?? "",
      ModbusRegisterType:
        inputSlice.value[
          `${inputPrefix}-Commands-${commandId}-Modbus-RegisterType`
        ] ?? "Coils",
    };
  }

  function HandleOpenNewModal() {
    const newId = commandsIds.length > 0 ? Math.max(...commandsIds) + 1 : 0;

    setModalFormState(GetDefaultModalFormState());

    setLocalComponentState({
      showModal: true,
      selectedCommandId: newId,
      isNewRecord: true,
    });
  }

  function HandleOpenEditModal(commandId: number) {
    setModalFormState(BuildModalStateFromStore(commandId));

    setLocalComponentState({
      showModal: true,
      selectedCommandId: commandId,
      isNewRecord: false,
    });
  }

  function HandleCloseModal() {
    setLocalComponentState({
      showModal: false,
      selectedCommandId: null,
      isNewRecord: false,
    });

    setModalFormState(GetDefaultModalFormState());
  }

  function SaveModalFormIntoStore(commandId: number) {
    HandleSetInput(
      `${inputPrefix}-Commands-${commandId}-NameVariable`,
      modalFormState.NameVariable,
    );
    HandleSetInput(
      `${inputPrefix}-Commands-${commandId}-ValueCommand`,
      modalFormState.ValueCommand,
    );
    HandleSetInput(
      `${inputPrefix}-Commands-${commandId}-AccessWriteLevel`,
      String(Number(modalFormState.AccessWriteLevel ?? 0)),
    );
    HandleSetInput(
      `${inputPrefix}-Commands-${commandId}-Enable`,
      String(modalFormState.Enable),
    );
    HandleSetInput(
      `${inputPrefix}-Commands-${commandId}-MultiLanguageDescription-It`,
      modalFormState.MultiLanguageDescriptionIt,
    );
    HandleSetInput(
      `${inputPrefix}-Commands-${commandId}-MultiLanguageDescription-En`,
      modalFormState.MultiLanguageDescriptionEn,
    );
    HandleSetInput(
      `${inputPrefix}-Commands-${commandId}-TroubleSettings`,
      modalFormState.TroubleSettings,
    );
    HandleSetInput(
      `${inputPrefix}-Commands-${commandId}-Name`,
      modalFormState.Name,
    );
    HandleSetInput(
      `${inputPrefix}-Commands-${commandId}-Alias`,
      modalFormState.Alias,
    );
    HandleSetInput(
      `${inputPrefix}-Commands-${commandId}-Description`,
      modalFormState.Description,
    );
    HandleSetInput(
      `${inputPrefix}-Commands-${commandId}-Type`,
      String(Number(modalFormState.Type ?? 0)),
    );
    HandleSetInput(
      `${inputPrefix}-Commands-${commandId}-Measurement`,
      modalFormState.Measurement,
    );
    HandleSetInput(
      `${inputPrefix}-Commands-${commandId}-ShowIndexPage`,
      String(modalFormState.ShowIndexPage),
    );
    HandleSetInput(
      `${inputPrefix}-Commands-${commandId}-HTMLViewEnable`,
      String(Number(modalFormState.HTMLViewEnable ?? 0)),
    );
    HandleSetInput(
      `${inputPrefix}-Commands-${commandId}-HTMLViewCategory-It`,
      modalFormState.HTMLViewCategoryIt,
    );
    HandleSetInput(
      `${inputPrefix}-Commands-${commandId}-HTMLViewCategory-En`,
      modalFormState.HTMLViewCategoryEn,
    );
    HandleSetInput(
      `${inputPrefix}-Commands-${commandId}-HTMLViewIndexPosition`,
      String(Number(modalFormState.HTMLViewIndexPosition ?? 0)),
    );
    HandleSetInput(
      `${inputPrefix}-Commands-${commandId}-Modbus-Address`,
      String(Number(modalFormState.ModbusAddress ?? 0)),
    );
    HandleSetInput(
      `${inputPrefix}-Commands-${commandId}-Modbus-GroupName`,
      modalFormState.ModbusGroupName,
    );
    HandleSetInput(
      `${inputPrefix}-Commands-${commandId}-Modbus-RegisterType`,
      modalFormState.ModbusRegisterType,
    );

    modalFormState.HTMLMaskRows.forEach((singleRowValue, rowIndex) => {
      HandleSetInput(
        `${inputPrefix}-Commands-${commandId}-HTMLMaskValue-${rowIndex}-Key`,
        singleRowValue.key,
      );
      HandleSetInput(
        `${inputPrefix}-Commands-${commandId}-HTMLMaskValue-${rowIndex}-It`,
        singleRowValue.it,
      );
      HandleSetInput(
        `${inputPrefix}-Commands-${commandId}-HTMLMaskValue-${rowIndex}-En`,
        singleRowValue.en,
      );
    });

    HandleSetInput(
      `${inputPrefix}-Commands-${commandId}-HTMLMaskValue-${modalFormState.HTMLMaskRows.length}-Key`,
      "",
    );
    HandleSetInput(
      `${inputPrefix}-Commands-${commandId}-HTMLMaskValue-${modalFormState.HTMLMaskRows.length}-It`,
      "",
    );
    HandleSetInput(
      `${inputPrefix}-Commands-${commandId}-HTMLMaskValue-${modalFormState.HTMLMaskRows.length}-En`,
      "",
    );
  }

  function HandleSaveModal() {
    if (localComponentState.selectedCommandId === null) {
      return;
    }

    const commandId = localComponentState.selectedCommandId;

    SaveModalFormIntoStore(commandId);

    if (localComponentState.isNewRecord) {
      setComponentState((previousStateValue) => {
        return {
          ...previousStateValue,
          commandsIds: [...previousStateValue.commandsIds, commandId],
        };
      });
    }

    HandleCloseModal();
  }

  function HandleRemoveCommand(commandId: number) {
    setComponentState((previousStateValue) => {
      return {
        ...previousStateValue,
        commandsIds: previousStateValue.commandsIds.filter(
          (singleId) => singleId !== commandId,
        ),
      };
    });

    if (localComponentState.selectedCommandId === commandId) {
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

  const cardLabelStyle = {
    color: "#374151",
    fontWeight: 600,
  };

  const cardStyle = {
    borderRadius: "12px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
    padding: "16px",
    cursor: "pointer",
    transition: "0.2s",
    height: "170px",
  };

  const trashButtonStyle = {
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
          Commands
        </div>

        <Suspense fallback={<></>}>
          <ButtonTag
            clickCallBack={HandleOpenNewModal}
            textToSee="Aggiungi Command"
          />
        </Suspense>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "16px",
          overflow: "auto",
          height: "60vh",
        }}
      >
        {commandsIds.map((singleCommandId, index) => {
          const nameValue =
            inputSlice.value[`${inputPrefix}-Commands-${singleCommandId}-NameVariable`] ??
            "";

          const valueCommandValue =
            inputSlice.value[
              `${inputPrefix}-Commands-${singleCommandId}-ValueCommand`
            ] ?? "";

          const aliasValue =
            inputSlice.value[
              `${inputPrefix}-Commands-${singleCommandId}-Alias`
            ] ?? "";

          const enableValue =
            inputSlice.value[
              `${inputPrefix}-Commands-${singleCommandId}-Enable`
            ] === "true";

          return (
            <div
              key={singleCommandId}
              onClick={() => HandleOpenEditModal(singleCommandId)}
              style={cardStyle}
              className="HoverTransform"
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "12px",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "#111827",
                    wordBreak: "break-word",
                  }}
                >
                  {nameValue !== "" ? nameValue : `Command ${index + 1}`}
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      padding: "5px",
                      borderRadius: "999px",
                      backgroundColor: enableValue ? "#dcfce7" : "#fee2e2",
                      color: enableValue ? "#166534" : "#991b1b",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {enableValue ? "Enabled" : "Disabled"}
                  </div>

                  <div
                    onClick={(event) => {
                      event.stopPropagation();
                      HandleRemoveCommand(singleCommandId);
                    }}
                    style={trashButtonStyle}
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
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  fontSize: "13px",
                  color: "#6b7280",
                }}
              >
                <div>
                  <span style={cardLabelStyle}>ValueCommand:</span>{" "}
                  {valueCommandValue !== "" ? valueCommandValue : "-"}
                </div>

                <div>
                  <span style={cardLabelStyle}>Alias:</span>{" "}
                  {aliasValue !== "" ? aliasValue : "-"}
                </div>
              </div>
            </div>
          );
        })}
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
                ? "Nuovo Command"
                : "Modifica Command"}
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
                    <div style={labelStyle}>ValueCommand</div>
                    <InputTag
                      value={modalFormState.ValueCommand}
                      onChange={(value) =>
                        setModalFormState((previousStateValue) => {
                          return {
                            ...previousStateValue,
                            ValueCommand: value,
                          };
                        })
                      }
                    />
                  </div>

                  <div>
                    <div style={labelStyle}>AccessWriteLevel</div>
                    <InputNumberTag
                      value={modalFormState.AccessWriteLevel}
                      onChange={(value) =>
                        setModalFormState((previousStateValue) => {
                          return {
                            ...previousStateValue,
                            AccessWriteLevel: Number(value ?? 0),
                          };
                        })
                      }
                      style={{ width: "100%" }}
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
                    <div style={labelStyle}>Type</div>
                    <InputNumberTag
                      value={modalFormState.Type}
                      onChange={(value) =>
                        setModalFormState((previousStateValue) => {
                          return {
                            ...previousStateValue,
                            Type: Number(value ?? 0),
                          };
                        })
                      }
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
                  {modalFormState.HTMLMaskRows.map((singleRowValue, rowIndex) => {
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
                          clickCallBack={() => HandleRemoveHtmlMaskRow(rowIndex)}
                          textToSee="Rimuovi"
                        />
                      </div>
                    );
                  })}

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

export default CommandsTabTag;