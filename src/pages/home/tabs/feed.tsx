import React, { useEffect, useState, useRef } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  StatusBar, 
  TextInput,
  Animated,
  Easing,
  Dimensions
} from "react-native";
import { useNavigation } from '@react-navigation/native';
import { usePosts } from "shared/hooks/usePosts";
import PostsContainer from "shared/components/posts/PostsContainer";
import globalStyles from "shared/styles";
import { Ionicons } from '@expo/vector-icons'; // Assuming you're using Expo

export default function Feed() {
  const navigation = useNavigation();
  const { posts, fetchPosts, loading, error } = usePosts();
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filterVisible, setFilterVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("gifts");
  const [sortOption, setSortOption] = useState("Default Sort");
  
  const searchAnimation = useRef(new Animated.Value(0)).current;
  const filterAnimation = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCreatePost = () => {
    navigation.navigate("Create Post");
  };
  
  const toggleSearch = () => {
    if (searchVisible) {
      // Hide search
      Animated.timing(searchAnimation, {
        toValue: 0,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: false
      }).start(() => setSearchVisible(false));
      setSearchText("");
    } else {
      // Show search
      setSearchVisible(true);
      Animated.timing(searchAnimation, {
        toValue: 1,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: false
      }).start();
    }
  };
  
  const toggleFilter = () => {
    if (filterVisible) {
      // Hide filter
      Animated.timing(filterAnimation, {
        toValue: 0,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: false
      }).start(() => setFilterVisible(false));
    } else {
      // Show filter
      setFilterVisible(true);
      Animated.timing(filterAnimation, {
        toValue: 1,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: false
      }).start();
    }
  };
  
  const searchWidth = searchAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [40, Dimensions.get('window').width - 120]
  });
  
  const filterHeight = filterAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 120]
  });

  if (loading) return (
    <SafeAreaView style={globalStyles.container}>
      <Text>Loading...</Text>
    </SafeAreaView>
  );
  
  if (error) return (
    <SafeAreaView style={globalStyles.container}>
      <Text>{error}</Text>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Welcome to Kudos League!</Text>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={handleCreatePost}
        >
          <Text style={styles.createButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.toolbarContainer}>
        <View style={styles.searchContainer}>
          {searchVisible ? (
            <Animated.View style={[styles.searchInputContainer, { width: searchWidth }]}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search..."
                value={searchText}
                onChangeText={setSearchText}
                autoFocus
              />
              <TouchableOpacity onPress={toggleSearch} style={styles.searchButton}>
                <Ionicons name="close" size={24} color="black" />
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <TouchableOpacity style={styles.iconButton} onPress={toggleSearch}>
              <Ionicons name="search" size={24} color="black" />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.categoryButtons}>
          <TouchableOpacity 
            style={[
              styles.categoryButton, 
              activeTab === "gifts" && styles.activeCategoryButton
            ]}
            onPress={() => setActiveTab("gifts")}
          >
            <Text style={activeTab === "gifts" ? styles.activeCategoryButtonText : styles.categoryButtonText}>Gifts</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.categoryButton, 
              activeTab === "requests" && styles.activeCategoryButton
            ]}
            onPress={() => setActiveTab("requests")}
          >
            <Text style={activeTab === "requests" ? styles.activeCategoryButtonText : styles.categoryButtonText}>Requests</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.sortFilterContainer}>
          <TouchableOpacity style={styles.sortButton} onPress={() => setSortOption(sortOption === "Default Sort" ? "Sort by Distance" : "Default Sort")}>
            <Text style={styles.sortButtonText}>{sortOption}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.iconButton} onPress={toggleFilter}>
            <Ionicons name="filter" size={24} color="black" />
          </TouchableOpacity>
        </View>
      </View>
      
      <Animated.View style={[styles.filterContainer, { height: filterHeight, opacity: filterAnimation }]}>
        <Text style={styles.filterTitle}>Filter Options</Text>
        <View style={styles.filterOptions}>
          <TouchableOpacity style={styles.filterOption}>
            <Text>Date (Newest)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterOption}>
            <Text>Distance (Closest)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterOption}>
            <Text>Kudos (Highest)</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
      
      <PostsContainer posts={posts} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: StatusBar.currentHeight || 0,
  },
  headerContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  createButtonText: {
    fontSize: 36,
    fontWeight: "bold",
    marginBottom: 2,
  },
  toolbarContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  searchButton: {
    padding: 4,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  categoryButtons: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 2,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 16,
    marginHorizontal: 4,
  },
  activeCategoryButton: {
    backgroundColor: "#000",
    color: "#fff",
  },
  categoryButtonText: {
    fontWeight: "500",
    color: "#333",
  },
  activeCategoryButtonText: {
    fontWeight: "500",
    color: '#fff',
  },
  sortFilterContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sortButton: {
    backgroundColor: "#f5f5f5",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  sortButtonText: {
    fontSize: 14,
  },
  filterContainer: {
    backgroundColor: "#f9f9f9",
    padding: 16,
    overflow: "hidden",
  },
  filterTitle: {
    fontWeight: "bold",
    marginBottom: 10,
  },
  filterOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  filterOption: {
    backgroundColor: "#f0f0f0",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
});