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
  { label: "Input", value: "Inputs" },
  { label: "Nothing", value: "Nothing" },
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
    height: "150px",
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
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "16px",
          overflow: "auto",
          height: "60vh",
        }}
      >
        {continuosReadsIds.map((singleReadId, index) => {
            
            const NameVariable =
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

          const enableValue =
            inputSlice.value[
              `${inputPrefix}-ContinuosReads-${singleReadId}-Enable`
            ] === "true";

          const aliasValue =
            inputSlice.value[
              `${inputPrefix}-ContinuosReads-${singleReadId}-Alias`
            ] ?? "";

          const measurementValue =
            inputSlice.value[
              `${inputPrefix}-ContinuosReads-${singleReadId}-Measurement`
            ] ?? "";

          return (
            <div
              key={singleReadId}
              onClick={() => HandleOpenEditModal(singleReadId)}
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
                  {NameVariable !== "" ? NameVariable : `Continuos Read ${index + 1}`}
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
                      HandleRemoveContinuosRead(singleReadId);
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
                  <span style={cardLabelStyle}>Description:</span>{" "}
                  {descriptionValue !== "" ? descriptionValue : "-"}
                </div>

                <div>
                  <span style={cardLabelStyle}>Type:</span> {typeValue}
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

export default ContinuosReadsTabTag;
