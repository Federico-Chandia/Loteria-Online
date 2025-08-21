import React, { useEffect, useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useRoute } from "@react-navigation/native";
import { getSorteos, getSorteo } from '../services/resultService';

export default function CheckScreen() {
  const route = useRoute();
  const [jugada, setJugada] = useState(["", "", "", "", "", ""]);
  const [sorteos, setSorteos] = useState([]);
  const [sorteoSeleccionado, setSorteoSeleccionado] = useState(null);
  const [resultadosModalidades, setResultadosModalidades] = useState([]);

  useEffect(() => {
    const fetchSorteos = async () => {
      const data = await getSorteos();
      // Limitar a últimos 6 sorteos (15 días de vigencia)
      const recentSorteos = data.slice(0, 6);
      setSorteos(recentSorteos);

      // Si viene desde historial, setear jugada y verificar automáticamente
      if (route.params?.jugada) {
        const jugadaStrings = route.params.jugada.map((n) => n.toString().padStart(2, '0'));
        setJugada(jugadaStrings);
        
        const sorteoAUsar = recentSorteos.length > 0 ? recentSorteos[0] : null;
        if (sorteoAUsar) {
          setSorteoSeleccionado(sorteoAUsar);
          setTimeout(() => verificar(sorteoAUsar, route.params.jugada), 300);
        }
      } else {
        if (recentSorteos.length > 0) setSorteoSeleccionado(recentSorteos[0]);
      }
    };
    fetchSorteos();
  }, []);

  const verificar = async (sorteoData = sorteoSeleccionado, jugadaNumsManual = null) => {
    if (!sorteoData) return;

    const sorteoCompleto = await getSorteo(sorteoData.numero);
    const jugadaNums = (jugadaNumsManual || jugada).map((n) => parseInt(n, 10));

    const resultados = sorteoCompleto.resultados.map((modalidad) => {
      const numeros = modalidad.numeros.split(",").map((n) => parseInt(n.trim(), 10));
      const aciertos = jugadaNums.filter((n) => numeros.includes(n)).length;
      const premio = modalidad.premio || null;
      return {
        titulo: modalidad.titulo,
        numeros,
        aciertos,
        premio,
      };
    });

    setResultadosModalidades(resultados);
  };

  const renderNumeros = (numeros) => (
    <View style={styles.numerosRow}>
      {numeros.map((num, i) => {
        const numStr = num.toString().padStart(2, '0');
        const esAcierto = jugada.some(j => parseInt(j) === num);
        return (
          <View
            key={i}
            style={[styles.numero, esAcierto && styles.numeroAcierto]}
          >
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: esAcierto ? '#28a745' : '#6c757d' }}>
              {numStr}
            </Text>
          </View>
        );
      })}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🔍 Revisa tu jugada</Text>

        {/* Selector de sorteo - Últimos 6 sorteos */}
        {sorteos.length > 0 && (
          <View style={styles.pickerContainer}>
            <Text style={styles.sectionTitle}>Últimos 6 sorteos (15 días de vigencia)</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={sorteoSeleccionado?.numero}
                style={styles.picker}
                onValueChange={(value) => {
                  const seleccionado = sorteos.find((s) => s.numero === value);
                  setSorteoSeleccionado(seleccionado);
                }}
              >
                {sorteos.map((s) => (
                  <Picker.Item
                    key={s.numero}
                    label={`Sorteo #${s.numero} - ${s.fecha}`}
                    value={s.numero}
                  />
                ))}
              </Picker>
            </View>
          </View>
        )}

        {/* Números de la jugada */}
        <View style={styles.jugadaSection}>
          <Text style={styles.sectionTitle}>Tu jugada</Text>
          <View style={styles.numerosContainer}>
            {jugada.map((num, i) => (
              <TextInput
                key={i}
                style={styles.numeroInput}
                keyboardType="numeric"
                maxLength={2}
                value={num}
                onChangeText={(val) => {
                  // Permitir números 0-45, formatear con ceros a la izquierda
                  const sanitized = val.replace(/[^0-9]/g, '').slice(0, 2);
                  if (sanitized === '' || (parseInt(sanitized) >= 0 && parseInt(sanitized) <= 45)) {
                    const copia = [...jugada];
                    copia[i] = sanitized;
                    setJugada(copia);
                  }
                }}
                
              />
            ))}
          </View>
        </View>

        {/* Botón revisar */}
        <TouchableOpacity style={styles.revisarButton} onPress={() => verificar()}>
          <Text style={styles.revisarButtonText}>🎯 Revisar Jugada</Text>
        </TouchableOpacity>

        {/* Resultados */}
        {resultadosModalidades.length > 0 && (
          <View style={styles.resultadosSection}>
            <Text style={styles.resultadosTitle}>📊 Resultados</Text>
            {resultadosModalidades.map((mod, idx) => (
              <View key={idx} style={styles.modalidadCard}>
                <View style={styles.modalidadHeader}>
                  <Text style={styles.modalidadTitulo}>{mod.titulo}</Text>
                  <View style={styles.aciertosContainer}>
                    <Text style={styles.aciertosText}>{mod.aciertos} aciertos</Text>
                  </View>
                </View>
                {renderNumeros(mod.numeros)}
                <View style={styles.premioContainer}>
                  <Text style={[styles.premioText, mod.aciertos >= 4 ? styles.conPremio : styles.sinPremio]}>
                    {mod.aciertos >= 4
                      ? `🏆 Tiene Premio: $${mod.premio ?? "?"}`
                      : "❌ Sin premio"}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    color: '#2c3e50',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#34495e',
  },
  pickerContainer: {
    marginBottom: 24,
  },
  pickerWrapper: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  picker: {
    height: 50,
  },
  jugadaSection: {
    marginBottom: 24,
  },
  numerosContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  numeroInput: {
    width: 56,
    height: 56,
    borderWidth: 2,
    borderColor: '#dee2e6',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    backgroundColor: '#fff',
    margin: 4,
  },
  revisarButton: {
    backgroundColor: '#3498db',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  revisarButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultadosSection: {
    marginTop: 8,
  },
  resultadosTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#2c3e50',
  },
  modalidadCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  modalidadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalidadTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  aciertosContainer: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  aciertosText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976d2',
  },
  numerosRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 6,
  },
  numero: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#dee2e6',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
  },
  numeroAcierto: {
    backgroundColor: '#d4edda',
    borderColor: '#28a745',
  },
  premioContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  premioText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  conPremio: {
    color: '#28a745',
  },
  sinPremio: {
    color: '#6c757d',
  },
});
