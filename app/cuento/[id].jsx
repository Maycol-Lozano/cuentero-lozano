import { useState, useEffect } from 'react';
import { View, TextInput, Pressable, Text, Alert, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

export default function Editor() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const esNuevo = id === 'nuevo';
  const [titulo, setTitulo] = useState('');
  const [cuerpo, setCuerpo] = useState('');
  const [inicialTitulo, setInicialTitulo] = useState('');
  const [inicialCuerpo, setInicialCuerpo] = useState('');

  let db = null;
  if (Platform.OS !== 'web') {
    db = useSQLiteContext();
  }

  // T2: Calcular número de palabras dinámicamente
  const contarPalabras = (texto) => {
    const limpio = texto.trim();
    if (!limpio) return 0;
    return limpio.split(/\s+/).length;
  };

  useEffect(() => {
    if (esNuevo) return;

    if (Platform.OS === 'web') {
      const demo = {
        '1': { titulo: 'El Chullachaqui del camino viejo', cuerpo: 'Cuentan los abuelos que en las profundidades del monte habita el Chullachaqui, un duende guardián de la selva que tiene un pie de humano y otro de animal o de palo.' },
        '2': { titulo: 'La Yacuruna del Nanay', cuerpo: 'La Yacuruna es el espíritu de las aguas, rey de las profundidades del río Amazonas y sus afluentes como el Nanay.' },
        '3': { titulo: 'El Tunchi que silbó tres veces', cuerpo: 'El Tunchi es un alma en pena que vaga por la selva amazónica protegiendo los senderos oscuros.' }
      }[id];
      if (demo) {
        setTitulo(demo.titulo);
        setCuerpo(demo.cuerpo);
        setInicialTitulo(demo.titulo);
        setInicialCuerpo(demo.cuerpo);
      }
      return;
    }

    async function cargar() {
      try {
        const fila = await db.getFirstAsync(
          'SELECT titulo, cuerpo FROM cuento WHERE id = ?',
          [Number(id)]
        );
        if (fila) {
          setTitulo(fila.titulo);
          setCuerpo(fila.cuerpo);
          setInicialTitulo(fila.titulo);
          setInicialCuerpo(fila.cuerpo);
        }
      } catch (error) {
        console.error("Error al cargar el cuento:", error);
      }
    }
    cargar();
  }, [id, esNuevo, db]);

  // T4: Alerta de salir sin guardar si hubo cambios
  const manejarSalir = () => {
    const hayCambios = titulo !== inicialTitulo || cuerpo !== inicialCuerpo;
    if (hayCambios) {
      if (Platform.OS === 'web') {
        if (confirm('¿Descartar cambios sin guardar?')) {
          router.back();
        }
      } else {
        Alert.alert(
          'Cambios sin guardar',
          '¿Deseas salir sin guardar los cambios de este cuento?',
          [
            { text: 'Continuar editando', style: 'cancel' },
            { text: 'Descartar', style: 'destructive', onPress: () => router.back() },
          ]
        );
      }
    } else {
      router.back();
    }
  };

  async function guardar() {
    const limpio = titulo.trim();
    if (!limpio) {
      if (Platform.OS === 'web') {
        alert('Todo cuento necesita un título.');
      } else {
        Alert.alert('Falta el título', 'Todo cuento necesita un nombre.');
      }
      return;
    }

    const ahora = new Date().toISOString();

    if (Platform.OS === 'web') {
      alert('Guardado exitoso (Simulado en Web). Para almacenamiento SQLite permanente, pruébalo en tu celular con Expo Go.');
      router.back();
      return;
    }

    try {
      if (esNuevo) {
        await db.runAsync(
          'INSERT INTO cuento (titulo, cuerpo, creado, editado) VALUES (?, ?, ?, ?)',
          [limpio, cuerpo, ahora, ahora]
        );
      } else {
        await db.runAsync(
          'UPDATE cuento SET titulo = ?, cuerpo = ?, editado = ? WHERE id = ?',
          [limpio, cuerpo, ahora, Number(id)]
        );
      }
      router.back();
    } catch (error) {
      console.error("Error al guardar en la base de datos:", error);
      Alert.alert('Error', 'No se pudo guardar el cuento.');
    }
  }

  function confirmarBorrado() {
    if (Platform.OS === 'web') {
      alert('Cuento borrado');
      router.back();
      return;
    }

    Alert.alert('Borrar cuento', 'Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: async () => {
          await db.runAsync('DELETE FROM cuento WHERE id = ?', [Number(id)]);
          router.back();
        },
      },
    ]);
  }

  return (
    <KeyboardAvoidingView
      style={styles.contenedor}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen
        options={{
          title: esNuevo ? 'Nuevo cuento' : 'Editar cuento',
          headerLeft: () => (
            <Pressable onPress={manejarSalir} style={{ marginRight: 15 }}>
              <Text style={{ color: '#fff', fontSize: 16 }}>← Volver</Text>
            </Pressable>
          ),
        }}
      />
      <TextInput
        style={styles.titulo}
        placeholder="Título del cuento"
        value={titulo}
        onChangeText={setTitulo}
      />
      <TextInput
        style={styles.cuerpo}
        placeholder="Había una vez, en la quebrada..."
        value={cuerpo}
        onChangeText={setCuerpo}
        multiline
        textAlignVertical="top"
      />

      {/* T2: Contador de palabras */}
      <Text style={styles.contadorPalabras}>
        Palabras: {contarPalabras(cuerpo)}
      </Text>

      <Pressable style={styles.guardar} onPress={guardar}>
        <Text style={styles.guardarTexto}>Guardar</Text>
      </Pressable>

      {!esNuevo && (
        <Pressable onPress={confirmarBorrado} style={{ marginTop: 6 }}>
          <Text style={styles.borrar}>Borrar este cuento</Text>
        </Pressable>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#f7f5f0', padding: 16, gap: 10 },
  titulo: {
    fontSize: 18,
    fontWeight: '600',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e8e2d5',
  },
  cuerpo: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e8e2d5',
  },
  contadorPalabras: {
    textAlign: 'right',
    color: '#7a8b7f',
    fontSize: 13,
    marginBottom: 4,
  },
  guardar: {
    backgroundColor: '#1b4332',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  guardarTexto: { color: '#fff', fontWeight: '600' },
  borrar: { textAlign: 'center', color: '#a4161a', paddingVertical: 8, fontWeight: '600' },
});