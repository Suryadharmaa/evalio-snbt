import type { DraftQuestion } from "@/lib/editorial/contracts";

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
    Functions: {
      practice_catalog: { Args: never; Returns: unknown };
      practice_start: {
        Args: { p_blueprint: string; p_subtest: string; p_topic: string | null; p_count: number; p_request: string };
        Returns: string;
      };
      practice_session: { Args: { p_session: string; p_position?: number }; Returns: unknown };
      practice_answer: { Args: { p_session: string; p_position: number; p_choice: number }; Returns: undefined };
      practice_finish: { Args: { p_session: string }; Returns: undefined };
      practice_history: { Args: never; Returns: unknown };
      request_account_deletion: { Args: never; Returns: string | null };
      editorial_access: { Args: never; Returns: string[] };
      editorial_question_workspace: { Args: { p_version?: string }; Returns: unknown };
      editorial_question_choices: { Args: never; Returns: unknown };
      editorial_save_question: {
        Args: { p_version: string | null; p_revision: number | null; p_draft: DraftQuestion };
        Returns: string;
      };
      editorial_transition_question: {
        Args: { p_version: string; p_revision: number; p_action: string; p_notes: string | null; p_answer: number | null };
        Returns: string;
      };
      read_published_question: { Args: { p_version: string }; Returns: unknown };
      report_question: {
        Args: { p_version: string; p_reason: string; p_notes: string };
        Returns: undefined;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
