import React, { lazy, Suspense } from "react";
import { Button, Divider, Panel } from "rsuite";
import { InputCaseEnum } from "../../commons/commonsEnums";

const TextInputTitleGenericTag = lazy(
  () => import("../input/GenericInput/TextInputTitleGeneric"),
);

function FieldWrapper({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: "13px",
          fontWeight: 600,
          color: "#374151",
        }}
      >
        {label} {required ? "*" : ""}
      </div>

      {children}
    </div>
  );
}

interface DynamicTemplateKeyValueEditorProps {
  label: string;
  value: Record<string, string>;
  keyLabel: string;
  valueLabel: string;
  suggestedKeys: string[];
  required?: boolean;
  onChange: (value: Record<string, string>) => void;
}

function DynamicTemplateKeyValueEditor({
  label,
  value,
  keyLabel,
  valueLabel,
  suggestedKeys,
  required = false,
  onChange,
}: DynamicTemplateKeyValueEditorProps) {
  const entries = Object.entries(value ?? {});

  const addEmptyEntry = () => {
    let newKey = "";
    let counter = 1;

    if (suggestedKeys.length > 0) {
      const availableSuggestedKey = suggestedKeys.find(
        (singleKey) => !(singleKey in (value ?? {})),
      );

      if (availableSuggestedKey) {
        newKey = availableSuggestedKey;
      }
    }

    while (
      !newKey ||
      Object.prototype.hasOwnProperty.call(value ?? {}, newKey)
    ) {
      newKey = `key_${counter}`;
      counter += 1;
    }

    onChange({
      ...(value ?? {}),
      [newKey]: "",
    });
  };

  const changeKey = (oldKey: string, newKey: string) => {
    if (!newKey || oldKey === newKey) return;

    const updated: Record<string, string> = {};
    Object.entries(value ?? {}).forEach(([singleKey, singleValue]) => {
      if (singleKey === oldKey) {
        updated[newKey] = singleValue;
      } else {
        updated[singleKey] = singleValue;
      }
    });

    onChange(updated);
  };

  const changeValue = (key: string, newVal: string) => {
    onChange({
      ...(value ?? {}),
      [key]: newVal,
    });
  };

  const removeEntry = (key: string) => {
    const updated = { ...(value ?? {}) };
    delete updated[key];
    onChange(updated);
  };

  return (
    <Panel
      bordered
      header={
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>
            {label} {required ? "*" : ""}
          </span>

          <Button appearance="primary" size="sm" onClick={addEmptyEntry}>
            Aggiungi
          </Button>
        </div>
      }
      style={{
        borderRadius: "10px",
        background: "#fafafa",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {entries.length === 0 && (
          <div
            style={{
              fontSize: "13px",
              color: "#6b7280",
            }}
          >
            Nessuna coppia key/value presente
          </div>
        )}

        {entries.map(([entryKey, entryValue], index) => (
          <div key={`${entryKey}-${index}`}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr auto",
                gap: "10px",
                alignItems: "end",
              }}
            >
              <FieldWrapper label={keyLabel}>
                <Suspense>
                  <TextInputTitleGenericTag
                    idInput={`${entryKey}-key`}
                    title=""
                    otherTitleInfo=""
                    placeholder=""
                    inputCase={InputCaseEnum.Insentive}
                    disabled={false}
                    value={entryKey}
                    OnChange={(newValue: string) =>
                      changeKey(entryKey, newValue)
                    }
                  />
                </Suspense>
              </FieldWrapper>

              <FieldWrapper label={valueLabel}>
                <Suspense>
                  <TextInputTitleGenericTag
                    idInput={`${entryKey}-value`}
                    title=""
                    otherTitleInfo=""
                    placeholder=""
                    inputCase={InputCaseEnum.Insentive}
                    disabled={false}
                    value={entryValue}
                    OnChange={(newValue: string) =>
                      changeValue(entryKey, newValue)
                    }
                  />
                </Suspense>
              </FieldWrapper>

              <Button
                appearance="ghost"
                color="red"
                size="sm"
                onClick={() => removeEntry(entryKey)}
              >
                Rimuovi
              </Button>
            </div>

            {index < entries.length - 1 && <Divider />}
          </div>
        ))}
      </div>
    </Panel>
  );
}

export default DynamicTemplateKeyValueEditor;
export { FieldWrapper };