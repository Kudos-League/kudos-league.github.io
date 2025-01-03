import React, { useState } from "react";
import { View, Text } from "react-native";
import { useController, useFormContext } from "react-hook-form";
import Input from "shared/components/forms/input";
import Picker from "shared/components/forms/picker";

type DonationAmountPickerProps = {
  onAmountChange: (amount: number) => void;
};

const predefinedAmounts = [
  { label: "$5", value: "500" },
  { label: "$10", value: "1000" },
  { label: "$20", value: "2000" },
  { label: "$50", value: "5000" },
];

export default function DonationAmountPicker({
  onAmountChange,
}: DonationAmountPickerProps) {
  const formMethods = useFormContext();

  if (!formMethods) {
    throw new Error("DonationAmountPicker must be used within a FormProvider");
  }

  const { control } = formMethods;
  const { field } = useController({
    name: "donationAmount",
    control,
    defaultValue: "",
  });

  const [customAmount, setCustomAmount] = useState("");

  const handlePickerChange = (value: string) => {
    const amount = parseInt(value, 10);
    onAmountChange(amount);
    field.onChange(value);
    setCustomAmount("");
  };

  const handleCustomAmountChange = (value: string) => {
    const numericValue = parseInt(value, 10) || 0;
    setCustomAmount(value);
    onAmountChange(numericValue * 100);
    field.onChange((numericValue * 100).toString());
  };

  return (
    <View style={{ padding: 10 }}>
      <Text style={{ fontSize: 16, marginBottom: 8 }}>
        Select Donation Amount:
      </Text>

      <Picker
        name="donationAmount"
        form={formMethods}
        options={predefinedAmounts}
        onValueChange={handlePickerChange}
      />

      <Text style={{ marginVertical: 8 }}>Or Enter Custom Amount:</Text>

      <Input
        name="customDonationAmount"
        label="Custom Amount"
        placeholder="Enter amount in dollars"
        form={formMethods}
        value={customAmount}
        keyboardType="numeric"
        onChangeText={handleCustomAmountChange}
      />
    </View>
  );
}
