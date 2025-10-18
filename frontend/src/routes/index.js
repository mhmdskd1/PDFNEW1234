import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PrivateRoute from '../components/PrivateRoute';
import Layout from '../components/Layout';

// استيراد جميع الصفحات
import LoginPage from '../pages/Login';
import DashboardPage from '../pages/Dashboard';
import ClientsPage from '../pages/Clients';
import CompaniesPage from '../pages/Companies';
import PayingCompaniesPage from '../pages/PayingCompanies';
import PDFInvoiceCreatorPage from '../pages/PDFInvoiceCreator';
import DigitalInvoiceCreatorPage from '../pages/DigitalInvoiceCreator';
import AccountsPage from '../pages/Accounts';
import PaidInvoicesPage from '../pages/PaidInvoices';
import DigitalInvoicesPage from '../pages/DigitalInvoices';
import ReportsPage from '../pages/Reports';
import SettingsPage from '../pages/Settings';

const AppRoutes = () => {
  return (
    <Routes>
      {/* مسار تسجيل الدخول */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* المسارات المحمية */}
      <Route path="/" element={
        <PrivateRoute>
          <Layout />
        </PrivateRoute>
      }>
        {/* الصفحة الرئيسية */}
        <Route index element={<DashboardPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        
        {/* إدارة العملاء */}
        <Route path="clients" element={
          <PrivateRoute requiredPermission="manageClients">
            <ClientsPage />
          </PrivateRoute>
        } />
        
        {/* إدارة الشركات */}
        <Route path="companies" element={
          <PrivateRoute requiredPermission="manageCompanies">
            <CompaniesPage />
          </PrivateRoute>
        } />
        
        {/* إدارة شركات الدفع */}
        <Route path="paying-companies" element={
          <PrivateRoute requiredPermission="manageCompanies">
            <PayingCompaniesPage />
          </PrivateRoute>
        } />
        
        {/* إنشاء فواتير PDF */}
        <Route path="create-pdf-invoice" element={
          <PrivateRoute requiredPermission="createInvoices">
            <PDFInvoiceCreatorPage />
          </PrivateRoute>
        } />
        
        {/* إنشاء فواتير رقمية */}
        <Route path="create-digital-invoice" element={
          <PrivateRoute requiredPermission="createInvoices">
            <DigitalInvoiceCreatorPage />
          </PrivateRoute>
        } />
        
        {/* إدارة الحسابات */}
        <Route path="accounts" element={
          <PrivateRoute requiredPermission="accessAccounts">
            <AccountsPage />
          </PrivateRoute>
        } />
        
        {/* سجل الفواتير PDF */}
        <Route path="paid-invoices" element={
          <PrivateRoute requiredPermission="viewReports">
            <PaidInvoicesPage />
          </PrivateRoute>
        } />
        
        {/* سجل الفواتير الرقمية */}
        <Route path="digital-invoices" element={
          <PrivateRoute requiredPermission="viewReports">
            <DigitalInvoicesPage />
          </PrivateRoute>
        } />
        
        {/* التقارير */}
        <Route path="reports" element={
          <PrivateRoute requiredPermission="viewReports">
            <ReportsPage />
          </PrivateRoute>
        } />
        
        {/* الإعدادات */}
        <Route path="settings" element={
          <PrivateRoute requiredPermission="manageSettings">
            <SettingsPage />
          </PrivateRoute>
        } />
      </Route>
      
      {/* صفحة 404 */}
      <Route path="*" element={
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          flexDirection: 'column'
        }}>
          <h1>الصفحة غير موجودة</h1>
          <p>الرابط الذي تبحث عنه غير متاح</p>
        </div>
      } />
    </Routes>
  );
};

export default AppRoutes;