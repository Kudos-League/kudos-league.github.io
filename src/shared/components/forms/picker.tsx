import { StyleSheet } from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import {
  useController,
  FieldValues,
  UseControllerProps,
  UseFormReturn,
} from "react-hook-form";

type Props<T extends FieldValues> = {
  name: string;
  form: UseFormReturn<T>;
  options: { label: string; value: string }[];
  onValueChange?: (value: string) => void;
} & UseControllerProps<T>;

export default function Picker<T extends FieldValues>({
  name,
  options,
  form,
  onValueChange,
}: Props<T>) {
  const { field } = useController<T>({
    control: form.control,
    name,
    defaultValue: options[0].value as T[keyof T],
  });

  return (
    <Dropdown
      style={styles.dropdown}
      placeholderStyle={styles.placeholderStyle}
      selectedTextStyle={styles.selectedTextStyle}
      data={options}
      maxHeight={300}
      labelField="label"
      valueField="value"
      value={field.value}
      onChange={({ value }) => {
        field.onChange(value);
        if (onValueChange) onValueChange(value);
      }}
    />
  );
}

const styles = StyleSheet.create({
  dropdown: {
    margin: 16,
    height: 50,
    borderBottomColor: "gray",
    borderBottomWidth: 0.5,
    flex: 1,
  },
  placeholderStyle: {
    fontSize: 16,
  },
  selectedTextStyle: {
    fontSize: 16,
  },
});
