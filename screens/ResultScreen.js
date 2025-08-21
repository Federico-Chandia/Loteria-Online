import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { getUltimoSorteoCompleto } from '../services/resultService';

// Cache para resultados
let cachedSorteoData = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export default function ResultsScreen({ navigation }) {
  const [sorteoData, setSorteoData] = useState(cachedSorteoData);
  const [loading, setLoading] = useState(!cachedSorteoData);

  useEffect(() => {
    const fetchUltimoSorteo = async () => {
      const now = Date.now();
      
      // Usar cache si es válido
      if (cachedSorteoData && (now - cacheTimestamp) < CACHE_DURATION) {
        setSorteoData(cachedSorteoData);
        setLoading(false);
        return;
      }

      try {
        const sorteoCompleto = await getUltimoSorteoCompleto();
        // Actualizar cache
        cachedSorteoData = sorteoCompleto;
        cacheTimestamp = now;
        setSorteoData(sorteoCompleto);
      } catch (error) {
        console.error('Error al cargar sorteo:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUltimoSorteo();
  }, []);

  const getColorForModalidad = (titulo) => {
    if (titulo.includes('TRADICIONAL')) return '#1e3c72';
    if (titulo.includes('REVANCHA')) return '#e74c3c';
    if (titulo.includes('SIEMPRE SALE')) return '#27ae60';
    if (titulo.includes('SEGUNDA')) return '#f39c12';
    return '#666';
  };

  // Memoizar renderizado de modalidades para mejor performance
  const modalidadesRenderizadas = useMemo(() => {
    if (!sorteoData) return [];
    
    return sorteoData.resultados
      .filter(r => r.numeros && !r.numeros.includes('Se reparte'))
      .map((resultado, index) => {
        const numeros = resultado.numeros.split(',').map(n => n.trim().padStart(2, '0'));
        const color = getColorForModalidad(resultado.titulo);
        
        return (
          <View key={`modalidad-${index}`} style={styles.modalidadContainer}>
            <Text style={styles.modalidadTitulo}>{resultado.titulo}</Text>
            <View style={styles.numbersContainer}>
              {numeros.map((num, numIndex) => (
                <View key={numIndex} style={[styles.numberBox, { backgroundColor: color }]}>
                  <Text style={styles.numberText}>{num}</Text>
                </View>
              ))}
            </View>
          </View>
        );
      });
  }, [sorteoData]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#1e3c72" />
        <Text style={styles.loadingText}>Cargando resultados...</Text>
      </View>
    );
  }

  if (!sorteoData) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>No se pudieron cargar los resultados</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.buttonText}>Volver al Inicio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sorteo #{sorteoData.infoSorteo[0].numero}</Text>
        <Text style={styles.fecha}>{sorteoData.infoSorteo[0].fecha}</Text>
      </View>

      {modalidadesRenderizadas}

      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Play')}>
          <Text style={styles.buttonText}>Jugar de nuevo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.buttonText}>Volver al Inicio</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f2027',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  title: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  fecha: {
    color: '#ccc',
    fontSize: 18,
    textAlign: 'center',
  },
  modalidadContainer: {
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  modalidadTitulo: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  numbersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  numberBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    margin: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  numberText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  buttonsContainer: {
    marginTop: 40,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  button: {
    backgroundColor: '#1e3c72',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 12,
    width: '80%',
    maxWidth: 300,
    alignItems: 'center',
    minHeight: 48,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  secondaryButton: {
    backgroundColor: '#444',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    marginTop: 16,
    textAlign: 'center',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
});
