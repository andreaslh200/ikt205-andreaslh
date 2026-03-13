import React, { useState, useEffect } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { NavigationContainer, useIsFocused } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { StatusBar } from 'expo-status-bar'
import * as ImagePicker from 'expo-image-picker'
import * as Notifications from 'expo-notifications'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
import { Session } from '@supabase/supabase-js'

type Note = {
  id: number
  title: string
  content: string
  user_email: string
  updated_at: string
  image_url: string | null
}

type RootStackParamList = {
  WorkNotes: undefined
  NewNote: undefined
  EditNote: { note: Note }
  Detail: { note: Note }
}

const Stack = createNativeStackNavigator<RootStackParamList>()

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

const MAX_FILE_SIZE = 15 * 1024 * 1024
const VALID_FORMATS = ['jpg', 'jpeg', 'png', 'webp']

function validateImage(asset: ImagePicker.ImagePickerAsset): string | null {
  const ext = asset.uri.split('.').pop()?.toLowerCase()
  if (!ext || !VALID_FORMATS.includes(ext)) {
    return 'Invalid format. Only JPG, PNG and WebP are allowed.'
  }
  if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE) {
    return 'Image is too large. Maximum size is 15MB.'
  }
  return null
}

async function uploadImage(uri: string, userId: string): Promise<string> {
  const ext = uri.split('.').pop()?.toLowerCase() || 'jpg'
  const fileName = `${userId}/${Date.now()}.${ext}`

  const response = await fetch(uri)
  const blob = await response.blob()
  const arrayBuffer = await new Response(blob).arrayBuffer()

  const { error } = await supabase.storage
    .from('note-images')
    .upload(fileName, arrayBuffer, {
      contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
    })

  if (error) throw error

  const { data } = supabase.storage.from('note-images').getPublicUrl(fileName)
  return data.publicUrl
}

async function requestNotificationPermissions() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    })
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  if (existingStatus !== 'granted') {
    await Notifications.requestPermissionsAsync()
  }
}

async function sendLocalNotification(noteTitle: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Nytt notat',
      body: noteTitle,
    },
    trigger: null,
  })
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  useEffect(() => {
    if (session?.user) {
      requestNotificationPermissions()
    }
  }, [session])

  if (!session) {
    return <Auth />
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator>
        <Stack.Screen name="WorkNotes" options={{ title: 'Work Notes' }}>
          {(props) => <MainScreen {...props} session={session} />}
        </Stack.Screen>
        <Stack.Screen name="NewNote" options={{ title: 'New Note' }}>
          {(props) => <NewNoteScreen {...props} session={session} />}
        </Stack.Screen>
        <Stack.Screen name="Detail" options={{ title: 'Note' }}>
          {(props) => <DetailScreen {...props} />}
        </Stack.Screen>
        <Stack.Screen name="EditNote" options={{ title: 'Edit Note' }}>
          {(props) => <EditNoteScreen {...props} session={session} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  )
}

const PAGE_SIZE = 5

