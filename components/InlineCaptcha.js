import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { generateCaptcha } from '../services/validationService';

export default function InlineCaptcha({ onSuccess, onCancel }) {
  const [captcha, setCaptcha] = useState(() => {
    console.log('InlineCaptcha: Generando captcha inicial');
    return generateCaptcha();
  });
  const [userAnswer, setUserAnswer] = useState('');
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 3;

  const generateNewCaptcha = () => {
    const newCaptcha = generateCaptcha();
    console.log('InlineCaptcha: Nuevo captcha generado', { question: newCaptcha.question, answer: newCaptcha.answer });
    setCaptcha(newCaptcha);
    setUserAnswer('');
  };

  const handleSubmit = () => {
    console.log('InlineCaptcha: handleSubmit', { userAnswer, expectedAnswer: captcha.answer });
    const answer = parseInt(userAnswer);
    
    if (answer === captcha.answer) {
      console.log('InlineCaptcha: Respuesta correcta');
      onSuccess();
    } else {
      const newAttempts = attempts + 1;
      console.log('InlineCaptcha: Respuesta incorrecta', { attempts: newAttempts });
      setAttempts(newAttempts);
      
      if (newAttempts >= maxAttempts) {
        console.log('InlineCaptcha: Máximo de intentos alcanzado');
        onCancel();
      } else {
        generateNewCaptcha();
      }
    }
  };

  if (!captcha) {
    console.log('InlineCaptcha: No hay captcha, no renderizando');
    return null;
  }
  
  console.log('InlineCaptcha: Renderizando captcha', { captcha, attempts });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🤖 Verificación de Seguridad</Text>
      <Text style={styles.debug}>CAPTCHA VISIBLE - DEBUG</Text>
      <Text style={styles.subtitle}>
        Resuelve esta operación para continuar:
      </Text>
      
      <View style={styles.captchaContainer}>
        <Text style={styles.question}>{captcha.question}</Text>
        <TextInput
          id="captcha-input"
          name="captcha-answer"
          style={styles.input}
          value={userAnswer}
          onChangeText={setUserAnswer}
          keyboardType="numeric"
          placeholder="Respuesta"
          maxLength={3}
        />
      </View>
      
      {attempts > 0 && (
        <Text style={styles.error}>
          Respuesta incorrecta. Intentos restantes: {maxAttempts - attempts}
        </Text>
      )}
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.submitButton, !userAnswer && styles.disabledButton]} 
          onPress={() => {
            console.log('InlineCaptcha: Botón Verificar presionado', { userAnswer, captcha });
            handleSubmit();
          }}
          disabled={!userAnswer}
        >
          <Text style={styles.submitButtonText}>Verificar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.cancelButton} 
          onPress={onCancel}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007bff',
    marginTop: 20,
    marginHorizontal: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#495057',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 16,
  },
  captchaContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  question: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 12,
  },
  input: {
    borderWidth: 2,
    borderColor: '#007bff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
    width: 80,
    fontWeight: 'bold',
    backgroundColor: '#fff',
  },
  error: {
    color: '#dc3545',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  submitButton: {
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#6c757d',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  debug: {
    color: 'red',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
});