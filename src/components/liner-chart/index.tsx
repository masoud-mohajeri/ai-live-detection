import type { FC } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import styles from './index.module.scss'

const colors = ['#bc5090', '#ff6361', '#003f5c', '#58508d']

type LinerChartProps<T extends { [key: string]: number[] }> = {
  data: T[]
  keysToPresent: Array<keyof T>
  title: string
}

export const LinerChartFactory = <T extends {}>() => {
  const Instance: FC<LinerChartProps<T>> = ({ data, keysToPresent, title }) => {
    return (
      <div className={styles.chart}>
        <h2>{title}</h2>
        <ResponsiveContainer width="100%" height={500}>
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
                key={item as string}
                isAnimationActive={false}
                type="monotone"
                dataKey={item as string}
                stroke={colors[index]}
                activeDot={{ r: 8 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  }
  return Instance
}
