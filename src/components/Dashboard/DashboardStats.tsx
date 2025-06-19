import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { t } from '../../utils/translations';
import { formatCurrency, getSubscriptionStatus } from '../../utils/helpers';
import { isExpiringSoon } from '../../utils/dateUtils';
import { Users, Shield, AlertTriangle, DollarSign } from 'lucide-react';

export function DashboardStats() {
  const { state } = useApp();
  const { subscribers, settings } = state;

  const stats = React.useMemo(() => {
    const total = subscribers.length;
    const active = subscribers.filter(sub => getSubscriptionStatus(sub) === 'active').length;
    const expiring = subscribers.filter(sub => 
      getSubscriptionStatus(sub) === 'active' && isExpiringSoon(sub.endDate)
    ).length;
    const revenue = subscribers
      .filter(sub => sub.paymentReceived)
      .reduce((sum, sub) => sum + sub.paymentAmount, 0);

    return { total, active, expiring, revenue };
  }, [subscribers]);

  const statCards = [
    {
      title: t('totalSubscribers', settings.language),
      value: stats.total.toString(),
      icon: Users,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: t('activeSubscriptions', settings.language),
      value: stats.active.toString(),
      icon: Shield,
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      title: t('expiringSoon', settings.language),
      value: stats.expiring.toString(),
      icon: AlertTriangle,
      color: 'orange',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
    {
      title: t('totalRevenue', settings.language),
      value: formatCurrency(stats.revenue, settings.currency),
      icon: DollarSign,
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stat.value}
                </p>
              </div>
              <div className={`${stat.bgColor} p-3 rounded-lg`}>
                <Icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}