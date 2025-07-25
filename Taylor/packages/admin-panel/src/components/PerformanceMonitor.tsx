import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface PerformanceMetric {
  id: string;
  endpoint_name: string;
  response_time_ms: number;
  status_code: number;
  cached: boolean;
  created_at: string;
}

interface PerformanceStats {
  totalRequests: number;
  averageResponseTime: number;
  cacheHitRate: number;
  errorRate: number;
  slowRequests: number;
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPerformanceMetrics();
    const interval = setInterval(fetchPerformanceMetrics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchPerformanceMetrics = async () => {
    try {
      setLoading(true);
      
      // Fetch recent performance metrics
      const { data: recentMetrics, error: metricsError } = await supabase
        .from('performance_metrics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (metricsError) throw metricsError;

      setMetrics(recentMetrics || []);

      // Calculate performance statistics
      if (recentMetrics && recentMetrics.length > 0) {
        const totalRequests = recentMetrics.length;
        const averageResponseTime = recentMetrics.reduce((sum, m) => sum + m.response_time_ms, 0) / totalRequests;
        const cacheHitRate = (recentMetrics.filter(m => m.cached).length / totalRequests) * 100;
        const errorRate = (recentMetrics.filter(m => m.status_code >= 400).length / totalRequests) * 100;
        const slowRequests = recentMetrics.filter(m => m.response_time_ms > 500).length;

        setStats({
          totalRequests,
          averageResponseTime: Math.round(averageResponseTime),
          cacheHitRate: Math.round(cacheHitRate * 100) / 100,
          errorRate: Math.round(errorRate * 100) / 100,
          slowRequests
        });
      }

      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch performance metrics');
      setLoading(false);
    }
  };

  const getStatusColor = (statusCode: number) => {
    if (statusCode < 300) return 'text-green-600';
    if (statusCode < 400) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceColor = (responseTime: number) => {
    if (responseTime < 200) return 'text-green-600';
    if (responseTime < 500) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Performance Monitor</h3>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Performance Monitor</h3>
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Performance Monitor</h3>
        <button
          onClick={fetchPerformanceMetrics}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {/* Performance Statistics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="text-2xl font-bold text-blue-600">{stats.totalRequests}</div>
            <div className="text-sm text-gray-600">Total Requests</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className={`text-2xl font-bold ${getPerformanceColor(stats.averageResponseTime)}`}>
              {stats.averageResponseTime}ms
            </div>
            <div className="text-sm text-gray-600">Avg Response Time</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="text-2xl font-bold text-green-600">{stats.cacheHitRate}%</div>
            <div className="text-sm text-gray-600">Cache Hit Rate</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className={`text-2xl font-bold ${stats.errorRate > 5 ? 'text-red-600' : 'text-green-600'}`}>
              {stats.errorRate}%
            </div>
            <div className="text-sm text-gray-600">Error Rate</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className={`text-2xl font-bold ${stats.slowRequests > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {stats.slowRequests}
            </div>
            <div className="text-sm text-gray-600">Slow Requests</div>
          </div>
        </div>
      )}

      {/* Recent Metrics Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Endpoint
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Response Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cached
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {metrics.map((metric) => (
              <tr key={metric.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {metric.endpoint_name}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${getPerformanceColor(metric.response_time_ms)}`}>
                  {metric.response_time_ms}ms
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${getStatusColor(metric.status_code)}`}>
                  {metric.status_code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {metric.cached ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Cached
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Fresh
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(metric.created_at).toLocaleTimeString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {metrics.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No performance metrics available yet.
        </div>
      )}
    </div>
  );
} 