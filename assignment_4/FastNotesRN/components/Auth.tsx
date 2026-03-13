import React, { useState } from 'react'
import { Alert, StyleSheet, View, Text, TextInput, Pressable } from 'react-native'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in email and password')
      return
    }

    setLoading(true)
    if (isSignUp) {
      const { data: { session }, error } = await supabase.auth.signUp({
        email: email,
        password: password,
      })
      if (error) {
        Alert.alert('Error', error.message)
      } else if (!session) {
        Alert.alert('Check your email for confirmation!')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      })
      if (error) Alert.alert('Error', error.message)
    }
    setLoading(false)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FastNotes</Text>
      <Text style={styles.subtitle}>{isSignUp ? 'Create an account' : 'Sign in to continue'}</Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        onChangeText={setEmail}
        value={email}
        placeholder="email@address.com"
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        onChangeText={setPassword}
        value={password}
        secureTextEntry
        placeholder="Password"
        autoCapitalize="none"
      />

      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{isSignUp ? 'Sign up' : 'Sign in'}</Text>
      </Pressable>

      <Pressable onPress={() => setIsSignUp(!isSignUp)}>
        <Text style={styles.switchText}>
          {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
  },
  switchText: {
    color: '#007AFF',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
})
