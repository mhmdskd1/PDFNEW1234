import React, { useState } from 'react';
import {
  Paper,
  Tabs,
  Tab,
  Box,
  Typography
} from '@mui/material';
import {
  Payment as PaymentIcon,
  AccountBalance as BalanceIcon
} from '@mui/icons-material';
import FinancialPage from './FinancialPage';
import BalancesPage from './BalancesPage';

const AccountsPage = () => {
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box>{children}</Box>}
    </div>
  );

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        إدارة الحسابات والأرصدة
      </Typography>
      
      <Paper sx={{ width: '100%', mt: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={currentTab} 
            onChange={handleTabChange}
            variant="fullWidth"
          >
            <Tab 
              label="المالية" 
              icon={<PaymentIcon />} 
              iconPosition="start"
            />
            <Tab 
              label="الأرصدة" 
              icon={<BalanceIcon />} 
              iconPosition="start"
            />
          </Tabs>
        </Box>

        <TabPanel value={currentTab} index={0}>
          <FinancialPage />
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          <BalancesPage />
        </TabPanel>
      </Paper>
    </div>
  );
};

export default AccountsPage;