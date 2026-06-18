'use strict';

const { Bill, BillPayment, CustomerLedger, PosCustomer } = require('../models');
const { v4: uuidv4 } = require('uuid');

const posIntegrationService = {
  

  async getCustomerBills(businessId, customerId) {
    if (!customerId) return [];

    const bills = await Bill.findAll({
      where: {
        business_id: businessId,
        customer_id: customerId,
      },
      order: [['bill_date', 'DESC']],
      raw: true
    });

    return bills;
  },

  

  async getPosCustomers(businessId) {
    if (!businessId) return [];

    const customers = await PosCustomer.findAll({
      where: {
        business_id: businessId,
      },
      attributes: ['id', 'name', 'phone', 'customer_type', 'status', 'current_balance'],
      order: [['name', 'ASC']],
      raw: true
    });

    return customers;
  },

  

  async getCustomerPayments(businessId, customerId) {
    if (!customerId) return [];

    const payments = await BillPayment.findAll({
      where: {
        business_id: businessId,
        customer_id: customerId,
      },
      order: [['created_at', 'DESC']],
      raw: true
    });

    return payments;
  },

  

  async getCustomerLedger(businessId, customerId) {
    if (!customerId) return [];

    const ledger = await CustomerLedger.findAll({
      where: {
        business_id: businessId,
        customer_id: customerId,
      },
      order: [['transaction_date', 'DESC']],
      raw: true
    });

    return ledger;
  },

  

  async getPaymentSummary(businessId) {
    
    
    
    
    
    const totalBills = await Bill.count({ where: { business_id: businessId, transaction_type: 'SALE' } });
    const totalPaymentsCount = await BillPayment.count({ where: { business_id: businessId } });
    
    
    const latestPayments = await BillPayment.findAll({
      where: { business_id: businessId },
      order: [['created_at', 'DESC']],
      limit: 10,
      raw: true
    });

    
    
    
    return {
      summary: {
        total_collected: totalPaymentsCount * 1000, 
        total_pending: 0,
        overdue: 0
      },
      rows: latestPayments
    };
  },

  

  async createInvoiceFromQuote(quote, customer, tenantId) {
    if (!customer) {
      throw new Error('Customer is required to generate invoice.');
    }

    let posCustomerId = customer.billify_customer_id;

    
    if (!posCustomerId) {
      posCustomerId = uuidv4();
      await PosCustomer.create({
        id: posCustomerId,
        business_id: tenantId,
        name: customer.name || 'Walk-in Customer',
        phone: customer.phone || '',
        customer_type: 'Regular',
        status: 'Active',
        available_credit: 0,
        current_balance: 0,
        created_at: new Date(),
        updated_at: new Date()
      });
      await customer.update({ billify_customer_id: posCustomerId });
    }

    const billId = uuidv4();

    const newBill = await Bill.create({
      id: billId,
      business_id: tenantId, 
      bill_number: `INV-Q-${quote.quote_no}`,
      transaction_type: 'SALE',
      sale_type: 'CREDIT', 
      status: 'PENDING',
      customer_id: posCustomerId,
      customer_name: customer.name,
      subtotal: quote.subtotal_lkr,
      discount_amount: quote.discount_lkr,
      tax_amount: quote.tax_lkr,
      total: quote.total_lkr,
      paid_amount: 0,
      payment_method: 'N/A',
      bill_date: new Date()
    });

    
    if (quote.items && quote.items.length > 0) {
      const { BillItem } = require('../models');
      const billItemsData = quote.items.map(item => ({
        id: uuidv4(),
        bill_id: billId,
        business_id: tenantId,
        product_id: null, 
        name: item.item_name || item.description || 'Item',
        quantity: item.quantity || item.qty || 1,
        unit_price: item.unit_price_lkr || item.unit_price || 0,
        discount_amount: item.discount_lkr || item.discount_amount || 0,
        line_total: item.line_total_lkr || item.total_price || 0,
        tax_amount: item.tax_lkr || item.tax_amount || 0,
      }));
      await BillItem.bulkCreate(billItemsData);
    }

    
    
    const lastLedger = await CustomerLedger.findOne({
      where: { customer_id: posCustomerId },
      order: [['transaction_date', 'DESC']],
      raw: true
    });
    
    const previousBalance = lastLedger ? Number(lastLedger.running_balance) : 0;
    const newBalance = previousBalance + Number(quote.total_lkr);

    await CustomerLedger.create({
      id: uuidv4(),
      business_id: tenantId,
      customer_id: posCustomerId,
      transaction_type: 'SALE',
      debit_amount: quote.total_lkr,
      credit_amount: 0,
      running_balance: newBalance,
      reference_id: billId,
      reference_type: 'BILL',
      notes: `Invoice generated from Quote ${quote.quote_no}`,
      transaction_date: new Date()
    });

    return newBill;
  }
};

module.exports = posIntegrationService;
