import React, { useEffect, useState, useRef, useCallback } from "react";
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
import { Ionicons } from '@expo/vector-icons';
import { searchPosts } from "shared/api/actions";
import CurrentEvent from "shared/components/events/CurrentEvent";
import { PostDTO } from "shared/api/types";
import { Icon, IconButton } from "react-native-paper";

interface TypeOfOrdering {
  type: "date" | "distance" | "kudos";
  order: "asc" | "desc";
}

type PostFilterType = "gifts" | "requests";

export default function Feed() {
  const navigation = useNavigation();
  const { posts, fetchPosts, loading, error } = usePosts();
  const [orderedPosts, setOrderedPosts] = useState<PostDTO[]>([]);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [results, setResults] = useState([]);
  const [cache, setCache] = useState({});
  const [filterVisible, setFilterVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<PostFilterType>("gifts");
  const [sortOption, setSortOption] = useState("Sort by date");
  const [typeOfOrdering, setTypeOfOrdering] = useState<TypeOfOrdering>({ type: "date", order: "desc" });
  
  const searchAnimation = useRef(new Animated.Value(0)).current;
  const filterAnimation = useRef(new Animated.Value(0)).current;
  const debounceTimeout = useRef(null);
  
  useEffect(() => {
    fetchPosts();
  }, []);

  // Memoized filter and sort function 
  const filterAndOrderPosts = useCallback((posts: PostDTO[], orderingType: TypeOfOrdering, filterType: PostFilterType) => {
    if (!posts || posts.length === 0) {
      return [];
    }

    // First filter the posts by type
    let filteredPosts = [...posts];
    if (filterType === "gifts") {
      filteredPosts = filteredPosts.filter((post) => post.type === "gift");
    } else if (filterType === "requests") {
      filteredPosts = filteredPosts.filter((post) => post.type === "request");
    }

    // Then sort the filtered posts
    let sortedPosts = [...filteredPosts];
    if (orderingType.type === "date") {
      sortedPosts.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return orderingType.order === "desc" ? dateB - dateA : dateA - dateB;
      });
    } else if (orderingType.type === "distance") {
      sortedPosts.sort((a, b) => {
        const distanceA = getDistanceBetweenLocations(a.location, null);
        const distanceB = getDistanceBetweenLocations(b.location, null);
        return orderingType.order === "desc" ? distanceB - distanceA : distanceA - distanceB;
      });
    } else if (orderingType.type === "kudos") {
      sortedPosts.sort((a, b) => {
        const kudosA = a.kudos || 0;
        const kudosB = b.kudos || 0;
        return orderingType.order === "desc" ? kudosB - kudosA : kudosA - kudosB;
      });
    }

    return sortedPosts;
  }, []);

  // Apply filters and sorting whenever posts, activeTab, or typeOfOrdering changes
  useEffect(() => {
    if (posts && posts.length > 0) {
      const filtered = filterAndOrderPosts(posts, typeOfOrdering, activeTab);
      setOrderedPosts(filtered);
    }
  }, [posts, activeTab, typeOfOrdering, filterAndOrderPosts]);

  const handleCreatePost = () => {
    navigation.navigate("Create Post");
  };

  // Toggle visibility of search bar
  const toggleSearch = () => {
    if (searchVisible) {
      // Hide search
      Animated.timing(searchAnimation, {
        toValue: 0,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: false
      }).start(() => {
        setSearchVisible(false);
        setSearchText("");
        setResults([]);
      });
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
  
  const debouncedSearch = (searchTerm) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      fetchResults(searchTerm);
    }, 300);
  };

  const fetchResults = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setResults([]);
      return;
    }
  
    if (cache[searchTerm]) {
      setResults(cache[searchTerm]);
      return;
    }
    
    try {
      const response = await searchPosts(searchTerm);
      setResults(response);
      setCache((prevCache) => ({ ...prevCache, [searchTerm]: response }));
    } catch (error) {
      console.error('Search API Error:', error);
    }
  };

  useEffect(() => {
    if (searchText.length > 2) {
      debouncedSearch(searchText);
    } else {
      setResults([]);
    }
  }, [searchText]);

  function getDistanceBetweenLocations(location1, location2) {
    // Placeholder function to calculate distance between two locations
    // Replace with actual distance calculation logic
    return Math.random() * 100; // Random distance for demonstration
  }
  
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
    outputRange: [40, Math.min(Dimensions.get('window').width - 20, 500)]
  });
  
  const filterHeight = filterAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 120]
  });

  // Toggle between default sort and sort by distance
  const toggleSortOption = () => {
    if (sortOption === "Sort by date") {
      setSortOption("Sort by Distance");
      setTypeOfOrdering({ type: "distance", order: "asc" });
    } else {
      setSortOption("Sort by date");
      setTypeOfOrdering({ type: "date", order: "desc" });
    }
  };

  const boldMatch = (text, match) => {
    const parts = text.split(new RegExp(`(${match})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === match.toLowerCase() ? (
        <Text key={index} style={{ fontWeight: 'bold' }}>{part}</Text>
      ) : (
        <Text key={index}>{part}</Text>
      )
    );
  };

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
      <CurrentEvent />

      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Welcome to Kudos League!</Text>
          <IconButton
            icon="plus-circle-outline"
            size={50}
            onPress={handleCreatePost}
          />
      </View>
      
      <View style={styles.toolbarContainer} onLayout={event => {
        const {width} = event.nativeEvent.layout;
        searchAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [40, width - 80]
        });
      }}>
        <View style={styles.searchContainer}>
          {searchVisible ? (
            <View style={{ position: 'relative' }}>
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
              
              {results.length > 0 && (
                <View style={styles.resultsDropdown}>
                  <PostsContainer posts={results} />
                </View>
              )}
            </View>
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
          <TouchableOpacity 
            style={styles.sortButton} 
            onPress={toggleSortOption}
          >
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
          <TouchableOpacity 
            style={[
              styles.filterOption,
              typeOfOrdering.type === "date" && typeOfOrdering.order === "desc" && styles.activeFilterOption
            ]} 
            onPress={() => setTypeOfOrdering({ type: "date", order: "desc" })}
          >
            <Text>Date (Newest)</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.filterOption,
              typeOfOrdering.type === "date" && typeOfOrdering.order === "asc" && styles.activeFilterOption
            ]} 
            onPress={() => setTypeOfOrdering({ type: "date", order: "asc" })}
          >
            <Text>Date (Oldest)</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.filterOption,
              typeOfOrdering.type === "distance" && typeOfOrdering.order === "asc" && styles.activeFilterOption
            ]} 
            onPress={() => setTypeOfOrdering({ type: "distance", order: "asc" })}
          >
            <Text>Distance (Closest)</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
      
      {!searchVisible || results.length === 0 ? (
        <PostsContainer posts={orderedPosts} />
      ) : null}
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
    zIndex: 10,
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
  resultsDropdown: {
    position: 'absolute',
    top: 45,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    maxHeight: 300,
    zIndex: 20,
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
    zIndex: 5,
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
    zIndex: 5,
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
    zIndex: 5,
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
  activeFilterOption: {
    backgroundColor: "#e0e0e0",
    borderWidth: 1,
    borderColor: "#000",
  }
});