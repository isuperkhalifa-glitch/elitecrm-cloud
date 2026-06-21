# EliteCRM V10 database upgrade order

Run these files once in Supabase SQL Editor, in this exact order:

1. `v10_4_schema_alignment.sql`
2. `v10_4_import_integrity.sql`
3. `v10_5_operational_integrity.sql`
4. `v10_4_registration_integrity_v2.sql`
5. `v10_4_archive_protection.sql`
6. `v10_6_commission_engine.sql`
7. `v10_6_write_permissions.sql`
8. `v10_6_read_scope.sql`
9. `v10_7_developer_role_guard_v2.sql`

Superseded drafts:

- `v10_4_registration_integrity.sql`
- `v10_7_developer_role_guard.sql`

After each file finishes, confirm that Supabase reports success before moving to the next file.
