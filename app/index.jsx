import { useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, Platform } from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

const CUENTOS_DEMO_WEB = [
  {
    id: 1,
    titulo: 'El Chullachaqui del camino viejo',
    cuerpo: 'Cuentan los abuelos que en las profundidades del monte habita el Chullachaqui, un duende guardián de la selva que tiene un pie de humano y otro de animal o de palo.',
    editado: new Date().toISOString()
  },
  {
    id: 2,
    titulo: 'La Yacuruna del Nanay',
    cuerpo: 'La Yacuruna es el espíritu de las aguas, rey de las profundidades del río Amazonas y sus afluentes como el Nanay.',
    editado: new Date().toISOString()
  },
  {
    id: 3,
    titulo: 'El Tunchi que silbó tres veces',
    cuerpo: 'El Tunchi es un alma en pena que vaga por la selva amazónica protegiendo los senderos oscuros.',
    editado: new Date().toISOString()
  }
];

export default function Lista() {
  const router = useRouter();
  const [cuentos, setCuentos] = useState([]);
  
  let db = null;
  if (Platform.OS !== 'web') {
    db = useSQLiteContext();
  }

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      async function cargar() {
        if (Platform.OS === 'web') {
          if (activo) setCuentos(CUENTOS_DEMO_WEB);
          return;
        }

        try {
          const filas = await db.getAllAsync(
            'SELECT id, titulo, cuerpo, editado FROM cuento ORDER BY editado DESC'
          );
          if (activo) setCuentos(filas);
        } catch (error) {
          console.error("Error cargando cuentos:", error);
        }
      }
      cargar();
      return () => { activo = false; };
    }, [db])
  );

  return (
    <View style={styles.contenedor}>
      {/* T1: Contador de cuentos en la cabecera */}
      <Stack.Screen
        options={{
          title: `Cuentero (${cuentos.length})`,
          headerRight: () => (
            <Pressable onPress={() => router.push('/ajustes')}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '500' }}>Ajustes</Text>
            </Pressable>
          ),
        }}
      />

      <FlatList
        data={cuentos}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListEmptyComponent={
          <Text style={styles.vacio}>
            Todavía no hay cuentos. Toca + para escribir el primero.
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.tarjeta} onPress={() => router.push(`/cuento/${item.id}`)}>
            <Text style={styles.tarjetaTitulo}>{item.titulo}</Text>
            {/* T3: Vista previa de las primeras 80 letras */}
            <Text style={styles.tarjetaPrevia} numberOfLines={2}>
              {item.cuerpo ? item.cuerpo.slice(0, 80) + (item.cuerpo.length > 80 ? '...' : '') : 'Sin contenido'}
            </Text>
            <Text style={styles.tarjetaFecha}>
              {new Date(item.editado).toLocaleDateString('es-PE')}
            </Text>
          </Pressable>
        )}
      />

      <Pressable style={styles.boton} onPress={() => router.push('/cuento/nuevo')}>
        <Text style={styles.botonTexto}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#f7f5f0' },
  tarjeta: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e8e2d5',
  },
  tarjetaTitulo: { fontSize: 16, fontWeight: '600', color: '#1b4332' },
  tarjetaPrevia: { fontSize: 14, color: '#4a5568', marginTop: 4, lineHeight: 20 },
  tarjetaFecha: { fontSize: 12, color: '#7a8b7f', marginTop: 8 },
  vacio: { textAlign: 'center', color: '#7a8b7f', marginTop: 40 },
  boton: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1b4332',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  botonTexto: { color: '#fff', fontSize: 28, lineHeight: 30 },
});