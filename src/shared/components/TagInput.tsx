import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity } from 'react-native';
import { Button } from 'react-native-paper';
import { getTopTags } from '../api/actions'; // Adjust the import path as needed
import globalStyles from '../../shared/styles'; // Adjust as needed
import debounce from 'lodash/debounce';
import { useAuth } from 'shared/hooks/useAuth';

interface Tag {
  id: string;
  name: string;
  count?: number;
}

interface TagInputProps {
  onTagsChange: (tags: Tag[]) => void;
  initialTags?: string[];
}

const TagInput: React.FC<TagInputProps> = ({ onTagsChange, initialTags = [] }) => {
  const [currentTagInput, setCurrentTagInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<Tag[]>(initialTags);
  const [suggestedTags, setSuggestedTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const { token } = useAuth(); // Adjust based on how you access the auth token

  // Debounced function to fetch tag suggestions
  const fetchSuggestions = debounce(async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestedTags([]);
      return;
    }

    setIsLoading(true);
    try {
      if (!token) {
        console.error('Error: Token is null');
        setSuggestedTags([]);
        return;
      }
      const response = await getTopTags(query, token);
      // Filter out tags that are already selected
      const filteredSuggestions = response.data.filter(
        (tag) => !selectedTags.some((selectedTag) => selectedTag.id === tag.id)
      );
      setSuggestedTags(filteredSuggestions);
    } catch (error) {
      console.error('Error fetching tag suggestions:', error);
      setSuggestedTags([]);
    } finally {
      setIsLoading(false);
    }
  }, 500); // 500ms debounce time

  useEffect(() => {
    fetchSuggestions(currentTagInput);
    
    // Cleanup function to cancel any pending debounced calls
    return () => {
      fetchSuggestions.cancel();
    };
  }, [currentTagInput]);

  useEffect(() => {
    onTagsChange(selectedTags);
  }, [selectedTags]);

  const handleAddTag = () => {
    if (currentTagInput.trim() === '') return;
    
    const newTag: Tag = {
      id: `new-${Date.now()}`,
      name: currentTagInput.trim(),
    };
    
    setSelectedTags([...selectedTags, newTag]);
    setCurrentTagInput('');
    setSuggestedTags([]);
    inputRef.current?.focus();
  };

  const handleSelectSuggestion = (tag: Tag) => {
    setSelectedTags([...selectedTags, tag]);
    setCurrentTagInput('');
    setSuggestedTags([]);
    inputRef.current?.focus();
  };

  const handleRemoveTag = (tagId: string) => {
    setSelectedTags(selectedTags.filter(tag => tag.id !== tagId));
  };

  return (
    <View style={{ width: '100%' }}>
      {/* Tags Input Section */}
      <Text style={globalStyles.inputTitle}>Tags</Text>
      
      <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', marginRight: 4 }}>
        <TextInput
          ref={inputRef}
          value={currentTagInput}
          onChangeText={setCurrentTagInput}
          style={[globalStyles.inputForm, { flex: 1, maxWidth: '70%' }]}
          placeholder="Enter tag and press Add"
          returnKeyType="done"
          onSubmitEditing={handleAddTag}
        />
        <Button
          mode="contained"
          style={[globalStyles.button, {
            maxWidth: '30%',
            paddingHorizontal: 4,
          }]}
          onPress={handleAddTag}
          disabled={currentTagInput.trim() === ''}
        >
          Add
        </Button>
      </View>
      
      {/* Tag Suggestions */}
      {suggestedTags.length > 0 && (
        <View style={{ marginTop: 8, maxHeight: 150 }}>
          <FlatList
            data={suggestedTags}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleSelectSuggestion(item)}
                style={{
                  padding: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: '#eaeaea',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text>{item.name}</Text>
                {item.count !== undefined && (
                  <Text style={{ color: '#888' }}>({item.count})</Text>
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      )}
      
      {/* Selected Tags Display */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 8 }}>
        {selectedTags.map((tag) => (
          <View
            key={tag.id}
            style={{
              backgroundColor: '#e0e0e0',
              borderRadius: 16,
              paddingVertical: 4,
              paddingHorizontal: 12,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Text>{tag.name}</Text>
            <TouchableOpacity
              onPress={() => handleRemoveTag(tag.id)}
              style={{ marginLeft: 8 }}
            >
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#666' }}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
};

export default TagInput;