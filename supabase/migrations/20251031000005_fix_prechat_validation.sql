-- Fix pre-chat form validation trigger to use 'id' instead of 'name'
-- The form fields use 'id' as the identifier, not 'name'

CREATE OR REPLACE FUNCTION validate_pre_chat_data()
RETURNS TRIGGER AS $$
DECLARE
  required_fields JSONB;
  field JSONB;
  field_id TEXT;
BEGIN
  -- Get required fields from department's pre_chat_form
  SELECT pre_chat_form INTO required_fields
  FROM departments
  WHERE id = NEW.department_id;
  
  -- Check each required field
  FOR field IN SELECT * FROM jsonb_array_elements(required_fields)
  LOOP
    IF (field->>'required')::BOOLEAN = true THEN
      field_id := field->>'id';  -- Changed from 'name' to 'id'
      
      -- Check if field exists in pre_chat_data
      IF NOT (NEW.pre_chat_data ? field_id) THEN
        RAISE EXCEPTION 'Required field % is missing', field_id;
      END IF;
      
      -- Check if field is not empty
      IF NEW.pre_chat_data->>field_id IS NULL OR 
         NEW.pre_chat_data->>field_id = '' THEN
        RAISE EXCEPTION 'Required field % cannot be empty', field_id;
      END IF;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

