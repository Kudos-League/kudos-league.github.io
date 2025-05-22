import { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useAuth } from 'shared/hooks/useAuth';
import { deleteReport, getReports, updateReportStatus } from 'shared/api/actions';
import globalStyles from 'shared/styles';

export default function AdminDashboard() {
  const { token, user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleDeleteReport = async (reportID: number) => {
    try {
      await deleteReport(reportID, token!);
      setReports(prev => prev.filter(r => r.id !== reportID));
    } catch (err) {
      console.error('Failed to delete report:', err);
      alert('Error deleting report');
    }
  };
  
  const handleUpdateStatus = async (reportID: number, status: 'ignored' | 'resolved') => {
    try {
      await updateReportStatus(reportID, status, token!);
      setReports(prev =>
        prev.map(r =>
          r.id === reportID ? { ...r, status } : r
        )
      );
    } catch (err) {
      console.error('Failed to update report status:', err);
      alert('Error updating report');
    }
  };  

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
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ fontWeight: 'bold' }}>Post ID: {report.postId}</Text>
                <Text>Reason: {report.reason}</Text>
              </View>

              {report.status && (
                <Text style={{ marginTop: 6, fontSize: 12, color: '#888' }}>
                  Status: {report.status}
                </Text>
              )}

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity onPress={() => handleUpdateStatus(report.id, 'ignored')}>
                  <Text style={{ color: 'orange' }}>Ignore</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleUpdateStatus(report.id, 'resolved')}>
                  <Text style={{ color: 'green' }}>Resolve</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteReport(report.id)}>
                  <Text style={{ color: 'red' }}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>

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
