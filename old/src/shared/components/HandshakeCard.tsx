import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HandshakeDTO } from 'shared/api/types';
const HandshakeCard = ({ handshake, userId }: { handshake: HandshakeDTO; userId: string }) => {
  const isSender = handshake.senderId.toString() === userId;
  const statusColor = getStatusColor(handshake.status);
  
  return (
    <View style={styles.handshakeCard}>
      <View style={styles.handshakeContent}>
        <View style={styles.handshakeHeader}>
          <Text style={styles.handshakeTitle}>
            {isSender ? 'You sent to' : 'Received from'}
          </Text>
          
          {/* Status indicator */}
          <View style={[styles.statusPill, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{handshake.status}</Text>
          </View>
        </View>
        
        <Text style={styles.postReference}>
          Post ID: {handshake.postId}
        </Text>
        
        <Text style={styles.userReference}>
          {isSender 
            ? `To: User ${handshake.recipientId}`
            : `From: User ${handshake.senderId}`}
        </Text>
        
        <Text style={styles.dateText}>
          Created: {new Date(handshake.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );
};

// Helper function to get status color based on handshake status
const getStatusColor = (status: string) => {
  switch (status) {
    case 'NEW':
      return '#3182CE'; // Blue
    case 'ACCEPTED':
      return '#38A169'; // Green
    case 'COMPLETED':
      return '#805AD5'; // Purple
    case 'REJECTED':
      return '#E53E3E'; // Red
    default:
      return '#718096'; // Gray
  }
};

// Add these to your styles object
const styles = StyleSheet.create({
handshakeCard: {
  backgroundColor: '#FFF',
  borderRadius: 10,
  marginBottom: 15,
  padding: 15,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 2,
},
handshakeContent: {
  width: '100%',
},
handshakeHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 10,
},
handshakeTitle: {
  fontSize: 16,
  fontWeight: 'bold',
  color: '#2D3748',
},
statusPill: {
  paddingVertical: 4,
  paddingHorizontal: 10,
  borderRadius: 15,
},
statusText: {
  color: '#FFF',
  fontSize: 12,
  fontWeight: 'bold',
},
postReference: {
  fontSize: 15,
  color: '#4A5568',
  marginBottom: 5,
},
userReference: {
  fontSize: 14,
  color: '#718096',
  marginBottom: 5,
},
dateText: {
  fontSize: 12,
  color: '#A0AEC0',
},
});

export default HandshakeCard;