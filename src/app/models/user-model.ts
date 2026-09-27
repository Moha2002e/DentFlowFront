
import { IUser } from '../interface/i-user';
export class User implements IUser {
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

  street: string | null = null;
  number: string | null = null;
  bte: string | null = null;
  city: string | null = null;
  zipcode: string | null = null;
  country: string | null = null;


  constructor(
    id: number = 0,
    firstName: string = '',
    lastName: string = '',
    email: string = '',
    password: string = '',
    admin: boolean = false,
    role: string = '',

    companyId: number | null = null,
    organisationId: number | null = null,
    phone: string | null = null,
    costCenterId: number | null = null,
    position: string = '',
    hireDate: Date | null = null,
    statut: boolean = true,
    splitBillingEnabled: boolean = false,
    reimbursementIban: string = '',
    reimbursementBic: string = '',
  ) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.password = password;
    this.admin = admin;
    this.role = role;
    this.companyId = companyId;
    this.organisationId = organisationId;
    this.phone = phone;
    this.costCenterId = costCenterId;
    this.position = position;
    this.hireDate = hireDate;
    this.statut = statut;
    this.splitBillingEnabled = splitBillingEnabled;
    this.reimbursementIban = reimbursementIban;
    this.reimbursementBic = reimbursementBic;
  }


  getFullName(): string {
    if (this.firstName && this.lastName) {
      return `${this.firstName} ${this.lastName}`;
    }
    return this.email || '';
  }

  getMaskedIban(): string {
    if (this.reimbursementIban && this.reimbursementIban.length > 4) {
      return `****${this.reimbursementIban.slice(-4)}`;
    }
    return this.reimbursementIban || '-';
  }
}
