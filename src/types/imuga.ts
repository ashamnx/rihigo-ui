// IMUGA Declaration Types

// Status Types
export type ImugaDeclarationStatus = 'draft' | 'ready_for_submission' | 'submitted';
export type ImugaRequestStatus = 'pending' | 'processing' | 'completed' | 'rejected';

export type TravelerTitle = 'mr' | 'mrs' | 'ms' | 'miss' | 'dr';
export type TravelerGender = 'male' | 'female' | 'other';
export type VisitPurpose = 'tourism' | 'business' | 'transit' | 'medical' | 'education' | 'employment' | 'other';

// Address Interface
export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postal_code?: string;
  country: string;
}

// Emergency Contact Interface
export interface EmergencyContact {
  contact_name: string;
  contact_phone: string;
  contact_relationship: string;
}

// Traveler Interface
export interface ImugaTraveler {
  id: string;
  declaration_id: string;

  // Personal Info
  title: TravelerTitle;
  first_name: string;
  middle_name?: string;
  last_name: string;
  gender: TravelerGender;
  date_of_birth: string;
  place_of_birth: string;
  nationality: string;
  country_of_residence: string;

  // Passport Info
  passport_number: string;
  passport_issue_date: string;
  passport_expiry_date: string;
  passport_issuing_country: string;
  passport_image_url?: string;

  // Photo
  photo_url?: string;

  // Contact Info
  email: string;
  phone: string;
  phone_country_code: string;

  // Address
  permanent_address: Address;

  // Visit Info
  visit_purpose: VisitPurpose;
  visit_purpose_other?: string;

  // Health Info
  yellow_fever_endemic_travel: boolean;
  vaccination_date?: string;
  health_notes?: string;

  // Customs Info
  customs_items_to_declare: boolean;
  declaration_details?: string;
  currency_amount?: number;
  currency_type?: string;

  // Emergency Contact
  emergency_contact: EmergencyContact;

  // Ordering
  sort_order: number;

  created_at: string;
  updated_at: string;
}

// Declaration Interface
export interface ImugaDeclaration {
  id: string;
  declaration_number: string; // IMUGA-YYYY-NNNNN
  status: ImugaDeclarationStatus;

  // Group Info
  group_name: string;
  group_reference?: string;

  // Accommodation
  accommodation_name: string;
  accommodation_address?: string;
  accommodation_island: string;
  accommodation_atoll: string;

  // Travel Info
  arrival_date: string;
  departure_date: string;
  arrival_flight: string;
  departure_flight?: string;
  arrival_port: string;

  // Notes
  internal_notes?: string;
  admin_notes?: string;

  // Submission
  submitted_at?: string;
  submitted_by?: string;

  // Travelers
  travelers?: ImugaTraveler[];
  travelers_count?: number;

  created_at: string;
  updated_at: string;
  created_by?: string;
}

// Request Interface (Public Submissions)
export interface ImugaRequest {
  id: string;
  request_number: string; // REQ-YYYY-NNNNN
  status: ImugaRequestStatus;

  // Requester Info
  requester_email: string;
  requester_name: string;
  requester_phone?: string;

  // Group Info
  group_name: string;
  total_travelers: number;

  // Accommodation
  accommodation_name: string;
  accommodation_island: string;
  accommodation_atoll: string;

  // Travel Info
  arrival_date: string;
  departure_date: string;
  arrival_flight: string;
  departure_flight?: string;

  // Travelers Data (JSONB)
  travelers_data: TravelerInputData[];

  // Processing
  declaration_id?: string;
  declaration?: ImugaDeclaration;
  processed_at?: string;
  processed_by?: string;
  rejection_reason?: string;

  notes?: string;

  created_at: string;
  updated_at: string;
}

