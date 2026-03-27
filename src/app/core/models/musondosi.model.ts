export interface EcocashDetails {
  accountNumber: string;
  accountName: string;
}

export interface BankDetails {
  accountNumber: string;
  accountName: string;
  bankName: string;
  branchName: string;
}

export interface MusondosiDetails {
  id: string;
  supportEmail: string;
  businessEmail: string;
  supportPhone: string;
  supportWhatsapp: string;
  supportSignal: string;
  ecocashDetails: EcocashDetails;
  bankDetails: BankDetails;
  facebookLink: string;
  instagramLink: string;
  twitterLink: string;
  tiktokLink: string;
  youtubeLink: string;
  createdAt: string;
  updatedAt: string;
}
