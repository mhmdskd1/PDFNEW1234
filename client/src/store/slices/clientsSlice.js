import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const fetchClients = createAsyncThunk(
  'clients/fetchClients',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/clients', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const createClient = createAsyncThunk(
  'clients/createClient',
  async (clientData, { rejectWithValue }) => {
    try {
      const response = await api.post('/clients', clientData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const updateClient = createAsyncThunk(
  'clients/updateClient',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/clients/${id}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const deleteClient = createAsyncThunk(
  'clients/deleteClient',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/clients/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

const clientsSlice = createSlice({
  name: 'clients',
  initialState: {
    clients: [],
    total: 0,
    page: 1,
    limit: 10,
    loading: false,
    error: null,
    selectedClient: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedClient: (state, action) => {
      state.selectedClient = action.payload;
    },
    setPage: (state, action) => {
      state.page = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Clients
      .addCase(fetchClients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClients.fulfilled, (state, action) => {
        state.loading = false;
        state.clients = action.payload.clients;
        state.total = action.payload.total;
        state.page = action.payload.page;
      })
      .addCase(fetchClients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Client
      .addCase(createClient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createClient.fulfilled, (state, action) => {
        state.loading = false;
        state.clients.unshift(action.payload.client);
        state.total += 1;
      })
      .addCase(createClient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Client
      .addCase(updateClient.fulfilled, (state, action) => {
        const index = state.clients.findIndex(c => c._id === action.payload.client._id);
        if (index !== -1) {
          state.clients[index] = action.payload.client;
        }
      })
      // Delete Client
      .addCase(deleteClient.fulfilled, (state, action) => {
        state.clients = state.clients.filter(c => c._id !== action.payload);
        state.total -= 1;
      });
  },
});

export const { clearError, setSelectedClient, setPage } = clientsSlice.actions;
export default clientsSlice.reducer;
