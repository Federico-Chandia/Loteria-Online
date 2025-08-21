import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView, Alert, Modal } from "react-native";
import { useValidationDebounce } from '../hooks/useDebounce';
import { lazyValidateJugada } from '../services/lazySecurityService';

export default function PlayScreen({ navigation }) {
  const [numeros, setNumeros] = useState(["", "", "", "", "", ""]);
  const [modalidad, setModalidad] = useState("SiempreSale");
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  const precios = {
    Tradicional: 1000,
    LaSegunda: 1000,
    Revancha: 1500,
    SiempreSale: 2000
  };

  const handleChangeNumero = (value, index) => {
    // Sanitizar entrada - permitir 0-45
    const nuevoValor = value.replace(/[^0-9]/g, "").slice(0, 2);
    if (nuevoValor === "" || (parseInt(nuevoValor) >= 0 && parseInt(nuevoValor) <= 45)) {
      const nuevosNumeros = [...numeros];
      nuevosNumeros[index] = nuevoValor;
      setNumeros(nuevosNumeros);
    }
  };

  // Validación con debounce
  const { isValidating, validationResult } = useValidationDebounce(
    lazyValidateJugada,
    numeros.filter(n => n !== ""),
    500
  );

  const getInputStyle = (num, index) => {
    if (num === "") return styles.numeroInput;
    const valor = parseInt(num);
    if (valor < 0 || valor > 45) return [styles.numeroInput, styles.inputError];
    const duplicado = numeros.filter(n => n === num).length > 1;
    if (duplicado) return [styles.numeroInput, styles.inputDuplicate];
    return [styles.numeroInput, styles.inputValid];
  };

  const numerosCompletos = numeros.filter(n => n !== "").length;



  const resetJugada = () => {
    setNumeros(["", "", "", "", "", ""]);
  };

  const jugar = () => {
    // Validaciones
    if (numeros.some(num => num === "")) {
      Alert.alert("Error", "Debes ingresar los 6 números principales.");
      return;
    }
    
    // Validación robusta
    const numerosValidos = numeros.map(n => parseInt(n, 10));
    
    // Verificar rango válido
    if (numerosValidos.some(n => isNaN(n) || n < 0 || n > 45)) {
      Alert.alert("Error", "Los números deben estar entre 0 y 45.");
      return;
    }
    
    // Verificar números únicos
    const numerosUnicos = new Set(numerosValidos);
    if (numerosUnicos.size !== 6) {
      setShowDuplicateModal(true);
      return;
    }
    
    // Verificar que no haya valores vacíos o inválidos
    if (numerosValidos.some(n => !Number.isInteger(n))) {
      Alert.alert("Error", "Todos los números deben ser válidos.");
      return;
    }

    // Navegar a pantalla de pago con validación adicional
    navigation.navigate('Payment', { 
      selectedNumbers: numerosValidos,
      modalidad: modalidad,
      precio: precios[modalidad]
    });
  };

  return (
    <ScrollView style={styles.container}>
      {/* Selector de modalidad */}
      <Text style={styles.sectionTitle}>Selecciona modalidad</Text>
      <View style={styles.modalidadContainer}>
        <TouchableOpacity
          style={[styles.modalidadBtn, modalidad === "Tradicional" && styles.selected]}
          onPress={() => setModalidad("Tradicional")}
        >
          <Text style={styles.modalidadText}>Tradicional</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modalidadBtn, modalidad === "LaSegunda" && styles.selected]}
          onPress={() => setModalidad("LaSegunda")}
        >
          <Text style={styles.modalidadText}>La Segunda</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modalidadBtn, modalidad === "Revancha" && styles.selected]}
          onPress={() => setModalidad("Revancha")}
        >
          <Text style={styles.modalidadText}>Revancha</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modalidadBtn, modalidad === "SiempreSale" && styles.selected]}
          onPress={() => setModalidad("SiempreSale")}
        >
          <Text style={styles.modalidadText}>Siempre Sale</Text>
        </TouchableOpacity>
      </View>

      {/* Números principales */}
      <Text style={styles.sectionTitle}>Ingresa tus 6 números (00-45)</Text>
      <Text style={styles.contador}>
        Seleccionaste {numerosCompletos} de 6 números
        {isValidating && " 🔄"}
        {validationResult && !validationResult.isValid && " ⚠️"}
      </Text>
      <View style={styles.inputRow}>
        {numeros.map((num, index) => (
          <TextInput
            key={index}
            style={getInputStyle(num, index)}
            keyboardType="numeric"
            maxLength={2}
            value={num}
            onChangeText={(value) => handleChangeNumero(value, index)}
          />
        ))}
      </View>





      {/* Precio y acciones */}
      <View style={styles.ticketInfo}>
        <Text style={styles.precio}>💵 Precio: ${precios[modalidad]}</Text>
        <TouchableOpacity style={styles.btnJugar} onPress={jugar}>
          <Text style={styles.btnJugarText}>🎟 Jugar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnReset} onPress={resetJugada}>
          <Text style={styles.btnResetText}>🗑 Borrar</Text>
        </TouchableOpacity>
      </View>

      {/* Modal de advertencia por números duplicados */}
      <Modal
        transparent={true}
        visible={showDuplicateModal}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>⚠️ Números Repetidos</Text>
            <Text style={styles.modalText}>Los números deben ser únicos. Por favor, revisa tu selección.</Text>
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => setShowDuplicateModal(false)}
            >
              <Text style={styles.modalButtonText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f4f4f4", 
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  sectionTitle: { 
    fontSize: 20, 
    fontWeight: "bold", 
    marginVertical: 16,
    textAlign: "center",
    color: "#333"
  },
  modalidadContainer: { 
    flexDirection: "row", 
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20
  },
  modalidadBtn: {
    flex: 1,
    minWidth: "48%",
    paddingVertical: 14,
    paddingHorizontal: 8,
    margin: 4,
    backgroundColor: "#ddd",
    borderRadius: 12,
    alignItems: "center",
    minHeight: 48
  },
  selected: { backgroundColor: "#4cafef" },
  modalidadText: { 
    fontWeight: "bold", 
    color: "#000",
    fontSize: 14,
    textAlign: "center"
  },
  inputRow: { 
    flexDirection: "row", 
    justifyContent: "center", 
    flexWrap: "wrap",
    paddingHorizontal: 10
  },
  contador: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
    fontWeight: "600"
  },
  numeroInput: {
    width: 56,
    height: 56,
    margin: 6,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#ccc",
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold"
  },
  inputValid: {
    borderColor: "#28a745",
    backgroundColor: "#f8fff8"
  },
  inputError: {
    borderColor: "#dc3545",
    backgroundColor: "#fff8f8"
  },
  inputDuplicate: {
    borderColor: "#ffc107",
    backgroundColor: "#fffdf0"
  },
  ticketInfo: { 
    marginVertical: 24, 
    alignItems: "center",
    paddingHorizontal: 16
  },
  precio: { 
    fontSize: 22, 
    fontWeight: "bold", 
    marginBottom: 20,
    color: "#333"
  },
  btnJugar: {
    backgroundColor: "#28a745",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginVertical: 8,
    width: "80%",
    alignItems: "center",
    minHeight: 48
  },
  btnJugarText: { 
    color: "#fff", 
    fontSize: 18, 
    fontWeight: "bold" 
  },
  btnReset: {
    backgroundColor: "#dc3545",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginVertical: 8,
    width: "80%",
    alignItems: "center",
    minHeight: 48
  },
  btnResetText: { 
    color: "#fff", 
    fontSize: 16, 
    fontWeight: "bold" 
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    width: '85%',
    maxWidth: 400,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffc107',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: '#ffc107',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    minHeight: 48,
    justifyContent: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
