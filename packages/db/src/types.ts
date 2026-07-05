/**
 * Tagora veritabanı domain tipleri.
 *
 * Üretimde bu dosya `supabase gen types typescript` ile otomatik üretilecek.
 * Şimdilik manuel olarak hand-rolled — local development için yeterli.
 */

export type UserTier = "free" | "plus" | "business";

export type StickerStatus =
  | "manufactured"
  | "shipped"
  | "delivered"
  | "claimed"
  | "active"
  | "blocked"
  | "retired"
  | "recall";

export type StickerUseCase =
  | "vehicle"
  | "door"
  | "pet"
  | "luggage"
  | "bike"
  | "other";

export type MessageSender = "owner" | "scanner" | "system";

export type ConversationStatus = "active" | "resolved" | "blocked";

export type AbuseReason =
  | "spam"
  | "harassment"
  | "threat"
  | "phishing"
  | "sexual_content"
  | "hate_speech"
  | "other";

export type AbuseStatus = "pending" | "reviewed" | "actioned" | "dismissed";

export type Locale = "tr" | "en";

// ===========================================================================
// TABLOLAR
// ===========================================================================

export interface User {
  id: string;
  auth_user_id: string | null;
  email: string;
  phone: string | null;
  display_name: string | null;
  locale: Locale;
  tier: UserTier;
  kvkk_consent_at: string;
  marketing_opt_in: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface StickerDesign {
  id: string;
  slug: string;
  name_tr: string;
  name_en: string;
  description_tr: string | null;
  description_en: string | null;
  price_try: number;
  price_usd: number | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Sticker {
  id: string;
  token: string;
  design_id: string | null;
  owner_id: string | null;
  status: StickerStatus;
  use_case: StickerUseCase | null;
  label: string | null;
  scan_count: number;
  last_scanned_at: string | null;
  manufactured_at: string;
  claimed_at: string | null;
  blocked_at: string | null;
  encrypted_emergency_info: string | null;
  created_at: string;
  updated_at: string;
}

/** Scanner'ın gördüğü minimal subset — public.sticker_public_info view'ı */
export interface StickerPublicInfo {
  token: string;
  use_case: StickerUseCase | null;
  label: string | null;
  status: StickerStatus;
  design_name_tr: string | null;
  design_name_en: string | null;
}

export interface ScannerSession {
  id: string;
  sticker_id: string;
  ephemeral_token: string;
  display_name: string | null;
  device_fingerprint_hash: string | null;
  message_count: number;
  is_blocked: boolean;
  created_at: string;
  expires_at: string;
}

export interface Conversation {
  id: string;
  sticker_id: string;
  scanner_session_id: string;
  owner_id: string | null;
  status: ConversationStatus;
  last_message_at: string | null;
  unread_owner_count: number;
  unread_scanner_count: number;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender: MessageSender;
  body: string;
  sent_at: string;
  read_at: string | null;
  flagged: boolean;
  flag_reason: string | null;
  deleted_at: string | null;
}

export interface AbuseReport {
  id: string;
  sticker_id: string | null;
  scanner_session_id: string | null;
  conversation_id: string | null;
  reported_by_user_id: string | null;
  reason: AbuseReason;
  details: string | null;
  status: AbuseStatus;
  reviewed_at: string | null;
  reviewer_notes: string | null;
  created_at: string;
}

export interface WaitlistEntry {
  id: string;
  email: string;
  locale: Locale;
  referral_source: string | null;
  created_at: string;
}

// ===========================================================================
// SUPABASE DATABASE TYPE (kısıtlı, manuel)
// ===========================================================================
// supabase-js v2 için: createClient<Database>() kullan
// gen:types ile otomatize edilebilir
export type Database = {
  public: {
    Tables: {
      users: { Row: User; Insert: Partial<User>; Update: Partial<User> };
      sticker_designs: { Row: StickerDesign; Insert: Partial<StickerDesign>; Update: Partial<StickerDesign> };
      stickers: { Row: Sticker; Insert: Partial<Sticker>; Update: Partial<Sticker> };
      scanner_sessions: { Row: ScannerSession; Insert: Partial<ScannerSession>; Update: Partial<ScannerSession> };
      conversations: { Row: Conversation; Insert: Partial<Conversation>; Update: Partial<Conversation> };
      messages: { Row: Message; Insert: Partial<Message>; Update: Partial<Message> };
      abuse_reports: { Row: AbuseReport; Insert: Partial<AbuseReport>; Update: Partial<AbuseReport> };
      waitlist: { Row: WaitlistEntry; Insert: Partial<WaitlistEntry>; Update: Partial<WaitlistEntry> };
    };
    Views: {
      sticker_public_info: { Row: StickerPublicInfo };
    };
    Functions: {
      delete_my_account: { Args: Record<string, never>; Returns: void };
      export_my_data: { Args: Record<string, never>; Returns: unknown };
      run_kvkk_cleanup: {
        Args: Record<string, never>;
        Returns: { job: string; affected: number }[];
      };
    };
    Enums: {
      user_tier: UserTier;
      sticker_status: StickerStatus;
      sticker_use_case: StickerUseCase;
      message_sender: MessageSender;
      conversation_status: ConversationStatus;
      abuse_reason: AbuseReason;
      abuse_status: AbuseStatus;
    };
  };
};
