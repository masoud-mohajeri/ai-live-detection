import type { FC } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const colors = ['#8884d8', '#82ca9d', '#BB2525']

type LinerChartProps<T extends {}> = { data: T[]; keysToPresent: Array<keyof T> }

export const LinerChartFactory = <T extends {}>() => {
  const Instance: FC<LinerChartProps<T>> = ({ data, keysToPresent }) => {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          width={500}
          height={300}
          data={data.map((item, index) => ({ ...item, index }))}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="index" />
          <YAxis />
          <Tooltip />
          <Legend />
          {keysToPresent.map((item, index) => (
            <Line
              isAnimationActive={false}
              type="monotone"
              dataKey={item as string}
              stroke={colors[index]}
              activeDot={{ r: 8 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    )
  }
  return Instance
}
