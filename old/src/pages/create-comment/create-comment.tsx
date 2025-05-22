import Input from "shared/components/forms/input";
import { SubmitHandler, useForm, UseFormReturn } from "react-hook-form";
import { TextInput } from "react-native";
import { View } from "react-native-reanimated/lib/typescript/Animated";
import { useAppSelector } from "redux_store/hooks";
import { sendMessage } from "shared/api/actions";
import { SendCommentDTO } from "shared/api/types";
import globalStyles from "shared/styles";
import { Button } from "react-native-paper";

interface FormValues {
  content: string;
}

export default function CreateMessage() {

  const form: UseFormReturn<FormValues> = useForm<FormValues>();
  const token = useAppSelector((state) => state.auth.token);

  const onInvalid = (e) => {
    console.error(e);
  }

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    const request: SendCommentDTO= {
      content: data.content,
    };
    try {
      if (!token) {
      throw new Error("No token. Please register or log in.");
      }
      await sendMessage(request, token);
      console.log("Message sent successfully.");
    } catch (e) {
      console.error("Error trying to send message:", e);
    }
  };

  return (
    <View style={globalStyles.container}>
      <View style={globalStyles.formRow}>
        <Input
          name="content"
          label="Content"
          form={form}
          registerOptions={{ required: "Content is required",
              minLength: { value: 1, message: "Content must be at least 1 characters long" },
              maxLength: { value: 1000, message: "Content must be at most 1000 characters long" },
          }}
        />
      </View>
      <Button
        onPress={form.handleSubmit(onSubmit, onInvalid)}
        disabled={!form.formState.isValid}
        mode="contained">
        Send
        </Button>
    </View>
        
  )

} 