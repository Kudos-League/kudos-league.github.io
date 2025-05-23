import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";

import globalStyles from "shared/styles";
import { getUserDetails, getUserEvents, getUserHandshakes, getUserPosts, updateUser } from "shared/api/actions";
import Profile from "shared/components/profile";
import { useAuth } from "../../../shared/hooks/useAuth";
import { EventDTO, HandshakeDTO, PostDTO } from "shared/api/types";
import { UserDTO } from "index";
import { getEndpointUrl } from "shared/api/config"; // Make sure to import this

type RootStackParamList = {
  UserProfile: { id: string };
};

export default function User() {
  const { authState, user: userProfile, token, isLoggedIn } = useAuth();
  const route = useRoute<RouteProp<RootStackParamList, "UserProfile">>();
  const targetUserID = route.params?.id || userProfile?.id; // if params not provided, assume it's logged in user
  const isLoggedInUser = targetUserID === userProfile?.id;

  const [user, setUser] = useState<UserDTO | null>(null);
  const [posts, setPosts] = useState<PostDTO[]>([]);
  const [handshakes, setHandshakes] = useState<HandshakeDTO[]>([]); 
  const [events, setEvents] = useState<EventDTO[]>([]); // TODO: Define the type for events
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
          if (!posts?.length) {
            const posts = await getUserPosts(targetUserID.toString(), authState?.token!);
            setPosts(posts);
          }
          
          // Fetch handshakes for the logged-in user
          if (authState?.token) {
            const handshakes = await getUserHandshakes(targetUserID.toString(), authState.token);
            setHandshakes(handshakes);
            const events = await getUserEvents(targetUserID.toString(), authState.token); //TODO: Do something with events that have already passed the deadline
            setEvents(events);
          }
        } else {
          if (!authState?.token) {
            throw new Error("No token available. Please log in.");
          }
          const fetchedUser = await getUserDetails(
            targetUserID.toString(),
            authState.token
          );
          setUser(fetchedUser);
          setFormState(fetchedUser);
          const posts = await getUserPosts(targetUserID.toString(), authState.token);
          setPosts(posts);

          const handshakes = await getUserHandshakes(targetUserID.toString(), authState.token);
          setHandshakes(handshakes);

          const events = await getUserEvents(targetUserID.toString(), authState.token);
          setEvents(events);
        }
      } catch (e) {
        setError("Failed to load user details.");
        console.error(e);
      }
    };

    fetchUser();
  }, [targetUserID, authState, userProfile]);

  const handleUpdate = async (formData) => {
    setLoading(true);
    setError(null);

    try {
      if (!formState) return;
      if (!token) return setError("No token available. Please login.");
      const state = formData || formState; // TODO: FormState isnt used?
     if (!targetUserID) {
         setError("User ID not found.");
         setLoading(false);
         return;
      }
      const updatedUser = await updateUser(state, targetUserID.toString(), token);
      setUser(updatedUser);
    } catch (e) {
      setError("Failed to update user.");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return <Text style={{ color: "red" }}>Please log in to view user details.</Text>;
  }

  if (!user) {
    return <Text style={{ color: "red" }}>Loading user details...</Text>;
  }

  return (
    <View style={globalStyles.container}>
      <Profile
        user={user}
        handleUpdate={handleUpdate}
        loading={loading}
        error={error}
        posts={posts}
        handshakes={handshakes}
        events={events}
      />
    </View>
  );
}
