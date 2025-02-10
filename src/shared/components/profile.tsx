import { useState } from "react";
import { View, Text, Button, TextInput } from "react-native";
import { useForm } from "react-hook-form";
import globalStyles from "shared/styles";
import Input from "shared/components/forms/input";

type ProfileFormValues = {
  email: string;
  avatar: File[];
};

type ProfileProps = {
  user: UserDTO;
  handleUpdate: (data: ProfileFormValues) => Promise<void>;
  loading: boolean;
  error: string | null;
};

export default function Profile({
  user,
  handleUpdate,
  loading,
  error,
}: ProfileProps) {
  const form = useForm<ProfileFormValues>({
    defaultValues: {
      email: user.email,
      avatar: [],
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    await handleUpdate(data);
  };

  return (
    <View style={globalStyles.container}>
      {error && <Text style={{ color: "red" }}>{error}</Text>}
      {user ? (
        <>
          <Text style={globalStyles.title}>User Profile</Text>
          <Text style={globalStyles.subtitle}>Username: {user.username}</Text>
          <Input
            name="email"
            label="Email"
            form={form}
            registerOptions={{ required: true }}
          />
          <Input
            name="avatar"
            label="Upload Avatar"
            type="file"
            form={form}
            multipleFiles={false}
          />
          <Button
            title={loading ? "Updating..." : "Update Profile"}
            onPress={form.handleSubmit(onSubmit)}
            disabled={loading}
          />
        </>
      ) : (
        <Text>Loading...</Text>
      )}
    </View>
  );
}
