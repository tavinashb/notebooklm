import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Note: Voice recognition will be implemented later due to package complexities
// import Voice from '@react-native-voice/voice';

interface VoiceInputButtonProps {
  onTranscript: (transcript: string) => void;
}

const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({ onTranscript }) => {
  const [isListening, setIsListening] = useState(false);

  const startListening = async () => {
    try {
      setIsListening(true);
      
      // Placeholder for voice recognition
      // In a real implementation, this would use @react-native-voice/voice
      setTimeout(() => {
        // Simulate voice input
        const sampleTranscripts = [
          'Washing machine warranty expires next month',
          'Car insurance renewal due in March',
          'School fee payment reminder for next week',
          'Medical checkup appointment scheduled',
          'Birthday reminder for John on 15th',
        ];
        
        const randomTranscript = sampleTranscripts[Math.floor(Math.random() * sampleTranscripts.length)];
        onTranscript(randomTranscript);
        setIsListening(false);
      }, 2000);
      
    } catch (error) {
      console.error('Voice recognition error:', error);
      setIsListening(false);
      Alert.alert('Error', 'Voice recognition failed. Please try again.');
    }
  };

  const stopListening = async () => {
    try {
      setIsListening(false);
      // Voice.stop();
    } catch (error) {
      console.error('Stop listening error:', error);
    }
  };

  const handlePress = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, isListening && styles.listeningButton]}
      onPress={handlePress}
      disabled={isListening}
    >
      <Ionicons
        name={isListening ? 'mic' : 'mic-outline'}
        size={20}
        color={isListening ? '#fff' : '#2196F3'}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  listeningButton: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
});

export default VoiceInputButton;