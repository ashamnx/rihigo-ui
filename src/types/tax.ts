export interface TaxRule {
  id: string;
  name: string;
  rate: number;
  type: 'percentage' | 'fixed_per_person';
  booking_type?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTaxRuleInput {
  name: string;
  rate: number;
  type: 'percentage' | 'fixed_per_person';
  booking_type?: string;
}

export interface BookingTax {
  id: string;
  booking_id: string;
  tax_rule_id?: string;
  name: string;
  rate: number;
  amount: number;
  created_at: string;
}
