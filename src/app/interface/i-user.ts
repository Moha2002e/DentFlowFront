
export interface IUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  admin: boolean;
  role: string;
  companyId: number | null;
  organisationId: number | null;
  phone: string | null;
  costCenterId: number | null;
  position: string;
  hireDate: Date | null;
  statut: boolean;

  splitBillingEnabled: boolean;
  reimbursementIban: string;
  reimbursementBic: string;
  street?: string | null;
  number?: string | null;
  bte?: string | null;
  city?: string | null;
  zipcode?: string | null;
  country?: string | null;
}