export function MainScreen({ navigation, session }: { navigation: any; session: Session }) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)

  const fetchNotes = async (loadMore = false) => {
    if (!loadMore) setLoading(true)
    const from = loadMore ? notes.length : 0
    const to = from + PAGE_SIZE - 1

    const { data, error } = await supabase
      .from('notes')
      .select('*', { count: 'exact' })
      .order('updated_at', { ascending: false })
      .range(from, to)

    if (error) {
      Alert.alert('Error', error.message)
    } else {
      const newNotes = loadMore ? [...notes, ...(data || [])] : (data || [])
      setNotes(newNotes)
      setHasMore((data?.length || 0) === PAGE_SIZE)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchNotes()
    const unsubscribe = navigation.addListener('focus', () => fetchNotes())
    return unsubscribe
  }, [navigation])

  const handleDelete = (note: Note) => {
    Alert.alert(
      'Delete note',
      `Are you sure you want to delete "${note.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('notes').delete().eq('id', note.id)
            if (error) {
              Alert.alert('Error', error.message)
            } else {
              Alert.alert('Deleted', 'Note was deleted')
              fetchNotes()
            }
          },
        },
      ]
    )
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <View style={styles.screen}>
      {loading ? (
        <View style={styles.empty}>
          <ActivityIndicator size="large" testID="loading-indicator" />
        </View>
      ) : notes.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No notes yet</Text>
        </View>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <Pressable
              style={styles.noteItem}
              onPress={() => navigation.navigate('Detail', { note: item })}
              onLongPress={() => handleDelete(item)}
            >
              {item.image_url && (
                <Image
                  source={{ uri: item.image_url }}
                  style={styles.noteImage}
                  resizeMode="contain"
                />
              )}
              <Text style={styles.noteTitle}>{item.title}</Text>
              <Text style={styles.noteMeta}>
                {item.user_email} · {new Date(item.updated_at).toLocaleDateString()}
              </Text>
            </Pressable>
          )}
          ListFooterComponent={hasMore ? (
            <Pressable style={styles.loadMoreButton} onPress={() => fetchNotes(true)}>
              <Text style={styles.loadMoreText}>Load more</Text>
            </Pressable>
          ) : null}
        />
      )}

      <View style={styles.bottomBar}>
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
        <Pressable style={styles.fab} onPress={() => navigation.navigate('NewNote')}>
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      </View>
    </View>
  )
}

export function NewNoteScreen({ navigation, session }: { navigation: any; session: Session }) {
  const isFocused = useIsFocused()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      const error = validateImage(result.assets[0])
      if (error) {
        Alert.alert('Invalid image', error)
        return
      }
      setImageUri(result.assets[0].uri)
    }
  }

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your camera')
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      const error = validateImage(result.assets[0])
      if (error) {
        Alert.alert('Invalid image', error)
        return
      }
      setImageUri(result.assets[0].uri)
    }
  }

  const showImageOptions = () => {
    if (!isFocused) return
    Alert.alert('Add Image', 'Choose an option', [
      { text: 'Take Photo', onPress: takePhoto },
      { text: 'Choose from Gallery', onPress: pickImage },
      { text: 'Cancel', style: 'cancel' },
    ])
  }

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Error', 'Title and content cannot be empty')
      return
    }

    setSaving(true)
    let imageUrl: string | null = null

    if (imageUri) {
      try {
        setUploading(true)
        imageUrl = await uploadImage(imageUri, session.user.id)
      } catch (err: any) {
        Alert.alert('Upload failed', err.message || 'Could not upload image')
        setSaving(false)
        setUploading(false)
        return
      }
      setUploading(false)
    }

    const { error } = await supabase.from('notes').insert({
      title: title.trim(),
      content: content.trim(),
      user_id: session.user.id,
      user_email: session.user.email,
      image_url: imageUrl,
    })

    if (error) {
      Alert.alert('Error', error.message)
    } else {
      await sendLocalNotification(title.trim())
      Alert.alert('Saved', 'Note was created')
      navigation.goBack()
    }
    setSaving(false)
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Title"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={[styles.input, styles.contentInput]}
          placeholder="Content"
          value={content}
          onChangeText={setContent}
          multiline
        />

        {imageUri && (
          <View>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="contain" />
            <Pressable onPress={() => setImageUri(null)}>
              <Text style={styles.removeImageText}>Remove image</Text>
            </Pressable>
          </View>
        )}

        <Pressable style={styles.imageButton} onPress={showImageOptions}>
          <Text style={styles.imageButtonText}>{imageUri ? 'Change Image' : 'Add Image'}</Text>
        </Pressable>

        {uploading && (
          <View style={styles.uploadingRow}>
            <ActivityIndicator size="small" />
            <Text style={styles.uploadingText}>Uploading image...</Text>
          </View>
        )}

        <Pressable
          style={[styles.saveButton, (saving || uploading) && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving || uploading}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function DetailScreen({ route, navigation }: { route: any; navigation: any }) {
  const { note } = route.params as { note: Note }

  const handleDelete = () => {
    Alert.alert(
      'Delete note',
      `Are you sure you want to delete "${note.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('notes').delete().eq('id', note.id)
            if (error) {
              Alert.alert('Error', error.message)
            } else {
              Alert.alert('Deleted', 'Note was deleted')
              navigation.navigate('WorkNotes')
            }
          },
        },
      ]
    )
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.detail}>
      <Text style={styles.detailTitle}>{note.title}</Text>
      <Text style={styles.noteMeta}>
        By {note.user_email} · Last edited {new Date(note.updated_at).toLocaleDateString()}
      </Text>
      {note.image_url && (
        <Image
          source={{ uri: note.image_url }}
          style={styles.detailImage}
          resizeMode="contain"
        />
      )}
      <Text style={styles.detailContent}>{note.content}</Text>

      <Pressable
        style={styles.editButton}
        onPress={() => navigation.navigate('EditNote', { note })}
      >
        <Text style={styles.saveButtonText}>Edit</Text>
      </Pressable>
      <Pressable
        style={styles.deleteButton}
        onPress={handleDelete}
      >
        <Text style={styles.saveButtonText}>Delete</Text>
      </Pressable>
    </ScrollView>
  )
}