// Input Types for Public Form
export interface TravelerInputData {
  title: TravelerTitle;
  first_name: string;
  middle_name?: string;
  last_name: string;
  gender: TravelerGender;
  date_of_birth: string;
  place_of_birth: string;
  nationality: string;
  country_of_residence: string;
  passport_number: string;
  passport_issue_date: string;
  passport_expiry_date: string;
  passport_issuing_country: string;
  passport_image_url?: string;
  photo_url?: string;
  email: string;
  phone: string;
  phone_country_code: string;
  permanent_address: Address;
  visit_purpose: VisitPurpose;
  visit_purpose_other?: string;
  yellow_fever_endemic_travel: boolean;
  vaccination_date?: string;
  health_notes?: string;
  customs_items_to_declare: boolean;
  declaration_details?: string;
  currency_amount?: number;
  currency_type?: string;
  emergency_contact: EmergencyContact;
}

export interface CreateImugaRequestInput {
  requester_email: string;
  requester_name: string;
  requester_phone?: string;
  group_name: string;
  accommodation_name: string;
  accommodation_island: string;
  accommodation_atoll: string;
  arrival_date: string;
  departure_date: string;
  arrival_flight: string;
  departure_flight?: string;
  notes?: string;
  travelers_data: TravelerInputData[];
}

// Admin Input Types
export interface CreateDeclarationInput {
  group_name: string;
  group_reference?: string;
  accommodation_name: string;
  accommodation_address?: string;
  accommodation_island: string;
  accommodation_atoll: string;
  arrival_date: string;
  departure_date: string;
  arrival_flight: string;
  departure_flight?: string;
  arrival_port: string;
  internal_notes?: string;
  admin_notes?: string;
}

export interface UpdateDeclarationInput extends Partial<CreateDeclarationInput> {
  status?: ImugaDeclarationStatus;
}

export interface AddTravelerInput {
  title: TravelerTitle;
  first_name: string;
  middle_name?: string;
  last_name: string;
  gender: TravelerGender;
  date_of_birth: string;
  place_of_birth: string;
  nationality: string;
  country_of_residence: string;
  passport_number: string;
  passport_issue_date: string;
  passport_expiry_date: string;
  passport_issuing_country: string;
  passport_image_url?: string;
  photo_url?: string;
  email: string;
  phone: string;
  phone_country_code: string;
  permanent_address_line1: string;
  permanent_address_line2?: string;
  permanent_address_city: string;
  permanent_address_state?: string;
  permanent_address_postal_code?: string;
  permanent_address_country: string;
  visit_purpose: VisitPurpose;
  visit_purpose_other?: string;
  yellow_fever_endemic_travel: boolean;
  vaccination_date?: string;
  health_notes?: string;
  customs_items_to_declare: boolean;
  declaration_details?: string;
  currency_amount?: number;
  currency_type?: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
}

export interface ProcessRequestInput {
  action: 'approve' | 'reject';
  rejection_reason?: string;
}

// Filter Types
export interface DeclarationFilters {
  page?: number;
  page_size?: number;
  status?: ImugaDeclarationStatus;
  search?: string;
  date_from?: string;
  date_to?: string;
}

export interface RequestFilters {
  page?: number;
  page_size?: number;
  status?: ImugaRequestStatus;
  search?: string;
  date_from?: string;
  date_to?: string;
}

// Summary Types
export interface DeclarationSummary {
  total: number;
  by_status: {
    draft: number;
    ready_for_submission: number;
    submitted: number;
  };
}

export interface RequestSummary {
  total: number;
  by_status: {
    pending: number;
    processing: number;
    completed: number;
    rejected: number;
  };
}

// Export Format for Chrome Plugin
export interface ImugaExportData {
  declaration_id: string;
  declaration_number: string;
  travelers: ExportTravelerData[];
  accommodation: {
    name: string;
    address?: string;
    island: string;
    atoll: string;
  };
  exported_at: string;
}

