import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { View, ActivityIndicator, Platform } from 'react-native';

async function iniciarBD(db) {
  try {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS cuento (
        id      INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo  TEXT NOT NULL,
        cuerpo  TEXT NOT NULL DEFAULT '',
        creado  TEXT NOT NULL,
        editado TEXT NOT NULL
      );
    `);

    const conteo = await db.getFirstAsync('SELECT COUNT(*) as total FROM cuento');
    if (conteo && conteo.total === 0) {
      const ahora = new Date().toISOString();
      await db.runAsync(
        'INSERT INTO cuento (titulo, cuerpo, creado, editado) VALUES (?, ?, ?, ?)',
        [
          'El Chullachaqui del camino viejo',
          'Cuentan los abuelos que en las profundidades del monte habita el Chullachaqui, un duende guardián de la selva que tiene un pie de humano y otro de animal o de palo.',
          ahora,
          ahora
        ]
      );
      await db.runAsync(
        'INSERT INTO cuento (titulo, cuerpo, creado, editado) VALUES (?, ?, ?, ?)',
        [
          'La Yacuruna del Nanay',
          'La Yacuruna es el espíritu de las aguas, rey de las profundidades del río Amazonas y sus afluentes como el Nanay.',
          ahora,
          ahora
        ]
      );
    }
  } catch (error) {
    console.error("Error BD:", error);
  }
}

export default function Layout() {
  if (Platform.OS === 'web') {
    return <Stack screenOptions={{ headerStyle: { backgroundColor: '#1b4332' }, headerTintColor: '#fff' }} />;
  }

  return (
    <SQLiteProvider databaseName="cuentero.db" onInit={iniciarBD}>
      <Stack screenOptions={{ headerStyle: { backgroundColor: '#1b4332' }, headerTintColor: '#fff' }} />
    </SQLiteProvider>
  );
}