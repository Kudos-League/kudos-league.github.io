import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";

import globalStyles from "shared/styles";
import { getUserDetails, updateUser } from "shared/api/actions";
import Profile from "shared/components/profile";
import { useAuth } from "../../../shared/hooks/useAuth";

type RootStackParamList = {
  UserProfile: { id: string };
};

export default function User() {
  const { authState, user: userProfile } = useAuth();
  const route = useRoute<RouteProp<RootStackParamList, "UserProfile">>();
  const targetUserID = route.params?.id;
  const isLoggedInUser = targetUserID === userProfile?.id;

  const [user, setUser] = useState<UserDTO | null>(null);
  const [formState, setFormState] = useState<Partial<UserDTO>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      setError(null);
      if (!targetUserID) {
        setError("Missing user ID to fetch details.");
        return;
      }

      try {
        if (isLoggedInUser) {
          setUser(userProfile);
          setFormState(userProfile || {});
        } else {
          if (!authState?.token) {
            throw new Error("No token available. Please log in.");
          }
          const fetchedUser = await getUserDetails(
            targetUserID,
            authState.token
          );
          setUser(fetchedUser);
          setFormState(fetchedUser);
        }
      } catch (e) {
        setError("Failed to load user details.");
      }
    };

    fetchUser();
  }, [targetUserID, authState, userProfile]);

  const handleUpdate = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!formState) return;
      const updatedUser = await updateUser(formState);
      setUser(updatedUser);
    } catch (e) {
      setError("Failed to update user.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <Text style={{ color: "red" }}>Loading user details...</Text>;
  }

  return (
    <View style={globalStyles.container}>
      <Profile
        user={user}
        formState={formState}
        setFormState={setFormState}
        handleUpdate={handleUpdate}
        loading={loading}
        error={error}
      />
    </View>
  );
}
