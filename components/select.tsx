import React, { useEffect, useImperativeHandle, useRef, useState } from "react";
import ReactSelect, {
  createFilter,
  SelectInstance,
} from "react-select";
import {
  DARK_TEXT_COLOR,
  FOREGROUND_COLOR,
  FOREGROUND_COLOR_DARK,
} from "../lib/client/theme";
import Input from "./input";

export interface SelectHandle {
  get value(): string | null;
  clear(): void;
}

export interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  onChange?(value: string | null): void;
  options: Option[];
  placeholder?: string;
  noOptionsMessage?: string;
}

export default React.forwardRef<SelectHandle, SelectProps>(function Select(
  { onChange, options, placeholder, noOptionsMessage },
  ref
) {
  const selectRef = useRef<SelectInstance<Option> | null>(null);

  useEffect(() => {
    const value = selectRef.current?.getValue()?.[0];
    if (value === undefined) return;

    for (const option of options) {
      if (option.value === value.value) {
        if (option.label !== value.label) {
          selectRef.current?.selectOption(option);
        }

        return;
      }
    }

    selectRef.current?.clearValue();
  }, [options]);

  useImperativeHandle(ref, () => ({
    get value() {
      return selectRef.current?.getValue()?.[0]?.value ?? null;
    },
    clear(): void {
      selectRef.current?.clearValue();
    },
  }));

  const [ssr, setSsr] = useState(true);
  useEffect(() => setSsr(false), []);

  if (ssr) {
    return <Input placeholder={placeholder} />;
  }

  return (
    <ReactSelect
      ref={(select) => {
        selectRef.current = select as SelectInstance<Option>;
      }}
      filterOption={createFilter({ stringify: (option) => option.label })}
      onChange={(value: any) => {
        if (onChange !== undefined) {
          onChange(value?.value ?? null);
        }
      }}
      options={options}
      placeholder={placeholder ?? ""}
      noOptionsMessage={() => noOptionsMessage ?? "No options"}
      styles={styles as any}
    />
  );
});

const styles: any = {
  container: (provided: any) => ({
    ...provided,
    width: "100%",
  }),
  control: (provided: any) => ({
    ...provided,
    backgroundColor: FOREGROUND_COLOR,
    border: `0.125rem solid ${FOREGROUND_COLOR_DARK}`,
    borderRadius: "0.25rem",
    padding: "0.125rem 0.25rem",
    minHeight: "2rem",
    cursor: "text",
    boxShadow: "none",
    "&:hover": {
      border: `0.125rem solid ${FOREGROUND_COLOR_DARK}`,
    },
  }),
  valueContainer: (provided: any) => ({
    ...provided,
    padding: 0,
    width: 0,
  }),
  placeholder: (provided: any) => ({
    ...provided,
    marginLeft: 0,
    marginRight: 0,
  }),
  input: (provided: any) => ({
    ...provided,
    margin: 0,
    paddingTop: 0,
    paddingBottom: 0,
  }),
  singleValue: (provided: any) => ({
    ...provided,
    marginLeft: 0,
    marginRight: 0,
  }),
  indicatorsContainer: (provided: any) => ({
    ...provided,
    height: "1.5rem",
    cursor: "pointer",
    filter: "brightness(80%)",
  }),
  indicatorSeparator: (provided: any) => ({
    ...provided,
    transform: "translateX(0.25rem) scaleY(2)",
  }),
  menu: (provided: any) => ({
    ...provided,
    backgroundColor: FOREGROUND_COLOR,
    border: `0.125rem solid ${FOREGROUND_COLOR_DARK}`,
    borderRadius: "0.25rem",
  }),
  option: (_provided: any, { isFocused }: any) => ({
    color: DARK_TEXT_COLOR,
    padding: "0.125rem 0.25rem",
    cursor: "pointer",
    overflow: "hidden",
    textOverflow: "ellipsis",
    backgroundColor: isFocused ? "#ddd" : undefined,
  }),
  noOptionsMessage: (provided: any) => ({
    ...provided,
    paddingTop: "0.125rem",
    paddingBottom: "0.125rem",
    fontSize: "90%",
  }),
};
