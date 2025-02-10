import { View, Text, TouchableOpacity, Image, TextInput } from "react-native";

import { SubmitHandler, useForm, UseFormReturn } from "react-hook-form";

import { Button } from "react-native-paper";
import { usePosts } from "shared/hooks/usePosts";
import { useAuth } from "shared/hooks/useAuth";
import Login from "shared/components/Login";
import Input from "shared/components/forms/input";
import globalStyles from "shared/styles";
import { useAppSelector } from "redux_store/hooks";
import { useState } from "react";
import GiftType from "./gift-type";
import { useNavigation } from "@react-navigation/native";

type FormValues = {
  title: string;
  body: string;
  type: "request" | "gift";
  files?: File[];
  tags: string[];
};

export default function CreatePost() {
  const navigation = useNavigation();
  const form: UseFormReturn<FormValues> = useForm<FormValues>();
  const [showLoginForm, setShowLoginForm] = useState(false);
  const { token, isLoggedIn } = useAuth();
  const [tags, setTags] = useState("");
  const [files, setFiles] = useState([]);
  const [postType, setPostType] = useState("gift");
  const [giftType, setGiftType] = useState("Gift");
  const { addPost } = usePosts();

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
        tags: data.tags,
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

  if (showLoginForm) {
    <View style={styles.loginWrapper}>
      <Text style={styles.loginPrompt}>Please log in to create a post.</Text>
      <Login onSuccess={handleLoginSuccess} />
    </View>;
  }

  return (
    <>
      <View>
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-around",
            alignItems: "center",
            rowGap: 10,
            marginHorizontal: 16,
            gap: 3,
            marginTop: 10,
          }}
        >
          <Button
            style={{
              ...globalStyles.button,
              backgroundColor: postType === "gift" ? "black" : "#c5c5c5",
              borderColor: "#444",
              borderWidth: 1,
              paddingHorizontal: 30,
            }}
            labelStyle={{ color: postType === "gift" ? "white" : "black" }}
            onPress={() => setPostType("gift")}
          >
            Give
          </Button>

          <Button
            style={{
              ...globalStyles.button,
              backgroundColor: postType === "request" ? "black" : "#c5c5c5",
              paddingHorizontal: 30,
              borderColor: "#444",
              borderWidth: 1,
            }}
            labelStyle={{ color: postType === "request" ? "white" : "black" }}
            onPress={() => setPostType("request")}
          >
            Request
          </Button>

          <Image
            source={{
              uri: "https://cdn-icons-png.flaticon.com/512/25/25231.png",
            }}
            alt="Add Image"
            style={{ width: 32, height: 32 }}
          />
        </View>
        <View style={globalStyles.contentContainerWithMargin}>
          <View style={{ width: "90%", marginVertical: 32 }}>
            {postType === "gift" && (
              <GiftType selected={giftType} onSelect={setGiftType} />
            )}
            <Text style={{ ...globalStyles.inputTitle, marginTop: 10 }}>
              Title
            </Text>
            <TextInput
              value={form.watch("title")}
              onChangeText={(text) => form.setValue("title", text)}
              style={globalStyles.inputForm}
              //onInvalid={onInvalid}
              placeholder="Enter title"
            />

            <Text style={globalStyles.inputTitle}>Info</Text>
            <TextInput
              value={form.watch("body")}
              onChangeText={(text) => form.setValue("body", text)}
              style={globalStyles.inputForm}
              multiline
              numberOfLines={4}
              placeholder="Enter post info"
            />

            <View
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Text style={globalStyles.inputTitle}>Add Images</Text>
              <TouchableOpacity>
                <Image
                  source={{
                    uri: "https://cdn-icons-png.flaticon.com/512/25/25231.png",
                  }}
                  alt="Add Image"
                  style={{ width: 50, height: 50, marginLeft: 10 }}
                />
              </TouchableOpacity>

              <View style={globalStyles.formRow}>
                <Input
                  name="files"
                  label="Attach Files"
                  type="file"
                  form={form}
                  registerOptions={{ required: false }}
                />
              </View>
            </View>

            <Text style={globalStyles.inputTitle}>Tags</Text>
            <TextInput
              // value={form.watch("tags")}
              // onChangeText={(text) => form.setValue("tags", text)}
              style={globalStyles.inputForm}
              // onInvalid={onInvalid}
              placeholder="Enter tags"
            />

            <Text style={globalStyles.inputTitle}>Location</Text>
            <View>
              <Image
                source={{
                  uri: "https://cdn-icons-png.flaticon.com/512/25/25231.png",
                }}
                alt="Location"
                style={{ width: 50, height: 50 }}
              />
            </View>

            <Button
              mode="contained"
              style={globalStyles.button}
              onPress={form.handleSubmit(onSubmit)}
            >
              Create
            </Button>
          </View>
        </View>
      </View>
    </>
  );
}

const styles = {
  loginWrapper: {
    padding: 20,
  },
  loginPrompt: {
    marginBottom: 15,
    fontSize: 16,
  },
};
