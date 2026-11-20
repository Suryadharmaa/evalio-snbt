export type StudentProfile = {
  user_id: string;
  alias: string | null;
  cohort_year: number;
  study_goal: string | null;
  created_at: string;
  delete_requested_at: string | null;
};

type PrivacyAcknowledgment = {
  user_id: string;
  policy_version: string;
  consent_type: "privacy_notice_acknowledgment";
  granted_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: StudentProfile;
        Insert: never;
        Update: Partial<Pick<StudentProfile, "alias" | "cohort_year" | "study_goal">>;
        Relationships: [];
      };
      user_consents: {
        Row: PrivacyAcknowledgment;
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: { request_account_deletion: { Args: never; Returns: string | null } };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
