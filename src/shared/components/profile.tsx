import { useState } from "react";
import { View, Text, Button, TextInput } from "react-native";
import globalStyles from "shared/styles";

type ProfileProps = {
  user: UserDTO;
  formState: Partial<UserDTO>;
  setFormState: React.Dispatch<React.SetStateAction<Partial<UserDTO>>>;
  handleUpdate: () => Promise<void>;
  loading: boolean;
  error: string | null;
};

export default function Profile({
  user,
  formState,
  setFormState,
  handleUpdate,
  loading,
  error,
}: ProfileProps) {
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  const handlePasswordUpdate = async () => {
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    setFormState((prev) => ({ ...prev, password: newPassword }));
    await handleUpdate();
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <View style={globalStyles.container}>
      {error && <Text style={{ color: "red" }}>{error}</Text>}
      {user ? (
        <>
          <Text style={globalStyles.title}>User Profile</Text>
          <Text style={globalStyles.subtitle}>Username: {user.username}</Text>
          <TextInput
            style={globalStyles.input}
            value={formState.email}
            onChangeText={(text) =>
              setFormState((prev) => ({ ...prev, email: text }))
            }
            placeholder="Email"
          />
          <TextInput
            style={globalStyles.input}
            value={formState.avatar || ""}
            onChangeText={(text) =>
              setFormState((prev) => ({ ...prev, avatar: text }))
            }
            placeholder="Avatar URL"
          />
          <TextInput
            style={globalStyles.input}
            value={newPassword}
            onChangeText={(text) => setNewPassword(text)}
            placeholder="New Password"
            secureTextEntry
          />
          {newPassword ? (
            <TextInput
              style={globalStyles.input}
              value={confirmPassword}
              onChangeText={(text) => setConfirmPassword(text)}
              placeholder="Confirm New Password"
              secureTextEntry
            />
          ) : null}
          <Button
            title={loading ? "Updating..." : "Update Profile"}
            onPress={handleUpdate}
            disabled={loading}
          />
          <Button
            title={loading ? "Updating Password..." : "Update Password"}
            onPress={handlePasswordUpdate}
            disabled={loading || !newPassword || !confirmPassword}
          />
        </>
      ) : (
        <Text>Loading...</Text>
      )}
    </View>
  );
}
