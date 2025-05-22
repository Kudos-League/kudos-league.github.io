import React, { useState } from "react";
import { useController, useFormContext } from "react-hook-form";
import Input from "@/components/forms/Input";
import Picker from "@/components/forms/DropdownPicker";

const predefinedAmounts = [
  { label: "$5", value: "500" },
  { label: "$10", value: "1000" },
  { label: "$20", value: "2000" },
  { label: "$50", value: "5000" },
];

type Props = {
  onAmountChange: (amount: number) => void;
};

export default function DonationAmountPicker({ onAmountChange }: Props) {
  const form = useFormContext();
  const { control } = form;

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
    const numeric = parseInt(value, 10) || 0;
    setCustomAmount(value);
    onAmountChange(numeric * 100);
    field.onChange((numeric * 100).toString());
  };

  return (
    <div className="w-full max-w-xs space-y-3">
      <label className="block text-sm font-semibold">Select Donation Amount:</label>
      <Input
        type='dropdown'
        name="donationAmount"
        label="Donation Amount"
        form={form}
        options={predefinedAmounts}
        onValueChange={handlePickerChange}
      />
      <label className="block text-sm font-semibold">Or Enter Custom Amount:</label>
      <Input
        name="customDonationAmount"
        label=""
        form={form}
        value={customAmount}
        placeholder="Enter amount in dollars"
        onValueChange={handleCustomAmountChange}
      />
    </div>
  );
}
