create index if not exists imports_pdf_project_created_at_idx
  on public.imports ((raw_result_json->>'project'), created_at)
  where source_type = 'pdf';