export interface ExportTravelerData {
  surname: string;
  given_name: string;
  middle_name: string;
  title: string;
  gender: string;
  date_of_birth: string; // DD/MM/YYYY
  place_of_birth: string;
  nationality: string;
  country_of_residence: string;
  passport_number: string;
  passport_issue_date: string; // DD/MM/YYYY
  passport_expiry_date: string; // DD/MM/YYYY
  passport_issuing_country: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  purpose_of_visit: string;
  arrival_date: string; // DD/MM/YYYY
  departure_date: string; // DD/MM/YYYY
  arrival_flight: string;
  departure_flight: string;
  yellow_fever_vaccinated: string; // "Yes" | "No"
  items_to_declare: string; // "Yes" | "No"
}

// Validation Result
export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

// UI Constants
export const DECLARATION_STATUS_LABELS: Record<ImugaDeclarationStatus, string> = {
  draft: 'Draft',
  ready_for_submission: 'Ready',
  submitted: 'Submitted',
};

export const DECLARATION_STATUS_COLORS: Record<ImugaDeclarationStatus, string> = {
  draft: 'badge-ghost',
  ready_for_submission: 'badge-warning',
  submitted: 'badge-success',
};

export const REQUEST_STATUS_LABELS: Record<ImugaRequestStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  rejected: 'Rejected',
};

export const REQUEST_STATUS_COLORS: Record<ImugaRequestStatus, string> = {
  pending: 'badge-info',
  processing: 'badge-warning',
  completed: 'badge-success',
  rejected: 'badge-error',
};

export const TRAVELER_TITLES: { value: TravelerTitle; label: string }[] = [
  { value: 'mr', label: 'Mr.' },
  { value: 'mrs', label: 'Mrs.' },
  { value: 'ms', label: 'Ms.' },
  { value: 'miss', label: 'Miss' },
  { value: 'dr', label: 'Dr.' },
];

export const VISIT_PURPOSES: { value: VisitPurpose; label: string }[] = [
  { value: 'tourism', label: 'Tourism / Holiday' },
  { value: 'business', label: 'Business' },
  { value: 'transit', label: 'Transit' },
  { value: 'medical', label: 'Medical' },
  { value: 'education', label: 'Education' },
  { value: 'employment', label: 'Employment' },
  { value: 'other', label: 'Other' },
];

