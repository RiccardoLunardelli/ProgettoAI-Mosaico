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
  commandsIds: number[]
}

interface ParametersTabTagPropsInterface {
  parametersIds: number[];
  setComponentState: Dispatch<SetStateAction<ComponentStateInterface>>;
}

interface InputSliceInterface {
  [key: string]: string;
}

interface LocalComponentStateInterface {
  showModal: boolean;
  selectedParameterId: number | null;
  isNewRecord: boolean;
}

interface HtmlMaskRowInterface {
  key: string;
  it: string;
  en: string;
}

interface ModalFormStateInterface {
  NameVariable: string;
  Label: string;
  Alias: string;
  Category: string;
  Default: string;
  Visibility: string;
  AccessLevel: number;
  AccessWriteLevel: number;
  Enable: boolean;
  MultiLanguageDescriptionIt: string;
  MultiLanguageDescriptionEn: string;
  TroubleSettings: string;
  Name: string;
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
    Label: "",
    Alias: "",
    Category: "",
    Default: "",
    Visibility: "",
    AccessLevel: 0,
    AccessWriteLevel: 0,
    Enable: true,
    MultiLanguageDescriptionIt: "",
    MultiLanguageDescriptionEn: "",
    TroubleSettings: "[]",
    Name: "",
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

function ParametersTabTag({
  parametersIds,
  setComponentState,
}: ParametersTabTagPropsInterface) {
  const dispatch = useDispatch();

  const [localComponentState, setLocalComponentState] =
    useState<LocalComponentStateInterface>({
      showModal: false,
      selectedParameterId: null,
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

  function GetHtmlMaskRowsFromStore(
    parameterId: number,
  ): HtmlMaskRowInterface[] {
    const result: HtmlMaskRowInterface[] = [];
    let rowIndex = 0;

    while (true) {
      const rowKey =
        inputSlice.value[
          `${inputPrefix}-Parameters-${parameterId}-HTMLMaskValue-${rowIndex}-Key`
        ];
      const rowIt =
        inputSlice.value[
          `${inputPrefix}-Parameters-${parameterId}-HTMLMaskValue-${rowIndex}-It`
        ];
      const rowEn =
        inputSlice.value[
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

  function BuildModalStateFromStore(
    parameterId: number,
  ): ModalFormStateInterface {
    return {
      NameVariable:
        inputSlice.value[
          `${inputPrefix}-Parameters-${parameterId}-NameVariable`
        ] ?? "",
      Label:
        inputSlice.value[`${inputPrefix}-Parameters-${parameterId}-Label`] ??
        "",
      Alias:
        inputSlice.value[`${inputPrefix}-Parameters-${parameterId}-Alias`] ??
        "",
      Category:
        inputSlice.value[`${inputPrefix}-Parameters-${parameterId}-Category`] ??
        "",
      Default:
        inputSlice.value[`${inputPrefix}-Parameters-${parameterId}-Default`] ??
        "",
      Visibility:
        inputSlice.value[
          `${inputPrefix}-Parameters-${parameterId}-Visibility`
        ] ?? "",
      AccessLevel: Number(
        inputSlice.value[
          `${inputPrefix}-Parameters-${parameterId}-AccessLevel`
        ] ?? 0,
      ),
      AccessWriteLevel: Number(
        inputSlice.value[
          `${inputPrefix}-Parameters-${parameterId}-AccessWriteLevel`
        ] ?? 0,
      ),
      Enable:
        inputSlice.value[`${inputPrefix}-Parameters-${parameterId}-Enable`] ===
        "true",
      MultiLanguageDescriptionIt:
        inputSlice.value[
          `${inputPrefix}-Parameters-${parameterId}-MultiLanguageDescription-It`
        ] ?? "",
      MultiLanguageDescriptionEn:
        inputSlice.value[
          `${inputPrefix}-Parameters-${parameterId}-MultiLanguageDescription-En`
        ] ?? "",
      TroubleSettings:
        inputSlice.value[
          `${inputPrefix}-Parameters-${parameterId}-TroubleSettings`
        ] ?? "[]",
      Name:
        inputSlice.value[`${inputPrefix}-Parameters-${parameterId}-Name`] ?? "",
      Description:
        inputSlice.value[
          `${inputPrefix}-Parameters-${parameterId}-Description`
        ] ?? "",
      Type: Number(
        inputSlice.value[`${inputPrefix}-Parameters-${parameterId}-Type`] ?? 0,
      ),
      Measurement:
        inputSlice.value[
          `${inputPrefix}-Parameters-${parameterId}-Measurement`
        ] ?? "",
      ShowIndexPage:
        inputSlice.value[
          `${inputPrefix}-Parameters-${parameterId}-ShowIndexPage`
        ] === "true",
      HTMLViewEnable: Number(
        inputSlice.value[
          `${inputPrefix}-Parameters-${parameterId}-HTMLViewEnable`
        ] ?? 0,
      ),
      HTMLViewCategoryIt:
        inputSlice.value[
          `${inputPrefix}-Parameters-${parameterId}-HTMLViewCategory-It`
        ] ?? "",
      HTMLViewCategoryEn:
        inputSlice.value[
          `${inputPrefix}-Parameters-${parameterId}-HTMLViewCategory-En`
        ] ?? "",
      HTMLViewIndexPosition: Number(
        inputSlice.value[
          `${inputPrefix}-Parameters-${parameterId}-HTMLViewIndexPosition`
        ] ?? 0,
      ),
      HTMLMaskRows: GetHtmlMaskRowsFromStore(parameterId),
      ModbusAddress: Number(
        inputSlice.value[
          `${inputPrefix}-Parameters-${parameterId}-Modbus-Address`
        ] ?? 0,
      ),
      ModbusGroupName:
        inputSlice.value[
          `${inputPrefix}-Parameters-${parameterId}-Modbus-GroupName`
        ] ?? "",
      ModbusRegisterType:
        inputSlice.value[
          `${inputPrefix}-Parameters-${parameterId}-Modbus-RegisterType`
        ] ?? "Coils",
    };
  }

  function HandleOpenNewModal() {
    const newId = parametersIds.length > 0 ? Math.max(...parametersIds) + 1 : 0;

    setModalFormState(GetDefaultModalFormState());

    setLocalComponentState({
      showModal: true,
      selectedParameterId: newId,
      isNewRecord: true,
    });
  }

  function HandleOpenEditModal(parameterId: number) {
    setModalFormState(BuildModalStateFromStore(parameterId));

    setLocalComponentState({
      showModal: true,
      selectedParameterId: parameterId,
      isNewRecord: false,
    });
  }

  function HandleCloseModal() {
    setLocalComponentState({
      showModal: false,
      selectedParameterId: null,
      isNewRecord: false,
    });

    setModalFormState(GetDefaultModalFormState());
  }

  function SaveModalFormIntoStore(parameterId: number) {
    HandleSetInput(
      `${inputPrefix}-Parameters-${parameterId}-NameVariable`,
      modalFormState.NameVariable,
    );
    HandleSetInput(
      `${inputPrefix}-Parameters-${parameterId}-Label`,
      modalFormState.Label,
    );
    HandleSetInput(
      `${inputPrefix}-Parameters-${parameterId}-Alias`,
      modalFormState.Alias,
    );
    HandleSetInput(
      `${inputPrefix}-Parameters-${parameterId}-Category`,
      modalFormState.Category,
    );
    HandleSetInput(
      `${inputPrefix}-Parameters-${parameterId}-Default`,
      modalFormState.Default,
    );
    HandleSetInput(
      `${inputPrefix}-Parameters-${parameterId}-Visibility`,
      modalFormState.Visibility,
    );
    HandleSetInput(
      `${inputPrefix}-Parameters-${parameterId}-AccessLevel`,
      String(Number(modalFormState.AccessLevel ?? 0)),
    );
    HandleSetInput(
      `${inputPrefix}-Parameters-${parameterId}-AccessWriteLevel`,
      String(Number(modalFormState.AccessWriteLevel ?? 0)),
    );
    HandleSetInput(
      `${inputPrefix}-Parameters-${parameterId}-Enable`,
      String(modalFormState.Enable),
    );
    HandleSetInput(
      `${inputPrefix}-Parameters-${parameterId}-MultiLanguageDescription-It`,
      modalFormState.MultiLanguageDescriptionIt,
    );
    HandleSetInput(
      `${inputPrefix}-Parameters-${parameterId}-MultiLanguageDescription-En`,
      modalFormState.MultiLanguageDescriptionEn,
    );
    HandleSetInput(
      `${inputPrefix}-Parameters-${parameterId}-TroubleSettings`,
      modalFormState.TroubleSettings,
    );
    HandleSetInput(
      `${inputPrefix}-Parameters-${parameterId}-Name`,
      modalFormState.Name,
    );
    HandleSetInput(
      `${inputPrefix}-Parameters-${parameterId}-Description`,
      modalFormState.Description,
    );
    HandleSetInput(
      `${inputPrefix}-Parameters-${parameterId}-Type`,
      String(Number(modalFormState.Type ?? 0)),
    );
    HandleSetInput(
      `${inputPrefix}-Parameters-${parameterId}-Measurement`,
      modalFormState.Measurement,
    );
    HandleSetInput(
      `${inputPrefix}-Parameters-${parameterId}-ShowIndexPage`,
      String(modalFormState.ShowIndexPage),
    );
    HandleSetInput(
      `${inputPrefix}-Parameters-${parameterId}-HTMLViewEnable`,
      String(Number(modalFormState.HTMLViewEnable ?? 0)),
    );
    HandleSetInput(
      `${inputPrefix}-Parameters-${parameterId}-HTMLViewCategory-It`,
      modalFormState.HTMLViewCategoryIt,
    );
    HandleSetInput(
      `${inputPrefix}-Parameters-${parameterId}-HTMLViewCategory-En`,
      modalFormState.HTMLViewCategoryEn,
    );
    HandleSetInput(
      `${inputPrefix}-Parameters-${parameterId}-HTMLViewIndexPosition`,
      String(Number(modalFormState.HTMLViewIndexPosition ?? 0)),
    );
    HandleSetInput(
      `${inputPrefix}-Parameters-${parameterId}-Modbus-Address`,
      String(Number(modalFormState.ModbusAddress ?? 0)),
    );
    HandleSetInput(
      `${inputPrefix}-Parameters-${parameterId}-Modbus-GroupName`,
      modalFormState.ModbusGroupName,
    );
    HandleSetInput(
      `${inputPrefix}-Parameters-${parameterId}-Modbus-RegisterType`,
      modalFormState.ModbusRegisterType,
    );

    modalFormState.HTMLMaskRows.forEach((singleRowValue, rowIndex) => {
      HandleSetInput(
        `${inputPrefix}-Parameters-${parameterId}-HTMLMaskValue-${rowIndex}-Key`,
        singleRowValue.key,
      );
      HandleSetInput(
        `${inputPrefix}-Parameters-${parameterId}-HTMLMaskValue-${rowIndex}-It`,
        singleRowValue.it,
      );
      HandleSetInput(
        `${inputPrefix}-Parameters-${parameterId}-HTMLMaskValue-${rowIndex}-En`,
        singleRowValue.en,
      );
    });

    HandleSetInput(
      `${inputPrefix}-Parameters-${parameterId}-HTMLMaskValue-${modalFormState.HTMLMaskRows.length}-Key`,
      "",
    );
    HandleSetInput(
      `${inputPrefix}-Parameters-${parameterId}-HTMLMaskValue-${modalFormState.HTMLMaskRows.length}-It`,
      "",
    );
    HandleSetInput(
      `${inputPrefix}-Parameters-${parameterId}-HTMLMaskValue-${modalFormState.HTMLMaskRows.length}-En`,
      "",
    );
  }

  function HandleSaveModal() {
    if (localComponentState.selectedParameterId === null) {
      return;
    }

    const parameterId = localComponentState.selectedParameterId;

    SaveModalFormIntoStore(parameterId);

    if (localComponentState.isNewRecord) {
      setComponentState((previousStateValue) => {
        return {
          ...previousStateValue,
          parametersIds: [...previousStateValue.parametersIds, parameterId],
        };
      });
    }

    HandleCloseModal();
  }

  function HandleRemoveParameter(parameterId: number) {
    setComponentState((previousStateValue) => {
      return {
        ...previousStateValue,
        parametersIds: previousStateValue.parametersIds.filter(
          (singleId) => singleId !== parameterId,
        ),
      };
    });

    if (localComponentState.selectedParameterId === parameterId) {
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
          Parameters
        </div>

        <Suspense fallback={<></>}>
          <ButtonTag
            clickCallBack={HandleOpenNewModal}
            textToSee="Aggiungi Parameter"
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
        {parametersIds.map((singleParameterId, index) => {
            
            const NameVariable =
            inputSlice.value[
              `${inputPrefix}-Parameters-${singleParameterId}-NameVariable`
            ] ?? "";

          const nameValue =
            inputSlice.value[
              `${inputPrefix}-Parameters-${singleParameterId}-Name`
            ] ?? "";

          const categoryValue =
            inputSlice.value[
              `${inputPrefix}-Parameters-${singleParameterId}-Category`
            ] ?? "";

          const measurementValue =
            inputSlice.value[
              `${inputPrefix}-Parameters-${singleParameterId}-Measurement`
            ] ?? "";

          const enableValue =
            inputSlice.value[
              `${inputPrefix}-Parameters-${singleParameterId}-Enable`
            ] === "true";

          const aliasValue =
            inputSlice.value[
              `${inputPrefix}-Parameters-${singleParameterId}-Alias`
            ] ?? "";

          return (
            <div
              key={singleParameterId}
              onClick={() => HandleOpenEditModal(singleParameterId)}
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
                  {NameVariable !== "" ? NameVariable : `Parameter ${index + 1}`}
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
                      HandleRemoveParameter(singleParameterId);
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
                  <span style={cardLabelStyle}>Name:</span>{" "}
                  {nameValue !== "" ? nameValue : "-"}
                </div>

                <div>
                  <span style={cardLabelStyle}>Category:</span>{" "}
                  {categoryValue !== "" ? categoryValue : "-"}
                </div>

                <div>
                  <span style={cardLabelStyle}>Measurement:</span>{" "}
                  {measurementValue !== "" ? measurementValue : "-"}
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
                ? "Nuovo Parameter"
                : "Modifica Parameter"}
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
                    <div style={labelStyle}>Label</div>
                    <InputTag
                      value={modalFormState.Label}
                      onChange={(value) =>
                        setModalFormState((previousStateValue) => {
                          return {
                            ...previousStateValue,
                            Label: value,
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
                    <div style={labelStyle}>Category</div>
                    <InputTag
                      value={modalFormState.Category}
                      onChange={(value) =>
                        setModalFormState((previousStateValue) => {
                          return {
                            ...previousStateValue,
                            Category: value,
                          };
                        })
                      }
                    />
                  </div>

                  <div>
                    <div style={labelStyle}>Default</div>
                    <InputTag
                      value={modalFormState.Default}
                      onChange={(value) =>
                        setModalFormState((previousStateValue) => {
                          return {
                            ...previousStateValue,
                            Default: value,
                          };
                        })
                      }
                    />
                  </div>

                  <div>
                    <div style={labelStyle}>Visibility</div>
                    <InputTag
                      value={modalFormState.Visibility}
                      onChange={(value) =>
                        setModalFormState((previousStateValue) => {
                          return {
                            ...previousStateValue,
                            Visibility: value,
                          };
                        })
                      }
                    />
                  </div>

                  <div>
                    <div style={labelStyle}>AccessLevel</div>
                    <InputNumberTag
                      value={modalFormState.AccessLevel}
                      onChange={(value) =>
                        setModalFormState((previousStateValue) => {
                          return {
                            ...previousStateValue,
                            AccessLevel: Number(value ?? 0),
                          };
                        })
                      }
                      style={{ width: "100%" }}
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

export default ParametersTabTag;
