import React from "react";
import {
  FieldValues,
  RegisterOptions,
  useController,
  UseFormReturn,
} from "react-hook-form";
import { KeyboardTypeOptions } from "react-native";
import { TextInput } from "react-native-paper";
import FilePicker from "./file";
import DropdownPicker from "./picker";
import { Path, PathValue } from "react-hook-form";

type Props<T extends FieldValues> = {
  name: Path<T>;
  label: string;
  form: UseFormReturn<T>;
  type?: "text" | "password" | "file" | "dropdown";
  options?: { label: string; value: string }[];
  registerOptions?: RegisterOptions<T>;
  placeholder?: string;
  value?: string;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  onValueChange?: (value: string | File[]) => void;
};

export default function Input<T extends FieldValues>({
  name,
  label,
  form,
  type = "text",
  options = [],
  registerOptions,
  placeholder,
  value,
  keyboardType,
  multiline,
  onValueChange,
}: Props<T>) {
  const defaultValue: PathValue<T, Path<T>> = type === "dropdown"
    ? (options?.[0]?.value as PathValue<T, Path<T>>)
    : type === "file"
    ? ([] as unknown as PathValue<T, Path<T>>)
    : ("" as PathValue<T, Path<T>>);

  const { field } = useController<T>({
    control: form.control,
    name,
    defaultValue: defaultValue as PathValue<T, Path<T>>,
  });

  if (type === "file") {
    return (
      <FilePicker
        placeholder={placeholder || "Choose Files"}
        selectedFiles={field.value as File[]}
        onChange={(files) => {
          field.onChange(files);
          if (onValueChange) onValueChange(files);
        }}
      />
    );
  }

  if (type === "dropdown") {
    return (
      <DropdownPicker
        options={options}
        value={field.value}
        placeholder={placeholder || label}
        onChange={(value) => {
          field.onChange(value);
          if (onValueChange) onValueChange(value);
        }}
      />
    );
  }

  return (
    <TextInput
      label={label}
      accessibilityLabel={label}
      placeholder={placeholder}
      value={value || field.value || ""}
      onChangeText={(val) => {
        field.onChange(val);
        if (onValueChange) onValueChange(val);
      }}
      keyboardType={keyboardType}
      multiline={multiline}
      secureTextEntry={type === "password"}
      {...form.register(name, registerOptions)}
    />
  );
}
