import React from 'react';
import type { SubmitHandler, SubmitErrorHandler } from 'react-hook-form';
import { FormProvider, UseFormReturn } from 'react-hook-form';

type Props<T> = {
    methods: UseFormReturn<T>;
    onSubmit: SubmitHandler<T>;
    onInvalid?: SubmitErrorHandler<T>;
    children: React.ReactNode;
    className?: string;
    serverError?: string | null;
};

export default function Form<T>({
    methods,
    onSubmit,
    onInvalid,
    children,
    className,
    serverError
}: Props<T>) {
    return (
        <FormProvider {...methods}>
            <form
                onSubmit={methods.handleSubmit(onSubmit, onInvalid)}
                className={className}
                noValidate
            >
                {children}
                {serverError && (
                    <p className='text-red-600 text-sm mt-2'>{serverError}</p>
                )}
            </form>
        </FormProvider>
    );
}
