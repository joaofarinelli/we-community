-- Drop the existing function first
DROP FUNCTION IF EXISTS issue_course_certificate(uuid,uuid);

-- Enable the pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create the issue_course_certificate function with correct return type
CREATE OR REPLACE FUNCTION issue_course_certificate(
    p_user_id UUID,
    p_course_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_course RECORD;
    v_completion BOOLEAN;
    v_certificate_id UUID;
    v_certificate_code TEXT;
    v_existing_certificate RECORD;
    v_company_id UUID;
    v_duration_minutes INTEGER;
BEGIN
    -- Get current company context
    SELECT current_setting('app.current_company_id', true)::UUID INTO v_company_id;
    
    -- Check if certificate already exists
    SELECT * INTO v_existing_certificate
    FROM user_course_certificates 
    WHERE user_id = p_user_id 
    AND course_id = p_course_id
    AND company_id = v_company_id;
    
    IF v_existing_certificate.id IS NOT NULL THEN
        RETURN json_build_object(
            'id', v_existing_certificate.id,
            'certificate_code', v_existing_certificate.certificate_code,
            'already_exists', true
        );
    END IF;
    
    -- Get course details
    SELECT * INTO v_course 
    FROM courses 
    WHERE id = p_course_id 
    AND company_id = v_company_id;
    
    IF v_course.id IS NULL THEN
        RAISE EXCEPTION 'Course not found';
    END IF;
    
    IF NOT v_course.certificate_enabled THEN
        RAISE EXCEPTION 'Certificate not enabled for this course';
    END IF;
    
    -- Check if user completed the course
    SELECT check_course_completion(p_user_id, p_course_id) INTO v_completion;
    
    IF NOT v_completion THEN
        RAISE EXCEPTION 'Course not completed';
    END IF;
    
    -- Calculate course duration from lessons
    SELECT COALESCE(SUM(duration), 0) INTO v_duration_minutes
    FROM course_lessons cl
    JOIN course_modules cm ON cl.module_id = cm.id
    WHERE cm.course_id = p_course_id
    AND cm.company_id = v_company_id;
    
    -- Generate certificate code using gen_random_uuid and extract first 8 characters
    v_certificate_code := UPPER(SUBSTRING(REPLACE(gen_random_uuid()::TEXT, '-', ''), 1, 8));
    
    -- Create certificate
    INSERT INTO user_course_certificates (
        user_id,
        company_id,
        course_id,
        course_title,
        certificate_code,
        duration_minutes,
        issued_at,
        issued_by,
        mentor_name,
        mentor_role,
        mentor_signature_url
    ) VALUES (
        p_user_id,
        v_company_id,
        p_course_id,
        v_course.title,
        v_certificate_code,
        v_duration_minutes,
        NOW(),
        'system',
        v_course.mentor_name,
        v_course.mentor_role,
        v_course.mentor_signature_url
    ) RETURNING id INTO v_certificate_id;
    
    RETURN json_build_object(
        'id', v_certificate_id,
        'certificate_code', v_certificate_code,
        'already_exists', false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;