export const GENDERS: { value: TravelerGender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

// ISO 3166-1 Country List
export const COUNTRIES: { code: string; name: string; phone_code: string }[] = [
  { code: 'AF', name: 'Afghanistan', phone_code: '+93' },
  { code: 'AL', name: 'Albania', phone_code: '+355' },
  { code: 'DZ', name: 'Algeria', phone_code: '+213' },
  { code: 'AD', name: 'Andorra', phone_code: '+376' },
  { code: 'AO', name: 'Angola', phone_code: '+244' },
  { code: 'AG', name: 'Antigua and Barbuda', phone_code: '+1-268' },
  { code: 'AR', name: 'Argentina', phone_code: '+54' },
  { code: 'AM', name: 'Armenia', phone_code: '+374' },
  { code: 'AU', name: 'Australia', phone_code: '+61' },
  { code: 'AT', name: 'Austria', phone_code: '+43' },
  { code: 'AZ', name: 'Azerbaijan', phone_code: '+994' },
  { code: 'BS', name: 'Bahamas', phone_code: '+1-242' },
  { code: 'BH', name: 'Bahrain', phone_code: '+973' },
  { code: 'BD', name: 'Bangladesh', phone_code: '+880' },
  { code: 'BB', name: 'Barbados', phone_code: '+1-246' },
  { code: 'BY', name: 'Belarus', phone_code: '+375' },
  { code: 'BE', name: 'Belgium', phone_code: '+32' },
  { code: 'BZ', name: 'Belize', phone_code: '+501' },
  { code: 'BJ', name: 'Benin', phone_code: '+229' },
  { code: 'BT', name: 'Bhutan', phone_code: '+975' },
  { code: 'BO', name: 'Bolivia', phone_code: '+591' },
  { code: 'BA', name: 'Bosnia and Herzegovina', phone_code: '+387' },
  { code: 'BW', name: 'Botswana', phone_code: '+267' },
  { code: 'BR', name: 'Brazil', phone_code: '+55' },
  { code: 'BN', name: 'Brunei', phone_code: '+673' },
  { code: 'BG', name: 'Bulgaria', phone_code: '+359' },
  { code: 'BF', name: 'Burkina Faso', phone_code: '+226' },
  { code: 'BI', name: 'Burundi', phone_code: '+257' },
  { code: 'CV', name: 'Cabo Verde', phone_code: '+238' },
  { code: 'KH', name: 'Cambodia', phone_code: '+855' },
  { code: 'CM', name: 'Cameroon', phone_code: '+237' },
  { code: 'CA', name: 'Canada', phone_code: '+1' },
  { code: 'CF', name: 'Central African Republic', phone_code: '+236' },
  { code: 'TD', name: 'Chad', phone_code: '+235' },
  { code: 'CL', name: 'Chile', phone_code: '+56' },
  { code: 'CN', name: 'China', phone_code: '+86' },
  { code: 'CO', name: 'Colombia', phone_code: '+57' },
  { code: 'KM', name: 'Comoros', phone_code: '+269' },
  { code: 'CG', name: 'Congo', phone_code: '+242' },
  { code: 'CD', name: 'Congo (DRC)', phone_code: '+243' },
  { code: 'CR', name: 'Costa Rica', phone_code: '+506' },
  { code: 'HR', name: 'Croatia', phone_code: '+385' },
  { code: 'CU', name: 'Cuba', phone_code: '+53' },
  { code: 'CY', name: 'Cyprus', phone_code: '+357' },
  { code: 'CZ', name: 'Czechia', phone_code: '+420' },
  { code: 'DK', name: 'Denmark', phone_code: '+45' },
  { code: 'DJ', name: 'Djibouti', phone_code: '+253' },
  { code: 'DM', name: 'Dominica', phone_code: '+1-767' },
  { code: 'DO', name: 'Dominican Republic', phone_code: '+1-809' },
  { code: 'EC', name: 'Ecuador', phone_code: '+593' },
  { code: 'EG', name: 'Egypt', phone_code: '+20' },
  { code: 'SV', name: 'El Salvador', phone_code: '+503' },
  { code: 'GQ', name: 'Equatorial Guinea', phone_code: '+240' },
  { code: 'ER', name: 'Eritrea', phone_code: '+291' },
  { code: 'EE', name: 'Estonia', phone_code: '+372' },
  { code: 'SZ', name: 'Eswatini', phone_code: '+268' },
  { code: 'ET', name: 'Ethiopia', phone_code: '+251' },
  { code: 'FJ', name: 'Fiji', phone_code: '+679' },
  { code: 'FI', name: 'Finland', phone_code: '+358' },
  { code: 'FR', name: 'France', phone_code: '+33' },
  { code: 'GA', name: 'Gabon', phone_code: '+241' },
  { code: 'GM', name: 'Gambia', phone_code: '+220' },
  { code: 'GE', name: 'Georgia', phone_code: '+995' },
  { code: 'DE', name: 'Germany', phone_code: '+49' },
  { code: 'GH', name: 'Ghana', phone_code: '+233' },
  { code: 'GR', name: 'Greece', phone_code: '+30' },
  { code: 'GD', name: 'Grenada', phone_code: '+1-473' },
  { code: 'GT', name: 'Guatemala', phone_code: '+502' },
  { code: 'GN', name: 'Guinea', phone_code: '+224' },
  { code: 'GW', name: 'Guinea-Bissau', phone_code: '+245' },
  { code: 'GY', name: 'Guyana', phone_code: '+592' },
  { code: 'HT', name: 'Haiti', phone_code: '+509' },
  { code: 'HN', name: 'Honduras', phone_code: '+504' },
  { code: 'HU', name: 'Hungary', phone_code: '+36' },
  { code: 'IS', name: 'Iceland', phone_code: '+354' },
  { code: 'IN', name: 'India', phone_code: '+91' },
  { code: 'ID', name: 'Indonesia', phone_code: '+62' },
  { code: 'IR', name: 'Iran', phone_code: '+98' },
  { code: 'IQ', name: 'Iraq', phone_code: '+964' },
  { code: 'IE', name: 'Ireland', phone_code: '+353' },
  { code: 'IL', name: 'Israel', phone_code: '+972' },
  { code: 'IT', name: 'Italy', phone_code: '+39' },
  { code: 'CI', name: 'Ivory Coast', phone_code: '+225' },
  { code: 'JM', name: 'Jamaica', phone_code: '+1-876' },
  { code: 'JP', name: 'Japan', phone_code: '+81' },
  { code: 'JO', name: 'Jordan', phone_code: '+962' },
  { code: 'KZ', name: 'Kazakhstan', phone_code: '+7' },
  { code: 'KE', name: 'Kenya', phone_code: '+254' },
  { code: 'KI', name: 'Kiribati', phone_code: '+686' },
  { code: 'KP', name: 'Korea (North)', phone_code: '+850' },
  { code: 'KR', name: 'Korea (South)', phone_code: '+82' },
  { code: 'KW', name: 'Kuwait', phone_code: '+965' },
  { code: 'KG', name: 'Kyrgyzstan', phone_code: '+996' },
  { code: 'LA', name: 'Laos', phone_code: '+856' },
  { code: 'LV', name: 'Latvia', phone_code: '+371' },
  { code: 'LB', name: 'Lebanon', phone_code: '+961' },
  { code: 'LS', name: 'Lesotho', phone_code: '+266' },
  { code: 'LR', name: 'Liberia', phone_code: '+231' },
  { code: 'LY', name: 'Libya', phone_code: '+218' },
  { code: 'LI', name: 'Liechtenstein', phone_code: '+423' },
  { code: 'LT', name: 'Lithuania', phone_code: '+370' },
  { code: 'LU', name: 'Luxembourg', phone_code: '+352' },
  { code: 'MG', name: 'Madagascar', phone_code: '+261' },
  { code: 'MW', name: 'Malawi', phone_code: '+265' },
  { code: 'MY', name: 'Malaysia', phone_code: '+60' },
  { code: 'MV', name: 'Maldives', phone_code: '+960' },
  { code: 'ML', name: 'Mali', phone_code: '+223' },
  { code: 'MT', name: 'Malta', phone_code: '+356' },
  { code: 'MH', name: 'Marshall Islands', phone_code: '+692' },
  { code: 'MR', name: 'Mauritania', phone_code: '+222' },
  { code: 'MU', name: 'Mauritius', phone_code: '+230' },
  { code: 'MX', name: 'Mexico', phone_code: '+52' },
  { code: 'FM', name: 'Micronesia', phone_code: '+691' },
  { code: 'MD', name: 'Moldova', phone_code: '+373' },
  { code: 'MC', name: 'Monaco', phone_code: '+377' },
  { code: 'MN', name: 'Mongolia', phone_code: '+976' },
  { code: 'ME', name: 'Montenegro', phone_code: '+382' },
  { code: 'MA', name: 'Morocco', phone_code: '+212' },
  { code: 'MZ', name: 'Mozambique', phone_code: '+258' },
  { code: 'MM', name: 'Myanmar', phone_code: '+95' },
  { code: 'NA', name: 'Namibia', phone_code: '+264' },
  { code: 'NR', name: 'Nauru', phone_code: '+674' },
  { code: 'NP', name: 'Nepal', phone_code: '+977' },
  { code: 'NL', name: 'Netherlands', phone_code: '+31' },
  { code: 'NZ', name: 'New Zealand', phone_code: '+64' },
  { code: 'NI', name: 'Nicaragua', phone_code: '+505' },
  { code: 'NE', name: 'Niger', phone_code: '+227' },
  { code: 'NG', name: 'Nigeria', phone_code: '+234' },
  { code: 'MK', name: 'North Macedonia', phone_code: '+389' },
  { code: 'NO', name: 'Norway', phone_code: '+47' },
  { code: 'OM', name: 'Oman', phone_code: '+968' },
  { code: 'PK', name: 'Pakistan', phone_code: '+92' },
  { code: 'PW', name: 'Palau', phone_code: '+680' },
  { code: 'PS', name: 'Palestine', phone_code: '+970' },
  { code: 'PA', name: 'Panama', phone_code: '+507' },
  { code: 'PG', name: 'Papua New Guinea', phone_code: '+675' },
  { code: 'PY', name: 'Paraguay', phone_code: '+595' },
  { code: 'PE', name: 'Peru', phone_code: '+51' },
  { code: 'PH', name: 'Philippines', phone_code: '+63' },
  { code: 'PL', name: 'Poland', phone_code: '+48' },
  { code: 'PT', name: 'Portugal', phone_code: '+351' },
  { code: 'QA', name: 'Qatar', phone_code: '+974' },
  { code: 'RO', name: 'Romania', phone_code: '+40' },
  { code: 'RU', name: 'Russia', phone_code: '+7' },
  { code: 'RW', name: 'Rwanda', phone_code: '+250' },
  { code: 'KN', name: 'Saint Kitts and Nevis', phone_code: '+1-869' },
  { code: 'LC', name: 'Saint Lucia', phone_code: '+1-758' },
  { code: 'VC', name: 'Saint Vincent and the Grenadines', phone_code: '+1-784' },
  { code: 'WS', name: 'Samoa', phone_code: '+685' },
  { code: 'SM', name: 'San Marino', phone_code: '+378' },
  { code: 'ST', name: 'Sao Tome and Principe', phone_code: '+239' },
  { code: 'SA', name: 'Saudi Arabia', phone_code: '+966' },
  { code: 'SN', name: 'Senegal', phone_code: '+221' },
  { code: 'RS', name: 'Serbia', phone_code: '+381' },
  { code: 'SC', name: 'Seychelles', phone_code: '+248' },
  { code: 'SL', name: 'Sierra Leone', phone_code: '+232' },
  { code: 'SG', name: 'Singapore', phone_code: '+65' },
  { code: 'SK', name: 'Slovakia', phone_code: '+421' },
  { code: 'SI', name: 'Slovenia', phone_code: '+386' },
  { code: 'SB', name: 'Solomon Islands', phone_code: '+677' },
  { code: 'SO', name: 'Somalia', phone_code: '+252' },
  { code: 'ZA', name: 'South Africa', phone_code: '+27' },
  { code: 'SS', name: 'South Sudan', phone_code: '+211' },
  { code: 'ES', name: 'Spain', phone_code: '+34' },
  { code: 'LK', name: 'Sri Lanka', phone_code: '+94' },
  { code: 'SD', name: 'Sudan', phone_code: '+249' },
  { code: 'SR', name: 'Suriname', phone_code: '+597' },
  { code: 'SE', name: 'Sweden', phone_code: '+46' },
  { code: 'CH', name: 'Switzerland', phone_code: '+41' },
  { code: 'SY', name: 'Syria', phone_code: '+963' },
  { code: 'TW', name: 'Taiwan', phone_code: '+886' },
  { code: 'TJ', name: 'Tajikistan', phone_code: '+992' },
  { code: 'TZ', name: 'Tanzania', phone_code: '+255' },
  { code: 'TH', name: 'Thailand', phone_code: '+66' },
  { code: 'TL', name: 'Timor-Leste', phone_code: '+670' },
  { code: 'TG', name: 'Togo', phone_code: '+228' },
  { code: 'TO', name: 'Tonga', phone_code: '+676' },
  { code: 'TT', name: 'Trinidad and Tobago', phone_code: '+1-868' },
  { code: 'TN', name: 'Tunisia', phone_code: '+216' },
  { code: 'TR', name: 'Turkey', phone_code: '+90' },
  { code: 'TM', name: 'Turkmenistan', phone_code: '+993' },
  { code: 'TV', name: 'Tuvalu', phone_code: '+688' },
  { code: 'UG', name: 'Uganda', phone_code: '+256' },
  { code: 'UA', name: 'Ukraine', phone_code: '+380' },
  { code: 'AE', name: 'United Arab Emirates', phone_code: '+971' },
  { code: 'GB', name: 'United Kingdom', phone_code: '+44' },
  { code: 'US', name: 'United States', phone_code: '+1' },
  { code: 'UY', name: 'Uruguay', phone_code: '+598' },
  { code: 'UZ', name: 'Uzbekistan', phone_code: '+998' },
  { code: 'VU', name: 'Vanuatu', phone_code: '+678' },
  { code: 'VA', name: 'Vatican City', phone_code: '+379' },
  { code: 'VE', name: 'Venezuela', phone_code: '+58' },
  { code: 'VN', name: 'Vietnam', phone_code: '+84' },
  { code: 'YE', name: 'Yemen', phone_code: '+967' },
  { code: 'ZM', name: 'Zambia', phone_code: '+260' },
  { code: 'ZW', name: 'Zimbabwe', phone_code: '+263' },
];

// Common Currencies
export const CURRENCIES: { code: string; name: string }[] = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', name: 'Chinese Yuan' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'AED', name: 'UAE Dirham' },
  { code: 'SAR', name: 'Saudi Riyal' },
  { code: 'SGD', name: 'Singapore Dollar' },
  { code: 'MYR', name: 'Malaysian Ringgit' },
  { code: 'THB', name: 'Thai Baht' },
  { code: 'MVR', name: 'Maldivian Rufiyaa' },
];

