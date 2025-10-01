import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import Input from '@/components/forms/Input';
import FormField from '@/components/forms/FormField';

const predefinedAmounts = [
    { label: '$5', value: '500' },
    { label: '$10', value: '1000' },
    { label: '$20', value: '2000' },
    { label: '$50', value: '5000' }
];

type Props = {
    onAmountChange: (amount: number) => void;
};

export default function DonationAmountPicker({ onAmountChange }: Props) {
    const [customAmount, setCustomAmount] = useState('');
    const form = useFormContext();

    const handlePickerChange = (value: string) => {
        const amount = parseInt(value, 10) || 0;
        onAmountChange(amount);
        form.setValue('donationAmount', value, { shouldValidate: true });
        setCustomAmount('');
    };

    const handleCustomAmountChange = (value: string) => {
        const numeric = parseInt(value, 10) || 0;
        setCustomAmount(value);
        form.setValue('customDonationAmount', value, { shouldValidate: true });
        const cents = numeric * 100;
        onAmountChange(cents);
        form.setValue('donationAmount', String(cents), { shouldValidate: true });
    };

    return (
        <div className='w-full max-w-xs space-y-3'>
            <FormField name='donationAmount' label='Select Donation Amount:'>
                <Input
                    type='dropdown'
                    name='donationAmount'
                    label='Donation Amount'
                    form={form}
                    options={predefinedAmounts}
                    onValueChange={handlePickerChange}
                    registerOptions={{
                        required: 'Select or enter a donation amount',
                        validate: (v: string) => {
                            const n = parseInt(v || '', 10) || 0;
                            return n > 0 || 'Enter a positive donation amount';
                        }
                    }}
                />
            </FormField>
            <FormField name='customDonationAmount' label='Or Enter Custom Amount:'>
                <Input
                    name='customDonationAmount'
                    label=''
                    form={form}
                    value={customAmount}
                    placeholder='Enter amount in dollars'
                    onValueChange={handleCustomAmountChange}
                    registerOptions={{
                        validate: (v: string) => {
                            if (!v) return true;
                            const ok = /^\d+$/.test(v);
                            return ok || 'Enter a valid dollar amount (numbers only)';
                        }
                    }}
                    htmlInputType='number'
                />
            </FormField>
        </div>
    );
}
