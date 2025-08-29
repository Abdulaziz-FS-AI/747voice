'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Phone, 
  Users, 
  TrendingUp, 
  TrendingDown,
  MessageSquare
} from 'lucide-react'

interface DashboardData {
  metrics: {
    totalCalls: number
    totalLeads: number
    conversionRate: number
    avgSentiment: number
    avgEngagement: number
  }
  dailyPerformance: Array<{
    date: string
    calls: number
    leads: number
    conversionRate: number
    sentiment: number
  }>
  leadQuality: {
    hot: number
    warm: number
    cool: number
  }
  topTopics: Array<{
    topic: string
    count: number
  }>
  intentDistribution: Array<{
    intent: string
    count: number
  }>
  recentLeads: Array<{
    id: string
    first_name: string
    last_name: string
    email: string
    phone: string
    lead_quality: string
    lead_score: number
    recommended_action: string
    call_time: string
    primary_intent: string
  }>
  assistantPerformance: Array<{
    name: string
    calls: number
    leads: number
    conversionRate: number
  }>
}

// MetricCard Component
const MetricCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  trend,
  description 
}: {
  title: string
  value: string | number
  change?: string
  icon: any
  trend?: 'up' | 'down' | 'neutral'
  description?: string
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {change && (
        <div className="flex items-center text-xs text-muted-foreground">
          {trend === 'up' && <TrendingUp className="h-3 w-3 mr-1 text-green-500" />}
          {trend === 'down' && <TrendingDown className="h-3 w-3 mr-1 text-red-500" />}
          <span>{change}</span>
        </div>
      )}
      {description && (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}
    </CardContent>
  </Card>
)

// Simple bar chart component
const SimpleBarChart = ({ data, title }: { data: any[], title: string }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        {data.slice(0, 5).map((item, index) => {
          const maxValue = Math.max(...data.map(d => d.calls || d.count || d.leads || 0))
          const width = ((item.calls || item.count || item.leads || 0) / maxValue) * 100
          
          return (
            <div key={index} className="flex items-center justify-between">
              <div className="flex-1 flex items-center">
                <span className="text-sm font-medium min-w-0 flex-1 truncate">
                  {item.date || item.topic || item.name || item.intent}
                </span>
                <div className="ml-2 flex-1 bg-gray-200 rounded-full h-2 max-w-32">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
              <span className="text-sm text-muted-foreground ml-2 min-w-fit">
                {item.calls || item.count || item.leads || 0}
              </span>
            </div>
          )
        })}
      </div>
    </CardContent>
  </Card>
)

// Lead quality distribution pie chart (simple version)
const LeadQualityChart = ({ data }: { data: { hot: number, warm: number, cool: number } }) => {
  const total = data.hot + data.warm + data.cool
  if (total === 0) return null

  const segments = [
    { label: 'Hot', count: data.hot, color: 'bg-red-500', percentage: (data.hot / total) * 100 },
    { label: 'Warm', count: data.warm, color: 'bg-yellow-500', percentage: (data.warm / total) * 100 },
    { label: 'Cool', count: data.cool, color: 'bg-blue-500', percentage: (data.cool / total) * 100 }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Lead Quality Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Simple horizontal bar representation */}
          <div className="w-full bg-gray-200 rounded-full h-4 flex overflow-hidden">
            {segments.map((segment, index) => (
              <div
                key={index}
                className={`${segment.color} h-full`}
                style={{ width: `${segment.percentage}%` }}
                title={`${segment.label}: ${segment.count} leads`}
              />
            ))}
          </div>
          
          {/* Legend */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            {segments.map((segment, index) => (
              <div key={index} className="flex items-center">
                <div className={`w-3 h-3 rounded-full ${segment.color} mr-2`} />
                <span className="text-muted-foreground">{segment.label}</span>
                <span className="ml-auto font-medium">{segment.count}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30')
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics/dashboard?days=${timeRange}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }
      
      const result = await response.json()
      if (result.success) {
        setData(result.data)
      } else {
        throw new Error(result.error || 'Unknown error')
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [timeRange])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading analytics...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error loading dashboard: {error}</p>
          <Button onClick={fetchDashboardData}>Retry</Button>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">No data available</div>
      </div>
    )
  }

  const getSentimentLabel = (score: number) => {
    if (score > 0.3) return { label: 'Positive', color: 'text-green-600' }
    if (score < -0.3) return { label: 'Negative', color: 'text-red-600' }
    return { label: 'Neutral', color: 'text-gray-600' }
  }

  const sentiment = getSentimentLabel(data.metrics.avgSentiment)

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Voice assistant performance and lead insights
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchDashboardData} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Total Calls"
          value={data.metrics.totalCalls.toLocaleString()}
          icon={Phone}
          description="Voice interactions processed"
        />
        <MetricCard
          title="Leads Generated"
          value={data.metrics.totalLeads.toLocaleString()}
          icon={Users}
          description={`${data.metrics.conversionRate}% conversion rate`}
        />
        <MetricCard
          title="Avg Sentiment"
          value={sentiment.label}
          icon={MessageSquare}
          description={`Score: ${data.metrics.avgSentiment.toFixed(2)}`}
        />
      </div>

      {/* Charts and Analytics */}
      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="leads">Lead Analysis</TabsTrigger>
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
          <TabsTrigger value="assistants">Assistants</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SimpleBarChart
              data={data.dailyPerformance.map(d => ({ date: d.date, calls: d.calls }))}
              title="Daily Call Volume"
            />
            <LeadQualityChart data={data.leadQuality} />
          </div>
        </TabsContent>

        <TabsContent value="leads" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent High-Quality Leads */}
            <Card>
              <CardHeader>
                <CardTitle>Recent High-Quality Leads</CardTitle>
                <CardDescription>Hot and warm leads that need follow-up</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.recentLeads.slice(0, 5).map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">
                          {lead.first_name} {lead.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {lead.email || lead.phone}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {lead.primary_intent} • Score: {lead.lead_score}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={lead.lead_quality === 'hot' ? 'destructive' : 'secondary'}
                        >
                          {lead.lead_quality}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(lead.call_time).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Lead Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Recommended Actions</CardTitle>
                <CardDescription>Based on lead quality and timing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 bg-red-50 rounded border-l-4 border-red-500">
                    <span className="text-sm font-medium">Contact Immediately</span>
                    <Badge variant="destructive">{data.leadQuality.hot} leads</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-yellow-50 rounded border-l-4 border-yellow-500">
                    <span className="text-sm font-medium">Follow up within 24h</span>
                    <Badge variant="secondary">{data.leadQuality.warm} leads</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-blue-50 rounded border-l-4 border-blue-500">
                    <span className="text-sm font-medium">Add to nurture campaign</span>
                    <Badge variant="outline">{data.leadQuality.cool} leads</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="conversations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SimpleBarChart
              data={data.topTopics}
              title="Most Discussed Topics"
            />
            <SimpleBarChart
              data={data.intentDistribution}
              title="Customer Intent Distribution"
            />
          </div>

          {/* Engagement Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Conversation Quality</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {data.metrics.avgEngagement.toFixed(1)}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Engagement Score</div>
                </div>
                <div className="text-center">
                  <div className={`text-3xl font-bold ${sentiment.color}`}>
                    {data.metrics.avgSentiment.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Sentiment Score</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assistants" className="space-y-6">
          <SimpleBarChart
            data={data.assistantPerformance.map(a => ({ name: a.name, leads: a.leads }))}
            title="Assistant Performance (Leads Generated)"
          />
          
          {/* Assistant Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle>Assistant Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Assistant</th>
                      <th className="text-right p-2">Calls</th>
                      <th className="text-right p-2">Leads</th>
                      <th className="text-right p-2">Conversion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.assistantPerformance.map((assistant, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2 font-medium">{assistant.name}</td>
                        <td className="p-2 text-right">{assistant.calls}</td>
                        <td className="p-2 text-right">{assistant.leads}</td>
                        <td className="p-2 text-right">{assistant.conversionRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}