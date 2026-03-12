import React, { useState, useEffect } from 'react'
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { StatusBar } from 'expo-status-bar'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
import { Session } from '@supabase/supabase-js'

// types
type Note = {
  id: number
  title: string
  content: string
  user_email: string
  updated_at: string
}

type RootStackParamList = {
  WorkNotes: undefined
  NewNote: undefined
  EditNote: { note: Note }
  Detail: { note: Note }
}

const Stack = createNativeStackNavigator<RootStackParamList>()

// app
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

  // show login if not authenticated
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
          {(props) => <EditNoteScreen {...props} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  )
}

// main screen - shows all notes from all users
function MainScreen({ navigation, session }: { navigation: any; session: Session }) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)

  const fetchNotes = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) {
      Alert.alert('Error', error.message)
    } else {
      setNotes(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchNotes()
    const unsubscribe = navigation.addListener('focus', fetchNotes)
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
          <Text style={styles.emptyText}>Loading...</Text>
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
              <Text style={styles.noteTitle}>{item.title}</Text>
              <Text style={styles.noteMeta}>
                {item.user_email} · {new Date(item.updated_at).toLocaleDateString()}
              </Text>
            </Pressable>
          )}
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

// new note form
function NewNoteScreen({ navigation, session }: { navigation: any; session: Session }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Error', 'Title and content cannot be empty')
      return
    }

    setSaving(true)
    const { error } = await supabase.from('notes').insert({
      title: title.trim(),
      content: content.trim(),
      user_id: session.user.id,
      user_email: session.user.email,
    })

    if (error) {
      Alert.alert('Error', error.message)
    } else {
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
        <Pressable
          style={[styles.saveButton, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

// detail view
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

// edit note
function EditNoteScreen({ route, navigation }: { route: any; navigation: any }) {
  const { note } = route.params as { note: Note }
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)
  const [saving, setSaving] = useState(false)

  const handleUpdate = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Error', 'Title and content cannot be empty')
      return
    }

    setSaving(true)
    const { error } = await supabase
      .from('notes')
      .update({
        title: title.trim(),
        content: content.trim(),
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
        <Pressable
          style={[styles.saveButton, saving && styles.buttonDisabled]}
          onPress={handleUpdate}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>Update</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

// styles
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
  detailContent: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginTop: 16,
  },
})


// (5%) Credentials
// Credentials are stored using AsyncStorage which keeps them in the app's private storage and Supabase handles token encryption automatically
