import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

export default function TicketScreen({ route, navigation }) {
  const { ticket } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Comprobante de Jugada</Text>
      <Text style={styles.label}>Números: {ticket.numbers.join(', ')}</Text>
      <Text style={styles.label}>Fecha: {ticket.date}</Text>
      <Text style={styles.label}>Estado: {ticket.status}</Text>
      <Button title="Volver al inicio" onPress={() => navigation.navigate('Home')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  label: { fontSize: 18, marginBottom: 10 },
});
