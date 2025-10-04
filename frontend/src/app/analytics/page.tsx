'use client'

import React from 'react'
import MainLayout from '../../components/layout/MainLayout'
import AnalyticsDashboard from '../../components/analytics/AnalyticsDashboard'

export default function AnalyticsPage() {
  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnalyticsDashboard />
        </div>
      </div>
    </MainLayout>
  )
}
