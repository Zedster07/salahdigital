import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { t } from '../../utils/translations';
import { formatDate } from '../../utils/dateUtils';
import { getSubscriptionStatus } from '../../utils/helpers';
import { User, Phone, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';

export function RecentSubscribers() {
  const { state } = useApp();
  const { subscribers, settings } = state;

  const recentSubscribers = React.useMemo(() => {
    return [...subscribers]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [subscribers]);

  const getStatusIcon = (subscriber: any) => {
    const status = getSubscriptionStatus(subscriber);
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'expired':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-orange-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (subscriber: any) => {
    const status = getSubscriptionStatus(subscriber);
    return t(status, settings.language);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        {t('recentSubscribers', settings.language)}
      </h3>
      
      {recentSubscribers.length === 0 ? (
        <div className="text-center py-8">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucun abonné pour le moment</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recentSubscribers.map((subscriber) => (
            <div
              key={subscriber.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{subscriber.name}</h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Phone className="w-4 h-4" />
                      <span>{subscriber.phone}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(subscriber.createdAt, settings.language)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-700">
                  {subscriber.subscriptionName}
                </span>
                <div className="flex items-center space-x-1">
                  {getStatusIcon(subscriber)}
                  <span className="text-sm font-medium">
                    {getStatusText(subscriber)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}