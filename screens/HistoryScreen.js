import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import secureJugadaService from '../services/secureJugadaServiceV2';
import { useNavigation } from "@react-navigation/native";

export default function HistoryScreen() {
  const navigation = useNavigation();
  const [jugadas, setJugadas] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const cargarJugadas = async () => {
    try {
      const data = await secureJugadaService['oJ']();
      console.log('HistoryScreen: Jugadas cargadas', data);
      // Ordenar de más reciente a más antigua
      const jugadasOrdenadas = data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      setJugadas(jugadasOrdenadas);
    } catch (error) {
      console.error('Error al cargar jugadas:', error);
    }
  };

  useEffect(() => {
    cargarJugadas();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    cargarJugadas();
    setRefreshing(false);
  };

  const renderNumbers = (numbers) => (
    <View style={styles.numbersContainer}>
      {numbers.map((num, index) => (
        <View key={index} style={styles.ball}>
          <Text style={styles.ballText}>{num}</Text>
        </View>
      ))}
    </View>
  );

  const formatearFechaHora = (fecha) => {
    const date = new Date(fecha);
    const fechaStr = date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
    const horaStr = date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return `${fechaStr} - ${horaStr}`;
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.jugadaId}>Jugada #{item.id}</Text>
        <Text style={styles.modalidad}>{item.modalidad || 'Tradicional'}</Text>
      </View>
      <Text style={styles.fechaHora}>{formatearFechaHora(item.fecha)}</Text>
      {item.numeros && renderNumbers(item.numeros)}

      {/* Botón para ir a CheckScreen con la jugada y sorteo */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.checkButton}
          onPress={() => {
            navigation.navigate("Check", {
              jugada: item.numeros,
              sorteo: item.sorteo
            });
          }}
        >
          <Text style={styles.checkButtonText}>Revisar Jugada</Text>
        </TouchableOpacity>
      </View>
    </View>
    
  );



  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎟 Historial de Jugadas</Text>
      {jugadas.length === 0 ? (
        <Text style={styles.empty}>No hay jugadas guardadas</Text>
      ) : (
        <FlatList
          data={jugadas}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 16,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  jugadaId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalidad: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d89ef',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  fechaHora: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  numbersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 12,
  },
  ball: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffcc00',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  ballText: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#333',
  },

  buttonContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  checkButton: {
    backgroundColor: '#2d89ef',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    minHeight: 48,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 18,
    color: '#999',
  },
});
