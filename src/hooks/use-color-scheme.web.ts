// The app's UI is designed for light backgrounds only (app.json
// "userInterfaceStyle": "light"), so web always reports light too.
export function useColorScheme() {
  return 'light' as const;
}
