module.exports = {
  preset: 'jest-expo',
  setupFiles: ['./jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|expo-.*|@expo|@react-navigation|react-native-.*|@supabase|@react-native-async-storage)/)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
}
