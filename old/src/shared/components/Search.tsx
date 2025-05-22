import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, TextInput, FlatList, Text, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { searchPosts } from 'shared/api/actions';
import PostsContainer from './posts/PostsContainer';

const SearchDropdown = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [cache, setCache] = useState({});
  const navigation = useNavigation();

  const fetchResults = async (searchTerm: string) => {
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

  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const debouncedSearch = (searchTerm: string) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      fetchResults(searchTerm);
    }, 300);
  };

  useEffect(() => {
    if (query.length > 2) {
      debouncedSearch(query);
    } else {
      setResults([]);
    }
  }, [query]);

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

  return (
    <View style={{ position: 'relative', width: '100%' }}>
      <TextInput
        style={{ padding: 10, borderWidth: 1, borderRadius: 5 }}
        placeholder='Search posts...'
        value={query}
        onChangeText={setQuery}
      />
      {results.length > 0 && (
        <View style={{ position: 'absolute', top: 40, width: '100%', backgroundColor: 'white', borderRadius: 5, elevation: 5 }}>
          <PostsContainer posts={results} />
        </View>
      )}
    </View>
  );
};

export default SearchDropdown;
