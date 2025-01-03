import { View, Text } from "react-native";

import { SubmitHandler, useForm, UseFormReturn } from "react-hook-form";

import { Button } from "react-native-paper";

import { CreatePostDTO } from "shared/api/types";
import { createPost } from "shared/api/actions";
import Input from "shared/components/forms/input";
import Picker from "shared/components/forms/picker";
import globalStyles from "shared/styles";
import { useAppSelector } from "redux_store/hooks";

export default function CreatePost() {
  const form: UseFormReturn<FormValues> = useForm<FormValues>();
  const token = useAppSelector((state) => state.auth.token);

  const onInvalid = (e) => {
    console.error(e);
  };

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    const request: CreatePostDTO = {
      title: data.title,
      body: data.body,
      type: data.type,
      files: data.files || [],
    };

    try {
      if (!token) {
        throw new Error("No token. Please register or log in.");
      }
      await createPost(request, token);
    } catch (e) {
      console.error("Error trying to create post:", e);
    }
  };

  return (
    <View style={globalStyles.container}>
      <View style={globalStyles.formRow}>
        <Text>I want to</Text>
        <Input
          name="type"
          label="Post Type"
          type="dropdown"
          options={[
            { label: "Get stuff", value: "request" },
            { label: "Give stuff", value: "gift" },
          ]}
          form={form}
        />
      </View>
      <View style={globalStyles.formRow}>
        <Input
          name="title"
          label="Title"
          form={form}
          registerOptions={{
            required: "Title is required",
            minLength: {
              value: 3,
              message: "Title must be at least 3 characters",
            },
            maxLength: {
              value: 60,
              message: "Title must not exceed 60 characters",
            },
          }}
        />
      </View>
      <View style={globalStyles.formRow}>
        <Input
          name="body"
          label="Body"
          form={form}
          registerOptions={{ required: "Body is required" }}
          multiline
        />
      </View>
      <View style={globalStyles.formRow}>
        <Input
          name="files"
          label="Attach Files"
          type="file"
          form={form}
          registerOptions={{ required: false }}
        />
      </View>
      <View style={globalStyles.formRow}>
        <Button
          onPress={form.handleSubmit(onSubmit, onInvalid)}
          disabled={!form.formState.isValid}
          mode="contained"
        >
          Submit
        </Button>
      </View>
    </View>
  );
}

type FormValues = {
  title: string;
  body: string;
  type: "request" | "offer";
  files?: File[];
};