function EditNoteScreen({ route, navigation, session }: { route: any; navigation: any; session: Session }) {
  const isFocused = useIsFocused()
  const { note } = route.params as { note: Note }
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)
  const [imageUri, setImageUri] = useState<string | null>(note.image_url)
  const [newImageSelected, setNewImageSelected] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      const error = validateImage(result.assets[0])
      if (error) {
        Alert.alert('Invalid image', error)
        return
      }
      setImageUri(result.assets[0].uri)
      setNewImageSelected(true)
    }
  }

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your camera')
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      const error = validateImage(result.assets[0])
      if (error) {
        Alert.alert('Invalid image', error)
        return
      }
      setImageUri(result.assets[0].uri)
      setNewImageSelected(true)
    }
  }

  const showImageOptions = () => {
    if (!isFocused) return
    Alert.alert('Add Image', 'Choose an option', [
      { text: 'Take Photo', onPress: takePhoto },
      { text: 'Choose from Gallery', onPress: pickImage },
      { text: 'Cancel', style: 'cancel' },
    ])
  }

  const handleUpdate = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Error', 'Title and content cannot be empty')
      return
    }

    setSaving(true)
    let imageUrl = note.image_url

    if (newImageSelected && imageUri) {
      try {
        setUploading(true)
        imageUrl = await uploadImage(imageUri, session.user.id)
      } catch (err: any) {
        Alert.alert('Upload failed', err.message || 'Could not upload image')
        setSaving(false)
        setUploading(false)
        return
      }
      setUploading(false)
    } else if (!imageUri) {
      imageUrl = null
    }

    const { error } = await supabase
      .from('notes')
      .update({
        title: title.trim(),
        content: content.trim(),
        image_url: imageUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', note.id)

    if (error) {
      Alert.alert('Error', error.message)
    } else {
      Alert.alert('Updated', 'Note was updated')
      navigation.popTo('WorkNotes')
    }
    setSaving(false)
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Title"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={[styles.input, styles.contentInput]}
          placeholder="Content"
          value={content}
          onChangeText={setContent}
          multiline
        />

        {imageUri && (
          <View>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="contain" />
            <Pressable onPress={() => { setImageUri(null); setNewImageSelected(true) }}>
              <Text style={styles.removeImageText}>Remove image</Text>
            </Pressable>
          </View>
        )}

        <Pressable style={styles.imageButton} onPress={showImageOptions}>
          <Text style={styles.imageButtonText}>{imageUri ? 'Change Image' : 'Add Image'}</Text>
        </Pressable>

        {uploading && (
          <View style={styles.uploadingRow}>
            <ActivityIndicator size="small" />
            <Text style={styles.uploadingText}>Uploading image...</Text>
          </View>
        )}

        <Pressable
          style={[styles.saveButton, (saving || uploading) && styles.buttonDisabled]}
          onPress={handleUpdate}
          disabled={saving || uploading}
        >
          <Text style={styles.saveButtonText}>Update</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
  noteItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: '500',
  },
  noteMeta: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  noteImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 8,
    marginBottom: 8,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 24,
  },
  logoutButton: {
    padding: 12,
  },
  logoutText: {
    color: '#FF3B30',
    fontSize: 16,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 28,
    color: '#fff',
    lineHeight: 30,
  },
  form: {
    padding: 16,
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  contentInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  imagePreview: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 8,
  },
  removeImageText: {
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 8,
    fontSize: 14,
  },
  imageButton: {
    backgroundColor: '#E5E5EA',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  imageButtonText: {
    color: '#333',
    fontSize: 16,
  },
  uploadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadingText: {
    color: '#888',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  editButton: {
    backgroundColor: '#FF9500',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  detail: {
    padding: 16,
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  detailImage: {
    width: '100%',
    height: 250,
    borderRadius: 8,
    marginTop: 12,
    backgroundColor: '#f0f0f0',
  },
  detailContent: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginTop: 16,
  },
  loadMoreButton: {
    padding: 16,
    alignItems: 'center',
  },
  loadMoreText: {
    color: '#007AFF',
    fontSize: 16,
  },
})
