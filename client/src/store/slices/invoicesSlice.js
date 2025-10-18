import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const fetchInvoices = createAsyncThunk(
  'invoices/fetchInvoices',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/invoices', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const createPDFInvoice = createAsyncThunk(
  'invoices/createPDFInvoice',
  async (invoiceData, { rejectWithValue }) => {
    try {
      const response = await api.post('/invoices/pdf', invoiceData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const createDigitalInvoice = createAsyncThunk(
  'invoices/createDigitalInvoice',
  async (invoiceData, { rejectWithValue }) => {
    try {
      const response = await api.post('/digital-invoices', invoiceData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const updateInvoiceStatus = createAsyncThunk(
  'invoices/updateStatus',
  async ({ id, status, paymentAmount }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/invoices/${id}/status`, { status, paymentAmount });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const generateInvoicePDF = createAsyncThunk(
  'invoices/generatePDF',
  async ({ invoiceData, templateId }, { rejectWithValue }) => {
    try {
      const response = await api.post('/invoices/generate-pdf', 
        { invoiceData, templateId },
        { responseType: 'blob' }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const fetchTemplates = createAsyncThunk(
  'invoices/fetchTemplates',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/templates');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

const invoicesSlice = createSlice({
  name: 'invoices',
  initialState: {
    pdfInvoices: [],
    digitalInvoices: [],
    templates: [],
    selectedTemplate: null,
    previewData: null,
    total: 0,
    page: 1,
    limit: 10,
    loading: false,
    error: null,
    generating: false,
    currentInvoiceNumber: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedTemplate: (state, action) => {
      state.selectedTemplate = action.payload;
    },
    setPreviewData: (state, action) => {
      state.previewData = action.payload;
    },
    clearPreviewData: (state) => {
      state.previewData = null;
    },
    setCurrentInvoiceNumber: (state, action) => {
      state.currentInvoiceNumber = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Invoices
      .addCase(fetchInvoices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInvoices.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.type === 'pdf') {
          state.pdfInvoices = action.payload.invoices;
        } else {
          state.digitalInvoices = action.payload.invoices;
        }
        state.total = action.payload.total;
        state.page = action.payload.page;
      })
      .addCase(fetchInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create PDF Invoice
      .addCase(createPDFInvoice.pending, (state) => {
        state.generating = true;
        state.error = null;
      })
      .addCase(createPDFInvoice.fulfilled, (state, action) => {
        state.generating = false;
        state.pdfInvoices.unshift(action.payload.invoice);
      })
      .addCase(createPDFInvoice.rejected, (state, action) => {
        state.generating = false;
        state.error = action.payload;
      })
      // Create Digital Invoice
      .addCase(createDigitalInvoice.fulfilled, (state, action) => {
        state.digitalInvoices.unshift(action.payload.invoice);
      })
      // Update Invoice Status
      .addCase(updateInvoiceStatus.fulfilled, (state, action) => {
        const invoice = action.payload.invoice;
        let invoices = invoice.type === 'pdf' ? state.pdfInvoices : state.digitalInvoices;
        const index = invoices.findIndex(inv => inv._id === invoice._id);
        if (index !== -1) {
          invoices[index] = invoice;
        }
      })
      // Generate PDF
      .addCase(generateInvoicePDF.pending, (state) => {
        state.generating = true;
      })
      .addCase(generateInvoicePDF.fulfilled, (state) => {
        state.generating = false;
      })
      .addCase(generateInvoicePDF.rejected, (state, action) => {
        state.generating = false;
        state.error = action.payload;
      })
      // Fetch Templates
      .addCase(fetchTemplates.fulfilled, (state, action) => {
        state.templates = action.payload.templates;
      });
  },
});

export const { 
  clearError, 
  setSelectedTemplate, 
  setPreviewData, 
  clearPreviewData,
  setCurrentInvoiceNumber 
} = invoicesSlice.actions;
export default invoicesSlice.reducer;
