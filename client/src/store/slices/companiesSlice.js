import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const fetchCompanies = createAsyncThunk(
  'companies/fetchCompanies',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/companies', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const createCompany = createAsyncThunk(
  'companies/createCompany',
  async (companyData, { rejectWithValue }) => {
    try {
      const response = await api.post('/companies', companyData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const updateCompany = createAsyncThunk(
  'companies/updateCompany',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/companies/${id}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const deleteCompany = createAsyncThunk(
  'companies/deleteCompany',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/companies/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const validateBTW = createAsyncThunk(
  'companies/validateBTW',
  async (btwNumber, { rejectWithValue }) => {
    try {
      const response = await api.post('/validation/btw', { btwNumber });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const validateKVK = createAsyncThunk(
  'companies/validateKVK',
  async (kvkNumber, { rejectWithValue }) => {
    try {
      const response = await api.post('/validation/kvk', { kvkNumber });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

const companiesSlice = createSlice({
  name: 'companies',
  initialState: {
    companies: [],
    paymentCompanies: [],
    total: 0,
    page: 1,
    limit: 10,
    loading: false,
    error: null,
    selectedCompany: null,
    validationLoading: false,
    validationResult: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedCompany: (state, action) => {
      state.selectedCompany = action.payload;
    },
    clearValidationResult: (state) => {
      state.validationResult = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Companies
      .addCase(fetchCompanies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCompanies.fulfilled, (state, action) => {
        state.loading = false;
        state.companies = action.payload.companies;
        state.total = action.payload.total;
        state.page = action.payload.page;
      })
      .addCase(fetchCompanies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Company
      .addCase(createCompany.fulfilled, (state, action) => {
        state.companies.unshift(action.payload.company);
        state.total += 1;
      })
      // Update Company
      .addCase(updateCompany.fulfilled, (state, action) => {
        const index = state.companies.findIndex(c => c._id === action.payload.company._id);
        if (index !== -1) {
          state.companies[index] = action.payload.company;
        }
      })
      // Delete Company
      .addCase(deleteCompany.fulfilled, (state, action) => {
        state.companies = state.companies.filter(c => c._id !== action.payload);
        state.total -= 1;
      })
      // BTW Validation
      .addCase(validateBTW.pending, (state) => {
        state.validationLoading = true;
      })
      .addCase(validateBTW.fulfilled, (state, action) => {
        state.validationLoading = false;
        state.validationResult = action.payload;
      })
      .addCase(validateBTW.rejected, (state, action) => {
        state.validationLoading = false;
        state.error = action.payload;
      })
      // KVK Validation
      .addCase(validateKVK.pending, (state) => {
        state.validationLoading = true;
      })
      .addCase(validateKVK.fulfilled, (state, action) => {
        state.validationLoading = false;
        state.validationResult = action.payload;
      })
      .addCase(validateKVK.rejected, (state, action) => {
        state.validationLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setSelectedCompany, clearValidationResult } = companiesSlice.actions;
export default companiesSlice.reducer;
