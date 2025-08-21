import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image, Modal, Animated, TextInput } from 'react-native';
import Toast from 'react-native-toast-message';
import secureJugadaService from '../services/secureJugadaServiceV2';


export default function PaymentScreen({ route, navigation }) {
  const { selectedNumbers, modalidad, precio, requiresCaptcha } = route.params || {};
  
  // Validar parámetros requeridos
  React.useEffect(() => {
    if (!selectedNumbers || !modalidad) {
      console.error('PaymentScreen: Parámetros faltantes', { selectedNumbers, modalidad, precio });
      Alert.alert('Error', 'Datos de jugada inválidos', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
      return;
    }
    console.log('PaymentScreen: Parámetros recibidos', { selectedNumbers, modalidad, precio, requiresCaptcha });
  }, []);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [scaleValue] = useState(new Animated.Value(0));

  const handleConfirm = () => {
    console.log('PaymentScreen: handleConfirm called - procesando pago directamente');
    processPayment();
  };

  const processPayment = async () => {
    console.log('PaymentScreen: processPayment iniciado', { selectedNumbers, modalidad });
    try {
      console.log('PaymentScreen: Usando servicio seguro...');
      await secureJugadaService['gJ']({
        numeros: selectedNumbers,
        tipo: modalidad
      });
      console.log('PaymentScreen: Servicio seguro exitoso');

      Toast.show({
        type: 'success',
        text1: '¡Jugada confirmada!',
        position: 'top',
        visibilityTime: 3000,
      });

      setModalVisible(true);
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
      }).start();

      setTimeout(() => {
        setModalVisible(false);
        scaleValue.setValue(0);
        navigation.navigate('Home');
      }, 2000);
    } catch (error) {
      console.error('Error al guardar la jugada:', error);
      Alert.alert('Error', error.message || 'No se pudo guardar la jugada');
    }
  };



  return (
    <View style={styles.container}>
      {/* Logo de Mercado Pago */}
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>💳 Mercado Pago</Text>
      </View>

      {/* Título */}
      <Text style={styles.title}>Confirmar y Pagar</Text>

      {/* Números seleccionados */}
      <Text style={styles.label}>Números elegidos</Text>
      <Text style={styles.numbers}>{selectedNumbers.join(' - ')}</Text>

      {/* Modalidad */}
      <Text style={styles.label}>Modalidad</Text>
      <Text style={styles.modalidad}>Quini 6 - {modalidad}</Text>

      {/* Precio */}
      <View style={styles.priceContainer}>
        <Text style={styles.priceLabel}>Total a pagar:</Text>
        <Text style={styles.price}>${precio}</Text>
      </View>

      {/* Botón de pago simulado */}
      <TouchableOpacity style={styles.payButton} onPress={handleConfirm}>
        <Text style={styles.payButtonText}>Pagar con Mercado Pago</Text>
      </TouchableOpacity>

      {/* Texto pequeño */}
      <Text style={styles.secureText}>🔒 Pago 100% seguro a través de Mercado Pago</Text>



      {/* Modal de confirmación */}
      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContent, { transform: [{ scale: scaleValue }] }]}>
            <Text style={styles.modalText}>✅ Jugada confirmada.</Text>
            <Text style={styles.modalText}>¡Mucha suerte!</Text>
          </Animated.View>
        </View>
      </Modal>


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  logoContainer: {
    width: 240,
    height: 70,
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#009ee3',
    borderRadius: 8,
  },
  logoText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    marginBottom: 32,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#333',
  },
  label: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  numbers: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalidad: {
    fontSize: 20,
    fontWeight: '600',
    color: '#007aff',
    marginBottom: 24,
    textAlign: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginVertical: 24,
  },
  priceLabel: {
    fontSize: 20,
    marginRight: 8,
    color: '#333',
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00a650',
  },
  payButton: {
    backgroundColor: '#009ee3',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    marginTop: 24,
    minHeight: 56,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  payButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  secureText: {
    fontSize: 16,
    color: '#777',
    marginTop: 20,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    width: '90%',
    maxWidth: 400,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  modalText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00a650',
    textAlign: 'center',
    marginVertical: 4,
  },
  captchaContainer: {
    backgroundColor: '#fff',
    padding: 20,
    margin: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007bff',
    elevation: 5,
  },
  captchaTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
  },
  captchaQuestion: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#007bff',
  },
  captchaInput: {
    borderWidth: 2,
    borderColor: '#007bff',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
  },
  captchaCancel: {
    backgroundColor: '#6c757d',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  captchaCancelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
