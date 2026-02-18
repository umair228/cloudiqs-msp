import React from 'react';
import { Tooltip, Tag } from 'antd';
import { FaClock, FaSpinner, FaCheckCircle, FaTimesCircle, FaExclamationTriangle } from 'react-icons/fa';

const RoleStatusIndicator = ({ roleStatus }) => {
  const getStatusConfig = () => {
    switch (roleStatus) {
      case 'pending_approval':
        return {
          label: 'Pending Approval',
          icon: <FaClock />,
          color: 'gold',
          tooltip: 'Waiting for customer to approve invitation'
        };
      case 'approved':
        return {
          label: 'Approved',
          icon: <FaSpinner className="fa-spin" />,
          color: 'blue',
          tooltip: 'Customer approved - waiting for CloudFormation deployment'
        };
      case 'established':
        return {
          label: 'Established ✓',
          icon: <FaCheckCircle />,
          color: 'green',
          tooltip: 'Role verified and ready for access requests'
        };
      case 'rejected':
        return {
          label: 'Rejected',
          icon: <FaTimesCircle />,
          color: 'red',
          tooltip: 'Customer rejected the invitation'
        };
      case 'verification_failed':
        return {
          label: 'Verification Failed',
          icon: <FaExclamationTriangle />,
          color: 'red',
          tooltip: 'Role verification failed - check configuration'
        };
      default:
        return {
          label: 'Unknown',
          icon: null,
          color: 'default',
          tooltip: 'Status unknown'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Tooltip title={config.tooltip}>
      <Tag
        color={config.color}
        style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '5px',
          cursor: 'pointer',
          fontSize: '12px',
          padding: '2px 8px'
        }}
      >
        {config.icon}
        <span>{config.label}</span>
      </Tag>
    </Tooltip>
  );
};

export default RoleStatusIndicator;
