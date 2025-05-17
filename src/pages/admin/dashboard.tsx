import { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth } from 'shared/hooks/useAuth';
import { getReports } from 'shared/api/actions';
import globalStyles from 'shared/styles';

export default function AdminDashboard() {
  const { token, user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      if (!token || !user?.admin) {
        setError('Admin access required.');
        setLoading(false);
        return;
      }

      try {
        const data = await getReports(token);
        setReports(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load reports.');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [token, user]);

  if (loading) return <ActivityIndicator style={{ marginTop: 20 }} />;
  if (error) return <Text style={{ color: 'red' }}>{error}</Text>;

  return (
    <ScrollView style={globalStyles.container}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>Reported Posts</Text>
      {reports.length === 0 ? (
        <Text>No reports found.</Text>
      ) : (
        reports.map((report) => (
          <View
            key={report.id}
            style={{
              padding: 12,
              marginBottom: 10,
              backgroundColor: '#F3F4F6',
              borderRadius: 8,
            }}
          >
            <Text style={{ fontWeight: 'bold' }}>Post ID: {report.postId}</Text>
            <Text>Reason: {report.reason}</Text>
            {report.post && (
              <>
                <Text style={{ marginTop: 8, fontStyle: 'italic' }}>
                  Post Title: {report.post.title}
                </Text>
                <Text>Post Body: {report.post.body}</Text>
              </>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}
