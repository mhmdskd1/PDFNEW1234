const axios = require('axios');
const { Setting } = require('../models');

class ValidationService {
  constructor() {
    this.btwApiUrl = null;
    this.kvkApiUrl = null;
    this.kvkApiKey = null;
  }

  async initializeSettings() {
    if (!this.btwApiUrl) {
      this.btwApiUrl = await Setting.get('api.btw.url', 'https://api.btw-nummer.nl');
      this.kvkApiUrl = await Setting.get('api.kvk.url', 'https://api.kvk.nl/api/v1');
      this.kvkApiKey = await Setting.get('api.kvk.key');
    }
  }

  // BTW Number Validation (Free Service)
  async validateBTW(btwNumber) {
    try {
      await this.initializeSettings();
      
      // Clean BTW number
      const cleanBTW = btwNumber.replace(/[^0-9B]/g, '');
      
      if (!this.isValidBTWFormat(cleanBTW)) {
        return {
          isValid: false,
          error: 'تنسيق رقم BTW غير صحيح',
          details: null
        };
      }

      // Call BTW API (Free service)
      const response = await axios.get(`${this.btwApiUrl}/validate/${cleanBTW}`, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Invoice Management System',
          'Accept': 'application/json'
        }
      });

      if (response.data && response.data.valid) {
        return {
          isValid: true,
          details: {
            btwNumber: response.data.vatNumber,
            companyName: response.data.name,
            address: response.data.address,
            isActive: response.data.active,
            validatedAt: new Date()
          },
          message: 'تم التحقق من رقم BTW بنجاح'
        };
      } else {
        return {
          isValid: false,
          error: 'رقم BTW غير صحيح أو غير نشط',
          details: response.data
        };
      }
    } catch (error) {
      console.error('BTW validation error:', error);
      
      if (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND') {
        return {
          isValid: false,
          error: 'فشل في الاتصال بخدمة التحقق من BTW',
          details: null,
          canRetry: true
        };
      }
      
      return {
        isValid: false,
        error: `خطأ في التحقق من BTW: ${error.message}`,
        details: null
      };
    }
  }

  // KVK Number Validation (Paid Service)
  async validateKVK(kvkNumber) {
    try {
      await this.initializeSettings();
      
      if (!this.kvkApiKey) {
        return {
          isValid: false,
          error: 'مفتاح KVK API غير معرّف - يتطلب اشتراكًا مدفوعًا',
          details: null,
          needsSubscription: true
        };
      }

      // Clean KVK number
      const cleanKVK = kvkNumber.replace(/[^0-9]/g, '');
      
      if (!this.isValidKVKFormat(cleanKVK)) {
        return {
          isValid: false,
          error: 'تنسيق رقم KVK غير صحيح',
          details: null
        };
      }

      // Call KVK API (Paid service)
      const response = await axios.get(`${this.kvkApiUrl}/companies/${cleanKVK}`, {
        timeout: 15000,
        headers: {
          'apikey': this.kvkApiKey,
          'Accept': 'application/json',
          'User-Agent': 'Invoice Management System'
        }
      });

      if (response.data && response.data.companies && response.data.companies.length > 0) {
        const company = response.data.companies[0];
        
        return {
          isValid: true,
          details: {
            kvkNumber: company.kvkNumber,
            companyName: company.tradeName || company.legalForm,
            legalForm: company.legalForm,
            businessActivities: company.businessActivities,
            address: {
              street: company.addresses?.[0]?.street,
              houseNumber: company.addresses?.[0]?.houseNumber,
              postalCode: company.addresses?.[0]?.postalCode,
              city: company.addresses?.[0]?.city,
              country: company.addresses?.[0]?.country
            },
            status: company.status,
            foundationDate: company.foundationDate,
            validatedAt: new Date()
          },
          message: 'تم التحقق من رقم KVK بنجاح'
        };
      } else {
        return {
          isValid: false,
          error: 'رقم KVK غير موجود',
          details: null
        };
      }
    } catch (error) {
      console.error('KVK validation error:', error);
      
      if (error.response?.status === 401) {
        return {
          isValid: false,
          error: 'مفتاح KVK API غير صحيح أو منتهي الصلاحية',
          details: null,
          needsRenewal: true
        };
      }
      
      if (error.response?.status === 429) {
        return {
          isValid: false,
          error: 'تم تجاوز حد الطلبات المسموح - يرجى المحاولة لاحقًا',
          details: null,
          canRetry: true
        };
      }
      
      return {
        isValid: false,
        error: `خطأ في التحقق من KVK: ${error.message}`,
        details: null
      };
    }
  }

  // Validate both BTW and KVK for Dutch companies
  async validateDutchCompany(btwNumber, kvkNumber) {
    const results = {
      btw: null,
      kvk: null,
      overall: {
        isValid: false,
        warnings: [],
        errors: []
      }
    };

    // Validate BTW
    if (btwNumber) {
      results.btw = await this.validateBTW(btwNumber);
      if (!results.btw.isValid) {
        results.overall.errors.push(`BTW: ${results.btw.error}`);
      }
    } else {
      results.overall.warnings.push('BTW: رقم BTW غير محدد');
    }

    // Validate KVK
    if (kvkNumber) {
      results.kvk = await this.validateKVK(kvkNumber);
      if (!results.kvk.isValid) {
        results.overall.errors.push(`KVK: ${results.kvk.error}`);
      }
    } else {
      results.overall.warnings.push('KVK: رقم KVK غير محدد');
    }

    // Overall validation
    results.overall.isValid = (
      (!btwNumber || results.btw?.isValid) &&
      (!kvkNumber || results.kvk?.isValid)
    );

    return results;
  }

  // Validate non-Dutch company (minimal validation)
  async validateNonDutchCompany(companyData) {
    const errors = [];
    
    if (!companyData.name) {
      errors.push('اسم الشركة مطلوب');
    }
    
    if (!companyData.country) {
      errors.push('بلد الشركة مطلوب');
    }
    
    if (!companyData.email || !this.isValidEmail(companyData.email)) {
      errors.push('بريد إلكتروني صحيح مطلوب');
    }

    return {
      isValid: errors.length === 0,
      errors,
      message: errors.length === 0 ? 
        'تم التحقق من بيانات الشركة بنجاح' : 
        'يوجد أخطاء في بيانات الشركة'
    };
  }

  // Format validation helpers
  isValidBTWFormat(btwNumber) {
    // Dutch BTW format: NL + 9 digits + B + 2 digits
    const dutchBTWRegex = /^NL[0-9]{9}B[0-9]{2}$/;
    return dutchBTWRegex.test(btwNumber);
  }

  isValidKVKFormat(kvkNumber) {
    // Dutch KVK format: 8 digits
    const dutchKVKRegex = /^[0-9]{8}$/;
    return dutchKVKRegex.test(kvkNumber);
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Test API connections
  async testConnections() {
    await this.initializeSettings();
    
    const results = {
      btw: { available: false, message: '' },
      kvk: { available: false, message: '' }
    };

    // Test BTW API
    try {
      const response = await axios.get(`${this.btwApiUrl}/health`, { timeout: 5000 });
      results.btw.available = true;
      results.btw.message = 'خدمة BTW متاحة';
    } catch (error) {
      results.btw.message = 'خدمة BTW غير متاحة';
    }

    // Test KVK API
    if (this.kvkApiKey) {
      try {
        const response = await axios.get(`${this.kvkApiUrl}/test`, {
          headers: { 'apikey': this.kvkApiKey },
          timeout: 5000
        });
        results.kvk.available = true;
        results.kvk.message = 'خدمة KVK متاحة';
      } catch (error) {
        if (error.response?.status === 401) {
          results.kvk.message = 'مفتاح KVK غير صحيح';
        } else {
          results.kvk.message = 'خدمة KVK غير متاحة';
        }
      }
    } else {
      results.kvk.message = 'مفتاح KVK غير معرّف';
    }

    return results;
  }
}

module.exports = new ValidationService();