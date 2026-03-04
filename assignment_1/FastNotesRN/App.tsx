import React, { useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";

// types

type Note = { id: number; title: string; content: string };

type RootStackParamList = {
  Main: undefined;
  NewNote: undefined;
  Detail: { note: Note };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// app

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [nextId, setNextId] = useState(1);

  const addNote = (title: string, content: string) => {
    setNotes((prev) => [...prev, { id: nextId, title, content }]);
    setNextId((id) => id + 1);
  };

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator initialRouteName="Main">
        <Stack.Screen name="Main" options={{ title: "FastNotes" }}>
          {(props) => <MainScreen {...props} notes={notes} />}
        </Stack.Screen>

        <Stack.Screen name="NewNote" options={{ title: "New Note" }}>
          {(props) => <NewNoteScreen {...props} addNote={addNote} />}
        </Stack.Screen>

        <Stack.Screen name="Detail" options={{ title: "Note" }}>
          {(props) => <DetailScreen {...props} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// main screen - shows all notes

function MainScreen({
  navigation,
  notes,
}: {
  navigation: any;
  notes: Note[];
}) {
  return (
    <View style={styles.screen}>
      {notes.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No notes yet. Tap + to add one!</Text>
        </View>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <Pressable
              style={styles.noteItem}
              onPress={() => navigation.navigate("Detail", { note: item })}
            >
              <Text style={styles.noteTitle}>{item.title}</Text>
            </Pressable>
          )}
        />
      )}

      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate("NewNote")}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

// new note form

function NewNoteScreen({
  navigation,
  addNote,
}: {
  navigation: any;
  addNote: (title: string, content: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSave = () => {
    if (title.trim() === "") return;
    addNote(title.trim(), content.trim());
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
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
        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// detail view

function DetailScreen({ route }: { route: any }) {
  const { note } = route.params as { note: Note };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.detail}>
      <Text style={styles.detailTitle}>{note.title}</Text>
      <Text style={styles.detailContent}>{note.content}</Text>
    </ScrollView>
  );
}

// styles

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#888",
  },
  noteItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  noteTitle: {
    fontSize: 18,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 28,
    color: "#fff",
    lineHeight: 30,
  },
  form: {
    padding: 16,
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  contentInput: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  saveButton: {
    backgroundColor: "#007AFF",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  detail: {
    padding: 16,
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
  },
  detailContent: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
  },
});
