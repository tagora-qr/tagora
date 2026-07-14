-- ============================================================================
-- UGC Content Filter — Apple Guideline 1.2
-- Basit keyword filter. Küfür / hakaret / cinsel içerik / spam paternleri.
-- INSERT trigger ile mesaj kaydı öncesi kontrol; eşleşenler auto-flag.
--
-- Not: Bu naive keyword list. İleride ML tabanlı moderation'a geçilebilir.
-- Şimdilik Apple'ın "objectionable content'i filtreleyen mekanizma" gereğini
-- karşılıyor.
-- ============================================================================

-- Bad word list — kısaca sık kullanılanlar (TR + EN, lowercase compared)
CREATE TABLE IF NOT EXISTS public.moderation_blocked_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('profanity', 'hate', 'sexual', 'spam', 'threat')),
  severity SMALLINT NOT NULL DEFAULT 1 CHECK (severity BETWEEN 1 AND 3),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.moderation_blocked_words ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage blocked words" ON public.moderation_blocked_words;
CREATE POLICY "Admins manage blocked words"
  ON public.moderation_blocked_words FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.auth_user_id = auth.uid() AND users.is_admin = true)
  );

-- Seed liste — küçük başlangıç, admin sonradan eklemeye devam edebilir
INSERT INTO public.moderation_blocked_words (word, category, severity) VALUES
  -- TR küfür (yaygın olanlar, tam liste değil)
  ('amk', 'profanity', 2),
  ('aq', 'profanity', 1),
  ('siktir', 'profanity', 2),
  ('orospu', 'profanity', 3),
  ('piç', 'profanity', 2),
  ('ibne', 'hate', 3),
  ('gavat', 'profanity', 2),
  -- EN küfür
  ('fuck', 'profanity', 2),
  ('shit', 'profanity', 1),
  ('bitch', 'profanity', 2),
  ('asshole', 'profanity', 2),
  -- Nefret söylemi
  ('nigger', 'hate', 3),
  ('faggot', 'hate', 3),
  -- Cinsel
  ('porno', 'sexual', 2),
  ('sex', 'sexual', 1),
  -- Tehdit
  ('öldüreceğim', 'threat', 3),
  ('kill you', 'threat', 3),
  ('i will kill', 'threat', 3),
  -- Spam
  ('bitcoin', 'spam', 1),
  ('crypto trading', 'spam', 1),
  ('click here', 'spam', 1)
ON CONFLICT (word) DO NOTHING;

-- Fonksiyon: mesaj metni içinde blocked word var mı?
CREATE OR REPLACE FUNCTION public.check_message_content(_body TEXT)
RETURNS TABLE(is_blocked BOOLEAN, matched_word TEXT, category TEXT, severity SMALLINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _lower TEXT;
BEGIN
  _lower := lower(_body);
  RETURN QUERY
    SELECT true, w.word, w.category, w.severity
    FROM public.moderation_blocked_words w
    WHERE position(w.word IN _lower) > 0
    ORDER BY w.severity DESC
    LIMIT 1;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false::BOOLEAN, NULL::TEXT, NULL::TEXT, NULL::SMALLINT;
  END IF;
END;
$$;

-- Trigger: mesaj insert edildiğinde otomatik olarak flag'le
-- Şu an sadece SEVERITY >= 2 olan mesajları flag'liyor.
-- Severity 3 (nefret söylemi, tehdit) → auto-blocked, gönderilmez
CREATE OR REPLACE FUNCTION public.moderate_message_before_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _match RECORD;
BEGIN
  IF NEW.body IS NULL OR length(NEW.body) = 0 THEN
    RETURN NEW;
  END IF;

  SELECT * INTO _match FROM public.check_message_content(NEW.body);

  IF _match.is_blocked THEN
    IF _match.severity >= 3 THEN
      -- Nefret söylemi veya tehdit: hemen reddet
      RAISE EXCEPTION 'Message contains prohibited content (%). Please review our Terms of Service.', _match.category
        USING ERRCODE = 'check_violation';
    ELSIF _match.severity >= 2 THEN
      -- Küfür / cinsel içerik: kaydet ama flag'le
      NEW.flagged := true;
    END IF;
    -- Severity 1 sadece uyarı, hiçbir şey yapma
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS moderate_message_before_insert_trigger ON public.messages;
CREATE TRIGGER moderate_message_before_insert_trigger
  BEFORE INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.moderate_message_before_insert();

-- ============================================================================
-- User Blocking — Sticker owner scanner'ı block edebilir
-- Zaten scanner_sessions.is_blocked var (task #59), kullanılıyor.
-- Ancak Apple 1.2: "block should also notify the developer" — hook ekle
-- ============================================================================

-- Bildirim: scanner block edildiğinde audit log
CREATE TABLE IF NOT EXISTS public.moderation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL CHECK (action_type IN ('block_scanner', 'flag_message', 'remove_content', 'ban_user')),
  actor_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  target_sticker_id UUID REFERENCES public.stickers(id) ON DELETE SET NULL,
  target_scanner_session_id UUID REFERENCES public.scanner_sessions(id) ON DELETE SET NULL,
  target_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_moderation_actions_created ON public.moderation_actions(created_at DESC);

ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins view moderation actions" ON public.moderation_actions;
CREATE POLICY "Admins view moderation actions"
  ON public.moderation_actions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.auth_user_id = auth.uid() AND users.is_admin = true)
  );

-- Trigger: scanner block edildiğinde moderation_actions'a kayıt
CREATE OR REPLACE FUNCTION public.log_scanner_block()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_blocked = true AND (OLD.is_blocked IS NULL OR OLD.is_blocked = false) THEN
    INSERT INTO public.moderation_actions (
      action_type,
      target_scanner_session_id,
      notes
    ) VALUES (
      'block_scanner',
      NEW.id,
      'Scanner blocked by sticker owner via chat'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS log_scanner_block_trigger ON public.scanner_sessions;
CREATE TRIGGER log_scanner_block_trigger
  AFTER UPDATE ON public.scanner_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.log_scanner_block();
