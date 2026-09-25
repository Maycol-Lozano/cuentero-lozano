import { View, Text, Pressable, Alert, StyleSheet, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
// Importamos la API legacy para mantener la función writeAsStringAsync compatible
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export default function Ajustes() {
  let db = null;
  if (Platform.OS !== 'web') {
    db = useSQLiteContext();
  }

  async function exportar() {
    if (Platform.OS === 'web') {
      alert('La exportación de archivos requiere la app móvil corriendo en celular.');
      return;
    }

    try {
      const cuentos = await db.getAllAsync(
        'SELECT titulo, cuerpo, creado FROM cuento ORDER BY creado ASC'
      );

      if (!cuentos || cuentos.length === 0) {
        Alert.alert('Nada que exportar', 'Todavía no has escrito ningún cuento.');
        return;
      }

      const texto = cuentos
        .map((c) => `# ${c.titulo}\n(${c.creado ? c.creado.slice(0, 10) : ''})\n\n${c.cuerpo}`)
        .join('\n\n---\n\n');

      const ruta = FileSystem.documentDirectory + 'cuentos.md';

      await FileSystem.writeAsStringAsync(ruta, texto, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(ruta, {
          mimeType: 'text/markdown',
          dialogTitle: 'Compartir mis cuentos',
          UTI: 'public.plain-text',
        });
      } else {
        Alert.alert('Guardado', `Archivo creado en: ${ruta}`);
      }
    } catch (error) {
      console.error("Error exportando:", error);
      Alert.alert('Error', `No se pudieron exportar los cuentos: ${error.message}`);
    }
  }

  return (
    <View style={styles.contenedor}>
      <Stack.Screen options={{ title: 'Ajustes' }} />
      <Pressable style={styles.boton} onPress={exportar}>
        <Text style={styles.botonTexto}>Exportar todos mis cuentos</Text>
      </Pressable>
      <Text style={styles.nota}>
        Se genera un archivo Markdown con todos tus cuentos y se abre el menú para compartirlo por WhatsApp, Correo o Drive.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#f7f5f0', padding: 16, gap: 12 },
  boton: { backgroundColor: '#1b4332', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  botonTexto: { color: '#fff', fontWeight: '600' },
  nota: { color: '#7a8b7f', fontSize: 13, lineHeight: 19 },
});