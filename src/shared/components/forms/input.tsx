import {
  FieldValues,
  RegisterOptions,
  useController,
  UseControllerProps,
  UseFormReturn,
} from "react-hook-form";
import { TextInput } from "react-native-paper";
import { KeyboardTypeOptions } from "react-native";

type Props<T extends FieldValues> = {
  name: string;
  label: string;
  form: UseFormReturn<T>;
  type?: "password";
  registerOptions?: RegisterOptions<T>;
  placeholder?: string;
  value?: string;
  onChangeText?: (value: string) => void;
  keyboardType?: KeyboardTypeOptions;
} & UseControllerProps<T>;

export default function Input<T extends FieldValues>({
  name,
  label,
  form,
  // registerOptions,
  type,
  placeholder,
  value,
  onChangeText,
  keyboardType,
}: Props<T>) {
  const { field } = useController<T>({
    control: form.control,
    name,
    defaultValue: "" as T[keyof T],
  });

  return (
    <TextInput
      label={label}
      accessibilityLabel={label}
      placeholder={placeholder}
      value={value || field.value}
      onChangeText={(val) => {
        field.onChange(val);
        if (onChangeText) onChangeText(val);
      }}
      secureTextEntry={type === "password"}
      keyboardType={keyboardType}
    />
  );
}