// Arrival Ports in Maldives
export const ARRIVAL_PORTS: { code: string; name: string }[] = [
  { code: 'MLE', name: 'Velana International Airport (Malé)' },
  { code: 'GAN', name: 'Gan International Airport (Addu)' },
  { code: 'HDQ', name: 'Hanimaadhoo International Airport' },
  { code: 'KDM', name: 'Kaadedhdhoo Airport' },
  { code: 'DRV', name: 'Dharavandhoo Airport' },
  { code: 'KDO', name: 'Kadhdhoo Airport' },
  { code: 'VAM', name: 'Villa International Airport (Maamigili)' },
  { code: 'MUL', name: 'Maafaru International Airport' },
];

// Helper function to get country by code
export function getCountryByCode(code: string): { code: string; name: string; phone_code: string } | undefined {
  return COUNTRIES.find((c) => c.code === code);
}

// Helper function to get country name by code
export function getCountryName(code: string): string {
  return COUNTRIES.find((c) => c.code === code)?.name || code;
}

// Helper function to create empty traveler data
export function createEmptyTravelerData(): TravelerInputData {
  return {
    title: 'mr',
    first_name: '',
    middle_name: '',
    last_name: '',
    gender: 'male',
    date_of_birth: '',
    place_of_birth: '',
    nationality: '',
    country_of_residence: '',
    passport_number: '',
    passport_issue_date: '',
    passport_expiry_date: '',
    passport_issuing_country: '',
    passport_image_url: '',
    photo_url: '',
    email: '',
    phone: '',
    phone_country_code: '+1',
    permanent_address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: '',
    },
    visit_purpose: 'tourism',
    visit_purpose_other: '',
    yellow_fever_endemic_travel: false,
    vaccination_date: '',
    health_notes: '',
    customs_items_to_declare: false,
    declaration_details: '',
    currency_amount: undefined,
    currency_type: '',
    emergency_contact: {
      contact_name: '',
      contact_phone: '',
      contact_relationship: '',
    },
  };
}
