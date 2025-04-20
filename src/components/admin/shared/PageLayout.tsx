import React from 'react';
import Layout from '../../Layout';
import PageHeader from './PageHeader';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

interface PageLayoutProps {
  title: string;
  children: React.ReactNode;
  actions?: {
    label: string;
    icon: IconDefinition;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  }[];
}

const PageLayout: React.FC<PageLayoutProps> = ({ title, children, actions }) => {
  return (
    <Layout title={title}>
      <PageHeader title={title} actions={actions} />
      <div className="space-y-6">
        {children}
      </div>
    </Layout>
  );
};

export default PageLayout; 