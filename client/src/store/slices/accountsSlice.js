import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const fetchAccounts = createAsyncThunk(
  'accounts/fetchAccounts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/accounts');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const fetchBalances = createAsyncThunk(
  'accounts/fetchBalances',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/accounts/balances');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const processPayment = createAsyncThunk(
  'accounts/processPayment',
  async (paymentData, { rejectWithValue }) => {
    try {
      const response = await api.post('/accounts/payment', paymentData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const fetchTransactions = createAsyncThunk(
  'accounts/fetchTransactions',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/accounts/transactions', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

const accountsSlice = createSlice({
  name: 'accounts',
  initialState: {
    pendingInvoices: [],
    balances: {
      cash: 0,
      brokers: [],
      profit: 0,
    },
    transactions: [],
    loading: false,
    error: null,
    paymentProcessing: false,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Accounts
      .addCase(fetchAccounts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAccounts.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingInvoices = action.payload.pendingInvoices;
      })
      .addCase(fetchAccounts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Balances
      .addCase(fetchBalances.fulfilled, (state, action) => {
        state.balances = action.payload.balances;
      })
      // Process Payment
      .addCase(processPayment.pending, (state) => {
        state.paymentProcessing = true;
        state.error = null;
      })
      .addCase(processPayment.fulfilled, (state, action) => {
        state.paymentProcessing = false;
        // Update invoice status in pending list
        const updatedInvoice = action.payload.invoice;
        const index = state.pendingInvoices.findIndex(inv => inv._id === updatedInvoice._id);
        if (index !== -1) {
          if (updatedInvoice.status === 'paid') {
            state.pendingInvoices.splice(index, 1);
          } else {
            state.pendingInvoices[index] = updatedInvoice;
          }
        }
        // Update balances
        if (action.payload.balances) {
          state.balances = action.payload.balances;
        }
      })
      .addCase(processPayment.rejected, (state, action) => {
        state.paymentProcessing = false;
        state.error = action.payload;
      })
      // Fetch Transactions
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.transactions = action.payload.transactions;
      });
  },
});

export const { clearError } = accountsSlice.actions;
export default accountsSlice.reducer;
