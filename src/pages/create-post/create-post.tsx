import { View, Text, TouchableOpacity, TextInput, Modal, TouchableWithoutFeedback } from 'react-native';
import { SubmitHandler, useForm, UseFormReturn } from 'react-hook-form';
import { Button } from 'react-native-paper';
import { usePosts } from 'shared/hooks/usePosts';
import { useAuth } from 'shared/hooks/useAuth';
import Login from 'shared/components/Login';
import Input from 'shared/components/forms/input';
import globalStyles from 'shared/styles';
import { useEffect, useRef, useState } from 'react';
import GiftType from './gift-type';
import { useNavigation } from '@react-navigation/native';
import useLocation from 'shared/hooks/useLocation';
import Map from 'shared/components/Map';
import { IconButton } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { getCategories } from 'shared/api/actions';

import '../../shared/assets/icons/addImage.png';
import { CategoryDTO, LocationDTO } from 'shared/api/types';
import TagInput from 'shared/components/TagInput';

type FormValues = {
  title: string;
  body: string;
  type: 'request' | 'gift';
  location: {lat: number, lng: number};
  files?: File[];
  tags: string[];
  categoryID: number;
};

export default function CreatePost() {
  const navigation = useNavigation();
  const inputRef = useRef<TextInput>(null);
  const infoModalRef = useRef<View>(null);
  const form: UseFormReturn<FormValues> = useForm<FormValues>({
    defaultValues: {
      title: '',
      body: '',
      tags: []
    },
    mode: 'onChange' // Validate on change for immediate feedback
  });
  const [showLoginForm, setShowLoginForm] = useState(false);
  const { token, isLoggedIn } = useAuth();
  const [tags, setTags] = useState('');
  const [files, setFiles] = useState([]);
  const [postType, setPostType] = useState('gift');
  const [giftType, setGiftType] = useState('Gift');
  const { addPost } = usePosts();
  const [location, setLocation] = useState<LocationDTO | null>(null);
  const { location: assumedLocation, errorMsg } = useLocation();
  const [currentTagInput, setCurrentTagInput] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [errors, setErrors] = useState({
    title: false,
    body: false,
  });
  const [badWordFlag, setBadWordFlag] = useState(false);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);

  // Track form validity
  const [isFormValid, setIsFormValid] = useState(false);

  //MOCKUP DATA: =================================================== //would get this from the backend 
  const badwords = ['badword', 'badword2', 'badword3'];
  //END OF MOCKUP DATA =============================================

  // Validate form on change
  // useEffect(() => {
  //   validateForm();
  // }, [form.watch('title'), form.watch('body')]);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch((err) => console.error("Failed to load categories", err));
  }, []);  

  // Form validation function
  const validateForm = () => {
    const title = form.watch('title') || '';
    const body = form.watch('body') || '';
    
    const newErrors = {
      title: !title.trim(),
      body: !body.trim(),
    };
    
    setErrors(newErrors);
    
    // Check if the form is valid
    setIsFormValid(!newErrors.title && !newErrors.body);
  };

  const handleAddTag = () => {
    if (currentTagInput.trim()) {
      if (badwords.includes(currentTagInput.trim() )){
        setBadWordFlag(true);
        return;
      } else {
        
      const currentTags = form.getValues('tags') || [];
      const newTags = [...currentTags, currentTagInput.trim()];
      form.setValue('tags', newTags);
      setCurrentTagInput('');
      setBadWordFlag(false);
    }
    inputRef.current?.focus();
    }
    // Remove the HACK that was causing an error
    // this.focus(); //HACK: workaround for focus() not working properly with refs
  };

  const handleTagsChange = (tags: { id: string; name: string; }[]) => {
  // Convert tag objects to string array for the form
  const tagNames = tags.map(tag => tag.name);
  form.setValue('tags', tagNames);
  
  // Check for bad words in tags
  const hasBadWord = tagNames.some(tag => 
    badwords.includes(tag.toLowerCase().trim())
  );
  
  setBadWordFlag(hasBadWord);
};

  const handleRemoveTag = (index: number) => {
    const currentTags = form.getValues('tags') || [];
    const newTags = currentTags.filter((_, i) => i !== index);
    form.setValue('tags', newTags);
  };

  if (errorMsg) console.error('error loading location', errorMsg);

  const onInvalid = (e) => {
    console.error(e);
  };

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    // Validate form before submission
    validateForm();
    
    if (!isFormValid) {
      return; // Prevent submission if form is invalid
    }
    
    if (!isLoggedIn) {
      setShowLoginForm(true);
      return;
    }
    
    try {
      const newPost = {
        title: data.title,
        body: data.body,
        type: data.type || postType,
        tags: data.tags || [],
        files: data.files || [],
        categoryID: data.categoryID,
        location
      };
      await addPost(newPost, token!);
      form.reset();
      navigation.goBack(); // TODO: Only on success
    } catch (err) {
      console.error('Failed to create post:', err);
    }
  };

  const handleLoginSuccess = () => {
    setShowLoginForm(false);
    form.reset();
  };

  const showInformationModal = () => {
    setShowModal(true);
  };
  const hideInformationModal = () => {
    setShowModal(false);
  };

  if (showLoginForm) {
    return (
      <View style={styles.loginWrapper}>
        <Text style={styles.loginPrompt}>Please log in to create a post.</Text>
        <Login onSuccess={handleLoginSuccess} />
      </View>
    );
  }

  return (
    <>
      <View>
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-around',
            alignItems: 'center',
            rowGap: 10,
            marginHorizontal: 16,
            gap: 3,
            marginTop: 10,
          }}
        >
          <Button
            style={{
              ...globalStyles.button,
              backgroundColor: postType === 'gift' ? 'black' : '#c5c5c5',
              borderColor: '#444',
              borderWidth: 1,
              paddingHorizontal: 10,
            }}
            labelStyle={{ color: postType === 'gift' ? 'white' : 'black' }}
            onPress={() => setPostType('gift')}
          >
            Give
          </Button>

          <Button
            style={{
              ...globalStyles.button,
              backgroundColor: postType === 'request' ? 'black' : '#c5c5c5',
              paddingHorizontal: 20,
              borderColor: '#444',
              borderWidth: 1,
            }}
            labelStyle={{ color: postType === 'request' ? 'white' : 'black' }}
            onPress={() => setPostType('request')}
          >
            Request
          </Button>

          <IconButton
            icon="information"
            onPress={() => showInformationModal()}
            size={32}
          />
          {showModal && (
            <Modal
              animationType="fade"
              transparent={true}
              visible={showModal}
              onRequestClose={hideInformationModal}
            >
              <TouchableWithoutFeedback onPress={hideInformationModal}>
                <View style={styles.modalOverlay}>
                  <View
                    style={styles.modalContainer}
                  >
                    <Text style={styles.modalText}>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam rhoncus lacus at ipsum condimentum condimentum. Curabitur et mi risus. Aliquam nec rutrum ex. Proin in laoreet mauris, non porta mauris. Nam tincidunt, ante nec pulvinar pulvinar, velit justo congue mauris, vel porttitor magna felis non quam. Quisque fermentum orci id tellus laoreet, ut lobortis dolor auctor. Nam massa dui, iaculis tristique euismod eu, auctor at leo. Duis arcu ligula, iaculis at eros vitae, vulputate interdum tellus. Aenean faucibus mauris sed diam dictum bibendum.
                    </Text>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </Modal>
          )}

        </View>
        <View style={globalStyles.contentContainerWithMargin}>
          <View style={{ width: '90%', marginVertical: 32 }}>
            {postType === 'gift' && (
              <GiftType selected={giftType} onSelect={setGiftType} />
            )}
            <Text style={{ ...globalStyles.inputTitle, marginTop: 10 }}>
              Title <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <TextInput
              value={form.watch('title')}
              onChangeText={(text) => {form.setValue('title', text)
              validateForm();
              }}
              style={[globalStyles.inputForm, errors.title && styles.inputError]}
              placeholder="Enter title"
            />
            {errors.title && (
              <Text style={styles.errorText}>Title is required</Text>
            )}

            <Text style={globalStyles.inputTitle}>
              Info <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <TextInput
              value={form.watch('body')}
              onChangeText={(text) => {form.setValue('body', text)
              validateForm();
              }}
              style={[globalStyles.inputForm, errors.body && styles.inputError]}
              multiline
              numberOfLines={4}
              placeholder="Enter post info"
            />
            {errors.body && (
              <Text style={styles.errorText}>Info is required</Text>
            )}

          <Text style={globalStyles.inputTitle}>Category</Text>
          <View style={[globalStyles.inputForm, { padding: 8 }]}>
            <Picker
              selectedValue={form.watch('categoryID')}
              onValueChange={(value) => form.setValue('categoryID', Number(value))}
            >
              <Picker.Item label="Select a category" value={undefined} />
              {categories.map((cat) => (
                <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
              ))}
            </Picker>
          </View>

            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <View style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', width: '100%' }}>
                <Text style={{...globalStyles.inputTitle, marginTop: 10}}>Add Images</Text>

                <View style={globalStyles.formRow}>
                  <Input
                    name="files"
                    placeholder= "../../shared/assets/icons/addImage.png"
                    label="Attach Files"
                    type="file-image"
                    form={form}
                    registerOptions={{ required: false }}
                  />
                </View>
              </View>
            </View>


            {/* Tags Input Section
            <Text style={globalStyles.inputTitle}>Tags</Text>
            <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', marginRight: 4 }}>
              <TextInput
                ref={inputRef}
                value={currentTagInput}
                onChangeText={setCurrentTagInput}
                style={[globalStyles.inputForm, { flex: 1, maxWidth: '70%' }]}
                placeholder="Enter tag and press Add"
                onSubmitEditing={handleAddTag}
                returnKeyType="done"
              />
              <Button
                mode="contained"
                style={[globalStyles.button, {
                  maxWidth: '30%',
                  paddingHorizontal: 4,
                }]}
                onPress={handleAddTag}
              >
                Add
              </Button>
            </View> */}

            <TagInput
              onTagsChange={handleTagsChange}
              initialTags={form.watch('tags')}
            />

            {/* Tags Display */}
            {badWordFlag && <Text style={styles.errorText}>Tag contains bad word</Text>}
            {form.watch('tags')?.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                {form.watch('tags').map((tag, index) => (
                  <View
                    key={index}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#e0e0e0',
                      borderRadius: 16,
                      paddingVertical: 4,
                      paddingHorizontal: 8,
                    }}
                  >
                    <Text style={{ marginRight: 4 }}>{tag}</Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveTag(index)}
                    >
                      <Text style={{ color: 'gray' }}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <Text style={globalStyles.inputTitle}>
              Location 
            </Text>
            <View style={{ alignItems: 'center' }}>
              <Map
                showAddressBar={true}
                exactLocation={false}
                coordinates={assumedLocation}
                width={300}
                height={300}
                onLocationChange={(data) => {
                  data && setLocation({ regionID: data.placeID, name: data.name });
                }}
              />
            </View>

            <TouchableOpacity
              style={[
                globalStyles.button, 
                !isFormValid && styles.disabledButton
              ]}
              onPress={form.handleSubmit(onSubmit)}
              disabled={!isFormValid}
            >
              <Text style={{ color: 'white', paddingVertical: 8 }}>
                Create
              </Text>
            </TouchableOpacity>
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
  modalOverlay: {
    display: 'flex',
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '70%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    lineHeight: 22,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 2,
  },
  inputError: {
    borderColor: 'red',
    borderWidth: 1,
  },
  requiredAsterisk: {
    color: 'red',
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#888',
    opacity: 0.7,
  },
  hintText: {
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  }
};