// src/components/dashboard/DashboardCard.jsx
import React from 'react';

const DashboardCard = ({ 
  title, 
  subtitle,
  children, 
  className = '', 
  action,
  gridColumn = 'span 1',
  loading = false,
  icon
}) => {
  if (loading) {
    return (
      <div 
        className={`dashboard-card loading ${className}`}
        style={{ gridColumn }}
      >
        <div className="card-header">
          <div className="skeleton-title"></div>
        </div>
        <div className="card-content">
          <div className="skeleton-content"></div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`dashboard-card ${className}`}
      style={{ gridColumn }}
    >
      <div className="card-header">
        <div className="card-title-wrapper">
          {icon && <div className="card-icon">{icon}</div>}
          <div>
            <h3 className="card-title">{title}</h3>
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
        </div>
        {action && <div className="card-action">{action}</div>}
      </div>
      <div className="card-content">
        {children}
      </div>
    </div>
  );
};

export default DashboardCard;