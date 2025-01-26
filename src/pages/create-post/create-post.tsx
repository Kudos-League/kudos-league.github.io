import React, { useState } from "react";
import { View, Text, Modal, StyleSheet } from "react-native";
import { useForm, SubmitHandler } from "react-hook-form";
import { Button } from "react-native-paper";
import { usePosts } from "shared/hooks/usePosts";
import { useAuth } from "shared/hooks/useAuth";
import Login from "shared/components/Login";
import Input from "shared/components/forms/input";
import globalStyles from "shared/styles";
import { useNavigation } from "@react-navigation/native";

type FormValues = {
  title: string;
  body: string;
  type: "request" | "gift";
  files?: File[];
};

export default function CreatePost() {
  const form = useForm<FormValues>();
  const navigation = useNavigation();
  const { token, isLoggedIn } = useAuth();
  const { addPost } = usePosts();
  const [showLoginForm, setShowLoginForm] = useState(false);

  const onInvalid = (e) => {
    console.error(e);
  };

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    if (!isLoggedIn) {
      setShowLoginForm(true);
      return;
    }
    try {
      const newPost = {
        title: data.title,
        body: data.body,
        type: data.type,
        files: data.files || [],
      };
      await addPost(newPost, token!);
      form.reset();
      navigation.goBack();
    } catch (err) {
      console.error("Failed to create post:", err);
    }
  };

  const handleLoginSuccess = () => {
    setShowLoginForm(false);
    form.reset();
  };

  return (
    <View style={globalStyles.container}>
      {showLoginForm ? (
        <View style={styles.loginWrapper}>
          <Text style={styles.loginPrompt}>
            Please log in to create a post.
          </Text>
          <Login onSuccess={handleLoginSuccess} />
        </View>
      ) : (
        <>
          <View style={globalStyles.formRow}>
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
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loginWrapper: {
    padding: 20,
  },
  loginPrompt: {
    marginBottom: 15,
    fontSize: 16,
  },
});
