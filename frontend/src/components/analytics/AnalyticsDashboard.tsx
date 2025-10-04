'use client'

import React, { useState, useEffect } from 'react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingCart, 
  DollarSign, 
  Eye,
  Star,
  Download,
  RefreshCw
} from 'lucide-react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

interface AnalyticsData {
  sales: {
    total: number
    growth: number
    chartData: Array<{ date: string; sales: number; orders: number }>
  }
  products: {
    total: number
    topSelling: Array<{ name: string; sales: number; revenue: number }>
    categories: Array<{ name: string; count: number; percentage: number }>
  }
  users: {
    total: number
    newUsers: number
    activeUsers: number
    chartData: Array<{ date: string; users: number; newUsers: number }>
  }
  orders: {
    total: number
    pending: number
    completed: number
    cancelled: number
    chartData: Array<{ date: string; orders: number; revenue: number }>
  }
  revenue: {
    total: number
    growth: number
    chartData: Array<{ date: string; revenue: number; profit: number }>
  }
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export const AnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')

  useEffect(() => {
    fetchAnalyticsData()
  }, [timeRange])

  const fetchAnalyticsData = async () => {
    setLoading(true)
    try {
      // Mock data - replace with actual API call
      const mockData: AnalyticsData = {
        sales: {
          total: 125000,
          growth: 12.5,
          chartData: generateChartData(30, 'sales')
        },
        products: {
          total: 1250,
          topSelling: [
            { name: 'iPhone 15 Pro', sales: 150, revenue: 225000 },
            { name: 'Samsung Galaxy S24', sales: 120, revenue: 180000 },
            { name: 'MacBook Pro M3', sales: 80, revenue: 200000 },
            { name: 'AirPods Pro', sales: 200, revenue: 50000 },
            { name: 'iPad Air', sales: 90, revenue: 90000 }
          ],
          categories: [
            { name: 'Electronics', count: 450, percentage: 36 },
            { name: 'Clothing', count: 300, percentage: 24 },
            { name: 'Home & Garden', count: 250, percentage: 20 },
            { name: 'Books', count: 150, percentage: 12 },
            { name: 'Sports', count: 100, percentage: 8 }
          ]
        },
        users: {
          total: 15420,
          newUsers: 1250,
          activeUsers: 8750,
          chartData: generateChartData(30, 'users')
        },
        orders: {
          total: 3250,
          pending: 125,
          completed: 2950,
          cancelled: 175,
          chartData: generateChartData(30, 'orders')
        },
        revenue: {
          total: 1250000,
          growth: 8.2,
          chartData: generateChartData(30, 'revenue')
        }
      }
      
      setData(mockData)
    } catch (error) {
      console.error('Failed to fetch analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateChartData = (days: number, type: string) => {
    const data = []
    const today = new Date()
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      const baseValue = type === 'sales' ? 1000 : type === 'users' ? 100 : type === 'orders' ? 50 : 5000
      const randomFactor = 0.5 + Math.random()
      
      data.push({
        date: date.toISOString().split('T')[0],
        sales: Math.floor(baseValue * randomFactor),
        orders: Math.floor(baseValue * 0.1 * randomFactor),
        users: Math.floor(baseValue * randomFactor),
        newUsers: Math.floor(baseValue * 0.1 * randomFactor),
        revenue: Math.floor(baseValue * 10 * randomFactor),
        profit: Math.floor(baseValue * 2 * randomFactor)
      })
    }
    
    return data
  }

  const StatCard: React.FC<{
    title: string
    value: string | number
    growth?: number
    icon: React.ReactNode
    color: string
  }> = ({ title, value, growth, icon, color }) => (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {growth !== undefined && (
            <div className="flex items-center mt-1">
              {growth >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm ${growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {Math.abs(growth)}%
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
      </div>
    </Card>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load analytics data</p>
        <Button onClick={fetchAnalyticsData} className="mt-4">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Overview of your e-commerce performance</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <Button onClick={fetchAnalyticsData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={`₹${data.revenue.total.toLocaleString()}`}
          growth={data.revenue.growth}
          icon={<DollarSign className="w-6 h-6 text-white" />}
          color="bg-green-500"
        />
        <StatCard
          title="Total Orders"
          value={data.orders.total.toLocaleString()}
          growth={5.2}
          icon={<ShoppingCart className="w-6 h-6 text-white" />}
          color="bg-blue-500"
        />
        <StatCard
          title="Total Users"
          value={data.users.total.toLocaleString()}
          growth={15.8}
          icon={<Users className="w-6 h-6 text-white" />}
          color="bg-purple-500"
        />
        <StatCard
          title="Total Products"
          value={data.products.total.toLocaleString()}
          growth={2.1}
          icon={<Eye className="w-6 h-6 text-white" />}
          color="bg-orange-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.revenue.chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Orders Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Orders Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.orders.chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Top Selling Products */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Top Selling Products</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.products.topSelling}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="sales" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Product Categories */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Product Categories</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.products.categories}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name} ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {data.products.categories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Order Status Overview */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Order Status Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{data.orders.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{data.orders.completed}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{data.orders.cancelled}</div>
            <div className="text-sm text-gray-600">Cancelled</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{data.orders.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default AnalyticsDashboard
