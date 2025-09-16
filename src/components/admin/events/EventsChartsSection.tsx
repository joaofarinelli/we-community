import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from 'recharts';
import type { EventsAnalytics } from '@/hooks/useEventsAnalytics';

interface EventsChartsSectionProps {
  data: EventsAnalytics;
  isLoading: boolean;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export const EventsChartsSection = ({ data, isLoading }: EventsChartsSectionProps) => {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-5 bg-muted rounded w-32"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Events by Month */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Eventos por Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              count: {
                label: "Eventos",
                color: "hsl(var(--primary))",
              },
            }}
          >
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data?.eventsByMonth || []}>
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Events by Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status dos Eventos</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              count: {
                label: "Eventos",
                color: "hsl(var(--primary))",
              },
            }}
          >
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data?.eventsByStatus || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  dataKey="count"
                  nameKey="status"
                >
                  {(data?.eventsByStatus || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Participants Growth */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Crescimento de Participantes</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              participants: {
                label: "Participantes",
                color: "hsl(var(--primary))",
              },
            }}
          >
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data?.participantsByMonth || []}>
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="participants" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Top Spaces */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Espaços por Eventos</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              eventCount: {
                label: "Eventos",
                color: "hsl(var(--primary))",
              },
            }}
          >
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data?.topSpaces || []} layout="horizontal">
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis 
                  type="category" 
                  dataKey="spaceName" 
                  tick={{ fontSize: 12 }}
                  width={100}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="eventCount" fill="hsl(var(--primary))" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};